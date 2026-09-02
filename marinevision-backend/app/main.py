from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from app.config import CONFIDENCE_THRESHOLD
from app.models.schemas import AnalyzeResponse, ReportResponse
from app.services.detector_service import get_detector, process_sonar_image, get_scan


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Eagerly load YOLO model at startup so first API request is not delayed
    print("Pre-loading SonarDetector model at startup...")
    get_detector()
    yield


app = FastAPI(
    title="Underwater Sonar Debris Detection API",
    description="Backend API prototype for detecting debris in underwater sonar images.",
    version="0.1.0",
    lifespan=lifespan,
)


@app.get("/api/health")
async def health_check():
    """Returns system health status and model readiness."""
    return {"status": "healthy", "model_ready": True}


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_sonar_image(
    file: UploadFile = File(...),
    confidence_threshold: float = Query(CONFIDENCE_THRESHOLD, ge=0.0, le=1.0),
):
    """
    Accepts an uploaded sonar image, runs CLAHE preprocessing + YOLOv8n inference,
    stores the scan, and returns detected debris bounding boxes and severity.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file must have a filename.")

    file_bytes = await file.read()
    scan_data = process_sonar_image(file_bytes, file.filename, conf_threshold=confidence_threshold)
    return scan_data


@app.get("/api/detections/{scan_id}", response_model=AnalyzeResponse)
async def get_scan_detections(scan_id: str):
    """Retrieves detection results for a previously analyzed scan by scan_id."""
    scan_data = get_scan(scan_id)
    if not scan_data:
        raise HTTPException(status_code=404, detail=f"Scan ID '{scan_id}' not found.")
    return scan_data


@app.get("/api/report/{scan_id}", response_model=ReportResponse)
async def get_scan_report(scan_id: str):
    """Generates and returns a summary report for a previously analyzed scan."""
    scan_data = get_scan(scan_id)
    if not scan_data:
        raise HTTPException(status_code=404, detail=f"Scan ID '{scan_id}' not found.")

    count = scan_data["detections_count"]
    severity = scan_data["severity"]
    if count == 0:
        summary = "No underwater debris detected above confidence threshold."
    else:
        summary = f"Detected {count} Ghost-Net debris object(s) with {severity} severity risk."

    return {
        "scan_id": scan_id,
        "filename": scan_data["filename"],
        "generated_at": scan_data["timestamp"],
        "detections_count": count,
        "severity": severity,
        "summary": summary,
        "detections": scan_data["detections"],
    }
