import os
import sys
import argparse
import json
from app.pipeline import processor
from app.database import log_alert

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
        return result
    else:
        print(f"Skipped {filename}: {result.get('status')}")
        return None

def main():
    parser = argparse.ArgumentParser(description="Offline Processing CLI")
    parser.add_argument("directory", help="Directory containing files to process recursively")
    parser.add_argument("--output", default="alerts_log.json", help="Output JSON file for the alert stream")
    args = parser.parse_args()
    
    if not os.path.isdir(args.directory):
        print("Invalid directory")
        sys.exit(1)
        
    all_alerts = []
        
    for root, dirs, files in os.walk(args.directory):
        for file in files:
            filepath = os.path.join(root, file)
            # Process files we know how to handle
            if any(file.endswith(ext) for ext in [".npy", ".npz", ".csv", ".sigmf-data", ".bin", ".data", ".png", ".jpg", ".jpeg"]):
                try:
                    res = process_file(filepath)
                    if res:
                        # Clean up heavy tensors before saving to JSON report
                        if "spectrogram_matrix" in res:
                            del res["spectrogram_matrix"]
                        if "embedding" in res:
                            del res["embedding"]
                        all_alerts.append(res)
                except Exception as e:
                    print(f"Error processing {filepath}: {e}")

    # Output alert stream JSON as required by specifications
    with open(args.output, "w") as f:
        json.dump(all_alerts, f, indent=4)
    print(f"\n[+] Competition Summary Report & Alert Stream saved to {args.output}")

if __name__ == "__main__":
    main()
