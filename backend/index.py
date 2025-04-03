import json
import os
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone
from config import PINECONE_API_KEY, INDEX_NAME, EMBEDDING_MODEL

# -------------------- Initialize Pinecone --------------------
try:
    pc = Pinecone(api_key=PINECONE_API_KEY)
    index = pc.Index(INDEX_NAME)
    print(f"Successfully connected to Pinecone index '{INDEX_NAME}'.")
    # Optional: Check index stats
    print(index.describe_index_stats())
except Exception as e:
    print(f"Error initializing Pinecone: {e}")
    exit()

# -------------------- Load the Embedding Model --------------------
try:
    print(f"Loading embedding model: {EMBEDDING_MODEL}...")
    model = SentenceTransformer(EMBEDDING_MODEL)
    print("Embedding model loaded successfully.")
except Exception as e:
    print(f"Error loading SentenceTransformer model '{EMBEDDING_MODEL}': {e}")
    exit()

# -------------------- Load Processed Record IDs --------------------
processed_ids_file = "processed_ids.json"
if os.path.exists(processed_ids_file):
    try:
        with open(processed_ids_file, "r") as f:
            processed_ids = set(json.load(f)) # Use a set for faster lookups
        print(f"Loaded {len(processed_ids)} processed record IDs.")
    except json.JSONDecodeError:
        print(f"Warning: Could not decode JSON from {processed_ids_file}. Starting fresh.")
        processed_ids = set()
    except Exception as e:
        print(f"Error loading {processed_ids_file}: {e}. Starting fresh.")
        processed_ids = set()
else:
    processed_ids = set()
    print("No processed IDs file found. Starting fresh.")

# -------------------- Load JSON Data --------------------
data_file_path = "data.json"
if not os.path.exists(data_file_path):
    print(f"Error: Data file '{data_file_path}' not found. Please ensure it exists.")
    exit()

try:
    with open(data_file_path, "r", encoding='utf-8') as f: # Specify encoding
        records = json.load(f)
    print(f"Loaded {len(records)} records from {data_file_path}.")
except json.JSONDecodeError as e:
    print(f"Error decoding JSON from {data_file_path}: {e}")
    exit()
except Exception as e:
    print(f"Error reading {data_file_path}: {e}")
    exit()

if not isinstance(records, list):
    print(f"Error: Expected a list of records in {data_file_path}, but got {type(records)}.")
    exit()

# -------------------- Generate Embeddings for New Records --------------------
new_vectors = []
new_ids_to_process = []
batch_size = 100 # Process in batches for Pinecone upsert efficiency

print("Processing records and generating embeddings...")
for i, item in enumerate(records):
    if not isinstance(item, dict) or len(item) != 1:
        print(f"Warning: Skipping invalid record format at index {i}: {item}")
        continue

    # Get the filename (key) and the inner data dictionary (value)
    filename = list(item.keys())[0]
    record_data = item[filename]

    # Define a unique ID for Pinecone (using filename is good if unique)
    record_id = filename

    if record_id in processed_ids:
        # print(f"Skipping already processed record: {record_id}")
        continue # Skip records that have already been processed

    # Extract the text content
    text = record_data.get("content", "")
    if not text or not isinstance(text, str) or len(text.strip()) == 0:
        print(f"Warning: Skipping record {record_id} due to missing or empty content.")
        continue

    # Generate embedding using the specified model
    try:
        embedding = model.encode(text).tolist()
    except Exception as e:
        print(f"Error generating embedding for {record_id}: {e}. Skipping.")
        continue

    # Prepare metadata, ensuring 'text' key holds the content
    metadata = {
        "text": text, # Crucial for retrieval context
        "source_filename": filename, # Store original filename
        "url": record_data.get("url", ""),
        "publish_date": record_data.get("publish_date", ""),
        "notification_number": record_data.get("notification_number", "")
    }
    # Filter out any metadata fields with empty values if desired
    metadata = {k: v for k, v in metadata.items() if v}

    new_vectors.append((record_id, embedding, metadata))
    new_ids_to_process.append(record_id)

    # Upsert in batches
    if len(new_vectors) >= batch_size:
        try:
            print(f"Upserting batch of {len(new_vectors)} vectors...")
            upsert_response = index.upsert(vectors=new_vectors)
            print(f"Batch upsert successful: {upsert_response}")
            processed_ids.update(new_ids_to_process) # Add successfully processed IDs to the set
            # Save processed IDs immediately after successful batch upsert
            with open(processed_ids_file, "w") as f:
                json.dump(list(processed_ids), f) # Convert set to list for JSON
        except Exception as e:
            print(f"Error upserting batch to Pinecone: {e}")
            # Decide how to handle batch failure (e.g., retry, log failed IDs)
        # Clear the lists for the next batch
        new_vectors = []
        new_ids_to_process = []

# Upsert any remaining vectors (less than batch_size)
if new_vectors:
    try:
        print(f"Upserting final batch of {len(new_vectors)} vectors...")
        upsert_response = index.upsert(vectors=new_vectors)
        print(f"Final batch upsert successful: {upsert_response}")
        processed_ids.update(new_ids_to_process)
        # Save processed IDs after the final successful upsert
        with open(processed_ids_file, "w") as f:
            json.dump(list(processed_ids), f)
    except Exception as e:
        print(f"Error upserting final batch to Pinecone: {e}")
elif not processed_ids and len(records) > 0:
     # This condition handles the case where records were loaded but none were new/valid
     print("No new valid records found to process.")
elif len(records) == 0:
     print("Input data file was empty.")
else:
    # This covers the case where all records were already processed
    print("All records from data.json were already processed.")


print(f"\nIndexing complete. Total processed IDs saved: {len(processed_ids)}")

# -------------------- Sample Query Demonstration --------------------
if index.describe_index_stats().total_vector_count > 0:
    print("\n--- Sample Query Demonstration ---")
    sample_query = "What are the latest rules for tax deductions under section 80C?"
    print("Sample Query:", sample_query)
    try:
        query_embedding = model.encode(sample_query).tolist()
        print("Query Embedding Generated (showing first 5 dims):", query_embedding[:5])
        query_results = index.query(
            vector=query_embedding,
            top_k=3, # Fetch top 3 results
            include_metadata=True
        )
        print("\nQuery Results:")
        if query_results["matches"]:
            for match in query_results["matches"]:
                print(f"\nID: {match['id']}, Score: {match['score']:.4f}")
                meta = match.get("metadata", {})
                print(f"  Source File: {meta.get('source_filename', 'N/A')}")
                print(f"  Publish Date: {meta.get('publish_date', 'N/A')}")
                print(f"  Notification #: {meta.get('notification_number', 'N/A')}")
                text_snippet = meta.get("text", "No text available.")[:300] # Show snippet
                print(f"  Content Snippet: {text_snippet}...")
                print("-" * 40)
        else:
            print("No relevant documents found for the sample query.")
    except Exception as e:
        print(f"Error during sample query: {e}")
else:
    print("\nSample Query skipped as Pinecone index appears empty.")