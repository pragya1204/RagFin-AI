import os
from config import INDEX_NAME, PINECONE_API_KEY, EMBEDDING_MODEL
from langchain_community.vectorstores import Pinecone as LangchainPinecone
from langchain_huggingface import HuggingFaceEmbeddings
from pinecone import Pinecone as BasePinecone
import logging
import json # Needed for test block

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def get_retriever(k_results=5):
    """Initializes and returns a Langchain retriever for the Pinecone index."""
    logging.info(f"[retriever.py] Initializing retriever for index '{INDEX_NAME}'...")

    # --- Initialize Embeddings ---
    try:
        logging.info(f"[retriever.py] Loading embedding model: {EMBEDDING_MODEL}")
        embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
        logging.info("[retriever.py] Embedding model loaded.")
    except Exception as e:
        logging.error(f"[retriever.py] Failed to load embedding model: {e}")
        raise

    # --- Initialize Langchain Pinecone Vector Store ---
    try:
        logging.info(f"[retriever.py] Connecting to Langchain Pinecone vector store for index: {INDEX_NAME}")
        # Explicitly tell Langchain to use 'chunk_text' from metadata as the Document's page_content
        vector_store = LangchainPinecone.from_existing_index(
            index_name=INDEX_NAME,
            embedding=embeddings,
            text_key='chunk_text' # <--- IMPORTANT: Use the key where chunk text is stored
        )
        logging.info("[retriever.py] Langchain Pinecone vector store connected.")
    except Exception as e:
        logging.error(f"[retriever.py] Failed to initialize Langchain Pinecone vector store: {e}")
        raise

    # --- Create Retriever ---
    try:
        # You might adjust search_type later (e.g., 'mmr' for diversity)
        retriever = vector_store.as_retriever(
            search_type="similarity", # Standard similarity search
            search_kwargs={"k": k_results}
        )
        logging.info(f"[retriever.py] Retriever created with k={k_results}.")
        return retriever
    except Exception as e:
        logging.error(f"[retriever.py] Failed to create retriever from vector store: {e}")
        raise


# --- Test Block (Updated for Chunks) ---
if __name__ == "__main__":
    print("\n--- Testing retriever.py Standalone (Chunking Aware) ---")

    try:
        # Get retriever, asking for top 3 chunks
        retriever_instance = get_retriever(k_results=3)

        test_query = "What are the rules for tax deductions?"
        print(f"\n[Test Block] Running test query: '{test_query}'")

        # Invoke the retriever - this should now return Langchain Document objects
        # where page_content is populated from metadata['chunk_text']
        results = retriever_instance.invoke(test_query)
        print(f"[Test Block] Retriever returned {len(results)} results (chunks).")

        print("\n[Test Block] Retrieved Chunks & Content:")
        if not results:
            print("  No results found.")

        for i, doc in enumerate(results):
            print(f"\n  Chunk {i+1}:")
            # Check metadata
            if hasattr(doc, 'metadata') and isinstance(doc.metadata, dict):
                print(f"    Metadata: {doc.metadata}")
            else:
                 print(f"    WARNING: Chunk {i+1} has invalid or missing metadata.")

            # Check page_content (should be the chunk text now)
            if hasattr(doc, 'page_content') and doc.page_content:
                print(f"    page_content (Chunk Text Snippet): {doc.page_content[:250]}...")
            else:
                 print("    WARNING: page_content attribute missing or empty.")
            print("-" * 10)

    except Exception as e:
        print(f"\n[Test Block] An error occurred during testing: {e}")
        logging.exception("[Test Block] Error details:")