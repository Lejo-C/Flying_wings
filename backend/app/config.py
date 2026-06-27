import os

# Base paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "data"))
EVIDENCE_DIR = os.path.abspath(os.path.join(DATA_DIR, "evidence"))
DB_PATH = os.path.abspath(os.path.join(DATA_DIR, "alerts.db"))
JSON_PATH = os.path.abspath(os.path.join(DATA_DIR, "alerts.json"))
REPORT_PATH = os.path.abspath(os.path.join(DATA_DIR, "report.json"))
MODEL_PATH = os.path.abspath(os.path.join(BASE_DIR, "model", "competition_model.onnx"))

# Create folders if they do not exist
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(EVIDENCE_DIR, exist_ok=True)

# DSP/STFT Parameters
FFT_SIZE = 256
OVERLAP = 128
NORMALIZATION = True
DC_REMOVE = True

# Threat classification options
SIMILARITY_THRESHOLD = 0.80  # Cosine similarity matching threshold
BUFFER_SIZE = 5               # Rolling temporal filter window size
VOTING_THRESHOLD = 3          # Alert triggers if >= VOTING_THRESHOLD windows match
MIN_CONSECUTIVE_WINDOWS = 2   # Minimum signal duration filtering rule
NOISE_FLOOR_THRESHOLD = 1e-4  # Noise rejection strategy threshold
