#!/usr/bin/env python3
import sys
import json
import requests
from pathlib import Path

# Base server URL
SERVER_URL = "http://127.0.0.1:8000"

DEMO_CASES = [
    {
        "case_num": 1,
        "name": "Case 1: Mine Detection",
        "image_path": "combined_dataset/images/test/0119_2015.jpg",
        "latitude": 20.12345,
        "longitude": 72.98765,
        "expected_desc": "Mine detected (~84.5% conf, MEDIUM severity)",
        "expected_count": 1,
        "expected_class": "Mine",
        "expected_conf_approx": 0.8446,
        "expected_severity": "MEDIUM",
    },
    {
        "case_num": 2,
        "name": "Case 2: Derelict-Fishing-Gear Detection",
        "image_path": "combined_dataset/images/test/Contact_419_sslo_png_jpg.rf.cd1d9f36292dff0f9d2c5e4e8674253c.jpg",
        "latitude": 20.12345,
        "longitude": 72.98765,
        "expected_desc": "Derelict-Fishing-Gear detected (~68.3% conf, MEDIUM severity)",
        "expected_count": 1,
        "expected_class": "Derelict-Fishing-Gear",
        "expected_conf_approx": 0.6829,
        "expected_severity": "MEDIUM",
    },
    {
        "case_num": 3,
        "name": "Case 3: Correctly Filtered / No Detection",
        "image_path": "combined_dataset/images/test/0004_2015.jpg",
        "latitude": 20.13000,
        "longitude": 72.99000,
        "expected_desc": "No detections (empty list, 0 count)",
        "expected_count": 0,
        "expected_class": None,
        "expected_conf_approx": None,
        "expected_severity": None,
    },
]


def test_server_health():
    try:
        resp = requests.get(f"{SERVER_URL}/api/health", timeout=5)
        if resp.status_code == 200 and resp.json().get("status") == "healthy":
            return True
    except Exception:
        pass
    return False


def main():
    print("=" * 80)
    print("DEMO CASES INTEGRATION TEST (scripts/test_demo_cases.py)")
    print("=" * 80)

    if not test_server_health():
        print(f"FATAL ERROR: FastAPI server is not running or unreachable at {SERVER_URL}", file=sys.stderr)
        print("Please start server in a separate terminal: uv run uvicorn app.main:app --port 8000", file=sys.stderr)
        sys.exit(1)

    print(f"Connected to FastAPI server at {SERVER_URL}!\n")

    test_images_dir = Path("test_images")
    test_images_dir.mkdir(parents=True, exist_ok=True)

    summary_results = []

    for case in DEMO_CASES:
        num = case["case_num"]
        name = case["name"]
        img_p = Path(case["image_path"])

        print("=" * 80)
        print(f"{name}")
        print("=" * 80)
        print(f"Image File: {img_p}")
        print(f"Coordinates: Lat={case['latitude']}, Lon={case['longitude']}")

        if not img_p.exists():
            print(f"ERROR: Image file not found at {img_p}", file=sys.stderr)
            summary_results.append({
                "name": name,
                "expected": case["expected_desc"],
                "actual": f"File Not Found ({img_p})",
                "status": "FAIL",
            })
            continue

        # 1. POST /api/analyze
        with open(img_p, "rb") as f:
            files = {"file": (img_p.name, f, "image/jpeg")}
            data = {"latitude": str(case["latitude"]), "longitude": str(case["longitude"])}
            response = requests.post(f"{SERVER_URL}/api/analyze", files=files, data=data)

        if response.status_code != 200:
            print(f"HTTP ERROR {response.status_code}: {response.text}")
            summary_results.append({
                "name": name,
                "expected": case["expected_desc"],
                "actual": f"HTTP {response.status_code}: {response.text[:50]}",
                "status": "FAIL",
            })
            continue

        analyze_json = response.json()
        scan_id = analyze_json.get("scan_id", "")
        detections = analyze_json.get("detections", [])
        dets_count = len(detections)

        print("\n[POST /api/analyze Response JSON]:")
        print(json.dumps(analyze_json, indent=2))

        # 2. GET /api/report/{scan_id}?format=csv
        csv_url = f"{SERVER_URL}/api/report/{scan_id}?format=csv"
        csv_resp = requests.get(csv_url)
        csv_file_path = test_images_dir / f"case{num}_report.csv"

        if csv_resp.status_code == 200:
            csv_file_path.write_text(csv_resp.text, encoding="utf-8")
            print(f"\n[CSV Report Saved to {csv_file_path}]:")
            print(csv_resp.text.strip())
        else:
            print(f"WARNING: Could not fetch CSV report for scan {scan_id}: HTTP {csv_resp.status_code}")

        # 3. Evaluate PASS / FAIL
        passed = False
        actual_desc = ""

        if case["expected_count"] == 0:
            if dets_count == 0:
                passed = True
                actual_desc = "0 detections (empty array)"
            else:
                passed = False
                actual_desc = f"{dets_count} detections returned (expected 0)"
        else:
            if dets_count == 1:
                det = detections[0]
                cls = det.get("classification")
                conf = det.get("confidence", 0.0)
                sev = det.get("severity", "")
                actual_desc = f"1 detection ({cls}, {conf * 100:.1f}% conf, {sev} sev)"
                
                class_match = (cls == case["expected_class"])
                conf_match = (abs(conf - case["expected_conf_approx"]) <= 0.03)
                sev_match = (sev == case["expected_severity"])
                
                if class_match and conf_match and sev_match:
                    passed = True
                else:
                    passed = False
            else:
                passed = False
                actual_desc = f"{dets_count} detections returned (expected 1)"

        summary_results.append({
            "name": name,
            "expected": case["expected_desc"],
            "actual": actual_desc,
            "status": "PASS" if passed else "FAIL",
        })
        print()

    # Print Final Summary Table
    print("\n" + "=" * 80)
    print(f"{'CASE NAME':<40} | {'ACTUAL OUTCOME':<30} | {'STATUS':<6}")
    print("=" * 80)
    for res in summary_results:
        print(f"{res['name']:<40} | {res['actual']:<30} | {res['status']:<6}")
    print("=" * 80)


if __name__ == "__main__":
    main()
