from flask import Flask, request, jsonify
from flask_cors import CORS
from retriever import get_retriever
from prompt_llm import build_prompt, get_llm_response
from pymongo import MongoClient, errors as mongo_errors
from datetime import datetime, timezone
import uuid
import logging
# No longer need json/os here as we don't load full content store
from config import MONGODB_URI, MONGODB_DB, MONGODB_COLLECTION

# --- Logging Setup ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Flask App Initialization ---
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000", "YOUR_PRODUCTION_FRONTEND_URL_HERE"]}})

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
    # Get retriever, maybe ask for slightly more chunks (e.g., 5) to feed LLM
    retriever = get_retriever(k_results=5)
    logging.info("Retriever initialized successfully.")
except Exception as e:
    logging.error(f"CRITICAL: Failed to initialize retriever: {e}")
    # App cannot function without retriever in this design
    # Consider exiting or returning 503 for all queries

# --- Routes ---
@app.route("/", methods=["GET"])
def home():
    status = {
        "service": "RagFin AI Backend",
        "status": "Running" if retriever else "Error",
        "retriever_initialized": retriever is not None,
        "mongodb_connected": db is not None,
    }
    return jsonify(status), 200 if retriever else 503

@app.route("/api/query", methods=["POST"])
def query_endpoint():
    if not retriever:
        logging.error("Retriever not available, cannot process query.")
        return jsonify({"error": "Backend configuration error: Retriever not available."}), 503

    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 415

    data = request.get_json()
    user_query = data.get("query", "").strip()
    chat_id = data.get("chat_id")

    if not user_query:
        return jsonify({"error": "Query cannot be empty"}), 400

    logging.info(f"Received query: '{user_query}' (Chat ID: {chat_id or 'New'})")

    try:
        # 1. Retrieve relevant CHUNKS from Pinecone
        logging.info(f"Invoking retriever for query: '{user_query}'")
        # retriever.invoke now returns Langchain Document objects for chunks
        # where page_content should hold the chunk_text due to text_key setting
        retrieved_chunks = retriever.invoke(user_query)
        logging.info(f"Retrieved {len(retrieved_chunks)} relevant chunks.")

        # 2. Extract context from the retrieved chunks
        context_parts = []
        source_info_list = [] # Track sources for logging/display
        for i, chunk_doc in enumerate(retrieved_chunks):
            # Check if page_content exists and has text
            if hasattr(chunk_doc, 'page_content') and chunk_doc.page_content:
                context_parts.append(chunk_doc.page_content)
                # Add source info for context/logging if available in metadata
                if hasattr(chunk_doc, 'metadata') and isinstance(chunk_doc.metadata, dict):
                     filename = chunk_doc.metadata.get('source_filename', 'Unknown')
                     chunk_idx = chunk_doc.metadata.get('chunk_index', -1)
                     source_info_list.append(f"{filename} (chunk {chunk_idx})")
                else:
                     source_info_list.append("Unknown source")
            else:
                # Fallback: try getting text directly from metadata if page_content failed
                if hasattr(chunk_doc, 'metadata') and isinstance(chunk_doc.metadata, dict):
                    chunk_text = chunk_doc.metadata.get('chunk_text')
                    if chunk_text:
                        logging.warning("Using chunk_text from metadata as page_content was empty.")
                        context_parts.append(chunk_text)
                        filename = chunk_doc.metadata.get('source_filename', 'Unknown')
                        chunk_idx = chunk_doc.metadata.get('chunk_index', -1)
                        source_info_list.append(f"{filename} (chunk {chunk_idx}, fallback)")
                    else:
                         logging.warning(f"Retrieved chunk {i} has neither page_content nor metadata.chunk_text.")
                else:
                     logging.warning(f"Retrieved chunk {i} has no usable content or metadata.")


        context = "\n\n".join(context_parts)
        if not context:
            logging.warning("No context could be constructed from retrieved chunks.")
            context = "No relevant context found in the knowledge base for this query."

        # 3. Build the prompt
        final_prompt = build_prompt(user_query, context)
        logging.info(f"Built prompt for LLM. Context based on chunks from: {', '.join(source_info_list) if source_info_list else 'None'}")

        # 4. Get LLM response
        answer = get_llm_response(final_prompt)
        logging.info(f"Received LLM response.")

        # 5. Store chat history (if MongoDB is connected)
        session_id_to_return = chat_id
        if chat_collection is not None:
            try:
                # Store messages - same logic as before
                message_user = {"role": "user", "content": user_query, "timestamp": datetime.now(timezone.utc)}
                message_assistant = {"role": "assistant", "content": answer, "timestamp": datetime.now(timezone.utc)}
                if chat_id:
                    update_result = chat_collection.update_one(
                        {"session_id": chat_id},
                        {"$push": {"messages": {"$each": [message_user, message_assistant]}},
                         "$set": {"last_updated": datetime.now(timezone.utc)}}
                    )
                    if update_result.matched_count == 0: chat_id = None
                    else: logging.info(f"Appended messages to existing chat session: {chat_id}")
                if not chat_id:
                    session_id_to_return = str(uuid.uuid4())
                    title = user_query[:75] + "..." if len(user_query) > 75 else user_query
                    chat_document = {
                        "session_id": session_id_to_return, "title": title,
                        "messages": [message_user, message_assistant],
                        "created_at": datetime.now(timezone.utc),
                        "last_updated": datetime.now(timezone.utc)
                    }
                    chat_collection.insert_one(chat_document)
                    logging.info(f"Created new chat session: {session_id_to_return}")
            except Exception as hist_e:
                 logging.error(f"Error during chat history handling: {hist_e}")
        else:
             logging.warning("MongoDB collection not available. Chat history not saved.")
             if not session_id_to_return: session_id_to_return = str(uuid.uuid4())

        # 6. Return response
        return jsonify({"answer": answer, "chat_id": session_id_to_return})

    except Exception as e:
        logging.exception(f"Critical error processing query '{user_query}': {e}")
        return jsonify({"error": "An internal error occurred while processing your request."}), 500

# get_chats route remains the same

# --- Main Execution ---
if __name__ == "__main__":
    if not retriever:
         logging.critical("Retriever failed to initialize. Backend cannot serve queries. Exiting.")
         exit() # Exit if retriever failed
    app.run(debug=False, host='0.0.0.0', port=5001, use_reloader=False)