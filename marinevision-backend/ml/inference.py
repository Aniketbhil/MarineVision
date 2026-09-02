#!/usr/bin/env python3
import sys
import json
import argparse
from pathlib import Path
import cv2
import numpy as np
from ultralytics import YOLO


class SonarDetector:
    def __init__(self, weights_path: str = "ml/weights/best.pt"):
        resolved_path = Path(weights_path).resolve()
        if not resolved_path.exists():
            raise FileNotFoundError(f"Model weights not found at {resolved_path}")
        
        print(f"Loading YOLO model from {resolved_path}...")
        self.model = YOLO(str(resolved_path))

    def preprocess(self, image_path: str) -> str:
        """
        Applies OpenCV preprocessing (resize to 416x416, Gaussian denoise, CLAHE contrast enhancement)
        and saves processed image to data/processed/, returning the new path.
        """
        input_p = Path(image_path).resolve()
        img = cv2.imread(str(input_p))
        if img is None:
            raise FileNotFoundError(f"Could not read image file at {input_p}")

        # Resize to model input size (416x416)
        img_resized = cv2.resize(img, (416, 416), interpolation=cv2.INTER_LINEAR)

        # Mild Gaussian denoise
        denoised = cv2.GaussianBlur(img_resized, (3, 3), 0)

        # CLAHE contrast enhancement on Lightness channel
        lab = cv2.cvtColor(denoised, cv2.COLOR_BGR2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        cl_channel = clahe.apply(l_channel)
        enhanced_lab = cv2.merge((cl_channel, a_channel, b_channel))
        processed_bgr = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

        # Save to data/processed/
        out_dir = Path("data/processed").resolve()
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / f"proc_{input_p.name}"
        cv2.imwrite(str(out_path), processed_bgr)

        return str(out_path)

    def detect(self, image_path: str, confidence_threshold: float = 0.70) -> list[dict]:
        """
        Runs Sonar Debris detection pipeline:
        1. Reads original image dimensions (orig_w, orig_h)
        2. Preprocesses image (OpenCV CLAHE + Denoise) to 416x416
        3. Runs YOLO inference on processed image
        4. Filters detections below confidence_threshold
        5. Scales bbox coordinates back to ORIGINAL image's pixel coordinate space
        """
        orig_p = Path(image_path).resolve()
        orig_img = cv2.imread(str(orig_p))
        if orig_img is None:
            raise FileNotFoundError(f"Could not read original image file at {orig_p}")
        orig_h, orig_w = orig_img.shape[:2]

        processed_path = self.preprocess(image_path)
        proc_img = cv2.imread(processed_path)
        if proc_img is None:
            raise FileNotFoundError(f"Could not read preprocessed image file at {processed_path}")
        proc_h, proc_w = proc_img.shape[:2]

        # Calculate coordinate scaling factors (Original / Preprocessed)
        scale_x = float(orig_w) / float(proc_w)
        scale_y = float(orig_h) / float(proc_h)

        # Run inference on processed image (forced CPU)
        results = self.model.predict(
            source=processed_path,
            device="cpu",
            verbose=False,
        )

        detections = []
        if not results:
            return detections

        res = results[0]
        boxes = res.boxes

        if boxes is None or len(boxes) == 0:
            return detections

        for box in boxes:
            conf = float(box.conf[0].item())
            if conf < confidence_threshold:
                continue

            cls_id = int(box.cls[0].item())
            cls_name = self.model.names.get(cls_id, "Ghost-Net")

            # Native xyxy format in preprocessed (proc_w x proc_h) coordinate space
            x1, y1, x2, y2 = box.xyxy[0].tolist()

            # Scale coordinates back to original image pixel space
            scaled_x1 = x1 * scale_x
            scaled_y1 = y1 * scale_y
            scaled_x2 = x2 * scale_x
            scaled_y2 = y2 * scale_y

            top_left_x = int(round(scaled_x1))
            top_left_y = int(round(scaled_y1))
            width = int(round(scaled_x2 - scaled_x1))
            height = int(round(scaled_y2 - scaled_y1))

            detections.append({
                "class": cls_name,
                "confidence": round(conf, 4),
                "bbox": {
                    "x": top_left_x,
                    "y": top_left_y,
                    "width": width,
                    "height": height,
                },
            })

        return detections


def main():
    parser = argparse.ArgumentParser(description="Run Underwater Sonar Debris Inference")
    parser.add_argument("image_path", type=str, help="Path to input sonar image")
    parser.add_argument(
        "--weights",
        type=str,
        default="ml/weights/best.pt",
        help="Path to trained model weights",
    )
    parser.add_argument(
        "--conf",
        type=float,
        default=0.70,
        help="Confidence threshold (default: 0.70)",
    )
    args = parser.parse_args()

    detector = SonarDetector(weights_path=args.weights)
    results = detector.detect(args.image_path, confidence_threshold=args.conf)
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
