import asyncio
import json
import os
import random
from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from app.database import init_db, log_alert, calculate_metrics
from app.pipeline.processor import execute_pipeline, parse_sigmf_meta
from app import config

app = FastAPI(title="Anti-UAS RF Prototype Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database and directories on startup
@app.on_event("startup")
def on_startup():
    init_db()
    
# Serve static evidence files (spectrogram plots)
# This makes images accessible under /data/evidence/{event_id}.png
os.makedirs(config.EVIDENCE_DIR, exist_ok=True)
app.mount("/data/evidence", StaticFiles(directory=config.EVIDENCE_DIR), name="evidence")

# Active WebSocket connections manager for telemetry streaming
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

@app.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/api/ingest")
async def ingest_files(files: list[UploadFile] = File(...)):
    """
    Ingests raw dataset blocks/files in batch. Detects SigMF meta/data,
    NumPy arrays, NPZ, or CSV, runs the 5-phase ONNX pipeline, logs outcomes,
    saves evidence, and broadcasts results.
    """
    # 1. Group uploads into meta (.meta) and data files
    meta_files = [f for f in files if f.filename.endswith('.meta')]
    data_files = [f for f in files if not f.filename.endswith('.meta')]
    
    # 2. Parse all metadata files
    parsed_metadata = {}
    for f in meta_files:
        try:
            content = await f.read()
            meta_dict = parse_sigmf_meta(content)
            base_name = os.path.splitext(f.filename)[0]
            parsed_metadata[base_name] = meta_dict
        except Exception as e:
            print(f"Error parsing metadata file {f.filename}: {e}")
            
    # If no data files are uploaded, but we have meta files, we return early
    if len(data_files) == 0 and len(meta_files) > 0:
        return JSONResponse({
            "status": "success", 
            "message": "Metadata loaded successfully.", 
            "parsed_metadata": parsed_metadata
        })
        
    results = []
    
    # 3. Process all data files sequentially
    for f in data_files:
        try:
            content = await f.read()
            base_name = os.path.splitext(f.filename)[0]
            
            # Check for associated metadata
            override_meta = parsed_metadata.get(base_name, None)
            
            # Execute Pipeline
            pipeline_result = execute_pipeline(content, f.filename, override_meta)
            
            if pipeline_result.get("status") == "metadata_only":
                results.append(pipeline_result)
                continue
                
            # Compute timing bounds (mock timestamps based on segment onset/offsets)
            meta = pipeline_result["metadata"]
            
            alert_payload = {
                "category": pipeline_result["category"],
                "confidence": pipeline_result["confidence"],
                "onset": "00:00:02.500",
                "offset": "00:00:04.200",
                "latency_ms": pipeline_result["latency_breakdown"]["total"],
                "latency_breakdown": pipeline_result["latency_breakdown"],
                "metadata": meta
            }
            
            # Save to SQLite and local JSON, and calculate similarity
            saved_alert = log_alert(
                alert_payload, 
                embedding=pipeline_result["embedding"], 
                spectrogram_matrix=pipeline_result["spectrogram_matrix"]
            )
            
            # Broadcast the alert to WebSocket clients
            await manager.broadcast(json.dumps({
                "type": "NEW_ALERT",
                "payload": saved_alert
            }))
            
            results.append(saved_alert)
        except Exception as e:
            print(f"Error processing file {f.filename}: {e}")
            results.append({
                "filename": f.filename,
                "status": "failed",
                "error": str(e)
            })
            
    return JSONResponse({"status": "success", "results": results})

@app.get("/api/metrics")
def get_metrics():
    """Returns Pd, FAR, F1, Recall, Precision, and Confusion Matrix."""
    stats = calculate_metrics()
    return JSONResponse(stats)

@app.get("/api/report")
def download_report():
    """Serves the generated report.json file."""
    if os.path.exists(config.REPORT_PATH):
        return FileResponse(config.REPORT_PATH, media_type="application/json", filename="report.json")
    else:
        # Generate default metrics if file doesn't exist
        stats = calculate_metrics()
        return JSONResponse(stats)

@app.get("/api/health")
def health_check():
    return {"status": "online", "model": "mobilenet_v3_small_int8"}

@app.get("/api/alerts")
def get_alerts():
    """Returns the historical alert log."""
    if os.path.exists(config.JSON_PATH):
        try:
            with open(config.JSON_PATH, "r") as f:
                alerts_history = json.load(f)
            # Return newest first
            return JSONResponse({"status": "success", "alerts": list(reversed(alerts_history))})
        except:
            return JSONResponse({"status": "success", "alerts": []})
    return JSONResponse({"status": "success", "alerts": []})
