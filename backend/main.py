# backend/main.py

from retriever import get_retriever
from prompt_llm import build_prompt, get_llm_response
import json
import os
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# NOTE: No longer need document_content_store or loading from data.json here,
# as the context will come from the chunk's page_content/metadata directly.

def main():
    # --- Initialize Retriever ---
    try:
        # Get retriever, maybe ask for slightly more chunks (e.g., 5) for better context
        retriever = get_retriever(k_results=5)
        logging.info("[main.py] Retriever initialization attempted.")
    except Exception as e:
        logging.error(f"[main.py] Failed to initialize retriever: {e}")
        print("CRITICAL: Could not initialize the document retriever. Exiting.")
        return

    # --- Get User Query ---
    user_query = input("Enter your financial query: ")
    if not user_query:
        print("Query cannot be empty.")
        return
    logging.info(f"[main.py] Processing query: '{user_query}'")

    # 1. Retrieve relevant CHUNKS from Pinecone
    try:
        # This now returns Langchain Document objects representing chunks
        retrieved_chunks = retriever.invoke(user_query)
        logging.info(f"[main.py] Retriever invoked. Found {len(retrieved_chunks)} relevant chunks.")
    except Exception as e:
        logging.error(f"[main.py] Error during retriever invocation: {e}")
        print("Error retrieving documents from the vector store.")
        return

    # 2. Extract context directly from the retrieved chunk documents
    context_parts = []
    source_info_list = []
    print("\n--- Retrieved Chunks & Processing ---")
    if not retrieved_chunks:
        print("No relevant chunks retrieved from vector store.")

    for i, chunk_doc in enumerate(retrieved_chunks):
        print(f"\nProcessing retrieved chunk {i+1}:")
        # Check metadata first
        metadata_info = "N/A"
        if hasattr(chunk_doc, 'metadata') and isinstance(chunk_doc.metadata, dict):
            metadata_info = chunk_doc.metadata
            print(f"  Metadata: {metadata_info}")
            filename = chunk_doc.metadata.get('source_filename', 'Unknown')
            chunk_idx = chunk_doc.metadata.get('chunk_index', -1)
            source_info_list.append(f"{filename} (chunk {chunk_idx})")
        else:
            print("  WARNING: Chunk has invalid or missing metadata attribute.")
            source_info_list.append("Unknown source")


        # Check page_content (should contain the chunk text)
        if hasattr(chunk_doc, 'page_content') and chunk_doc.page_content:
            print(f"  page_content (Chunk Text Snippet): {chunk_doc.page_content[:250]}...")
            context_parts.append(chunk_doc.page_content) # Add text to context
        else:
             # Fallback - Check if text was stored under 'chunk_text' in metadata
             if isinstance(metadata_info, dict):
                 chunk_text_fallback = metadata_info.get('chunk_text')
                 if chunk_text_fallback:
                      print(f"  WARNING: page_content empty, using text from metadata['chunk_text'].")
                      print(f"  Fallback Text Snippet: {chunk_text_fallback[:250]}...")
                      context_parts.append(chunk_text_fallback)
                 else:
                     print(f"  WARNING: page_content is empty AND metadata['chunk_text'] not found.")
             else:
                 print(f"  WARNING: page_content is empty and metadata is invalid.")

    # 3. Construct the final context string
    context = "\n\n".join(context_parts)
    if not context:
        logging.warning("[main.py] No context could be constructed from retrieved chunks.")
        print("\nWARNING: No usable context constructed.")
        context = "No relevant context found in the knowledge base for this query."

    print("\n--- Constructed Context (Snippets Sent to LLM) ---")
    if context_parts:
        # Show snippets from the start of each actual context part being used
        for part in context_parts:
            print(part[:250] + "..." if len(part) > 250 else part)
            print("-" * 15)
    else:
        print(context) # Show the placeholder if no context was built

    # 4. Build the final prompt for the LLM
    try:
        final_prompt = build_prompt(user_query, context)
        print("\n--- Final Prompt (Start Sent to LLM) ---")
        print(final_prompt[:600] + "...")
        print("-" * 20)
    except Exception as e:
        logging.error(f"[main.py] Error building prompt: {e}")
        print("Error occurred while preparing the request for the AI.")
        return

    # 5. Get LLM response
    print("\n--- Requesting LLM Response ---")
    try:
        answer = get_llm_response(final_prompt)
        print("\n--- LLM Answer ---")
        print(answer)
    except Exception as e:
        logging.error(f"[main.py] Error getting LLM response: {e}")
        print("Error occurred while getting the response from the AI.")

if __name__ == "__main__":
    main()