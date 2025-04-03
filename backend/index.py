import json
import os
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone
from langchain.text_splitter import RecursiveCharacterTextSplitter
from config import PINECONE_API_KEY, INDEX_NAME, EMBEDDING_MODEL
import logging
import time
import hashlib

# --- Logging Setup ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Constants ---
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 150
METADATA_SIZE_LIMIT_BYTES = 35 * 1024

# -------------------- Initialize Pinecone --------------------
pc = None # Initialize pc to None
index = None # Initialize index to None
try:
    logging.info(f"Initializing Pinecone client with API key ending in '...{PINECONE_API_KEY[-4:] if PINECONE_API_KEY else 'N/A'}'")
    pc = Pinecone(api_key=PINECONE_API_KEY)

    # --- Robust Index Existence Check ---
        
        # --- Robust Index Existence Check ---
    logging.info("Fetching list of existing Pinecone indexes...")
    index_list_response = pc.list_indexes() # Returns a specific Pinecone object

    # Check if the response object has an 'indexes' attribute and if it's a list
    if hasattr(index_list_response, 'indexes') and isinstance(index_list_response.indexes, list):
        # Access the list of index details via the .indexes attribute
        existing_indexes_details = index_list_response.indexes
        # Extract the names from the list of index detail objects/dicts
        # Use getattr for safe access to the 'name' attribute/key of each item in the list
        existing_index_names = [getattr(idx_details, 'name', None) for idx_details in existing_indexes_details]
        # Filter out None values in case some items didn't have 'name'
        existing_index_names = [name for name in existing_index_names if name is not None]
        logging.info(f"Found index names: {existing_index_names}")

        # Check if your target index name is in the extracted list
        if INDEX_NAME not in existing_index_names:
            logging.error(f"Pinecone index '{INDEX_NAME}' does not exist in the list: {existing_index_names}. Please create it first.")
            exit()
        else:
            logging.info(f"Index '{INDEX_NAME}' found.")
            # Now connect to the specific index
            index = pc.Index(INDEX_NAME)
            logging.info(f"Successfully connected to Pinecone index '{INDEX_NAME}'.")
            logging.info(f"Initial index stats: {index.describe_index_stats()}")
    else:
        # Handle unexpected response structure if 'indexes' attribute is missing or not a list
        logging.error(f"Could not verify index existence. Unexpected response object structure from pc.list_indexes(). Object type: {type(index_list_response)}, Value: {index_list_response}")
        logging.error("Please check Pinecone client library version, API key, network connection, and service status.")
        exit() # Exit because we cannot confirm the index exists
except Exception as e:
    logging.exception(f"FATAL: Error during Pinecone initialization or index check: {e}") # Log full traceback
    exit() # Exit on any initialization error

# -------------------- Load the Embedding Model --------------------
# (Keep this section as it was before)
try:
    logging.info(f"Loading embedding model: {EMBEDDING_MODEL}...")
    model = SentenceTransformer(EMBEDDING_MODEL)
    logging.info("Embedding model loaded successfully.")
except Exception as e:
    logging.error(f"Error loading SentenceTransformer model '{EMBEDDING_MODEL}': {e}")
    exit()

# -------------------- Initialize Text Splitter --------------------
# (Keep this section as it was before)
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=CHUNK_SIZE,
    chunk_overlap=CHUNK_OVERLAP,
    length_function=len,
    add_start_index=True,
)
logging.info(f"Text splitter initialized with chunk_size={CHUNK_SIZE}, overlap={CHUNK_OVERLAP}")

# -------------------- Load Processed Record IDs (Now tracks chunk IDs) --------------------
# (Keep this section as it was before)
processed_ids_file = "processed_chunk_ids.json"
processed_chunk_ids = set()
if os.path.exists(processed_ids_file):
    try:
        with open(processed_ids_file, "r", encoding='utf-8') as f:
            processed_ids_list = json.load(f)
            if isinstance(processed_ids_list, list):
                 processed_chunk_ids = set(processed_ids_list)
            else:
                 logging.warning(f"Expected list in {processed_ids_file}, got {type(processed_ids_list)}. Starting fresh.")
        logging.info(f"Loaded {len(processed_chunk_ids)} processed chunk IDs.")
    except Exception as e:
        logging.error(f"Error loading {processed_ids_file}: {e}. Starting fresh.")
else:
    logging.info("No processed chunk IDs file found. Starting fresh.")

# -------------------- Load Source JSON Data --------------------
# (Keep this section as it was before)
data_file_path = "../WebScraping/data.json"
if not os.path.exists(data_file_path):
    logging.error(f"Error: Data file '{data_file_path}' not found.")
    exit()
try:
    with open(data_file_path, "r", encoding='utf-8') as f:
        source_records = json.load(f)
    logging.info(f"Loaded {len(source_records)} source document records from {data_file_path}.")
except Exception as e:
    logging.error(f"Error reading/decoding {data_file_path}: {e}")
    exit()
if not isinstance(source_records, list):
    logging.error(f"Error: Expected a list of records in {data_file_path}.")
    exit()

# -------------------- Process Documents, Chunk, Generate Embeddings --------------------
# (Keep this section as it was before - no changes needed here for this specific error)
new_vectors = []
new_chunk_ids_batch = []
batch_size = 100
total_chunks_processed = 0
total_source_docs_processed = 0
total_skipped_docs = 0
total_skipped_chunks = 0

logging.info("Processing documents, chunking, and generating embeddings...")
for i, item in enumerate(source_records):
    # ... (rest of the loop for chunking, embedding, metadata check, batching) ...
    # This part remains the same as the previous chunking version
    if not isinstance(item, dict) or len(item) != 1:
        logging.warning(f"Skipping invalid source record format at index {i}.")
        total_skipped_docs += 1
        continue
    filename = list(item.keys())[0]
    record_data = item[filename]
    if not isinstance(record_data, dict):
        logging.warning(f"Skipping source record {filename} at index {i}: Value is not a dictionary.")
        total_skipped_docs += 1
        continue
    text_content = record_data.get("content", "")
    if not text_content or not isinstance(text_content, str) or len(text_content.strip()) == 0:
        logging.warning(f"Skipping source record {filename} due to missing or empty 'content'.")
        total_skipped_docs += 1
        continue
    base_metadata = {
        "source_filename": filename,
        "url": record_data.get("url", record_data.get("pdf_url", "")),
        "publish_date": record_data.get("publish_date", record_data.get("date", "")),
        "notification_number": record_data.get("notification_number", "")
    }
    base_metadata = {k: v for k, v in base_metadata.items() if v is not None and v != ""}
    try:
        chunks = text_splitter.split_text(text_content)
        # logging.info(f"Document '{filename}' split into {len(chunks)} chunks.") # Can make logs noisy
    except Exception as e:
        logging.error(f"Error splitting text for document '{filename}': {e}. Skipping document.")
        total_skipped_docs += 1
        continue
    total_source_docs_processed += 1
    for chunk_index, chunk_text in enumerate(chunks):
        chunk_id_str = f"{filename}_chunk_{chunk_index}"
        if chunk_id_str in processed_chunk_ids:
            total_skipped_chunks += 1
            continue
        chunk_metadata = base_metadata.copy()
        chunk_metadata["chunk_index"] = chunk_index
        chunk_metadata["chunk_text"] = chunk_text
        metadata_json_string = json.dumps(chunk_metadata)
        metadata_size = len(metadata_json_string.encode('utf-8'))
        if metadata_size > METADATA_SIZE_LIMIT_BYTES:
            logging.warning(f"Chunk {chunk_id_str} metadata size ({metadata_size} bytes) exceeds limit. Skipping chunk.")
            total_skipped_chunks += 1
            continue
        try:
            chunk_embedding = model.encode(chunk_text).tolist()
        except Exception as e:
            logging.error(f"Error generating embedding for chunk {chunk_id_str}: {e}. Skipping chunk.")
            total_skipped_chunks += 1
            continue
        new_vectors.append((chunk_id_str, chunk_embedding, chunk_metadata))
        new_chunk_ids_batch.append(chunk_id_str)
        total_chunks_processed += 1
        if len(new_vectors) >= batch_size:
            try:
                logging.info(f"Upserting batch of {len(new_vectors)} chunk vectors...")
                upsert_response = index.upsert(vectors=new_vectors)
                logging.info(f"Batch upsert response: {upsert_response}")
                processed_chunk_ids.update(new_chunk_ids_batch)
                with open(processed_ids_file, "w", encoding='utf-8') as f:
                    json.dump(list(processed_chunk_ids), f)
            except Exception as e:
                logging.error(f"Error upserting batch to Pinecone: {e}")
            new_vectors = []
            new_chunk_ids_batch = []
if new_vectors:
    try:
        logging.info(f"Upserting final batch of {len(new_vectors)} chunk vectors...")
        upsert_response = index.upsert(vectors=new_vectors)
        logging.info(f"Final batch upsert response: {upsert_response}")
        processed_chunk_ids.update(new_chunk_ids_batch)
        with open(processed_ids_file, "w", encoding='utf-8') as f:
            json.dump(list(processed_chunk_ids), f)
    except Exception as e:
        logging.error(f"Error upserting final batch to Pinecone: {e}")

# -------------------- Indexing Summary --------------------
# (Keep this section as it was before)
logging.info(f"\n--- Indexing Summary ---")
logging.info(f"Total source documents loaded: {len(source_records)}")
logging.info(f"Source documents processed: {total_source_docs_processed}")
logging.info(f"Source documents skipped (invalid format/content): {total_skipped_docs}")
logging.info(f"Total chunks processed for upsert: {total_chunks_processed}")
logging.info(f"Chunks skipped (already processed or metadata too large): {total_skipped_chunks}")
logging.info(f"Total chunk IDs in {processed_ids_file}: {len(processed_chunk_ids)}")


# -------------------- Sample Query Demonstration --------------------
# (Keep this section as it was before)
try:
    # Ensure index object is valid before using it
    if index:
        logging.info("Waiting a few seconds for Pinecone index to update stats...")
        time.sleep(10)
        logging.info("Checking index stats after delay...")
        index_stats = index.describe_index_stats()
        logging.info(f"Index stats after delay: {index_stats}")

        if index_stats and index_stats.total_vector_count > 0:
            logging.info("\n--- Sample Query Demonstration (Chunks) ---")
            sample_query = "What are the rules for tax deductions under section 80C?"
            logging.info(f"Sample Query: {sample_query}")
            query_embedding = model.encode(sample_query).tolist()
            logging.info(f"Query Embedding Generated (first 5 dims): {query_embedding[:5]}")

            query_results = index.query(
                vector=query_embedding,
                top_k=3, # Fetch top 3 relevant CHUNKS
                include_metadata=True
            )
            logging.info("\nQuery Results (Chunks):")
            if query_results and query_results["matches"]:
                for match in query_results["matches"]:
                    logging.info(f"\n  Chunk ID: {match['id']}, Score: {match['score']:.4f}")
                    meta = match.get("metadata", {})
                    logging.info(f"    Source File: {meta.get('source_filename', 'N/A')}")
                    logging.info(f"    Publish Date: {meta.get('publish_date', 'N/A')}")
                    chunk_text_snippet = meta.get("chunk_text", "N/A")[:250]
                    logging.info(f"    Chunk Text Snippet: {chunk_text_snippet}...")
                    logging.info("-" * 20)
            else:
                logging.info("No relevant chunks found for the sample query.")
        else:
            logging.warning("\nSample Query skipped. Pinecone index reports 0 vectors even after waiting.")
    else:
         logging.warning("\nSample Query skipped as Pinecone index object is not valid.")
except Exception as e:
    logging.error(f"Error during sample query or describing index stats: {e}")