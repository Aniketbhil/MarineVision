# MarineVision Backend API

Backend service for the MarineVision underwater sonar debris detection prototype. Built with FastAPI, PyTorch, and Ultralytics YOLOv8.

---

## 1. Prerequisites

* **Python Version**: Python 3.10+ (project configured for Python 3.12).
* **Package Manager**: This project uses [uv](https://docs.astral.sh/uv/) for fast, deterministic dependency management (do not use bare `pip` or `requirements.txt`).

---

## 2. Setup Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Aniketbhil/MarineVision.git
   cd marinevision-backend
   ```

2. **Install dependencies**:
   ```bash
   uv sync
   ```
   *Note: `uv sync` reads `pyproject.toml` and `uv.lock` automatically to set up a virtual environment in `.venv/`.*

3. **Pre-trained Weights Included**:
   * `ml/weights/best.pt` is checked into the repository. No dataset download or model training is required to run the backend API.

4. **Environment Variables**:
   * A `HF_TOKEN` / `.env` file is **ONLY** required if you intend to stream and regenerate the training dataset from Hugging Face (`ml/prepare_ghostvision_dataset.py`). It is **NOT** needed for running the backend API or serving inference requests.

---

## 3. Running the Server

Start the local API development server:

```bash
uv run uvicorn app.main:app --reload --port 8000
```

*Note: The FastAPI application loads the YOLO model weights into memory once during startup via a lifespan event, ensuring that initial API requests are not delayed by model loading.*

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
Uploads a sonar image, applies OpenCV CLAHE contrast enhancement & Gaussian denoising, runs YOLOv8n inference, and returns detected bounding boxes scaled to the original image coordinates.

* **Example Request**:
  ```bash
  curl -s -X POST "http://127.0.0.1:8000/api/analyze" \
    -F "file=@ghostvision_dataset/images/test/Contact_380_sslo_png_jpg.rf.3fc1fd368201477e8873e08721af1913.jpg"
  ```
* **Example Response**:
  ```json
  {
    "scan_id": "702289a9-bc63-4e2e-b42d-fc98191a4cbb",
    "filename": "Contact_380_sslo_png_jpg.rf.3fc1fd368201477e8873e08721af1913.jpg",
    "timestamp": "2026-09-02T21:43:36.762448Z",
    "detections_count": 1,
    "severity": "MEDIUM",
    "detections": [
      {
        "class": "Ghost-Net",
        "confidence": 0.8197,
        "bbox": {
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
Retrieves saved detection results for a previously processed scan by its `scan_id`.

* **Example Request**:
  ```bash
  curl -s http://127.0.0.1:8000/api/detections/702289a9-bc63-4e2e-b42d-fc98191a4cbb
  ```
* **Example Response**:
  ```json
  {
    "scan_id": "702289a9-bc63-4e2e-b42d-fc98191a4cbb",
    "filename": "Contact_380_sslo_png_jpg.rf.3fc1fd368201477e8873e08721af1913.jpg",
    "timestamp": "2026-09-02T21:43:36.762448Z",
    "detections_count": 1,
    "severity": "MEDIUM",
    "detections": [
      {
        "class": "Ghost-Net",
        "confidence": 0.8197,
        "bbox": {
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

### GET `/api/report/{scan_id}`
Generates a structured text summary and severity assessment report for a scan.

* **Example Request**:
  ```bash
  curl -s http://127.0.0.1:8000/api/report/702289a9-bc63-4e2e-b42d-fc98191a4cbb
  ```
* **Example Response**:
  ```json
  {
    "scan_id": "702289a9-bc63-4e2e-b42d-fc98191a4cbb",
    "filename": "Contact_380_sslo_png_jpg.rf.3fc1fd368201477e8873e08721af1913.jpg",
    "generated_at": "2026-09-02T21:43:36.762448Z",
    "detections_count": 1,
    "severity": "MEDIUM",
    "summary": "Detected 1 Ghost-Net debris object(s) with MEDIUM severity risk.",
    "detections": [
      {
        "class": "Ghost-Net",
        "confidence": 0.8197,
        "bbox": {
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

## 5. Troubleshooting

* **`uv sync` fails to resolve**:
  Ensure you are using `uv` version 0.1.0+. If lock cache issues occur, run:
  ```bash
  uv cache clean && uv sync
  ```
  *(Platform markers in `pyproject.toml` automatically route Linux/Windows to CPU wheels and macOS to PyPI wheels).*

* **Server fails to load model at startup**:
  Confirm `ml/weights/best.pt` exists (size ~6.0 MB). If missing, ensure git LFS or repository cloning fetched the weights file properly.

* **Port conflicts (`[Errno 98] Address already in use`)**:
  If port 8000 is occupied by another process, launch Uvicorn on a different port:
  ```bash
  uv run uvicorn app.main:app --reload --port 8001
  ```

---

## 6. Hackathon Prototype Notes

* **Detector Scope**: Single-class detector trained specifically on `"Ghost-Net"` underwater sonar contacts.
* **Confidence Threshold**: Default filtering threshold is set to `0.70` (images with no detections above `0.70` return empty detection lists `[]`).
* **Disclaimer**: This backend is a hackathon prototype designed for demonstration purposes and rapid frontend integration. It does not guarantee production-grade detection accuracy across all sonar operational frequencies.
