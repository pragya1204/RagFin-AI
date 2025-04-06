# backend/retriever.py

import os
# Import necessary components from config and libraries
from config import INDEX_NAME, PINECONE_API_KEY, EMBEDDING_MODEL # Need EMBEDDING_MODEL only if loading fallback
from langchain_community.vectorstores import Pinecone as LangchainPinecone
from langchain_huggingface import HuggingFaceEmbeddings
from sentence_transformers import SentenceTransformer # Import here for fallback loading
import logging
import json # Needed for test block logic below

# Configure logging for this module
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Updated get_retriever function ---
# Accepts an optional pre-loaded embedding model object
def get_retriever(k_results=5, model=None):
    """
    Initializes and returns a Langchain retriever for the Pinecone index.
    Accepts an optional pre-loaded SentenceTransformer model.
    """
    logging.info(f"[retriever.py] Initializing retriever for index '{INDEX_NAME}' with k={k_results}...")

    # --- Initialize Embeddings ---
    embeddings_interface = None # Variable to hold the Langchain embedding object

    if model is not None:
        # Use the pre-loaded model passed as argument
        try:
            logging.info("[retriever.py] Using pre-loaded embedding model provided.")
            # Wrap the provided SentenceTransformer model in Langchain's interface
            # This assumes 'model' is a loaded SentenceTransformer object
            embeddings_interface = HuggingFaceEmbeddings(model=model)
            logging.info("[retriever.py] Pre-loaded model wrapped successfully.")
        except Exception as e:
             logging.error(f"[retriever.py] Failed to wrap pre-loaded model: {e}")
             raise # Cannot proceed if wrapping fails
    else:
        # Load model ONLY if not provided (Fallback for standalone testing or if app.py fails)
        logging.warning("[retriever.py] No pre-loaded model provided. Loading model internally...")
        try:
            logging.info(f"[retriever.py] Loading embedding model internally: {EMBEDDING_MODEL}")
            internal_model = SentenceTransformer(EMBEDDING_MODEL)
            embeddings_interface = HuggingFaceEmbeddings(model=internal_model)
            logging.info("[retriever.py] Internal embedding model loaded and wrapped.")
        except Exception as e:
            logging.error(f"[retriever.py] Failed to load internal embedding model: {e}")
            raise # Cannot proceed if internal loading fails

    # Ensure we have a valid embeddings object before proceeding
    if embeddings_interface is None:
         logging.error("[retriever.py] Embedding interface could not be initialized.")
         raise ValueError("Failed to initialize embedding interface for retriever.")

    # --- Initialize Langchain Pinecone Vector Store ---
    try:
        logging.info(f"[retriever.py] Connecting to vector store (Index: {INDEX_NAME})...")
        # Ensure PINECONE_API_KEY is implicitly used by the client or set env var if needed
        # os.environ["PINECONE_API_KEY"] = PINECONE_API_KEY # Usually not needed if client configured
        vector_store = LangchainPinecone.from_existing_index(
            index_name=INDEX_NAME,
            embedding=embeddings_interface, # Use the initialized Langchain embeddings object
            text_key='chunk_text' # Tell Langchain where chunk text is in metadata
        )
        logging.info("[retriever.py] Langchain Pinecone vector store connected.")
    except Exception as e:
        logging.error(f"[retriever.py] Failed to initialize Langchain Pinecone vector store: {e}")
        raise

    # --- Create Retriever ---
    try:
        retriever = vector_store.as_retriever(
            search_type="similarity", # Use standard similarity search
            search_kwargs={"k": k_results} # Fetch the requested number of results
        )
        logging.info(f"[retriever.py] Retriever created successfully.")
        return retriever
    except Exception as e:
        logging.error(f"[retriever.py] Failed to create retriever from vector store: {e}")
        raise


# --- Test Block (Updated for Chunks & Local Context Loading) ---
if __name__ == "__main__":
    print("\n--- Testing retriever.py Standalone (Chunking Aware) ---")

    # --- Load Document Content for Test Context Fetching ---
    # Replicate minimal loading logic from app.py just for this test
    test_doc_store = {}
    test_data_path = "../WebScraping/data.json" # Adjust path if needed relative to retriever.py
    try:
        if os.path.exists(test_data_path):
            with open(test_data_path, "r", encoding='utf-8') as f:
                test_records = json.load(f)
            if isinstance(test_records, list):
                for item in test_records:
                    if isinstance(item, dict) and len(item) == 1:
                        filename = list(item.keys())[0]
                        record_data = item[filename]
                        if isinstance(record_data, dict) and "content" in record_data:
                            # For testing, maybe just store a snippet or indicator
                            test_doc_store[filename] = (record_data["content"][:100] + "...") # Store snippet
            print(f"[Test Block] Loaded {len(test_doc_store)} document snippets for context verification.")
        else:
            print(f"[Test Block] WARNING: Test data file not found at {test_data_path}. Cannot verify context fetching.")
    except Exception as e:
        print(f"[Test Block] Error loading test data: {e}")
    # --- End Test Context Loading ---

    try:
        # Get retriever instance, loading model internally for this test
        print("\n[Test Block] Initializing retriever (will load model internally)...")
        retriever_instance = get_retriever(k_results=3) # Get top 3 chunks

        test_query = "What did recent CBDT circulars say about compounding offenses?" # More specific query
        print(f"\n[Test Block] Running test query: '{test_query}'")

        # Invoke the retriever
        results = retriever_instance.invoke(test_query)
        print(f"[Test Block] Retriever returned {len(results)} results (chunks).")

        print("\n[Test Block] Retrieved Chunks & Verification:")
        if not results:
            print("  No results found.")

        for i, doc in enumerate(results):
            print(f"\n  Chunk {i+1}:")
            # Check metadata structure
            if hasattr(doc, 'metadata') and isinstance(doc.metadata, dict):
                print(f"    Metadata: {doc.metadata}")
                # Verify if we can find source_filename
                filename = doc.metadata.get('source_filename')
                if filename:
                     # Check if we have the content snippet stored
                     content_snippet = test_doc_store.get(filename)
                     if content_snippet:
                          print(f"    Verified - Found content snippet for {filename}: {content_snippet}")
                     else:
                          print(f"    NOTE: Source file {filename} present in metadata but not found in test store.")
                else:
                     print("    WARNING: 'source_filename' missing in metadata.")
            else:
                print(f"    WARNING: Result {i+1} has invalid or missing metadata.")

            # Check page_content (should be the chunk text)
            if hasattr(doc, 'page_content') and doc.page_content:
                print(f"    page_content Snippet: {doc.page_content[:250]}...") # Show snippet
            else:
                 print("    WARNING: page_content attribute missing or empty.")
            print("-" * 10)

    except Exception as e:
        print(f"\n[Test Block] An error occurred during testing: {e}")
        logging.exception("[Test Block] Error details:")