#!/usr/bin/env python3
import sys
import json
from pathlib import Path

# Ensure project root is in python path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.services.severity import classify_severity
from app.services.geotagging import attach_location
from app.services.reports import generate_json_report, generate_csv_report


def main():
    print("=" * 65)
    print("TESTING MARINEVISION SERVICES (severity, geotagging, reports)")
    print("=" * 65)

    # 1. Test severity classification
    print("\n--- 1. Testing app/services/severity.py ---")
    sev_94 = classify_severity(0.94)
    sev_75 = classify_severity(0.75)
    sev_50 = classify_severity(0.50)

    print(f"classify_severity(0.94) = {sev_94} (expected: 'HIGH')")
    print(f"classify_severity(0.75) = {sev_75} (expected: 'MEDIUM')")
    print(f"classify_severity(0.50) = {sev_50} (expected: 'FILTERED')")

    assert sev_94 == "HIGH", f"Expected HIGH, got {sev_94}"
    assert sev_75 == "MEDIUM", f"Expected MEDIUM, got {sev_75}"
    assert sev_50 == "FILTERED", f"Expected FILTERED, got {sev_50}"

    # 2. Test geotagging
    print("\n--- 2. Testing app/services/geotagging.py ---")
    raw_detections = [
        {
            "class": "Ghost-Net",
            "confidence": 0.94,
            "bbox": {"x": 420, "y": 310, "width": 80, "height": 45},
        },
        {
            "class": "Ghost-Net",
            "confidence": 0.78,
            "bbox": {"x": 150, "y": 200, "width": 50, "height": 30},
        },
    ]

    tagged_detections = attach_location(raw_detections, 20.12345, 72.98765)
    print("Geotagged Detections:")
    print(json.dumps(tagged_detections, indent=2))

    assert tagged_detections[0]["latitude"] == 20.12345
    assert tagged_detections[0]["longitude"] == 72.98765

    # 3. Test report generation
    print("\n--- 3. Testing app/services/reports.py ---")
    scan_id = "SSS-001"
    json_report = generate_json_report(scan_id, tagged_detections)
    csv_report = generate_csv_report(scan_id, tagged_detections)

    print("\n[Generated JSON Report]:")
    print(json.dumps(json_report, indent=2))

    print("\n[Generated CSV Report]:")
    print(csv_report)

    # Verify output files written to data/reports/
    json_file = Path(f"data/reports/{scan_id}.json")
    csv_file = Path(f"data/reports/{scan_id}.csv")

    print("File persistence check:")
    print(f"  - {json_file}: exists={json_file.exists()}, size={json_file.stat().st_size if json_file.exists() else 0} bytes")
    print(f"  - {csv_file}: exists={csv_file.exists()}, size={csv_file.stat().st_size if csv_file.exists() else 0} bytes")

    assert json_file.exists(), f"File {json_file} was not created"
    assert csv_file.exists(), f"File {csv_file} was not created"

    print("\n" + "=" * 65)
    print("ALL SERVICES TESTS PASSED SUCCESSFULLY!")
    print("=" * 65)


if __name__ == "__main__":
    main()
