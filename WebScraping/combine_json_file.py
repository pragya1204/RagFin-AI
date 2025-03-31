import os
import json
import subprocess
import time
import sys

def run_python_files(directory, timeout=60, poll_interval=0.5):
    print("Running Python files concurrently...")
    # Get list of Python files excluding this file
    python_files = [
        f for f in os.listdir(directory)
        if f.endswith('.py') and f != os.path.basename(__file__)
    ]
    # Use sys.executable to ensure the subprocess uses your active .venv
    python_executable = sys.executable
    processes = []
    for filename in python_files:
        print(f"Executing: {filename}")
        # Pass the current environment variables so that PATH includes your updated chromedriver location
        env = os.environ.copy()
        proc = subprocess.Popen([python_executable, filename], cwd=directory, env=env)
        processes.append({'filename': filename, 'process': proc, 'start_time': time.time()})

    # Poll until all processes have finished or are terminated
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
    print(f"Combined data written to {output_file}")

if __name__ == "__main__":
    input_directory = os.path.dirname(os.path.abspath(__file__))
    output_file = os.path.join(input_directory, 'data.json')

    run_python_files(input_directory)
    combine_json_files(input_directory, output_file)
