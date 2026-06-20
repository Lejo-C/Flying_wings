import sqlite3
import json
import os
from datetime import datetime

DB_PATH = "data/alerts.db"
JSON_PATH = "data/alerts.json"

def init_db():
    os.makedirs("data", exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            category TEXT,
            confidence REAL,
            center_freq REAL,
            bandwidth REAL,
            matching_library TEXT,
            onset TEXT,
            offset TEXT
        )
    ''')
    conn.commit()
    conn.close()

def log_alert(alert_data: dict):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    timestamp = datetime.utcnow().isoformat()
    cursor.execute('''
        INSERT INTO alerts (timestamp, category, confidence, center_freq, bandwidth, matching_library, onset, offset)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        timestamp,
        alert_data.get("category"),
        alert_data.get("confidence"),
        alert_data.get("centerFreq"),
        alert_data.get("bandwidth"),
        alert_data.get("matchingLibrary"),
        alert_data.get("onset"),
        alert_data.get("offset")
    ))
    conn.commit()
    conn.close()

    # Append to JSON
    alerts_history = []
    if os.path.exists(JSON_PATH):
        try:
            with open(JSON_PATH, "r") as f:
                alerts_history = json.load(f)
        except json.JSONDecodeError:
            pass
            
    alert_data["system_timestamp"] = timestamp
    alerts_history.append(alert_data)
    
    with open(JSON_PATH, "w") as f:
        json.dump(alerts_history, f, indent=4)
        
    return alert_data
