from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class BBox(BaseModel):
    x: int = Field(..., description="Top-left X coordinate in original image pixel space")
    y: int = Field(..., description="Top-left Y coordinate in original image pixel space")
    width: int = Field(..., description="Bounding box width in pixels")
    height: int = Field(..., description="Bounding box height in pixels")


class DetectionItem(BaseModel):
    class_name: str = Field(..., alias="class", description="Detected debris class name ('Ghost-Net')")
    confidence: float = Field(..., description="Detection confidence score (0.0 to 1.0)")
    bbox: BBox

    class Config:
        populate_by_name = True


class AnalyzeResponse(BaseModel):
    scan_id: str
    filename: str
    timestamp: str
    detections_count: int
    severity: str = Field(..., description="Severity level: 'HIGH' (conf >= 0.90), 'MEDIUM' (conf >= 0.70), or 'CLEAR'")
    detections: List[DetectionItem]


class ReportResponse(BaseModel):
    scan_id: str
    filename: str
    generated_at: str
    detections_count: int
    severity: str
    summary: str
    detections: List[DetectionItem]
