import os
import sys
import argparse
from pipeline import processor
from database import log_alert

def process_file(filepath):
    print(f"Processing {filepath}...")
    with open(filepath, "rb") as f:
        file_chunk = f.read()
    filename = os.path.basename(filepath)
    result = processor.execute_pipeline(file_chunk, filename)
    
    if result.get("status") == "success":
        result["metadata"]["filename"] = filename
        result["latency_ms"] = result.get("latency_breakdown", {}).get("total", 0.0)
        log_alert(result, result.get("embedding"), result.get("spectrogram_matrix"))
        print(f"Alert logged: {result.get('category')} - Confidence: {result.get('confidence'):.2f}")
    else:
        print(f"Skipped {filename}: {result.get('status')}")

def main():
    parser = argparse.ArgumentParser(description="Offline Processing CLI")
    parser.add_argument("directory", help="Directory containing files to process recursively")
    args = parser.parse_args()
    
    if not os.path.isdir(args.directory):
        print("Invalid directory")
        sys.exit(1)
        
    for root, dirs, files in os.walk(args.directory):
        for file in files:
            filepath = os.path.join(root, file)
            # Process files we know how to handle
            if any(file.endswith(ext) for ext in [".npy", ".npz", ".csv", ".sigmf-data", ".bin", ".data", ".png", ".jpg", ".jpeg"]):
                try:
                    process_file(filepath)
                except Exception as e:
                    print(f"Error processing {filepath}: {e}")

if __name__ == "__main__":
    main()
