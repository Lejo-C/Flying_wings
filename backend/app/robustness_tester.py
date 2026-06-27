import os
import json
import numpy as np
from pipeline import processor
from app import config

def add_noise(signal, snr_db):
    sig_power = np.mean(np.abs(signal)**2)
    if sig_power == 0:
        sig_power = 1.0
    noise_power = sig_power / (10 ** (snr_db / 10))
    noise = np.sqrt(noise_power / 2) * (np.random.randn(len(signal)) + 1j * np.random.randn(len(signal)))
    return signal + noise

def add_interference(signal, interference_power):
    # Add a single tone interference
    t = np.arange(len(signal))
    interference = np.sqrt(interference_power) * np.exp(1j * 2 * np.pi * 0.1 * t)
    return signal + interference

def run_tests():
    print("Starting Robustness Testing Suite...")
    
    # Generate a dummy UAS-like signal (e.g., QPSK-like)
    t = np.arange(100000)
    base_signal = np.exp(1j * np.pi * np.random.choice([0.25, 0.75, 1.25, 1.75], size=len(t)))
    
    scenarios = [
        {"name": "Clean Signal", "snr": 30, "interference": 0.0},
        {"name": "Low SNR", "snr": 5, "interference": 0.0},
        {"name": "High Interference", "snr": 20, "interference": 2.0},
        {"name": "Low SNR + Interference", "snr": 0, "interference": 2.0},
    ]
    
    results = []
    
    for scenario in scenarios:
        print(f"Testing Scenario: {scenario['name']}")
        sig = add_noise(base_signal, scenario['snr'])
        sig = add_interference(sig, scenario['interference'])
        
        # Convert to bytes as expected by processor
        file_chunk = sig.astype(np.complex64).tobytes()
        
        res = processor.execute_pipeline(file_chunk, "dummy.sigmf-data", override_meta={"datatype": "cf32"})
        
        results.append({
            "scenario": scenario["name"],
            "snr_db": scenario["snr"],
            "prediction": res.get("category", "Unknown"),
            "confidence": res.get("confidence", 0.0),
            "latency_ms": res.get("latency_breakdown", {}).get("total", 0.0)
        })
        
    report_path = os.path.join(config.DATA_DIR, "robustness_report.json")
    with open(report_path, "w") as f:
        json.dump(results, f, indent=4)
        
    print(f"Robustness report saved to {report_path}")

if __name__ == "__main__":
    run_tests()
