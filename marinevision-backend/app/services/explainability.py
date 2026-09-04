import logging
from pathlib import Path
import cv2
import numpy as np

logger = logging.getLogger(__name__)


def compute_acoustic_contrast(image_path: str, bbox: dict, expansion_factor: float = 0.30) -> float:
    """
    Computes acoustic contrast ratio for a target bounding box region in a sonar image:
    1. Reads original image in grayscale.
    2. Extracts target pixel ROI inside bbox.
    3. Computes mean pixel intensity inside target ROI (target_mean).
    4. Expands bbox by expansion_factor (default 30%) to sample surrounding local background ring.
    5. Computes mean pixel intensity of surrounding ring (surrounding_mean).
    6. Returns ratio: target_mean / surrounding_mean
    """
    img_p = Path(image_path).resolve()
    img = cv2.imread(str(img_p), cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise FileNotFoundError(f"Could not read image file at {img_p}")

    img_h, img_w = img.shape[:2]

    x = max(0, min(int(bbox.get("x", 0)), img_w - 1))
    y = max(0, min(int(bbox.get("y", 0)), img_h - 1))
    w = max(1, min(int(bbox.get("width", 1)), img_w - x))
    h = max(1, min(int(bbox.get("height", 1)), img_h - y))

    target_roi = img[y : y + h, x : x + w]
    target_mean = float(np.mean(target_roi))

    # Expanded bounding box
    pad_w = int(round(w * expansion_factor))
    pad_h = int(round(h * expansion_factor))

    exp_x1 = max(0, x - pad_w)
    exp_y1 = max(0, y - pad_h)
    exp_x2 = min(img_w, x + w + pad_w)
    exp_y2 = min(img_h, y + h + pad_h)

    # Create mask for surrounding ring (1 inside expanded box excluding original bbox)
    mask = np.zeros((img_h, img_w), dtype=np.uint8)
    mask[exp_y1:exp_y2, exp_x1:exp_x2] = 1
    mask[y : y + h, x : x + w] = 0

    surrounding_pixels = img[mask == 1]
    if len(surrounding_pixels) == 0:
        surrounding_mean = target_mean
    else:
        surrounding_mean = float(np.mean(surrounding_pixels))

    if surrounding_mean == 0:
        return 1.0

    return round(target_mean / surrounding_mean, 4)


def compute_elongation(image_path: str, bbox: dict) -> dict:
    """
    Computes elongation metrics for a target bounding box region in a sonar image:
    1. Simple Elongation: max(w, h) / min(w, h) based on raw bbox dimensions.
    2. Contour-Fitted Elongation: Otsu thresholding on target ROI to isolate target contact,
       fits minimum-area rotated rectangle to largest contour, and computes axis ratio.
    Returns dict: {"simple_elongation": float, "contour_elongation": float, "elongation_method": str}
    """
    img_p = Path(image_path).resolve()
    img = cv2.imread(str(img_p), cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise FileNotFoundError(f"Could not read image file at {img_p}")

    img_h, img_w = img.shape[:2]

    x = max(0, min(int(bbox.get("x", 0)), img_w - 1))
    y = max(0, min(int(bbox.get("y", 0)), img_h - 1))
    w = max(1, min(int(bbox.get("width", 1)), img_w - x))
    h = max(1, min(int(bbox.get("height", 1)), img_h - y))

    # Simple Elongation (bbox aspect ratio)
    simple_elongation = float(max(w, h)) / float(max(min(w, h), 1))

    target_roi = img[y : y + h, x : x + w]

    contour_elongation = None
    method = "bbox_fallback"

    try:
        # Otsu's thresholding
        _, thresh = cv2.threshold(target_roi, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if contours:
            largest_contour = max(contours, key=cv2.contourArea)
            if len(largest_contour) >= 3:
                rect = cv2.minAreaRect(largest_contour)
                rect_w, rect_h = rect[1]
                if rect_w > 0 and rect_h > 0:
                    contour_elongation = float(max(rect_w, rect_h)) / float(min(rect_w, rect_h))
                    method = "contour"
    except Exception as e:
        logger.warning(f"Contour elongation calculation failed, falling back to bbox: {e}")

    if contour_elongation is None:
        contour_elongation = simple_elongation
        method = "bbox_fallback"

    return {
        "simple_elongation": round(simple_elongation, 4),
        "contour_elongation": round(contour_elongation, 4),
        "elongation_method": method,
    }


def compute_explainability_evidence(image_path: str, bbox: dict) -> dict:
    """
    Computes acoustic contrast ratio and elongation metrics for a target bounding box region.
    Gracefully handles errors, setting values to None/null if computation fails.
    Returns dict:
    {
        "acoustic_contrast_ratio": float or None,
        "elongation_ratio": float or None,
        "elongation_method": "contour" | "bbox_fallback" | None
    }
    """
    evidence = {
        "acoustic_contrast_ratio": None,
        "elongation_ratio": None,
        "elongation_method": None,
    }

    try:
        contrast = compute_acoustic_contrast(image_path, bbox)
        evidence["acoustic_contrast_ratio"] = contrast
    except Exception as e:
        logger.warning(f"Failed to compute acoustic contrast for {image_path}: {e}")

    try:
        elong_res = compute_elongation(image_path, bbox)
        method = elong_res.get("elongation_method", "contour")
        if method == "contour" and elong_res.get("contour_elongation") is not None:
            elong_ratio = elong_res["contour_elongation"]
        else:
            elong_ratio = elong_res.get("simple_elongation")
            method = "bbox_fallback"

        evidence["elongation_ratio"] = elong_ratio
        evidence["elongation_method"] = method
    except Exception as e:
        logger.warning(f"Failed to compute elongation for {image_path}: {e}")

    return evidence
