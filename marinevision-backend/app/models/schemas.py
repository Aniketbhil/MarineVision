from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field


class BBox(BaseModel):
    x: int = Field(..., description="Top-left X coordinate in original image pixel space")
    y: int = Field(..., description="Top-left Y coordinate in original image pixel space")
    width: int = Field(..., description="Bounding box width in pixels")
    height: int = Field(..., description="Bounding box height in pixels")


class Evidence(BaseModel):
    acoustic_contrast_ratio: Optional[float] = Field(
        None, description="Ratio of mean target intensity to surrounding local background intensity"
    )
    elongation_ratio: Optional[float] = Field(
        None, description="Elongation metric ratio (max_axis / min_axis)"
    )
    elongation_method: Optional[Literal["contour", "bbox_fallback"]] = Field(
        None, description="Calculation method used ('contour' or 'bbox_fallback')"
    )


class DetectionItem(BaseModel):
    id: Optional[str] = Field(None, description="Detection identifier (e.g. D001)")
    class_name: str = Field(..., alias="class", description="Detected debris class name ('Derelict-Fishing-Gear' or 'Mine')")
    confidence: float = Field(..., description="Detection confidence score (0.0 to 1.0)")
    latitude: Optional[float] = Field(None, description="Scan latitude coordinate")
    longitude: Optional[float] = Field(None, description="Scan longitude coordinate")
    severity: Optional[str] = Field(None, description="Severity level: 'HIGH' or 'MEDIUM'")
    bounding_box: BBox = Field(..., alias="bbox", description="Bounding box in original image pixel space")
    evidence: Optional[Evidence] = Field(None, description="Computed explainability evidence metrics")

    class Config:
        populate_by_name = True


class AnalyzeResponse(BaseModel):
    scan_id: str
    detections: List[DetectionItem]


class ReportResponse(BaseModel):
    scan_id: str
    detections: List[DetectionItem]
