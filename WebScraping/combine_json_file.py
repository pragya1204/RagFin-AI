import os
import json
import subprocess
import time

def run_python_files(directory, timeout=60, poll_interval=0.5):
    print("Running Python files concurrently...")
    # Get list of Python files excluding this file
    python_files = [
        f for f in os.listdir(directory)
        if f.endswith('.py') and f != os.path.basename(__file__)
    ]
    # Start processes and track start times
    processes = []
    for filename in python_files:
        file_path = os.path.join(directory, filename)
        print(f"Executing: {filename}")
        proc = subprocess.Popen(['python', file_path])
        processes.append({'filename': filename, 'process': proc, 'start_time': time.time()})

    # Poll until all processes have finished or been terminated
    while processes:
        for proc_info in processes.copy():
            proc = proc_info['process']
            filename = proc_info['filename']
            elapsed = time.time() - proc_info['start_time']
            if proc.poll() is not None:
                print(f"{filename} completed.")
                processes.remove(proc_info)
            elif elapsed > timeout:
                print(f"Timeout expired for {filename}; terminating process.")
                proc.terminate()
                proc.wait()
                processes.remove(proc_info)
        time.sleep(poll_interval)

def combine_json_files(directory, output_file):
    print("Combining JSON files...")
    combined_data = []
    output_filename = os.path.basename(output_file)

    for filename in os.listdir(directory):
        # Skip the output file if it already exists
        if filename.endswith('.json') and filename != output_filename:
            file_path = os.path.join(directory, filename)
            try:
                with open(file_path, 'r') as f:
                    data = json.load(f)
                if isinstance(data, list):
                    combined_data.extend(data)
                else:
                    combined_data.append(data)
            except Exception as e:
                print(f"Skipping {filename} due to error: {e}")

    with open(output_file, 'w') as f:
        json.dump(combined_data, f, indent=4)
    print(f"Combined data has been written to {output_file}")

if __name__ == "__main__":
    input_directory = './'
    output_file = 'data.json'

    run_python_files(input_directory)
    combine_json_files(input_directory, output_file)
