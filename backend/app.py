# backend/app.py

# --- Core Flask & Utils ---
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os
import tempfile
import uuid
from datetime import datetime, timezone
from werkzeug.utils import secure_filename # For secure file handling

# --- LLM, RAG, Embeddings ---
from retriever import get_retriever
from prompt_llm import build_prompt, get_llm_response
from config import GROQ_API_KEY, GROQ_MODEL, EMBEDDING_MODEL # Need embedding model name
from sentence_transformers import SentenceTransformer
from langchain.text_splitter import RecursiveCharacterTextSplitter

# --- Database ---
from pymongo import MongoClient, ReturnDocument, errors as mongo_errors
from config import MONGODB_URI, MONGODB_DB, MONGODB_COLLECTION
from bson import ObjectId # Keep just in case

# --- File Parsing ---
import fitz # PyMuPDF
import pandas as pd
import magic # python-magic or python-magic-bin

# --- Math for Similarity ---
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# --- Logging Setup ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Constants ---
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 150
MAX_FILE_SIZE_MB = 10 # Limit upload size
ALLOWED_EXTENSIONS = {'pdf', 'xlsx', 'csv', 'txt'}
TOP_K_RAG_CHUNKS = 3 # How many chunks to get from Pinecone
TOP_M_DOC_CHUNKS = 2 # How many chunks to get from user document

# --- Flask App Initialization ---
app = Flask(__name__)
# Configure CORS - Adjust origins for production
CORS(app, resources={
    r"/api/*": {"origins": ["http://localhost:3000", "YOUR_PRODUCTION_FRONTEND_URL_HERE"]}
})
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE_MB * 1024 * 1024

# --- Global In-Memory Store for Document Chunks ---
# { session_id: { "filename": "...", "chunks": [text_chunk_1, text_chunk_2, ...] } }
session_document_store = {}
# WARNING: Temporary storage! Data lost on server restart.
# TODO: Implement persistent storage and session cleanup later.

# --- MongoDB Connection ---
db = None
chat_collection = None
try:
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    client.admin.command('ismaster')
    db = client[MONGODB_DB]
    chat_collection = db[MONGODB_COLLECTION]
    logging.info(f"Successfully connected to MongoDB: {MONGODB_DB}/{MONGODB_COLLECTION}")
except Exception as e:
    logging.error(f"Could not connect to MongoDB: {e}")

# --- Retriever Initialization ---
retriever = None
try:
    retriever = get_retriever(k_results=TOP_K_RAG_CHUNKS)
    logging.info("Retriever initialized successfully.")
except Exception as e:
    logging.error(f"CRITICAL: Failed to initialize retriever: {e}")

# --- Embedding Model Initialization ---
embedding_model = None
try:
    logging.info(f"Loading embedding model: {EMBEDDING_MODEL}...")
    embedding_model = SentenceTransformer(EMBEDDING_MODEL)
    logging.info("Embedding model loaded successfully.")
except Exception as e:
    logging.error(f"CRITICAL: Failed to load embedding model: {e}")

# --- Text Splitter Initialization ---
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=CHUNK_SIZE,
    chunk_overlap=CHUNK_OVERLAP,
    length_function=len,
)

# --- Helper Functions (unchanged) ---
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(filepath):
    try:
        doc = fitz.open(filepath)
        text = "".join(page.get_text() for page in doc)
        doc.close()
        return text
    except Exception as e: logging.error(f"Error extracting PDF text {filepath}: {e}"); return None

def extract_text_from_excel(filepath):
    try:
        excel_data = pd.read_excel(filepath, sheet_name=None)
        text = ""
        for sheet_name, df in excel_data.items():
            text += f"--- Sheet: {sheet_name} ---\n"
            try: text += df.to_markdown(index=False) + "\n\n"
            except ImportError: text += df.to_string(index=False) + "\n\n"
        return text
    except Exception as e: logging.error(f"Error extracting Excel text {filepath}: {e}"); return None

def extract_text_from_csv(filepath):
    try:
        df = pd.read_csv(filepath)
        text = "--- CSV Data ---\n"
        try: text += df.to_markdown(index=False) + "\n\n"
        except ImportError: text += df.to_string(index=False) + "\n\n"
        return text
    except Exception as e: logging.error(f"Error extracting CSV text {filepath}: {e}"); return None

def extract_text_from_txt(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f: return f.read()
    except Exception as e: logging.error(f"Error extracting TXT {filepath}: {e}"); return None

# --- Routes ---

# Health check
@app.route("/", methods=["GET"])
def home():
    status = {
        "service": "RagFin AI Backend",
        "status": "Running" if retriever and embedding_model else "Error",
        "retriever_initialized": retriever is not None,
        "embedding_model_loaded": embedding_model is not None,
        "mongodb_connected": db is not None,
    }
    return jsonify(status), 200 if retriever and embedding_model else 503

# File Upload Endpoint (Uses session_id from frontend)
@app.route("/api/upload", methods=["POST"])
def upload_document():
    if 'file' not in request.files: return jsonify({"error": "No file part."}), 400
    if not embedding_model: return jsonify({"error": "Backend embedding model not available."}), 503

    file = request.files['file']
    # --- Use session_id REQUIRED from frontend form data ---
    session_id = request.form.get('session_id')
    if not session_id:
        logging.error("Missing session_id in upload request form data.")
        return jsonify({"error": "Session ID is required for upload."}), 400
    # --- End session_id change ---

    if file.filename == '': return jsonify({"error": "No selected file."}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        logging.info(f"Received upload for session {session_id}: {filename}")
        _, temp_filepath = tempfile.mkstemp(suffix=os.path.splitext(filename)[1])
        extracted_text = None
        try:
            file.save(temp_filepath)
            logging.info(f"Temp file: {temp_filepath}")
            mime_type = magic.from_file(temp_filepath, mime=True); logging.info(f"MIME: {mime_type}")

            if 'pdf' in mime_type: extracted_text = extract_text_from_pdf(temp_filepath)
            elif 'excel' in mime_type or 'spreadsheetml' in mime_type or filename.endswith('.xlsx'): extracted_text = extract_text_from_excel(temp_filepath)
            elif 'csv' in mime_type or filename.endswith('.csv'): extracted_text = extract_text_from_csv(temp_filepath)
            elif 'text' in mime_type or filename.endswith('.txt'): extracted_text = extract_text_from_txt(temp_filepath)
            else: return jsonify({"error": f"Unsupported file type: {mime_type}"}), 415

            if not extracted_text: return jsonify({"error": "Failed to extract text."}), 500

            logging.info(f"Chunking text for {filename}...")
            text_chunks = text_splitter.split_text(extracted_text)
            logging.info(f"Created {len(text_chunks)} chunks.")

            # Store text chunks in memory using the session_id from frontend
            session_document_store[session_id] = { "filename": filename, "chunks": text_chunks }
            logging.info(f"Stored {len(text_chunks)} text chunks for session {session_id}.")

            # Return success confirmation
            return jsonify({
                "message": f"Processed '{filename}'. Context active for session.",
                "filename": filename
                # No need to return session_id, frontend sent it
            }), 200
        except Exception as e:
            logging.exception(f"Error processing uploaded file {filename}: {e}")
            return jsonify({"error": "Error processing file."}), 500
        finally:
            if os.path.exists(temp_filepath):
                try: os.remove(temp_filepath); logging.info(f"Removed temp file: {temp_filepath}")
                except OSError as e: logging.error(f"Error removing temp file {temp_filepath}: {e}")
    else:
        return jsonify({"error": "File type not allowed."}), 400


# Query Endpoint (Uses session_id, combines contexts, uses upsert for history)
@app.route("/api/query", methods=["POST"])
def query_endpoint():
    if not retriever or not embedding_model:
        logging.error("Retriever or Embedding Model not available."); return jsonify({"error": "Backend service not fully ready."}), 503
    if not request.is_json: return jsonify({"error": "Request must be JSON"}), 415

    data = request.get_json()
    user_query = data.get("query", "").strip()
    chat_id = data.get("chat_id") # Use this as the consistent session identifier

    if not user_query: return jsonify({"error": "Query cannot be empty"}), 400
    # --- Use chat_id consistently as session_id ---
    session_id = chat_id
    logging.info(f"Processing query: '{user_query}' (Session ID: {session_id or 'None Provided'})")
    # --- End consistency change ---

    try:
        # 1. Retrieve RAG Context
        logging.info(f"Invoking retriever for RAG context...")
        rag_chunks_docs = retriever.invoke(user_query)
        logging.info(f"Retrieved {len(rag_chunks_docs)} RAG chunks.")
        rag_context_parts = []; rag_source_info = []
        for i, doc in enumerate(rag_chunks_docs):
            text = doc.page_content if hasattr(doc, 'page_content') and doc.page_content else doc.metadata.get('chunk_text')
            if text:
                rag_context_parts.append(text)
                filename = doc.metadata.get('source_filename', '?'); chunk_idx = doc.metadata.get('chunk_index', '?')
                rag_source_info.append(f"{filename}({chunk_idx})")
            else: logging.warning(f"RAG chunk {i} has no text.")
        rag_context = "\n\n".join(rag_context_parts)
        logging.info(f"RAG Context from: {', '.join(rag_source_info) if rag_source_info else 'None'}")

        # 2. Retrieve User Document Context (if session_id exists in store)
        doc_context_parts = []; doc_source_info = []
        doc_filename_for_prompt = "Uploaded Document"
        if session_id and session_id in session_document_store:
            session_data = session_document_store[session_id]
            doc_filename_for_prompt = session_data.get("filename", doc_filename_for_prompt)
            doc_text_chunks = session_data.get("chunks", [])
            logging.info(f"Found {len(doc_text_chunks)} doc chunks for session {session_id} ({doc_filename_for_prompt}). Searching...")
            if doc_text_chunks:
                try:
                    query_embedding = embedding_model.encode([user_query])
                    doc_chunk_embeddings = embedding_model.encode(doc_text_chunks)
                    similarities = cosine_similarity(query_embedding, doc_chunk_embeddings)[0]
                    top_m_indices = np.argsort(similarities)[-TOP_M_DOC_CHUNKS:][::-1]
                    for idx in top_m_indices:
                         # Maybe add similarity threshold later: if similarities[idx] > 0.X:
                         doc_context_parts.append(doc_text_chunks[idx])
                         doc_source_info.append(f"chunk {idx} (score {similarities[idx]:.3f})")
                    logging.info(f"Doc Context from {doc_filename_for_prompt}: {', '.join(doc_source_info) if doc_source_info else 'None relevant'}")
                except Exception as emb_e: logging.exception(f"Error embedding/comparing doc chunks: {emb_e}")
            else: logging.info(f"No text chunks in store for session {session_id}.")
        else: logging.info(f"No doc context in store for session {session_id}.")
        doc_context = "\n\n".join(doc_context_parts)

        # 3. Combine Contexts
        combined_context = ""
        if rag_context_parts: combined_context += "Context from Recent Notifications:\n---\n" + rag_context + "\n---\n\n"
        if doc_context_parts: combined_context += f"Context from User's Document ({doc_filename_for_prompt}):\n---\n" + doc_context + "\n---"
        if not combined_context: combined_context = "No relevant context found."; logging.warning("No context constructed.")

        # 4. Build Prompt
        final_prompt = build_prompt(user_query, combined_context)

        # 5. Get LLM Response
        logging.info("Requesting LLM response...")
        answer = get_llm_response(final_prompt)
        logging.info(f"Received LLM response.")

        # 6. Prepare messages
        now_utc = datetime.now(timezone.utc)
        message_user = {"role": "user", "content": user_query, "timestamp": now_utc.isoformat()}
        message_assistant = {"role": "assistant", "content": answer, "timestamp": now_utc.isoformat()}
        session_id_to_return = session_id # Use the ID received from frontend

        # 7. Store/Update chat history using UPSERT
        if chat_collection is not None:
            try:
                # --- Use session_id consistently, require frontend to send it ---
                if session_id_to_use := session_id: # Python 3.8+ assignment expression
                    logging.info(f"Upserting chat history for session: {session_id_to_use}")
                    update_data = {
                        "$push": {"messages": {"$each": [message_user, message_assistant]}},
                        "$set": {"last_updated": now_utc},
                        "$setOnInsert": {
                             "session_id": session_id_to_use,
                             "title": user_query[:75] + "..." if len(user_query) > 75 else user_query,
                             "created_at": now_utc }}
                    result = chat_collection.update_one({"session_id": session_id_to_use}, update_data, upsert=True)
                    if result.matched_count > 0: logging.info(f"Appended to existing session: {session_id_to_use}")
                    elif result.upserted_id is not None: logging.info(f"Created new session via upsert: {session_id_to_use}")
                    else: logging.error(f"Chat history upsert failed unexpectedly: {session_id_to_use}")
                    session_id_to_return = session_id_to_use # Ensure we return the ID used/created
                else:
                    # This case means frontend sent chat_id=null or empty string
                    logging.error("No valid session_id received from frontend in /api/query. Cannot save history.")
                    session_id_to_return = None # Indicate history wasn't saved persistently

            except mongo_errors.PyMongoError as mongo_e:
                logging.error(f"MongoDB error during chat history upsert: {mongo_e}")
                session_id_to_return = session_id # Return ID frontend sent even if save failed
            except Exception as hist_e:
                 logging.exception(f"Unexpected error during chat history handling: {hist_e}")
                 session_id_to_return = session_id
        else:
             logging.warning("MongoDB not connected. Chat history not saved.")
             # If no DB and no ID from frontend, generate temp ID for response consistency
             if not session_id_to_return: session_id_to_return = str(uuid.uuid4()) + "-tmp-nodb"

        # 8. Return response
        return jsonify({"answer": answer, "chat_id": session_id_to_return})

    except Exception as e:
        logging.exception(f"Critical error processing query '{user_query}': {e}")
        return jsonify({"error": "An internal error occurred."}), 500


# GET /api/chats - Unchanged
@app.route("/api/chats", methods=["GET"])
def get_chat_list():
    # ... (same as previous version) ...
    if chat_collection is None: return jsonify({"error": "Database unavailable."}), 503
    try:
        chat_summaries = list(chat_collection.find({}, {"_id": 0, "session_id": 1, "title": 1, "last_updated": 1} ).sort("last_updated", -1).limit(100))
        for chat in chat_summaries:
            if isinstance(chat.get('last_updated'), datetime): chat['last_updated'] = chat['last_updated'].isoformat()
        return jsonify(chat_summaries)
    except Exception as e: logging.exception(f"Error fetching chat list: {e}"); return jsonify({"error": "Server error."}), 500

# GET /api/chat/<session_id> - Unchanged
@app.route("/api/chat/<string:session_id>", methods=["GET"])
def get_chat_messages(session_id):
     # ... (same as previous version) ...
    if chat_collection is None: return jsonify({"error": "Database unavailable."}), 503
    if not session_id: return jsonify({"error": "Session ID required."}), 400
    try:
        chat_data = chat_collection.find_one({"session_id": session_id},{"_id": 0})
        if chat_data:
            if 'messages' in chat_data and isinstance(chat_data['messages'], list):
                 for msg in chat_data['messages']:
                      if isinstance(msg.get('timestamp'), datetime): msg['timestamp'] = msg['timestamp'].isoformat()
            if isinstance(chat_data.get('created_at'), datetime): chat_data['created_at'] = chat_data['created_at'].isoformat()
            if isinstance(chat_data.get('last_updated'), datetime): chat_data['last_updated'] = chat_data['last_updated'].isoformat()
            return jsonify(chat_data)
        else: return jsonify({"error": "Chat session not found."}), 404
    except Exception as e: logging.exception(f"Error fetching chat {session_id}: {e}"); return jsonify({"error": "Server error."}), 500

# POST /api/chats - Unchanged
@app.route("/api/chats", methods=["POST"])
def save_update_chat():
    # ... (same as previous version) ...
    if chat_collection is None: return jsonify({"error": "Database unavailable."}), 503
    if not request.is_json: return jsonify({"error": "Request must be JSON"}), 415
    data = request.get_json(); messages = data.get("messages"); chat_id = data.get("chat_id"); title = data.get("title")
    if not messages or not isinstance(messages, list): return jsonify({"error": "Invalid 'messages'."}), 400
    for msg in messages:
         if not isinstance(msg, dict) or 'role' not in msg or 'content' not in msg: return jsonify({"error": "Invalid message structure."}), 400
    now_utc = datetime.now(timezone.utc); session_id_to_return = chat_id; new_session_created = False
    try:
        if chat_id:
            update_data = {"messages": messages, "last_updated": now_utc};
            if title: update_data["title"] = title
            result = chat_collection.find_one_and_update({"session_id": chat_id},{"$set": update_data}, projection={"session_id": 1} )
            if result is None: chat_id = None; logging.warning(f"Chat ID '{data.get('chat_id')}' not found for explicit save.")
            else: logging.info(f"Chat '{chat_id}' updated via explicit save."); session_id_to_return = chat_id
        if not chat_id:
            session_id_to_return = str(uuid.uuid4()); new_session_created = True
            if not title: title = messages[0].get("content", "New Chat")[:75] + "..." if messages else "New Chat"
            chat_document = {"session_id": session_id_to_return, "title": title, "messages": messages, "created_at": now_utc, "last_updated": now_utc}
            chat_collection.insert_one(chat_document)
            logging.info(f"New chat '{session_id_to_return}' created via explicit save.")
        return jsonify({"message": "Chat saved successfully.", "chat_id": session_id_to_return}), 200
    except Exception as e: logging.exception(f"Error during explicit chat save/update: {e}"); return jsonify({"error": "Error saving chat."}), 500


# --- Main Execution Guard ---
if __name__ == "__main__":
    if not retriever: logging.critical("Retriever failed. Exiting."); exit(1)
    if not embedding_model: logging.critical("Embedding model failed. Exiting."); exit(1)
    if db is None or chat_collection is None: logging.warning("MongoDB unavailable. History disabled.")
    #app.run(debug=False, host='0.0.0.0', port=5001, use_reloader=False)
    pass