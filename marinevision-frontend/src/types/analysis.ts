export interface Coordinates {
  latitude?: number;
  longitude?: number;
}

export interface AnalyzeRequest {
  file: File;
  coordinates?: Coordinates;
}

export interface AnalyzeResponse {
  scan_id: string;
  detections?: Detection[];
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Evidence {
  acoustic_contrast_ratio?: number;
  elongation_ratio?: number;
}

export interface Detection {
  id: string;
  classification: string;
  confidence: number;
  latitude: number;
  longitude: number;
  severity: string;
  bounding_box: BoundingBox;
  evidence: Evidence;
}

export interface ScanReport {
  scan_id: string;
  detections: Detection[];
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}
