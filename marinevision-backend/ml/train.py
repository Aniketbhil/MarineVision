#!/usr/bin/env python3
import sys
import time
import argparse
import shutil
from pathlib import Path
from ultralytics import YOLO


def parse_args():
    parser = argparse.ArgumentParser(description="Fine-tune YOLOv8n on GhostVision dataset")
    parser.add_argument("--epochs", type=int, default=20, help="Number of training epochs")
    parser.add_argument("--imgsz", type=int, default=416, help="Image size for training")
    parser.add_argument("--batch", type=int, default=8, help="Batch size")
    parser.add_argument("--patience", type=int, default=5, help="Early stopping patience")
    parser.add_argument(
        "--time-check",
        action="store_true",
        help="Run 1 epoch to measure per-epoch time and print extrapolated training duration estimate",
    )
    return parser.parse_args()


def run_time_check(args, data_yaml_path: Path):
    print("=" * 65)
    print("RUNNING YOLOv8n TIME-CHECK (1 EPOCH ON CPU)")
    print("=" * 65)
    print(f"Dataset config: {data_yaml_path.resolve()}")
    print(f"Target Config: epochs={args.epochs}, imgsz={args.imgsz}, batch={args.batch}, patience={args.patience}")
    print("Device: cpu (forced)")
    print("=" * 65)

    model = YOLO("yolov8n.pt")

    start_time = time.perf_counter()
    # Run exactly 1 epoch with no saving/plots to measure time
    results = model.train(
        data=str(data_yaml_path.resolve()),
        epochs=1,
        imgsz=args.imgsz,
        batch=args.batch,
        device="cpu",
        workers=4,
        save=False,
        plots=False,
        exist_ok=True,
        verbose=True,
    )
    epoch_duration = time.perf_counter() - start_time

    # Extrapolate estimates
    total_target_epochs = args.epochs
    patience = args.patience

    worst_case_seconds = epoch_duration * total_target_epochs
    best_case_epochs = max(5, patience + 1)
    best_case_seconds = epoch_duration * best_case_epochs

    def format_time(sec):
        m, s = divmod(sec, 60)
        h, m = divmod(m, 60)
        if h > 0:
            return f"{int(h)}h {int(m)}m {int(s)}s"
        elif m > 0:
            return f"{int(m)}m {int(s)}s"
        else:
            return f"{s:.2f}s"

    print("\n" + "=" * 65)
    print("TIME-CHECK ESTIMATION SUMMARY")
    print("=" * 65)
    print(f"1-Epoch Measured Wall-Clock Time: {epoch_duration:.2f} seconds ({format_time(epoch_duration)})")
    print(f"\nExtrapolated Full Training Duration ({args.epochs} total epochs):")
    print(f"  - Worst-case (all {total_target_epochs} epochs run): {format_time(worst_case_seconds)} ({worst_case_seconds:.1f}s)")
    print(f"  - Best-case (early stopping triggers after ~{best_case_epochs} epochs): {format_time(best_case_seconds)} ({best_case_seconds:.1f}s)")
    print("=" * 65)
    print("\n[TIME-CHECK COMPLETE] Exiting without saving weights or continuing full training.")
    sys.exit(0)


def train(args, data_yaml_path: Path):
    print("=" * 65)
    print("STARTING YOLOv8n FINE-TUNING ON GHOSTVISION DATASET")
    print("=" * 65)
    print(f"Config: epochs={args.epochs}, imgsz={args.imgsz}, batch={args.batch}, patience={args.patience}")
    print(f"Dataset: {data_yaml_path.resolve()}")
    print("Device: cpu (forced)")
    print("=" * 65)

    model = YOLO("yolov8n.pt")

    results = model.train(
        data=str(data_yaml_path.resolve()),
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        patience=args.patience,
        device="cpu",
        workers=4,
        save=True,
        plots=True,
        exist_ok=True,
        verbose=True,
    )

    # Save best weights to ml/weights/best.pt
    weights_dir = Path(__file__).resolve().parent / "weights"
    weights_dir.mkdir(parents=True, exist_ok=True)
    target_best_pt = weights_dir / "best.pt"

    best_pt_source = Path(results.save_dir) / "weights" / "best.pt"
    if best_pt_source.exists():
        shutil.copy(best_pt_source, target_best_pt)
        print(f"\nSuccessfully copied best model checkpoint to: {target_best_pt.resolve()}")
    else:
        print(f"\nWARNING: Could not locate best weights file at {best_pt_source}", file=sys.stderr)

    # Print final validation metrics
    if hasattr(results, "box") and results.box is not None:
        map50 = getattr(results.box, "map50", "N/A")
        map50_95 = getattr(results.box, "map", "N/A")
    elif hasattr(results, "results_dict") and isinstance(results.results_dict, dict):
        map50 = results.results_dict.get("metrics/mAP50(B)", "N/A")
        map50_95 = results.results_dict.get("metrics/mAP50-95(B)", "N/A")
    else:
        map50, map50_95 = "N/A", "N/A"

    print("\n" + "=" * 65)
    print("FINAL TRAINING & VALIDATION METRICS")
    print("=" * 65)
    print(f"  - mAP@50:    {map50}")
    print(f"  - mAP@50-95: {map50_95}")
    print("=" * 65)


def main():
    args = parse_args()
    base_dir = Path(__file__).resolve().parent.parent
    data_yaml_path = base_dir / "ghostvision_dataset" / "data.yaml"

    if not data_yaml_path.exists():
        print(f"FATAL ERROR: Dataset config not found at {data_yaml_path.resolve()}", file=sys.stderr)
        sys.exit(1)

    if args.time_check:
        run_time_check(args, data_yaml_path)
    else:
        train(args, data_yaml_path)


if __name__ == "__main__":
    main()
