from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from retriever import get_retriever
from prompt_llm import build_prompt, get_llm_response
from pymongo import MongoClient, errors as mongo_errors
from datetime import datetime, timezone # Use timezone-aware UTC
import uuid
import logging # Use logging module
from config import MONGODB_URI, MONGODB_DB, MONGODB_COLLECTION

# --- Logging Setup ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Flask App Initialization ---
app = Flask(__name__)
# Configure CORS more restrictively in production if needed
CORS(app, resources={r"/api/*": {"origins": "*"}}) # Example: Prefix API routes

# --- MongoDB Connection ---
try:
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000) # Add timeout
    # The ismaster command is cheap and does not require auth.
    client.admin.command('ismaster')
    db = client[MONGODB_DB]
    chat_collection = db[MONGODB_COLLECTION]
    logging.info(f"Successfully connected to MongoDB: {MONGODB_DB}/{MONGODB_COLLECTION}")
except mongo_errors.ConnectionFailure as e:
    logging.error(f"Could not connect to MongoDB: {e}")
    # Depending on requirements, you might exit or run in a degraded mode
    db = None
    chat_collection = None
except Exception as e:
    logging.error(f"An unexpected error occurred during MongoDB initialization: {e}")
    db = None
    chat_collection = None

# --- Retriever Initialization ---
try:
    retriever = get_retriever()
    logging.info("Retriever initialized successfully.")
except Exception as e:
    logging.error(f"Failed to initialize retriever: {e}")
    retriever = None # Handle cases where retriever fails

# --- Routes ---
@app.route("/", methods=["GET"])
def home():
    # Simple health check or info endpoint
    status = {
        "service": "RagFin AI Backend",
        "status": "Running",
        "mongodb_connected": db is not None,
        "retriever_initialized": retriever is not None
    }
    return jsonify(status), 200

# Note: Consider prefixing API routes like /api/query
@app.route("/api/query", methods=["POST"])
def query_endpoint():
    if not request.is_json:
        logging.warning("Received non-JSON request to /api/query")
        return jsonify({"error": "Request must be JSON"}), 415

    data = request.get_json()
    user_query = data.get("query", "").strip()
    # chat_id is optional for the basic version, but keep for potential future use
    chat_id = data.get("chat_id")

    if not user_query:
        logging.info("Received empty query")
        return jsonify({"error": "Query cannot be empty"}), 400

    if not retriever:
        logging.error("Retriever not available, cannot process query.")
        return jsonify({"error": "Backend configuration error: Retriever not available."}), 503 # Service Unavailable

    logging.info(f"Received query: '{user_query}' (Chat ID: {chat_id or 'New'})")

    try:
        # 1. Retrieve relevant documents
        logging.info(f"Invoking retriever for query: '{user_query}'")
        docs = retriever.invoke(user_query)
        logging.info(f"Retrieved {len(docs)} documents.")

        # 2. Extract context from documents
        context_parts = []
        for i, doc in enumerate(docs):
            # Prioritize 'text' from metadata as populated by index.py
            text = doc.metadata.get("text") if doc.metadata and doc.metadata.get("text") else doc.page_content
            if text:
                context_parts.append(f"Source {i+1}:\n{text}") # Add identifier if helpful
            else:
                 logging.warning(f"Document {i+1} (ID: {doc.metadata.get('source_filename', 'N/A')}) has no text content.")
        context = "\n\n".join(context_parts)

        if not context:
            logging.warning("No context could be extracted from retrieved documents.")
            # Decide how to handle: provide default answer or error
            # For now, proceed without context, LLM might still answer generally
            context = "No specific context found." # Placeholder

        # 3. Build the prompt
        final_prompt = build_prompt(user_query, context)
        # Be cautious logging the full prompt if context is very large or sensitive
        logging.info(f"Built prompt for LLM (Query: {user_query})")

        # 4. Get LLM response
        answer = get_llm_response(final_prompt)
        logging.info(f"Received LLM response.")

        # 5. Store chat history (if MongoDB is connected)
        session_id_to_return = chat_id
        if chat_collection is not None:
            try:
                # Basic version: No registration, so every interaction could be new OR stateless
                # If chat_id IS provided AND exists, append. Otherwise, create new.
                # FOR THE BASIC VERSION WITHOUT LOGIN, WE MIGHT ALWAYS CREATE A NEW SESSION
                # OR the frontend could generate a UUID per browser session and pass it.
                # Let's assume the frontend sends a generated UUID if it wants state.

                message_user = {"role": "user", "content": user_query, "timestamp": datetime.now(timezone.utc)}
                message_assistant = {"role": "assistant", "content": answer, "timestamp": datetime.now(timezone.utc)}

                if chat_id:
                     # Try to update existing session
                    update_result = chat_collection.update_one(
                        {"session_id": chat_id},
                        {"$push": {"messages": {"$each": [message_user, message_assistant]}},
                         "$set": {"last_updated": datetime.now(timezone.utc)}}
                    )
                    if update_result.matched_count == 0:
                        # chat_id provided but not found, treat as new session
                        chat_id = None
                    else:
                         logging.info(f"Appended messages to existing chat session: {chat_id}")

                if not chat_id:
                    # Create a new session
                    session_id_to_return = str(uuid.uuid4())
                    # Generate a simple title from the first query
                    title = user_query[:50] + "..." if len(user_query) > 50 else user_query
                    chat_document = {
                        "session_id": session_id_to_return,
                        "title": title,
                        "messages": [message_user, message_assistant],
                        "created_at": datetime.now(timezone.utc),
                        "last_updated": datetime.now(timezone.utc)
                        # Add user_id field later if implementing authentication
                    }
                    insert_result = chat_collection.insert_one(chat_document)
                    logging.info(f"Created new chat session: {session_id_to_return} (Title: {title})")

            except mongo_errors.PyMongoError as mongo_e:
                logging.error(f"MongoDB error during chat history update: {mongo_e}")
                # Continue without saving history if DB fails, but log error
            except Exception as hist_e:
                 logging.error(f"Unexpected error during chat history handling: {hist_e}")

        # 6. Return response
        return jsonify({"answer": answer, "chat_id": session_id_to_return})

    except Exception as e:
        # Log the full traceback for debugging
        logging.exception(f"Error processing query '{user_query}': {e}")
        return jsonify({"error": "An internal error occurred while processing your request."}), 500

# Example route to get recent chats (if needed for UI)
@app.route("/api/chats", methods=["GET"])
def get_chats():
    if chat_collection is None:
        return jsonify({"error": "Database connection not available."}), 503

    try:
        # Fetch basic info (ID, title, timestamp) for recent chats
        # Avoid fetching large message arrays unless necessary
        chats = list(chat_collection.find(
            {},
            {"_id": 0, "session_id": 1, "title": 1, "last_updated": 1}
        ).sort("last_updated", -1).limit(50))
        return jsonify(chats)
    except mongo_errors.PyMongoError as e:
        logging.error(f"MongoDB error fetching chats: {e}")
        return jsonify({"error": "Failed to retrieve chat history."}), 500
    except Exception as e:
        logging.exception(f"Unexpected error fetching chats: {e}")
        return jsonify({"error": "An internal server error occurred."}), 500


# --- Main Execution ---
if __name__ == "__main__":
    # Use Waitress or Gunicorn in production instead of Flask's built-in server
    # For development:
    app.run(debug=True, host='0.0.0.0', port=5001, use_reloader=True) # Use a specific port e.g. 5001
    # use_reloader=False might be needed if embedding models reload poorly