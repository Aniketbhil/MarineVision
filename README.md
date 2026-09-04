# MarineVision

MarineVision is an AI-powered underwater sonar debris detection prototype built for SIH26057. It processes side-scan sonar contact images, detects derelict fishing gear ("Derelict-Fishing-Gear") using deep learning, attaches GPS coordinates, and generates actionable risk assessment reports. This repository is structured to contain `marinevision-backend/` and sibling application modules (such as `marinevision-frontend/`).

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
   * Pre-trained weights `ml/weights/best.pt` are checked into the repository. No dataset downloads or model training are required to run the server.

4. **Environment Variables**:
   * A `HF_TOKEN` / `.env` file is **ONLY** required if you intend to stream and regenerate the raw dataset from Hugging Face (`ml/prepare_ghostvision_dataset.py`). It is **NOT** needed for running the backend API server.

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
Uploads a sonar image with optional GPS coordinates, applies CLAHE contrast enhancement & Gaussian denoising, runs YOLOv8n inference, geotags detections, and returns bounding boxes scaled to the original image coordinates.

* **Example Request**:
  ```bash
  curl -s -X POST "http://127.0.0.1:8000/api/analyze" \
    -F "file=@ghostvision_dataset/images/test/Contact_380_sslo_png_jpg.rf.3fc1fd368201477e8873e08721af1913.jpg" \
    -F "latitude=20.12345" \
    -F "longitude=72.98765"
  ```
* **Example Response**:
  ```json
  {
    "scan_id": "SSS-20260902_215547_074",
    "detections": [
      {
        "id": "D001",
        "classification": "Ghost-Net",
        "confidence": 0.8197,
        "latitude": 20.12345,
        "longitude": 72.98765,
        "severity": "MEDIUM",
        "bounding_box": {
          "x": 309,
          "y": 304,
          "width": 26,
          "height": 23
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
  curl -s http://127.0.0.1:8000/api/detections/SSS-20260902_215547_074
  ```
* **Example Response**:
  ```json
  {
    "scan_id": "SSS-20260902_215547_074",
    "detections": [
      {
        "id": "D001",
        "classification": "Ghost-Net",
        "confidence": 0.8197,
        "latitude": 20.12345,
        "longitude": 72.98765,
        "severity": "MEDIUM",
        "bounding_box": {
          "x": 309,
          "y": 304,
          "width": 26,
          "height": 23
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
  curl -s "http://127.0.0.1:8000/api/report/SSS-20260902_215547_074?format=json"
  ```
* **Example Response (JSON)**:
  ```json
  {
    "scan_id": "SSS-20260902_215547_074",
    "detections": [
      {
        "id": "D001",
        "classification": "Ghost-Net",
        "confidence": 0.8197,
        "latitude": 20.12345,
        "longitude": 72.98765,
        "severity": "MEDIUM",
        "bounding_box": {
          "x": 309,
          "y": 304,
          "width": 26,
          "height": 23
        }
      }
    ]
  }
  ```

* **Example Request (CSV)**:
  ```bash
  curl -s "http://127.0.0.1:8000/api/report/SSS-20260902_215547_074?format=csv"
  ```
* **Example Response (CSV)**:
  ```text
  ID,Classification,Confidence,Latitude,Longitude,Severity
  D001,Ghost-Net,82%,20.12345,72.98765,MEDIUM
  ```

---

## 5. Running the Demo Test Suite

A standalone test script `scripts/test_demo_cases.py` validates end-to-end API processing across 3 known demo sonar images.

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

*What it proves*: Runs end-to-end inference against 3 test cases (Clear Detection, Filtered Background, and Secondary Example), verifies actual outputs match expected detection confidences/severities with 100% PASS status, and saves downloadable CSV reports into `test_images/`.

---

## 6. Troubleshooting

* **`uv sync` fails**:
  Ensure `uv` is installed (`https://docs.astral.sh/uv/`). If lock cache issues occur, clean cache and resync:
  ```bash
  uv cache clean && uv sync
  ```
  *(Platform markers in `pyproject.toml` route Linux/Windows to CPU wheel indexes and macOS to PyPI wheels automatically).*

* **Server fails to load model**:
  Verify `ml/weights/best.pt` exists (file size ~6.0 MB). If missing, confirm repository files were cloned completely.

* **Port conflicts (`[Errno 98] Address already in use`)**:
  If port 8000 is occupied, run Uvicorn on a different port:
  ```bash
  uv run uvicorn app.main:app --reload --port 8001
  ```

---

## 7. Hackathon Prototype Notes

* **Detector Scope**: Single-class detector trained specifically on `"Derelict-Fishing-Gear"` underwater sonar contacts.
* **Confidence Threshold**: Default filtering threshold is `0.70` (images with no detections above `0.70` return empty detection lists `[]`).
* **Model Accuracy**: Current prototype model achieves **mAP50 ~0.588** (58.8% mAP@50, 22.1% mAP@50-95). This is a proof-of-concept result for hackathon demonstration.
* **Severity Heuristics**: Risk levels (`HIGH >= 90%`, `MEDIUM >= 70%`) are prototype confidence-based heuristics, not field-validated marine risk scores.
