import json
import traceback
from datetime import datetime
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Optional

import cv2
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware

from app.config import CONFIDENCE_THRESHOLD, MODEL_WEIGHTS_PATH, UPLOAD_DIR, REPORT_DIR
from ml.inference import SonarDetector
from app.services.severity import classify_severity
from app.services.geotagging import attach_location
from app.services.reports import generate_json_report, generate_csv_report

detector_instance: Optional[SonarDetector] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global detector_instance
    print("Pre-loading SonarDetector model at startup...")
    detector_instance = SonarDetector(weights_path=str(MODEL_WEIGHTS_PATH))
    yield


app = FastAPI(
    title="Underwater Sonar Debris Detection API",
    description="Backend API prototype for detecting debris in underwater sonar images.",
    version="0.1.0",
    lifespan=lifespan,
)

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    """Returns system health status and model readiness."""
    return {"status": "healthy", "model_ready": detector_instance is not None}


@app.post("/api/analyze")
async def analyze_sonar_scan(
    file: UploadFile = File(...),
    latitude: float = Form(0.0),
    longitude: float = Form(0.0),
):
    """
    Accepts multipart form data (image file + optional latitude/longitude),
    runs CLAHE preprocessing + YOLOv8n inference, geotags detections, computes severity,
    saves JSON and CSV reports to data/reports/, and returns the JSON report.
    """
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="Invalid request: An image file must be uploaded.")

    valid_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff"}
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in valid_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image file format '{file_ext}'. Supported formats: {sorted(list(valid_extensions))}",
        )

    try:
        file_bytes = await file.read()
        if len(file_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes).")

        timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")[:19]
        scan_id = f"SSS-{timestamp_str}"

        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        upload_path = UPLOAD_DIR / f"{scan_id}_{file.filename}"
        upload_path.write_bytes(file_bytes)

        test_cv_img = cv2.imread(str(upload_path))
        if test_cv_img is None:
            raise HTTPException(status_code=400, detail="Corrupted or invalid image file. Could not decode image with OpenCV.")

        if detector_instance is None:
            raise HTTPException(status_code=500, detail="Model is not loaded.")

        # 1. Run detection (confidence threshold)
        raw_detections = detector_instance.detect(str(upload_path), confidence_threshold=CONFIDENCE_THRESHOLD)

        # 2. Attach scan-level GPS coordinates
        geotagged_detections = attach_location(raw_detections, latitude=latitude, longitude=longitude)

        # 3. Compute severity per detection
        for det in geotagged_detections:
            det["severity"] = classify_severity(det.get("confidence", 0.0))

        # 4. Generate & persist JSON and CSV reports
        json_report = generate_json_report(scan_id, geotagged_detections)
        generate_csv_report(scan_id, geotagged_detections)

        return json_report

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error during analysis: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Inference or analysis processing failed: {str(e)}")


@app.get("/api/detections/{scan_id}")
async def get_scan_detections(scan_id: str):
    """Reads data/reports/{scan_id}.json and returns it. Returns 404 if not found."""
    report_path = REPORT_DIR / f"{scan_id}.json"
    if not report_path.exists():
        raise HTTPException(status_code=404, detail=f"Scan report '{scan_id}' not found.")

    try:
        content = report_path.read_text(encoding="utf-8")
        return json.loads(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read scan report: {str(e)}")


@app.get("/api/report/{scan_id}")
async def get_scan_report(scan_id: str, format: str = Query("json")):
    """Returns JSON report by default, or CSV as a downloadable text/csv response if format=csv."""
    fmt = format.lower()
    if fmt == "csv":
        csv_path = REPORT_DIR / f"{scan_id}.csv"
        if not csv_path.exists():
            raise HTTPException(status_code=404, detail=f"CSV report for scan '{scan_id}' not found.")
        csv_text = csv_path.read_text(encoding="utf-8")
        return Response(
            content=csv_text,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={scan_id}.csv"},
        )
    elif fmt == "json":
        json_path = REPORT_DIR / f"{scan_id}.json"
        if not json_path.exists():
            raise HTTPException(status_code=404, detail=f"JSON report for scan '{scan_id}' not found.")
        json_text = json_path.read_text(encoding="utf-8")
        return json.loads(json_text)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported format '{format}'. Use 'json' or 'csv'.")
