#!/usr/bin/env python3
import sys
import random
from pathlib import Path

# Ensure project root is in python path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import cv2
from app.services.explainability import compute_acoustic_contrast, compute_elongation


REAL_DETECTIONS = [
    {
        "label": "Mine (Real Detection)",
        "image_path": "combined_dataset/images/test/0119_2015.jpg",
        "type": "REAL: Mine",
        "bbox": {"x": 807, "y": 108, "width": 61, "height": 28},
    },
    {
        "label": "Derelict-Fishing-Gear (Real Detection)",
        "image_path": "combined_dataset/images/test/Contact_419_sslo_png_jpg.rf.cd1d9f36292dff0f9d2c5e4e8674253c.jpg",
        "type": "REAL: DFG",
        "bbox": {"x": 305, "y": 312, "width": 30, "height": 23},
    },
]


def find_background_images():
    test_img_dir = BASE_DIR / "combined_dataset" / "images" / "test"
    test_lbl_dir = BASE_DIR / "combined_dataset" / "labels" / "test"

    bg_files = []
    for img_p in sorted(test_img_dir.glob("*.jpg")):
        lbl_p = test_lbl_dir / f"{img_p.stem}.txt"
        if not lbl_p.exists() or lbl_p.stat().st_size == 0:
            bg_files.append(img_p)
    return bg_files


def main():
    print("=" * 105)
    print("EXPLAINABILITY FEATURE MEASUREMENT SCRIPT (Contrast Ratio & Elongation)")
    print("=" * 105)

    random.seed(42)  # For reproducible background crop sampling

    results = []

    # 1. Process Real Detections
    for item in REAL_DETECTIONS:
        img_path = str(BASE_DIR / item["image_path"])
        bbox = item["bbox"]

        contrast = compute_acoustic_contrast(img_path, bbox)
        elongation_info = compute_elongation(img_path, bbox)

        results.append({
            "image": Path(item["image_path"]).name[:30],
            "region_type": item["type"],
            "contrast_ratio": contrast,
            "simple_elongation": elongation_info["simple_elongation"],
            "contour_elongation": elongation_info["contour_elongation"],
            "bbox_str": f"{bbox['width']}x{bbox['height']} @ ({bbox['x']},{bbox['y']})",
        })

    # 2. Process Random Background Crops
    bg_images = find_background_images()
    selected_bg = random.sample(bg_images, min(7, len(bg_images)))

    for i, bg_path in enumerate(selected_bg, 1):
        img = cv2.imread(str(bg_path))
        if img is None:
            continue
        h, w = img.shape[:2]

        # Sample a typical object-sized crop (e.g. 50x30) at random valid coordinates
        crop_w, crop_h = 50, 30
        rand_x = random.randint(10, max(11, w - crop_w - 10))
        rand_y = random.randint(10, max(11, h - crop_h - 10))
        bg_bbox = {"x": rand_x, "y": rand_y, "width": crop_w, "height": crop_h}

        contrast = compute_acoustic_contrast(str(bg_path), bg_bbox)
        elongation_info = compute_elongation(str(bg_path), bg_bbox)

        results.append({
            "image": bg_path.name[:30],
            "region_type": f"BG CROP #{i}",
            "contrast_ratio": contrast,
            "simple_elongation": elongation_info["simple_elongation"],
            "contour_elongation": elongation_info["contour_elongation"],
            "bbox_str": f"{crop_w}x{crop_h} @ ({rand_x},{rand_y})",
        })

    # 3. Print Comparison Table
    print("\n" + "=" * 115)
    print(
        f"{'IMAGE':<32} | {'REGION TYPE':<16} | {'BBOX ROI':<18} | {'CONTRAST':<10} | {'SIMPLE ELONG':<13} | {'CONTOUR ELONG':<13}"
    )
    print("=" * 115)

    for r in results:
        print(
            f"{r['image']:<32} | {r['region_type']:<16} | {r['bbox_str']:<18} | {r['contrast_ratio']:<10.4f} | {r['simple_elongation']:<13.4f} | {r['contour_elongation']:<13.4f}"
        )

    print("=" * 115)

    # 4. Summary Statistics
    real_contrasts = [r["contrast_ratio"] for r in results if "REAL" in r["region_type"]]
    bg_contrasts = [r["contrast_ratio"] for r in results if "BG" in r["region_type"]]

    real_contour_elong = [r["contour_elongation"] for r in results if "REAL" in r["region_type"]]
    bg_contour_elong = [r["contour_elongation"] for r in results if "BG" in r["region_type"]]

    print("\nSUMMARY STATISTICAL OBSERVATIONS:")
    print(f"  - Real Detections Contrast Ratio Range:      {min(real_contrasts):.4f} - {max(real_contrasts):.4f}")
    print(f"  - Background Crops Contrast Ratio Range:    {min(bg_contrasts):.4f} - {max(bg_contrasts):.4f}")
    print(f"  - Real Detections Contour Elongation Range:  {min(real_contour_elong):.4f} - {max(real_contour_elong):.4f}")
    print(f"  - Background Crops Contour Elongation Range:{min(bg_contour_elong):.4f} - {max(bg_contour_elong):.4f}")
    print("=" * 115)


if __name__ == "__main__":
    main()
