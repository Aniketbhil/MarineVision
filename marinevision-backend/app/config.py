import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent

DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
PROCESSED_DIR = DATA_DIR / "processed"
REPORT_DIR = DATA_DIR / "reports"
DATASET_DIR = BASE_DIR / "dataset"

# ML Model settings
MODEL_WEIGHTS_PATH = BASE_DIR / "ml" / "weights" / "best_v2.pt"
CONFIDENCE_THRESHOLD = 0.65
SEVERITY_HIGH = 0.90

# Ensure essential directories exist
for directory in [UPLOAD_DIR, PROCESSED_DIR, REPORT_DIR, DATASET_DIR, MODEL_WEIGHTS_PATH.parent]:
    directory.mkdir(parents=True, exist_ok=True)
