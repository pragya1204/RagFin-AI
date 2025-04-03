import os
import json
import subprocess
import time
import sys

def run_python_files(directory, timeout=60, poll_interval=0.5):
    """Runs other Python scripts in the directory concurrently."""
    print("Running Python files concurrently...")
    python_files = [
        f for f in os.listdir(directory)
        if f.endswith('.py') and f != os.path.basename(__file__)
    ]
    if not python_files:
        print("No other Python files found to run.")
        return

    python_executable = sys.executable
    processes = []
    print(f"Found scripts to run: {', '.join(python_files)}")
    for script_filename in python_files:
        print(f"Executing: {script_filename}")
        try:
            env = os.environ.copy()
            # Ensure correct path handling for subprocess, especially if running from different locations
            script_path = os.path.join(directory, script_filename)
            # Execute script in its own directory context if needed
            proc = subprocess.Popen([python_executable, script_path], cwd=directory, env=env)
            processes.append({'filename': script_filename, 'process': proc, 'start_time': time.time()})
        except Exception as e:
            print(f"Error starting process for {script_filename}: {e}")


    # Poll until all processes have finished or are terminated
    start_poll_time = time.time()
    max_wait_time = timeout * len(processes) # Adjust max wait if needed

    while processes:
        if time.time() - start_poll_time > max_wait_time + 10: # Safety break
             print("Warning: Exceeded maximum polling time. Forcing exit.")
             for proc_info in processes:
                  if proc_info['process'].poll() is None:
                       print(f"Terminating stuck process: {proc_info['filename']}")
                       proc_info['process'].terminate()
                       proc_info['process'].wait()
             break

        for proc_info in list(processes): # Iterate over a copy
            proc = proc_info['process']
            filename = proc_info['filename']
            elapsed = time.time() - proc_info['start_time']
            poll_status = proc.poll()

            if poll_status is not None:
                print(f"{filename} completed with return code {poll_status}.")
                processes.remove(proc_info)
            elif elapsed > timeout:
                print(f"Timeout expired ({timeout}s) for {filename}; terminating process.")
                try:
                    proc.terminate() # Try graceful termination
                    proc.wait(timeout=5) # Wait briefly
                except subprocess.TimeoutExpired:
                    print(f"Force killing {filename} after termination timeout.")
                    proc.kill() # Force kill if terminate fails
                    proc.wait()
                except Exception as term_e:
                     print(f"Error terminating {filename}: {term_e}")
                if proc_info in processes: # Check if already removed by another condition race
                    processes.remove(proc_info)

        if processes: # Only sleep if there are still processes running
            time.sleep(poll_interval)
    print("Finished running concurrent scripts.")


def combine_json_files(directory, output_file):
    """Combines JSON files into the desired list-of-single-item-dicts format."""
    print("Combining JSON files...")
    combined_data = []
    output_filename = os.path.basename(output_file)
    files_processed = 0

    # Look for specific JSON files likely produced by your scrapers
    # Adjust these names if your scrapers produce different output files
    source_json_files = ['processed_pdfs.json', 'rbi_notifications.json']

    for json_filename in source_json_files:
        file_path = os.path.join(directory, json_filename)
        if not os.path.exists(file_path):
            print(f"Source file not found, skipping: {json_filename}")
            continue

        print(f"Processing source file: {json_filename}")
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # *** CORE CHANGE IS HERE ***
            # Expecting data to be a dictionary like:
            # {"filename1.pdf": {details}, "filename2.pdf": {details}} OR
            # {"title1": {details}, "title2": {details}}
            if isinstance(data, dict):
                count_added = 0
                for key, value in data.items():
                    # Create a new dictionary containing only this single key-value pair
                    single_record_dict = {key: value}
                    combined_data.append(single_record_dict)
                    count_added += 1
                print(f"  Added {count_added} records from dictionary structure in {json_filename}.")
                files_processed += 1
            # If a source file *did* produce a list of single-item dicts already, handle that too
            elif isinstance(data, list):
                 # Check if list items are already in the desired format
                 valid_list = True
                 for item in data:
                      if not (isinstance(item, dict) and len(item) == 1):
                           valid_list = False
                           break
                 if valid_list:
                      combined_data.extend(data)
                      print(f"  Extended with {len(data)} records from list structure in {json_filename}.")
                      files_processed += 1
                 else:
                      print(f"  Warning: Skipping list in {json_filename} as items are not single-key dictionaries.")
            else:
                print(f"  Warning: Unexpected data type ({type(data)}) in {json_filename}. Skipping.")

        except json.JSONDecodeError as e:
            print(f"  Error decoding JSON from {json_filename}: {e}")
        except Exception as e:
            print(f"  Error processing {json_filename}: {e}")

    if not combined_data:
         print("Warning: No data was combined. Output file will be empty or not updated.")
         # Optional: Decide whether to write an empty list or skip writing
         # return # Uncomment to avoid writing empty file

    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(combined_data, f, indent=4, ensure_ascii=False) # ensure_ascii=False is good for non-English text
        print(f"Combined data written to {output_file}. Total records: {len(combined_data)} from {files_processed} source file(s).")
    except Exception as e:
        print(f"Error writing combined data to {output_file}: {e}")


if __name__ == "__main__":
    # Assume this script is inside the WebScraping directory
    input_directory = os.path.dirname(os.path.abspath(__file__))
    output_file = os.path.join(input_directory, 'data.json')

    # 1. Run the scraping scripts first
    run_python_files(input_directory)

    # 2. Then combine their outputs
    combine_json_files(input_directory, output_file)