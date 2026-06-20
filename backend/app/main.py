import asyncio
import json
import random
from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db, log_alert
from app.pipeline.processor import execute_pipeline

app = FastAPI(title="Anti-UAS RF Prototype Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize SQLite database
@app.on_event("startup")
def on_startup():
    init_db()

# Active WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
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
async def ingest_dataset(file: UploadFile = File(...)):
    """
    Ingests a raw dataset block, executes the 5-phase ONNX pipeline, 
    logs the event, and broadcasts the alert over WebSockets.
    """
    contents = await file.read()
    
    # Run End-to-End Pipeline
    pipeline_result = execute_pipeline(contents)
    
    # Calculate dummy bounding info for the prototype
    alert_data = {
        "category": pipeline_result["category"],
        "confidence": pipeline_result["confidence"],
        "centerFreq": random.uniform(2400.0, 2480.0),
        "bandwidth": random.uniform(5.0, 22.0),
        "matchingLibrary": "UAS Protocol Map A" if pipeline_result["category"] == "UAS-like" else "None",
        "onset": "00:01:22.000",
        "offset": "00:01:23.500",
        "latency_ms": pipeline_result["processing_latency_ms"]
    }
    
    # Phase 5: Routing & Broadcast (SQLite + JSON)
    saved_alert = log_alert(alert_data)
    
    # Broadcast to frontend dashboard
    await manager.broadcast(json.dumps({
        "type": "NEW_ALERT",
        "payload": saved_alert
    }))
    
    return {"status": "success", "latency": pipeline_result["processing_latency_ms"], "result": alert_data}

@app.get("/api/health")
def health_check():
    return {"status": "online", "model": "mobilenet_v3_small_int8"}
