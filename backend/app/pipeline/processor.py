import os
import time
import numpy as np
import scipy.signal as signal
import scipy.ndimage as ndimage
import onnxruntime as ort
import logging
import io
import json
import pandas as pd
from app import config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Temporal Buffer for single-stream stateful voting
TEMPORAL_BUFFER = []

def load_onnx_session():
    """Initializes the double-headed ONNX MobileNetV3 Core."""
    if os.path.exists(config.MODEL_PATH):
        try:
            # Using CPUExecutionProvider for standard CPU baseline
            session = ort.InferenceSession(config.MODEL_PATH, providers=['CPUExecutionProvider'])
            logger.info("ONNX Double-Headed Model loaded successfully.")
            return session
        except Exception as e:
            logger.error(f"Error loading ONNX model: {e}")
            return None
    else:
        logger.warning(f"ONNX model file not found at {config.MODEL_PATH}. Running in Dummy Simulation Mode.")
        return None

# Load the model once into memory
onnx_session = load_onnx_session()

def parse_sigmf_meta(meta_content: bytes) -> dict:
    """Parses SigMF JSON metadata and extracts parameters."""
    try:
        meta = json.loads(meta_content.decode('utf-8'))
        global_info = meta.get('global', {})
        captures = meta.get('captures', [{}])
        annotations = meta.get('annotations', [])
        
        sample_rate = global_info.get('core:sample_rate', 1.0)
        center_freq = captures[0].get('core:frequency', 2400.0e6) if captures else 2400.0e6
        datatype = global_info.get('core:datatype', 'cf32')
        
        return {
            "sample_rate": sample_rate,
            "center_freq": center_freq / 1.0e6, # convert to MHz
            "bandwidth": sample_rate / 1.0e6,   # Baseband bandwidth
            "datatype": datatype,
            "annotations": annotations
        }
    except Exception as e:
        logger.error(f"Failed to parse SigMF metadata: {e}")
        return {}

def phase_1_ingestion(file_chunk: bytes, filename: str = "") -> tuple:
    """
    Data Ingestion Layer: Parses binary structures (.npy / .npz / .sigmf / CSV)
    Returns: (iq_data, metadata_dict)
    """
    metadata = {
        "sample_rate": 1.0e6,      # default 1 MHz
        "center_freq": 2400.0,     # default 2400 MHz (2.4 GHz)
        "bandwidth": 1.0,          # default 1 MHz bandwidth
        "annotations": [],
        "filename": filename
    }
    
    try:
        # Check if the uploaded file is a .npz file (Zip signature PK\x03\x04)
        if file_chunk.startswith(b'PK\x03\x04'):
            logger.info("Parsing file as NPZ archive...")
            with np.load(io.BytesIO(file_chunk)) as archive:
                files = archive.files
                if not files:
                    raise ValueError("Empty NPZ archive.")
                # Look for a key that contains the actual data
                data_key = next((k for k in files if 'data' in k.lower() or 'spec' in k.lower() or 'iq' in k.lower()), files[0])
                raw_data = archive[data_key]
        
        # Check if the uploaded file is a highly compressed .npy binary (NUMPY signature)
        elif file_chunk.startswith(b'\x93NUMPY'):
            logger.info("Parsing file as NPY binary...")
            raw_data = np.load(io.BytesIO(file_chunk))
            
        else:
            lower_name = filename.lower()
            
            # Check if it's an image
            is_image = any(lower_name.endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.bmp', '.webp'])
            if is_image:
                logger.info("Parsing file as Spectrogram Image...")
                try:
                    from PIL import Image
                    img = Image.open(io.BytesIO(file_chunk)).convert('RGB')
                    img = img.resize((224, 224), Image.Resampling.BILINEAR)
                    img_arr = np.array(img).astype(np.float32) / 255.0
                    tensor = img_arr.transpose(2, 0, 1) # (3, 224, 224)
                    tensor = np.expand_dims(tensor, axis=0) # (1, 3, 224, 224)
                    metadata["image_tensor"] = tensor
                    return np.array([]), metadata
                except Exception as e:
                    logger.error(f"Image parsing failed: {e}")

            # Check if raw binary SigMF data
            is_binary = any(lower_name.endswith(ext) for ext in ['.sigmf-data', '.data', '.bin'])
            if is_binary:
                logger.info("Parsing file as raw binary IQ...")
                datatype = metadata.get("datatype", "cf32")
                if "cf32" in datatype:
                    raw_data = np.frombuffer(file_chunk, dtype=np.float32)
                elif "ci16" in datatype:
                    raw_data = np.frombuffer(file_chunk, dtype=np.int16).astype(np.float32) / 32767.0
                elif "ci8" in datatype:
                    raw_data = np.frombuffer(file_chunk, dtype=np.int8).astype(np.float32) / 127.0
                else:
                    raw_data = np.frombuffer(file_chunk, dtype=np.float32)
                
                if len(raw_data) % 2 != 0:
                    raw_data = raw_data[:-1]
                iq_data = raw_data[0::2] + 1j * raw_data[1::2]
                return iq_data, metadata
            
            # Check if it is a JSON file (SigMF metadata)
            try:
                decoded = file_chunk.decode('utf-8', errors='ignore').strip()
                if decoded.startswith('{') and decoded.endswith('}'):
                    logger.info("Parsing file as SigMF Metadata (.meta)...")
                    sigmf_meta = parse_sigmf_meta(file_chunk)
                    metadata.update(sigmf_meta)
                    # Return empty array for IQ data, to be populated when binary file is sent
                    return np.array([]), metadata
            except:
                pass
                
            # Otherwise, assume it is a raw CSV
            logger.info("Parsing file as CSV...")
            df = pd.read_csv(io.BytesIO(file_chunk), header=None, nrows=8192)
            raw_data = df.values
            
        raw_data = raw_data.flatten()
        
        # Determine number of complex samples
        # If it doesn't contain explicit imaginary components, check if interleaved (even/odd values represent real/imag)
        if not np.iscomplexobj(raw_data):
            if len(raw_data) >= 8192:
                # Interpret as interleaved IQ values: I = even, Q = odd
                iq_data = raw_data[0::2] + 1j * raw_data[1::2]
            else:
                # Spoof imaginary component
                iq_data = raw_data + 1j * np.zeros_like(raw_data)
        else:
            iq_data = raw_data
            
        return iq_data, metadata
    except Exception as e:
        logger.error(f"Error parsing uploaded signal: {e}")
        raise ValueError(f"Invalid signal format. Cannot parse IQ data. Details: {e}")

def phase_2_feature_mapping(iq_data: np.ndarray) -> np.ndarray:
    """
    Advanced RF Feature Engineering: 
    Transforms IQ into (3, 224, 224) STFT log-magnitude tensor.
    Applies DC offset removal, IQ Normalization, Hann windowing, and scales.
    """
    # 1. DC offset removal
    if config.DC_REMOVE:
        iq_data = iq_data - np.mean(iq_data)
        
    # 2. IQ Normalization
    if config.NORMALIZATION:
        peak = np.max(np.abs(iq_data))
        if peak > 1e-9:
            iq_data = iq_data / peak
            
    # 3. Channel 1: Log-Magnitude STFT
    f, t, Zxx = signal.stft(iq_data, nperseg=config.FFT_SIZE, noverlap=config.OVERLAP, window='hann')
    ch1 = np.log10(np.abs(Zxx) + 1e-9)
    
    # 4. Channel 2: STFT Phase Map
    ch2 = np.angle(Zxx)
    
    # 5. Channel 3: Cyclic Spectral Density (CSD Spectrogram via Fast FFT Correlation)
    autocorr = signal.correlate(iq_data, iq_data, mode='same', method='fft')
    _, _, Zxx_c = signal.stft(autocorr, nperseg=config.FFT_SIZE, noverlap=config.OVERLAP, window='hann')
    ch3 = np.log10(np.abs(Zxx_c) + 1e-9)
    
    # 6. Resize all channels to 224x224 and Normalize
    def resize_and_norm(matrix):
        zoom_y = 224 / matrix.shape[0]
        zoom_x = 224 / matrix.shape[1]
        resized = ndimage.zoom(matrix, (zoom_y, zoom_x))
        m_min, m_max = np.min(resized), np.max(resized)
        return (resized - m_min) / (m_max - m_min + 1e-9)
        
    ch1_norm = resize_and_norm(ch1)
    ch2_norm = resize_and_norm(ch2)
    ch3_norm = resize_and_norm(ch3)
    
    # Stack into 3 unique channels (RGB)
    tensor = np.stack([ch1_norm, ch2_norm, ch3_norm])
    tensor = np.expand_dims(tensor, axis=0).astype(np.float32)
    
    return tensor

def phase_3_onnx_inference(tensor: np.ndarray) -> tuple:
    """
    Executes ONNX MobileNetV3 inference.
    Returns: (probabilities_array, embeddings_array)
    """
    if onnx_session is not None:
        input_name = onnx_session.get_inputs()[0].name
        output_names = [o.name for o in onnx_session.get_outputs()]
        results = onnx_session.run(output_names, {input_name: tensor})
        probs = results[0]
        embeddings = results[1] if len(results) > 1 else np.zeros((tensor.shape[0], 1024))
        return probs, embeddings
    else:
        # Dummy Simulation Mode
        logger.warning("ONNX Session is inactive. Generating simulated prediction.")
        batch_size = tensor.shape[0]
        probs = np.zeros((batch_size, 3))
        for i in range(batch_size):
            if np.random.rand() > 0.8:
                probs[i] = np.array([0.95, 0.03, 0.02])
            else:
                probs[i] = np.array([0.05, 0.90, 0.05])
        embeddings = np.random.randn(batch_size, 1024).astype(np.float32)
        embeddings = embeddings / (np.linalg.norm(embeddings, axis=1, keepdims=True) + 1e-9)
        return probs, embeddings

def phase_4_temporal_filter(probs_list: list) -> dict:
    """
    Applies majority voting and temporal filter over a list of frame probabilities.
    Returns consensus label and confidence.
    """
    classes = ["UAS-like", "Non-UAS", "Unknown"]
    
    # Map each frame probability to class index
    class_indices = [int(np.argmax(p)) for p in probs_list]
    confidences = [float(p[idx]) for idx, p in zip(class_indices, probs_list)]
    
    uas_idx = 0
    uas_count = class_indices.count(uas_idx)
    
    max_consecutive_uas = 0
    current_consecutive = 0
    first_threat_idx = -1
    last_threat_idx = -1
    
    for i, idx in enumerate(class_indices):
        if idx == uas_idx:
            if current_consecutive == 0 and first_threat_idx == -1:
                first_threat_idx = i
            current_consecutive += 1
            if current_consecutive > max_consecutive_uas:
                max_consecutive_uas = current_consecutive
                last_threat_idx = i
        else:
            current_consecutive = 0
            
    # Majority rule and Minimum signal duration filtering
    min_consecutive = getattr(config, 'MIN_CONSECUTIVE_WINDOWS', 2)
    if uas_count >= config.VOTING_THRESHOLD and max_consecutive_uas >= min_consecutive:
        final_class = "UAS-like"
        # Find mean confidence of UAS-like frames
        uas_confidences = [conf for idx, conf in zip(class_indices, confidences) if idx == uas_idx]
        final_confidence = np.mean(uas_confidences) if uas_confidences else 0.85
    else:
        # Fallback to majority vote
        consensus_idx = max(set(class_indices), key=class_indices.count)
        if consensus_idx == uas_idx: # If consensus is UAS but failed consecutive check
            consensus_idx = 1 # Non-UAS fallback
        final_class = classes[consensus_idx]
        matching_confidences = [conf for idx, conf in zip(class_indices, confidences) if idx == consensus_idx]
        final_confidence = np.mean(matching_confidences) if matching_confidences else 0.85
        
    return {
        "category": final_class,
        "confidence": float(final_confidence),
        "class_indices": class_indices,
        "confidences": confidences,
        "first_threat_idx": first_threat_idx,
        "last_threat_idx": last_threat_idx
    }

def execute_pipeline(file_chunk: bytes, filename: str = "", override_meta: dict = None) -> dict:
    """
    Executes the End-to-End processing pipeline with detailed Latency Breakdown.
    Supports sliding window slicing and complex input parsing.
    """
    times = {}
    
    # 1. Ingestion
    t_start = time.time()
    iq_data, metadata = phase_1_ingestion(file_chunk, filename)
    times["loading"] = (time.time() - t_start) * 1000
    
    # If the file is only a SigMF meta file (and not an image), return early
    if len(iq_data) == 0 and "image_tensor" not in metadata:
        return {
            "status": "metadata_only",
            "metadata": metadata,
            "latency_breakdown": {"loading": round(times["loading"], 2)}
        }
        
    # If metadata overrides are provided (e.g. from a paired .meta file upload)
    if override_meta:
        metadata.update(override_meta)
        
    # Check if the file was a spectrogram image
    if "image_tensor" in metadata:
        tensor = metadata.pop("image_tensor")
        t_spec_total = 0.0 # Bypassed
        
        t0 = time.time()
        probs, embeddings = phase_3_onnx_inference(tensor)
        t_onnx_total = (time.time() - t0) * 1000
        
        voting_result = {
            "category": ["UAS-like", "Non-UAS", "Unknown"][int(np.argmax(probs[0]))],
            "confidence": float(np.max(probs[0])),
        }
        avg_embedding = embeddings[0]
        norm = np.linalg.norm(avg_embedding)
        if norm > 1e-9:
            avg_embedding = avg_embedding / norm
            
        return {
            "status": "success",
            "category": voting_result["category"],
            "confidence": voting_result["confidence"],
            "embedding": avg_embedding.tolist(),
            "metadata": metadata,
            "spectrogram_matrix": tensor[0][0].tolist(),
            "latency_breakdown": {
                "loading": round(times["loading"], 2),
                "preprocessing": 0.0,
                "spectrogram": 0.0,
                "onnx": round(t_onnx_total, 2),
                "postprocessing": 0.0,
                "total": round(times["loading"] + t_onnx_total, 2)
            }
        }

    # Noise rejection strategy
    avg_power = np.mean(np.abs(iq_data))
    if avg_power < getattr(config, 'NOISE_FLOOR_THRESHOLD', 1e-4):
        return {
            "status": "success",
            "category": "Non-UAS",
            "confidence": 0.99,
            "embedding": np.zeros(1024).tolist(),
            "metadata": metadata,
            "spectrogram_matrix": None,
            "latency_breakdown": {
                "loading": round(times["loading"], 2),
                "preprocessing": 0.0, "spectrogram": 0.0, "onnx": 0.0, "postprocessing": 0.0,
                "total": round(times["loading"], 2)
            }
        }

    # 2. Sliding Window & Preprocessing & ONNX Inference
    t_prep_total = 0.0
    t_spec_total = 0.0
    t_onnx_total = 0.0
    
    tensors = []
    
    # Segment length 4096 samples, overlap 2048
    segment_size = 4096
    overlap = 2048
    step = segment_size - overlap
    
    # Ensure signal has at least segment_size samples
    if len(iq_data) < segment_size:
        pad_size = segment_size - len(iq_data)
        iq_data = np.pad(iq_data, (0, pad_size), 'constant')
        
    num_samples = len(iq_data)
    num_segments = max(1, (num_samples - segment_size) // step + 1)
    
    # Cap segments to 10 for performance safeguard
    num_segments = min(num_segments, 10)
    
    logger.info(f"Processing signal split into {num_segments} sliding segments...")
    
    for i in range(num_segments):
        start_idx = i * step
        end_idx = start_idx + segment_size
        segment = iq_data[start_idx:end_idx]
        
        # A. Preprocessing
        t0 = time.time()
        # DC removal / Normalization inside phase_2_feature_mapping
        t_prep_total += (time.time() - t0) * 1000
        
        # B. Spectrogram Generation
        t0 = time.time()
        tensor = phase_2_feature_mapping(segment)
        t_spec_total += (time.time() - t0) * 1000
        tensors.append(tensor[0])
        
    batched_tensor = np.stack(tensors, axis=0) # shape (num_segments, 3, 224, 224)
        
    # C. Inference
    t0 = time.time()
    probs, embeddings = phase_3_onnx_inference(batched_tensor)
    t_onnx_total += (time.time() - t0) * 1000
    
    probs_list = list(probs)
    embeddings_list = list(embeddings)
        
    times["preprocessing"] = t_prep_total
    times["spectrogram"] = t_spec_total
    times["onnx"] = t_onnx_total
    
    # 3. Postprocessing & Temporal filter voting consensus
    t_post_start = time.time()
    voting_result = phase_4_temporal_filter(probs_list)
    
    # Calculate average embedding across all windows
    avg_embedding = np.mean(embeddings_list, axis=0)
    # Normalize average embedding
    norm = np.linalg.norm(avg_embedding)
    if norm > 1e-9:
        avg_embedding = avg_embedding / norm
        
    times["postprocessing"] = (time.time() - t_post_start) * 1000
    
    # Compute total latency
    total_latency = sum(times.values())
    times["total"] = total_latency
    
    # Generate a plot image representation of the first segment's spectrogram (Channel 0)
    first_tensor = phase_2_feature_mapping(iq_data[:segment_size])[0][0] # 224x224 array
    
    # Format onset and offset dynamically if we found a threat
    sample_rate = metadata.get("sample_rate", 1.0)
    
    onset_time = 0.0
    offset_time = float(num_segments * step / sample_rate)
    
    if voting_result["category"] == "UAS-like":
        if voting_result["first_threat_idx"] != -1:
            onset_time = (voting_result["first_threat_idx"] * step) / sample_rate
        if voting_result["last_threat_idx"] != -1:
            offset_time = ((voting_result["last_threat_idx"] + 1) * step + overlap) / sample_rate
            
    def format_time(seconds):
        ms = int((seconds % 1) * 1000)
        s = int(seconds)
        m = s // 60
        h = m // 60
        return f"{h:02d}:{m%60:02d}:{s%60:02d}.{ms:03d}"
        
    result = {
        "status": "success",
        "category": voting_result["category"],
        "confidence": voting_result["confidence"],
        "embedding": avg_embedding.tolist(),
        "metadata": metadata,
        "spectrogram_matrix": first_tensor.tolist(), # Return matrix to save as PNG in database
        "onset": format_time(onset_time),
        "offset": format_time(offset_time),
        "latency_breakdown": {
            "loading": round(times["loading"], 2),
            "preprocessing": round(times["preprocessing"], 2),
            "spectrogram": round(times["spectrogram"], 2),
            "onnx": round(times["onnx"], 2),
            "postprocessing": round(times["postprocessing"], 2),
            "total": round(times["total"], 2)
        }
    }
    
    return result
