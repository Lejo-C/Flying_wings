# Anti-UAS RF Detection Prototype

The **Anti-UAS RF Detection Prototype** is a sophisticated full-stack platform designed to ingest, process, and classify Radio Frequency (RF) signals to detect and track Unmanned Aerial Systems (UAS). The system processes raw RF IQ data, performs feature engineering via Short-Time Fourier Transforms (STFT), and runs machine learning inference using an ONNX-optimized MobileNetV3 architecture to accurately identify drone communication links.

It features a high-performance Python/FastAPI backend and a sleek, dynamic React dashboard for real-time monitoring and threat analysis.

---

## 🏗️ Project Architecture & Workflow

The system is broken into a frontend dashboard and a data-processing backend, working together in a seamless pipeline.

### End-to-End Processing Workflow
1. **Data Ingestion**: RF signal data is uploaded (or read offline) via the API. The system dynamically parses multiple data types including raw binary IQ data (`cf32`, `ci16`, `ci8`), `SigMF` metadata structures, `.npy` binary arrays, CSVs, and even raw spectrogram images (`.png`, `.jpg`).
2. **Signal Preprocessing**: Raw IQ data is normalized, DC offset is removed, and the signal is chunked using an overlapping sliding window.
3. **Feature Engineering**: The signal is converted into a log-magnitude spectrogram using STFT, scaled, and transformed into a 3-channel 224x224 tensor tailored for the vision model.
4. **ONNX Inference**: The batched tensors are fed into a customized double-headed PyTorch-to-ONNX model. The model simultaneously outputs class probabilities (UAS, Non-UAS, Unknown) and dense feature embeddings (1024-d).
5. **Postprocessing & Temporal Filtering**: Sliding window results are passed through majority voting. A threat is only triggered if it surpasses the `MIN_CONSECUTIVE_WINDOWS` duration check and the `NOISE_FLOOR_THRESHOLD` energy check, ensuring robust false alarm rejection.
6. **Logging & Analytics**: The alert is logged to a local SQLite database along with detailed latency metrics, dynamic onset/offset timestamps, and the generated spectrogram image. Re-occurrence cosine similarity is calculated against past threats.

---

## 🛠️ Technologies Used

### Backend Engine
- **Language**: Python 3
- **API Framework**: FastAPI & Uvicorn
- **Machine Learning**: PyTorch (for model training), ONNX Runtime (for optimized CPU/GPU inference)
- **Signal Processing**: SciPy, NumPy, Pandas
- **Image Processing**: Pillow (PIL)
- **Database**: SQLite (for alerts and metrics tracking)

### Frontend Dashboard
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4 for rapid, responsive UI design
- **Icons**: Lucide React
- **Visualization**: HTML Canvas / React components rendering the HUD and spectrogram evidence.

### Deployment & DevOps
- **Containerization**: Docker & Docker Compose
- **Environment**: Containerized multi-service deployment with automatic volume mapping for persistence.

---

## 🚀 How to Start the Project

The easiest way to get the system up and running is using Docker Compose.

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) installed and running on your system.
- [Docker Compose](https://docs.docker.com/compose/install/)

### Running via Docker (Recommended)
1. Clone the repository and navigate to the project root:
   ```bash
   cd Flying_wings
   ```
2. Start the services using Docker Compose:
   ```bash
   docker-compose up --build
   ```
3. Access the applications:
   - **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
   - **Backend API (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Running Locally (Without Docker)

If you prefer to run the system natively:

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
```

---

## 💻 Offline Tools & CLI Scripts

The backend is equipped with standalone CLI scripts for offline dataset processing and evaluation. 

### 1. Offline Batch Processing (CLI)
You can recursively process entire directories of raw RF captures offline without running the HTTP API. This simulates field-edge ingestion and populates your SQLite database with threats.
```bash
python backend/app/cli.py /path/to/dataset/directory
```
*Note: Ensure your Python environment is activated and dependencies are installed.*

### 2. Robustness Testing Suite
Evaluate the ONNX model's performance by injecting variable Signal-to-Noise Ratio (SNR) levels and simulated RF interference into base signals. 
```bash
python backend/app/robustness_tester.py
```
This script will output a detailed analysis report to `backend/data/robustness_report.json` evaluating the model's prediction latency and confidence drops under harsh conditions.

---

## 🧠 Model Training

The `DoubleHeadedMobileNet` architecture is defined in PyTorch. The model is trained on pre-processed RF feature datasets and exported to the ONNX standard.

To re-train the model or regenerate the ONNX artifact:
```bash
python backend/training/train.py
```
This script will:
1. Initialize the dataset loaders.
2. Train the MobileNetV3-Small base model.
3. Replace the classification head.
4. Export the `competition_model.onnx` file with both probability and embedding output channels.

Move the generated `competition_model.onnx` into `backend/app/model/` and restart the backend to deploy the new weights.
