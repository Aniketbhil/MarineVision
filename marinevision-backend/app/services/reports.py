import json
import csv
import io
from pathlib import Path
from typing import List, Dict, Any
from app.config import REPORT_DIR
from app.services.severity import classify_severity


def generate_json_report(scan_id: str, detections: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generates a structured JSON report for a scan, assigning sequential IDs (D001, D002...),
    mapping classification, severity, and bounding_box, and writes to data/reports/{scan_id}.json.
    """
    formatted_detections = []
    for idx, det in enumerate(detections, start=1):
        det_id = f"D{idx:03d}"
        classification = det.get("classification") or det.get("class", "Derelict-Fishing-Gear")
        conf = float(det.get("confidence", 0.0))
        lat = float(det.get("latitude", 0.0))
        lon = float(det.get("longitude", 0.0))
        sev = det.get("severity") or classify_severity(conf)
        bbox = det.get("bounding_box") or det.get("bbox", {"x": 0, "y": 0, "width": 0, "height": 0})

        formatted_detections.append({
            "id": det_id,
            "classification": classification,
            "confidence": round(conf, 4),
            "latitude": lat,
            "longitude": lon,
            "severity": sev,
            "bounding_box": bbox,
        })

    report_data = {
        "scan_id": scan_id,
        "detections": formatted_detections,
    }

    # Save to data/reports/{scan_id}.json
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    json_path = REPORT_DIR / f"{scan_id}.json"
    json_path.write_text(json.dumps(report_data, indent=2), encoding="utf-8")

    return report_data


def generate_csv_report(scan_id: str, detections: List[Dict[str, Any]]) -> str:
    """
    Generates a CSV text report with columns ID,Classification,Confidence,Latitude,Longitude,Severity
    (with confidence formatted as percentage '94%') and writes to data/reports/{scan_id}.csv.
    """
    output = io.StringIO()
    writer = csv.writer(output, lineterminator="\n")
    writer.writerow(["ID", "Classification", "Confidence", "Latitude", "Longitude", "Severity"])

    for idx, det in enumerate(detections, start=1):
        det_id = f"D{idx:03d}"
        classification = det.get("classification") or det.get("class", "Derelict-Fishing-Gear")
        conf = float(det.get("confidence", 0.0))
        conf_pct = f"{int(round(conf * 100))}%"
        lat = float(det.get("latitude", 0.0))
        lon = float(det.get("longitude", 0.0))
        sev = det.get("severity") or classify_severity(conf)

        writer.writerow([det_id, classification, conf_pct, lat, lon, sev])

    csv_text = output.getvalue()

    # Save to data/reports/{scan_id}.csv
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    csv_path = REPORT_DIR / f"{scan_id}.csv"
    csv_path.write_text(csv_text, encoding="utf-8")

    return csv_text
