# MarineVision

MarineVision is an AI-powered underwater sonar debris detection prototype built for SIH26057. It processes side-scan sonar contact images, detects derelict fishing gear ("Derelict-Fishing-Gear") and underwater naval mines ("Mine") using deep learning, attaches GPS coordinates, computes descriptive physical explainability metrics, and generates actionable risk assessment reports. This repository is structured to contain `marinevision-backend/` and sibling application modules (such as `marinevision-frontend/`).

---

## 1. Prerequisites

* **Python Version**: Python 3.10+ (configured for Python 3.12).
* **Package Manager**: Uses [uv](https://docs.astral.sh/uv/) for fast, deterministic dependency management (do not use bare `pip` or `requirements.txt`).

---

## 2. Setup Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Aniketbhil/MarineVision.git
   cd MarineVision
   ```

2. **Navigate to the backend folder & install dependencies**:
   ```bash
   cd marinevision-backend
   uv sync
   ```
   *Note: `uv sync` reads `pyproject.toml` and `uv.lock` automatically from inside `marinevision-backend/` to set up the virtual environment.*

3. **Pre-trained Model Included**:
   * Pre-trained 2-class weights `ml/weights/best_v2.pt` are checked into the repository. No dataset downloads or model training are required to run the server.

4. **Environment Variables**:
   * A `HF_TOKEN` / `.env` file is **ONLY** required if you intend to stream and regenerate raw datasets. It is **NOT** needed for running the backend API server.

---

## 3. Running the Server

From inside the `marinevision-backend/` directory:

```bash
cd marinevision-backend
uv run uvicorn app.main:app --reload --port 8000
```

*Note: The FastAPI server loads the YOLO model once at startup via a lifespan handler, ensuring initial API requests are served without cold-start delay.*

---

## 4. API Reference

### GET `/api/health`
Checks backend service health and model readiness status.

* **Example Request**:
  ```bash
  curl -s http://127.0.0.1:8000/api/health
  ```
* **Example Response**:
  ```json
  {
    "status": "healthy",
    "model_ready": true
  }
  ```

---

### POST `/api/analyze`
Uploads a sonar image with optional GPS coordinates, applies CLAHE contrast enhancement & Gaussian denoising, runs 2-class YOLOv8n inference, computes physical explainability metrics (`acoustic_contrast_ratio`, `elongation_ratio`), geotags detections, and returns bounding boxes scaled to the original image coordinates.

* **Example Request (Mine Detection)**:
  ```bash
  curl -s -X POST "http://127.0.0.1:8000/api/analyze" \
    -F "file=@combined_dataset/images/test/0119_2015.jpg" \
    -F "latitude=20.12345" \
    -F "longitude=72.98765"
  ```
* **Example Response**:
  ```json
  {
    "scan_id": "SSS-20260904_234734_717",
    "detections": [
      {
        "id": "D001",
        "classification": "Mine",
        "confidence": 0.8446,
        "latitude": 20.12345,
        "longitude": 72.98765,
        "severity": "MEDIUM",
        "bounding_box": {
          "x": 807,
          "y": 108,
          "width": 61,
          "height": 28
        },
        "evidence": {
          "acoustic_contrast_ratio": 0.8199,
          "elongation_ratio": 2.2222,
          "elongation_method": "contour"
        }
      }
    ]
  }
  ```

* **Example Request (Derelict-Fishing-Gear Detection)**:
  ```bash
  curl -s -X POST "http://127.0.0.1:8000/api/analyze" \
    -F "file=@combined_dataset/images/test/Contact_419_sslo_png_jpg.rf.cd1d9f36292dff0f9d2c5e4e8674253c.jpg" \
    -F "latitude=20.12345" \
    -F "longitude=72.98765"
  ```
* **Example Response**:
  ```json
  {
    "scan_id": "SSS-20260904_234726_278",
    "detections": [
      {
        "id": "D001",
        "classification": "Derelict-Fishing-Gear",
        "confidence": 0.6829,
        "latitude": 20.12345,
        "longitude": 72.98765,
        "severity": "MEDIUM",
        "bounding_box": {
          "x": 305,
          "y": 312,
          "width": 30,
          "height": 23
        },
        "evidence": {
          "acoustic_contrast_ratio": 1.1302,
          "elongation_ratio": 1.1597,
          "elongation_method": "contour"
        }
      }
    ]
  }
  ```

---

### GET `/api/detections/{scan_id}`
Retrieves saved JSON detection results for a previously analyzed scan by `scan_id`.

* **Example Request**:
  ```bash
  curl -s http://127.0.0.1:8000/api/detections/SSS-20260904_234734_717
  ```
* **Example Response**:
  ```json
  {
    "scan_id": "SSS-20260904_234734_717",
    "detections": [
      {
        "id": "D001",
        "classification": "Mine",
        "confidence": 0.8446,
        "latitude": 20.12345,
        "longitude": 72.98765,
        "severity": "MEDIUM",
        "bounding_box": {
          "x": 807,
          "y": 108,
          "width": 61,
          "height": 28
        },
        "evidence": {
          "acoustic_contrast_ratio": 0.8199,
          "elongation_ratio": 2.2222,
          "elongation_method": "contour"
        }
      }
    ]
  }
  ```

---

### GET `/api/report/{scan_id}?format=json|csv`
Exports stored scan report in JSON format (default) or downloadable CSV format (`format=csv`).

* **Example Request (JSON)**:
  ```bash
  curl -s "http://127.0.0.1:8000/api/report/SSS-20260904_234734_717?format=json"
  ```
* **Example Response (JSON)**:
  ```json
  {
    "scan_id": "SSS-20260904_234734_717",
    "detections": [
      {
        "id": "D001",
        "classification": "Mine",
        "confidence": 0.8446,
        "latitude": 20.12345,
        "longitude": 72.98765,
        "severity": "MEDIUM",
        "bounding_box": {
          "x": 807,
          "y": 108,
          "width": 61,
          "height": 28
        },
        "evidence": {
          "acoustic_contrast_ratio": 0.8199,
          "elongation_ratio": 2.2222,
          "elongation_method": "contour"
        }
      }
    ]
  }
  ```

* **Example Request (CSV)**:
  ```bash
  curl -s "http://127.0.0.1:8000/api/report/SSS-20260904_234734_717?format=csv"
  ```
* **Example Response (CSV)**:
  ```text
  ID,Classification,Confidence,Latitude,Longitude,Severity,AcousticContrastRatio,ElongationRatio
  D001,Mine,84%,20.12345,72.98765,MEDIUM,0.8199,2.2222
  ```

---

## 5. Running the Demo Test Suite

A standalone test script `scripts/test_demo_cases.py` validates end-to-end API processing across 3 confirmed real demo sonar images.

1. **Ensure the server is running** in a separate terminal:
   ```bash
   cd marinevision-backend
   uv run uvicorn app.main:app --reload --port 8000
   ```
2. **Execute the demo test suite**:
   ```bash
   cd marinevision-backend
   uv run python scripts/test_demo_cases.py
   ```

*What it proves*: Runs end-to-end inference against 3 test cases:
1. **Case 1: Mine Detection** (`0119_2015.jpg` -> `Mine`, ~84.5% confidence, `MEDIUM` severity)
2. **Case 2: Derelict-Fishing-Gear Detection** (`Contact_419...jpg` -> `Derelict-Fishing-Gear`, ~68.3% confidence, `MEDIUM` severity)
3. **Case 3: Correctly Filtered / No Detection** (`0004_2015.jpg` -> 0 detections, empty array `[]`)

Verifies actual API outputs match expected detection confidences/severities with 100% PASS status, and saves downloadable CSV reports into `test_images/`.

---

## 6. Troubleshooting

* **`uv sync` fails**:
  Ensure `uv` is installed (`https://docs.astral.sh/uv/`). If lock cache issues occur, clean cache and resync:
  ```bash
  uv cache clean && uv sync
  ```
  *(Platform markers in `pyproject.toml` route Linux/Windows to CPU wheel indexes and macOS to PyPI wheels automatically).*

* **Server fails to load model**:
  Verify `ml/weights/best_v2.pt` exists (file size ~6.0 MB). If missing, confirm repository files were cloned completely.

* **Port conflicts (`[Errno 98] Address already in use`)**:
  If port 8000 is occupied, run Uvicorn on a different port:
  ```bash
  uv run uvicorn app.main:app --reload --port 8001
  ```

---

## 7. Hackathon Prototype Notes

* **Detector Scope**: 2-class detector trained on `"Derelict-Fishing-Gear"` (ghost nets / crab pots) and `"Mine"` (underwater naval mines / mine-like objects).
* **Dataset Composition**:
  * **Derelict-Fishing-Gear**: Derived from the GhostVision dataset (400 images: 280 train, 80 val, 40 test).
  * **Mine**: Derived from Teledyne Gavia AUV side-scan sonar mine dataset (375 images: 262 train, 75 val, 38 test). Non-mine bottom object (NOMBO) crops were stripped of positive bounding boxes to serve as hard-negative seabed clutter examples.
* **Confidence Threshold**: Default filtering threshold is `0.65` (`CONFIDENCE_THRESHOLD` in `app/config.py`). *Note: This threshold was empirically verified to introduce zero false positives on our background/negative test images at the time of testing, rather than derived from a formal precision-recall trade-off analysis.*
* **Explainability Evidence Metrics**: `acoustic_contrast_ratio` and `elongation_ratio` are descriptive physical measurements calculated directly from the target crop and presented alongside the confidence score as supporting context. *Note: These are descriptive metrics for user inspection, not a formal validation or pass/fail check.*
* **Severity Heuristics**: Risk levels (`HIGH >= 90%`, `MEDIUM >= 65%`) are prototype confidence-based heuristics, not field-validated marine risk scores.
