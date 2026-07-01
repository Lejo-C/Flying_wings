# Anti-UAS RF Detection Prototype

The **Anti-UAS RF Detection Prototype** is a highly optimized, full-stack edge computing platform designed to ingest, process, and classify Radio Frequency (RF) signals to detect and track Unmanned Aerial Systems (UAS). 

Engineered for strict competition requirements, the system processes both raw RF IQ data and visual Spectrogram Bundles, performs advanced signal feature engineering, and executes machine learning inference using a highly compressed ONNX architecture. The entire pipeline is designed to run in real-time natively on a **standard Laptop CPU Baseline**.

---

## 🏗️ Project Architecture & Workflow

The system is deployed as a containerized microservice architecture, utilizing a high-performance Python inference engine communicating with a dynamic, responsive React dashboard.

### End-to-End Processing Workflow
1. **Multi-Format Ingestion**: RF signal data is ingested via the API payload. The system supports live `.sigmf-data` binaries (and associated `.meta` files), `.npy` matrices, CSVs, and pre-rendered `.png`/`.jpg` Spectrogram Bundles.
2. **Signal Preprocessing**: Raw IQ data undergoes DC offset removal, amplitude normalization, and is sliced into manageable overlapping temporal windows.
3. **Feature Engineering**: The raw signal is transformed into a log-magnitude spectrogram using Fast Fourier Transforms (FFT/STFT), scaled, and stacked into a 3-channel 224x224 input tensor.
4. **ONNX CPU Inference**: The tensors are passed into a customized PyTorch-to-ONNX MobileNetV3 model optimized specifically for `CPUExecutionProvider`. It simultaneously outputs classification probabilities and dense feature embeddings (1024-d).
5. **Postprocessing & Temporal Logic**: Sliding window results undergo a stateful temporal majority-vote consensus to prevent transient noise from triggering false alarms.
6. **Database Persistence**: The classified threat is logged to a local SQLite database, extracting bounding latencies and cross-referencing cosine similarities against past known threats.

---

## 🛠️ Comprehensive Technology Stack

### ⚡ Frontend (Dashboard & Visuals)
- **Framework**: React 19 + Vite (Fast HMR & Optimized Bundling)
- **Styling**: Tailwind CSS v4 (Utility-first responsive design)
- **Icons & UI**: Lucide React
- **Web Server**: Nginx (Alpine-based static serving in Docker)

### ⚙️ Backend (Inference & API)
- **Core**: Python 3.10
- **API Framework**: FastAPI + Uvicorn (Asynchronous ASGI server)
- **Database**: SQLite3 (Local persistent alert timeline & metrics)

### 🧠 Machine Learning & Mathematics
- **Inference Engine**: ONNX Runtime (Forced CPU execution for hardware baseline compliance)
- **Model Architecture**: MobileNetV3-Small (INT8 Quantized / PyTorch Export)
- **Signal Processing**: SciPy (STFT, signal filtering) & NumPy (High-performance matrix operations)
- **Image Processing**: Pillow (PIL) for generating dynamic spectrogram evidence plots

### 🚀 DevOps & Deployment
- **Containerization**: Docker & Docker Compose
- **State Management**: Docker Volume Mapping (for database and AI model persistence)

---

## 🏁 How to Run the Project

The system is fully containerized for out-of-the-box deployment without the need for manual environment configurations or NVIDIA drivers.

### Prerequisites
- [Docker Desktop](https://docs.docker.com/get-docker/) running on your host machine.

### Deployment (Docker Compose)
1. Navigate to the project root directory:
   ```bash
   cd Flying_wings
   ```
2. Build and start the containers in detached mode:
   ```bash
   docker-compose up -d --build
   ```
3. Access the platforms:
   - **Main UI Dashboard**: [http://localhost](http://localhost) (Served on port 80)
   - **Backend API (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

*(Note: The UI actively streams data from the backend via WebSockets and HTTP endpoints. If the backend is restarting, the UI will automatically reconnect once available).*

---

## 💻 Manual Developer Testing (Without Docker)

If you are modifying the Python pipeline or React components directly and wish to bypass Docker:

**1. Start the Backend:**
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**2. Start the Frontend:**
```bash
cd frontend
npm install
npm run dev
# Vite will serve the dev environment on http://localhost:5173
```

---

## 🎯 Competition Compliance Checklist
- [x] **Input Support**: Supports both native IQ data and Spectrogram Image bundles.
- [x] **Latency Requirements**: Optimized mathematical FFT pipeline processes segments well under the 2.0-second threshold.
- [x] **Classification**: Outputs Ternary states (UAS-like, Non-UAS, Unknown).
- [x] **Hardware Baseline**: Explicitly hardcoded to run perfectly on standard Laptop CPUs (No GPUs required).
- [x] **Threat Logging**: Automatically saves threats to a searchable database library.
- [x] **Operator Tuning**: Includes live Confidence Threshold UI controls mapped directly to data visualization logic.
