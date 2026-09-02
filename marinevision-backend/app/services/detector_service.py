import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
from app.config import MODEL_WEIGHTS_PATH, CONFIDENCE_THRESHOLD, SEVERITY_HIGH, UPLOAD_DIR
from ml.inference import SonarDetector

_detector_instance: Optional[SonarDetector] = None
_scan_store: Dict[str, Dict[str, Any]] = {}


def get_detector() -> SonarDetector:
    global _detector_instance
    if _detector_instance is None:
        print(f"Initializing SonarDetector model from {MODEL_WEIGHTS_PATH}...")
        _detector_instance = SonarDetector(weights_path=str(MODEL_WEIGHTS_PATH))
    return _detector_instance


def process_sonar_image(file_bytes: bytes, filename: str, conf_threshold: float = CONFIDENCE_THRESHOLD) -> Dict[str, Any]:
    scan_id = str(uuid.uuid4())
    now_str = datetime.utcnow().isoformat() + "Z"

    # Save uploaded file
    upload_path = UPLOAD_DIR / f"{scan_id}_{filename}"
    upload_path.write_bytes(file_bytes)

    # Run detection
    detector = get_detector()
    raw_detections = detector.detect(str(upload_path), confidence_threshold=conf_threshold)

    # Determine severity
    max_conf = max([d["confidence"] for d in raw_detections], default=0.0)
    if max_conf >= SEVERITY_HIGH:
        severity = "HIGH"
    elif max_conf >= conf_threshold:
        severity = "MEDIUM"
    else:
        severity = "CLEAR"

    scan_data = {
        "scan_id": scan_id,
        "filename": filename,
        "timestamp": now_str,
        "upload_path": str(upload_path),
        "detections_count": len(raw_detections),
        "severity": severity,
        "detections": raw_detections,
    }

    _scan_store[scan_id] = scan_data
    return scan_data


def get_scan(scan_id: str) -> Optional[Dict[str, Any]]:
    return _scan_store.get(scan_id)
