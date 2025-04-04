# backend/app.py

from flask import Flask, request, jsonify
from flask_cors import CORS
from retriever import get_retriever
from prompt_llm import build_prompt, get_llm_response
from pymongo import MongoClient, ReturnDocument, errors as mongo_errors
from bson import ObjectId # Potentially needed if querying by MongoDB's _id later
from datetime import datetime, timezone
import uuid
import logging
from config import MONGODB_URI, MONGODB_DB, MONGODB_COLLECTION

# --- Logging Setup ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Flask App Initialization ---
app = Flask(__name__)
# Configure CORS - Adjust origins for production
CORS(app, resources={
    r"/api/*": {"origins": ["http://localhost:3000", "YOUR_PRODUCTION_FRONTEND_URL_HERE"]}
})

# --- MongoDB Connection ---
db = None
chat_collection = None
try:
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000) # Add timeout
    # The ismaster command is cheap and does not require auth. Checks connectivity.
    client.admin.command('ismaster')
    db = client[MONGODB_DB]
    chat_collection = db[MONGODB_COLLECTION]
    logging.info(f"Successfully connected to MongoDB: {MONGODB_DB}/{MONGODB_COLLECTION}")
except mongo_errors.ConnectionFailure as e:
    logging.error(f"Could not connect to MongoDB: {e}")
except Exception as e:
    logging.error(f"An unexpected error occurred during MongoDB initialization: {e}")
# App will run but history features will fail if db/chat_collection is None

# --- Retriever Initialization ---
retriever = None
try:
    # Request k=5 chunks for context
    retriever = get_retriever(k_results=5)
    logging.info("Retriever initialized successfully.")
except Exception as e:
    logging.error(f"CRITICAL: Failed to initialize retriever: {e}")
    # Essential for core functionality

# --- Routes ---

# Health check / Info Endpoint
@app.route("/", methods=["GET"])
def home():
    status = {
        "service": "RagFin AI Backend",
        "status": "Running" if retriever else "Error",
        "retriever_initialized": retriever is not None,
        "mongodb_connected": db is not None,
    }
    return jsonify(status), 200 if retriever else 503

# Main RAG Query Endpoint (Handles getting answer + auto-saving history)
@app.route("/api/query", methods=["POST"])
def query_endpoint():
    if not retriever:
        logging.error("Retriever not available, cannot process query.")
        return jsonify({"error": "Backend configuration error: Retriever not available."}), 503

    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 415

    data = request.get_json()
    user_query = data.get("query", "").strip()
    chat_id = data.get("chat_id") # Existing chat ID from frontend (can be null)

    if not user_query:
        return jsonify({"error": "Query cannot be empty"}), 400

    logging.info(f"Processing query: '{user_query}' (Chat ID: {chat_id or 'New'})")

    try:
        # 1. Retrieve relevant CHUNKS
        logging.info(f"Invoking retriever...")
        retrieved_chunks = retriever.invoke(user_query)
        logging.info(f"Retrieved {len(retrieved_chunks)} relevant chunks.")

        # 2. Extract context from retrieved chunks
        context_parts = []
        source_info_list = []
        for i, chunk_doc in enumerate(retrieved_chunks):
            chunk_text = None
            # Prioritize page_content (populated if text_key='chunk_text' worked)
            if hasattr(chunk_doc, 'page_content') and chunk_doc.page_content:
                chunk_text = chunk_doc.page_content
            # Fallback: check metadata if page_content was empty
            elif hasattr(chunk_doc, 'metadata') and isinstance(chunk_doc.metadata, dict):
                chunk_text_fallback = chunk_doc.metadata.get('chunk_text')
                if chunk_text_fallback:
                    logging.warning(f"Using chunk_text from metadata as page_content was empty for chunk {i}.")
                    chunk_text = chunk_text_fallback

            if chunk_text:
                context_parts.append(chunk_text)
                # Log source info if available
                if hasattr(chunk_doc, 'metadata') and isinstance(chunk_doc.metadata, dict):
                    filename = chunk_doc.metadata.get('source_filename', 'Unknown')
                    chunk_idx = chunk_doc.metadata.get('chunk_index', -1)
                    source_info_list.append(f"{filename} (chunk {chunk_idx})")
                else:
                    source_info_list.append("Unknown source")
            else:
                logging.warning(f"Retrieved chunk {i} has no usable text content (checked page_content and metadata.chunk_text).")

        context = "\n\n".join(context_parts)
        if not context:
            logging.warning("No context could be constructed from retrieved chunks.")
            context = "No relevant context found in the knowledge base for this query." # Placeholder
        logging.info(f"Context constructed from: {', '.join(source_info_list) if source_info_list else 'None'}")

        # 3. Build the prompt for the LLM
        final_prompt = build_prompt(user_query, context)

        # 4. Get LLM response
        logging.info("Requesting LLM response...")
        answer = get_llm_response(final_prompt)
        logging.info(f"Received LLM response.")

        # 5. Prepare messages for storage/return
        now_utc = datetime.now(timezone.utc)
        # Ensure timestamps are ISO format strings for JSON compatibility
        message_user = {"role": "user", "content": user_query, "timestamp": now_utc.isoformat()}
        message_assistant = {"role": "assistant", "content": answer, "timestamp": now_utc.isoformat()}

        session_id_to_return = chat_id
        new_session_created = False

        # 6. Store/Update chat history in MongoDB (if connected)
        if chat_collection is not None:
            try:
                if chat_id:
                    # Append to existing session
                    update_result = chat_collection.update_one(
                        {"session_id": chat_id},
                        {"$push": {"messages": {"$each": [message_user, message_assistant]}},
                         "$set": {"last_updated": now_utc}} # Update last interaction time
                    )
                    if update_result.matched_count == 0:
                        # This handles cases where frontend sends an old/invalid ID
                        logging.warning(f"chat_id '{chat_id}' provided but not found in DB. Creating new session.")
                        chat_id = None # Force creation of new session below
                    else:
                         logging.info(f"Appended messages to existing chat session: {chat_id}")

                # Create new session if chat_id was None initially or if update failed to find match
                if not chat_id:
                    session_id_to_return = str(uuid.uuid4()) # Generate new UUID
                    new_session_created = True
                    # Generate title from first user query
                    title = user_query[:75] + "..." if len(user_query) > 75 else user_query
                    chat_document = {
                        "session_id": session_id_to_return,
                        "title": title,
                        "messages": [message_user, message_assistant], # Start with current exchange
                        "created_at": now_utc,
                        "last_updated": now_utc
                    }
                    insert_result = chat_collection.insert_one(chat_document)
                    logging.info(f"Created new chat session: {session_id_to_return} (Title: {title})")

            except mongo_errors.PyMongoError as mongo_e:
                logging.error(f"MongoDB error during chat history update/insert: {mongo_e}")
                # If DB fails during *new* session creation, we can't return a reliable persistent ID
                if new_session_created: session_id_to_return = None
            except Exception as hist_e:
                 logging.exception(f"Unexpected error during chat history handling: {hist_e}") # Log traceback
                 if new_session_created: session_id_to_return = None # Can't rely on the generated ID if save failed

        else:
             # Handle case where DB is not connected
             logging.warning("MongoDB collection not available. Chat history not saved.")
             # Still generate a temporary session ID if needed for frontend state continuity in this browser session
             if not session_id_to_return: session_id_to_return = str(uuid.uuid4()) + "-tmp" # Mark as temporary

        # 7. Return response including the answer AND the correct chat_id
        # Frontend needs chat_id to continue the conversation thread
        return jsonify({"answer": answer, "chat_id": session_id_to_return})

    except Exception as e:
        # Catch-all for any unexpected error during the RAG process
        logging.exception(f"Critical error processing query '{user_query}': {e}") # Log traceback
        return jsonify({"error": "An internal error occurred while processing your request."}), 500

# GET Endpoint to retrieve summary list of chat sessions
@app.route("/api/chats", methods=["GET"])
def get_chat_list():
    if chat_collection is None:
        return jsonify({"error": "Database connection not available."}), 503
    try:
        # Fetch limited fields, sort by most recently updated
        chat_summaries = list(chat_collection.find(
            {}, # No filter, get all chats
            {"_id": 0, "session_id": 1, "title": 1, "last_updated": 1} # Projection
        ).sort("last_updated", -1).limit(100)) # Limit history size

        # Convert datetime objects to ISO strings for JSON
        for chat in chat_summaries:
            if isinstance(chat.get('last_updated'), datetime):
                 chat['last_updated'] = chat['last_updated'].isoformat()

        return jsonify(chat_summaries)
    except mongo_errors.PyMongoError as e:
        logging.error(f"MongoDB error fetching chat list: {e}")
        return jsonify({"error": "Failed to retrieve chat history."}), 500
    except Exception as e:
        logging.exception(f"Unexpected error fetching chat list: {e}")
        return jsonify({"error": "An internal server error occurred."}), 500


# GET Endpoint to retrieve full message history for ONE chat session
@app.route("/api/chat/<string:session_id>", methods=["GET"])
def get_chat_messages(session_id):
    if chat_collection is None:
        return jsonify({"error": "Database connection not available."}), 503
    if not session_id:
         return jsonify({"error": "Session ID required."}), 400

    try:
        logging.info(f"Fetching messages for chat_id: {session_id}")
        # Find the chat document by our custom session_id
        chat_data = chat_collection.find_one(
            {"session_id": session_id},
            {"_id": 0} # Exclude MongoDB's internal _id
        )

        if chat_data:
            # Ensure timestamps in messages are ISO strings for JSON
            if 'messages' in chat_data and isinstance(chat_data['messages'], list):
                 for msg in chat_data['messages']:
                      if isinstance(msg.get('timestamp'), datetime):
                           msg['timestamp'] = msg['timestamp'].isoformat()
            # Convert top-level timestamps too
            if isinstance(chat_data.get('created_at'), datetime):
                 chat_data['created_at'] = chat_data['created_at'].isoformat()
            if isinstance(chat_data.get('last_updated'), datetime):
                 chat_data['last_updated'] = chat_data['last_updated'].isoformat()

            return jsonify(chat_data)
        else:
            logging.warning(f"Chat session not found: {session_id}")
            return jsonify({"error": "Chat session not found."}), 404
    except mongo_errors.PyMongoError as e:
         logging.error(f"MongoDB error fetching chat {session_id}: {e}")
         return jsonify({"error": "Database error fetching chat."}), 500
    except Exception as e:
        logging.exception(f"Error fetching chat messages for {session_id}: {e}")
        return jsonify({"error": "An internal server error occurred."}), 500

# POST Endpoint for explicitly saving/updating a chat (e.g., from Save button)
@app.route("/api/chats", methods=["POST"])
def save_update_chat():
    if chat_collection is None:
        return jsonify({"error": "Database connection not available."}), 503

    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 415

    data = request.get_json()
    messages = data.get("messages")
    chat_id = data.get("chat_id") # ID of chat being saved (MIGHT BE NULL for new chat save)
    title = data.get("title") # Optional title from frontend

    # Validate messages payload
    if not messages or not isinstance(messages, list):
         return jsonify({"error": "Invalid or missing 'messages' data provided."}), 400
    # Basic validation of message structure within the list (optional but good)
    for msg in messages:
         if not isinstance(msg, dict) or 'role' not in msg or 'content' not in msg:
              return jsonify({"error": "Invalid message structure in 'messages' list."}), 400

    now_utc = datetime.now(timezone.utc)
    session_id_to_return = chat_id
    new_session_created = False

    try:
        if chat_id:
            # Attempt to update existing chat using chat_id
            logging.info(f"Explicit save/update requested for chat session: {chat_id}")
            # Use find_one_and_update to ensure the document exists before updating
            # We replace the entire messages array and update timestamp
            update_data = {
                    "messages": messages,
                    "last_updated": now_utc
            }
            # Update title only if provided in the request
            if title:
                update_data["title"] = title

            result = chat_collection.find_one_and_update(
                {"session_id": chat_id},
                {"$set": update_data},
                projection={"session_id": 1} # Just need to know if it found it
                # return_document=ReturnDocument.AFTER # Use if you need the updated doc back
            )

            if result is None: # find_one_and_update returns None if no document matched
                 logging.warning(f"Chat ID '{chat_id}' not found during explicit save. Treating as new chat.")
                 chat_id = None # Clear chat_id to trigger creation below
            else:
                 logging.info(f"Chat session '{chat_id}' updated successfully via explicit save.")
                 session_id_to_return = chat_id # Confirm the ID that was updated

        # If no chat_id was provided OR the update didn't find the document
        if not chat_id:
            # Create new chat session
            session_id_to_return = str(uuid.uuid4())
            new_session_created = True
            # Determine title: Use provided, or generate from first message, or default
            if not title:
                 if messages and messages[0].get("content"):
                      title = messages[0]["content"][:75] + "..."
                 else:
                      title = "New Chat"

            logging.info(f"Explicitly creating new chat session '{session_id_to_return}' via save request.")
            chat_document = {
                "session_id": session_id_to_return,
                "title": title,
                "messages": messages,
                "created_at": now_utc,
                "last_updated": now_utc
            }
            chat_collection.insert_one(chat_document)
            logging.info(f"New chat session '{session_id_to_return}' created successfully via explicit save.")

        # Return success message and the relevant session ID
        return jsonify({"message": "Chat saved successfully.", "chat_id": session_id_to_return}), 200

    except mongo_errors.PyMongoError as mongo_e:
        logging.error(f"MongoDB error during explicit chat save/update: {mongo_e}")
        return jsonify({"error": "Database error saving chat."}), 500
    except Exception as e:
        logging.exception(f"Unexpected error during explicit chat save/update: {e}")
        return jsonify({"error": "An internal server error occurred saving chat."}), 500


# --- Main Execution Guard ---
if __name__ == "__main__":
    # Check essential components before starting
    if not retriever:
         logging.critical("Retriever failed to initialize. Backend cannot serve queries. Exiting.")
         exit(1) # Exit with error code if retriever fails
    if db is None or chat_collection is None: # NEW Check - Correct way
         logging.warning("MongoDB connection failed or collection not found. Chat history features will be unavailable.")

    # Use production-ready server like Waitress or Gunicorn for deployment
    # For local development:
    # debug=False and use_reloader=False are generally more stable, especially with model loading
    app.run(debug=False, host='0.0.0.0', port=5001, use_reloader=False)