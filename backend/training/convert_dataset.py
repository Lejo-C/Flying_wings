import os
import glob
import pandas as pd
import numpy as np
import time
import gc

def convert_csv_to_npy(dataset_dir):
    print("==================================================")
    print(" DroneRF Dataset Converter (CSV -> Binary NPY)")
    print("==================================================")
    
    csv_files = glob.glob(os.path.join(dataset_dir, '**', '*.csv'), recursive=True)
    total_files = len(csv_files)
    
    if total_files == 0:
        print("No CSV files found. Make sure you extracted the RAR files!")
        return

    print(f"Found {total_files} CSV files to convert.")
    print("This will take a few minutes, but it will permanently speed up training by 100x!\n")
    
    start_time = time.time()
    
    for i, csv_path in enumerate(csv_files):
        npy_path = csv_path.replace('.csv', '.npy')
        
        # Skip if already converted
        if os.path.exists(npy_path):
            print(f"[{i+1}/{total_files}] Already converted: {os.path.basename(npy_path)}")
            continue
            
        print(f"[{i+1}/{total_files}] Converting: {os.path.basename(csv_path)} ...", end="", flush=True)
        
        try:
            # 1. Use Pandas (C-Optimized) to read the massive text file extremely fast
            # We strictly enforce 8192 rows (the maximum needed for our STFT transforms) 
            # to guarantee the system RAM will never crash.
            df = pd.read_csv(csv_path, header=None, nrows=8192)
            raw_data = df.values
            
            # 2. Flatten it into a 1D array of floats
            iq_data = raw_data.flatten()
            
            # 3. Save it instantly as a highly compressed binary Numpy file
            np.save(npy_path, iq_data)
            print(" DONE")
            
            # 4. Force Linux to release the RAM back to the system immediately
            del df
            del raw_data
            del iq_data
            gc.collect()
            
        except Exception as e:
            print(f" ERROR: {e}")
            
    elapsed = time.time() - start_time
    print(f"\nConversion Complete! Took {elapsed:.1f} seconds.")
    print("You can now safely delete the massive .csv files to save 45GB of hard drive space!")

if __name__ == "__main__":
    # Resolves to backend/training/dataset/train/
    script_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(script_dir, 'dataset', 'train')
    convert_csv_to_npy(dataset_path)
