#!/usr/bin/env python3
import os
import sys
import shutil
import random
import traceback
import yaml
import numpy as np
from collections import Counter
from pathlib import Path
from PIL import Image
import cv2
from concurrent.futures import ThreadPoolExecutor, as_completed
from huggingface_hub import hf_hub_download

try:
    from datasets import load_dataset, Image as HFImage
    DATASETS_AVAILABLE = True
except ImportError:
    DATASETS_AVAILABLE = False


CLASS_MAPPING = {
    "Crab-Pot": 0,
    "crab-pot": 0,
    "Derelict-Fishing-Gear": 0,
    "derelict-fishing-gear": 0,
    "Ghost-Net": 0,
    "ghost-net": 0,
    0: 0,
}

YAML_CLASS_NAMES = {
    0: "Derelict-Fishing-Gear",
}


def load_hf_token():
    """Reads HF_TOKEN from environment or .env file."""
    token = os.environ.get("HF_TOKEN")
    if not token:
        base_dir = Path(__file__).resolve().parent.parent
        env_file = base_dir / ".env"
        if env_file.exists():
            for line in env_file.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line.startswith("HF_TOKEN=") and not line.startswith("#"):
                    token = line.split("=", 1)[1].strip().strip("'\"")
                    os.environ["HF_TOKEN"] = token
                    break
    return token


def parse_annotations(objs):
    """
    Extract bboxes and class_ids from record objects dict.
    Returns: list of (0, [x, y, width, height]) mapping all annotations to Class 0 ('Derelict-Fishing-Gear')
    """
    annotations = []
    if isinstance(objs, dict):
        bboxes = objs.get("bbox") or objs.get("bboxes") or []
        categories = (
            objs.get("categories")
            or objs.get("category")
            or objs.get("label")
            or objs.get("labels")
            or objs.get("names")
            or []
        )
        for bbox, _ in zip(bboxes, categories):
            if len(bbox) == 4:
                annotations.append((0, bbox))
    return annotations


def convert_bbox_to_yolo(bbox, img_width, img_height):
    x, y, w, h = bbox
    x_center = (x + w / 2.0) / float(img_width)
    y_center = (y + h / 2.0) / float(img_height)
    w_norm = w / float(img_width)
    h_norm = h / float(img_height)

    # Clamp to [0, 1] bounds
    x_center = max(0.0, min(1.0, x_center))
    y_center = max(0.0, min(1.0, y_center))
    w_norm = max(0.0, min(1.0, w_norm))
    h_norm = max(0.0, min(1.0, h_norm))

    return x_center, y_center, w_norm, h_norm


def process_record(args):
    split_name, rec, output_dir, hf_token = args
    filename_stem = rec["stem"]
    rel_path = rec["rel_path"]
    img_path = output_dir / "images" / split_name / f"{filename_stem}.jpg"
    lbl_path = output_dir / "labels" / split_name / f"{filename_stem}.txt"

    local_downloaded = hf_hub_download(
        repo_id="PINGEcosystem/sss-crab-pot-detection-ds",
        filename=rel_path,
        repo_type="dataset",
        token=hf_token,
    )

    with Image.open(local_downloaded) as img:
        if img.mode != "RGB":
            img = img.convert("RGB")
        img.save(img_path, format="JPEG")
        img_w, img_h = img.width, img.height

    anns = rec["parsed_annotations"]
    label_lines = []
    is_bg = False
    cids = []
    if not anns:
        is_bg = True
    else:
        for cid, bbox in anns:
            cids.append(cid)
            x_c, y_c, nw, nh = convert_bbox_to_yolo(bbox, img_w, img_h)
            label_lines.append(f"{cid} {x_c:.6f} {y_c:.6f} {nw:.6f} {nh:.6f}")

    lbl_path.write_text(
        "\n".join(label_lines) + ("\n" if label_lines else ""),
        encoding="utf-8",
    )

    return split_name, img_path, is_bg, cids


def prepare_ghostvision_dataset(output_dir: Path, max_samples: int = 400):
    if not DATASETS_AVAILABLE:
        print("FATAL ERROR: HuggingFace 'datasets' package is not installed!", file=sys.stderr)
        sys.exit(1)

    hf_token = load_hf_token()
    if not hf_token:
        print("=" * 65, file=sys.stderr)
        print("FATAL ERROR: HF_TOKEN environment variable is missing!", file=sys.stderr)
        print("Please set HF_TOKEN in your environment or .env file before running.", file=sys.stderr)
        print("=" * 65, file=sys.stderr)
        sys.exit(1)

    # Wipe previous output directory completely to ensure fresh dataset generation
    if output_dir.exists():
        print(f"Cleaning previous dataset directory at {output_dir.resolve()}...")
        shutil.rmtree(output_dir)

    print("Attempting to load 'PINGEcosystem/sss-crab-pot-detection-ds' from Hugging Face...")
    print(f"HF_TOKEN prefix: {hf_token[:5]}***")

    try:
        ds_raw = load_dataset(
            "PINGEcosystem/sss-crab-pot-detection-ds", streaming=True, token=hf_token
        ).cast_column("image", HFImage(decode=False))
    except Exception as e:
        print("=" * 65, file=sys.stderr)
        print(f"FATAL ERROR: Failed to load dataset from Hugging Face Hub:\n{e}", file=sys.stderr)
        traceback.print_exc()
        print("=" * 65, file=sys.stderr)
        sys.exit(1)

    print("Successfully connected to Hugging Face dataset stream!")

    records = []
    splits = [s for s in ["validation", "train", "test"] if s in ds_raw.keys()]

    print(f"Streaming and indexing records from Hugging Face splits: {splits}...")
    for split_name in splits:
        stream_raw = ds_raw[split_name]
        for idx, item in enumerate(stream_raw):
            raw_path = item.get("image", {}).get("path", "")
            if not raw_path:
                continue

            stem = Path(raw_path).stem
            anns = parse_annotations(item.get("objects"))

            if "sss-crab-pot-detection-ds@" in raw_path:
                rel_path = raw_path.split("sss-crab-pot-detection-ds@", 1)[1].split("/", 1)[1]
            else:
                rel_path = f"{split_name}/{Path(raw_path).name}"

            records.append({
                "stem": stem,
                "rel_path": rel_path,
                "parsed_annotations": anns
            })

            if len(records) >= 800:
                break
        if len(records) >= 800:
            break

    if not records:
        print("FATAL ERROR: No records retrieved from Hugging Face dataset stream!", file=sys.stderr)
        sys.exit(1)

    print(f"Retrieved {len(records)} candidate records from Hugging Face Hub.")

    # Categorize records
    annotated_records = []
    background_records = []

    for r in records:
        anns = r["parsed_annotations"]
        if not anns:
            background_records.append(r)
        else:
            annotated_records.append(r)

    # Ensure background images are at least 17% (68 images out of 400)
    target_bg_count = max(
        68,
        int(max_samples * 0.17),
    )
    if len(background_records) >= target_bg_count:
        sampled_bg = random.sample(background_records, target_bg_count)
    else:
        sampled_bg = list(background_records)

    quota_annotated = max_samples - len(sampled_bg)
    if len(annotated_records) > quota_annotated:
        sampled_ann = random.sample(annotated_records, quota_annotated)
    else:
        sampled_ann = list(annotated_records)

    final_sample = sampled_bg + sampled_ann
    random.shuffle(final_sample)

    total_sampled = len(final_sample)

    # Stratified split: 70% train, 20% val, 10% test
    n_train = int(total_sampled * 0.70)
    n_val = int(total_sampled * 0.20)

    train_records = final_sample[:n_train]
    val_records = final_sample[n_train : n_train + n_val]
    test_records = final_sample[n_train + n_val :]

    split_map = {
        "train": train_records,
        "val": val_records,
        "test": test_records,
    }

    # Setup clean output directories
    output_dir.mkdir(parents=True, exist_ok=True)
    for s in ["train", "val", "test"]:
        (output_dir / "images" / s).mkdir(parents=True, exist_ok=True)
        (output_dir / "labels" / s).mkdir(parents=True, exist_ok=True)

    # Create single-class data.yaml
    data_yaml_content = {
        "path": str(output_dir.resolve()),
        "train": "images/train",
        "val": "images/val",
        "test": "images/test",
        "names": YAML_CLASS_NAMES,
    }
    with open(output_dir / "data.yaml", "w", encoding="utf-8") as f:
        yaml.dump(data_yaml_content, f, sort_keys=False)

    print("Parallel downloading and converting real sonar image files (16 threads)...")
    tasks = []
    for split_name, recs in split_map.items():
        for rec in recs:
            tasks.append((split_name, rec, output_dir, hf_token))

    per_split_counts = Counter()
    per_class_counts = Counter()
    bg_count_actual = 0
    saved_filenames = []
    first_image_path = None

    with ThreadPoolExecutor(max_workers=16) as executor:
        futures = [executor.submit(process_record, task) for task in tasks]
        for future in as_completed(futures):
            split_name, img_path, is_bg, cids = future.result()
            per_split_counts[split_name] += 1
            saved_filenames.append(img_path.name)
            if first_image_path is None:
                first_image_path = img_path

            if is_bg:
                bg_count_actual += 1
            for cid in cids:
                per_class_counts[cid] += 1

    # Compute OpenCV stats for first sample image
    cv_img = cv2.imread(str(first_image_path))
    if cv_img is not None:
        h, w, c = cv_img.shape
        mean_val = float(np.mean(cv_img))
        std_val = float(np.std(cv_img))
        min_val = int(np.min(cv_img))
        max_val = int(np.max(cv_img))
    else:
        h, w, c, mean_val, std_val, min_val, max_val = 0, 0, 0, 0.0, 0.0, 0, 0

    # Print Summary
    print("\n" + "=" * 65)
    print("GHOSTVISION DATASET PREPARATION SUMMARY")
    print("=" * 65)
    print("REAL HUGGING FACE DATASET LOAD CONFIRMED: YES")
    print(f"Output Directory: {output_dir.resolve()}")
    print(f"Total Images Sampled: {total_sampled}")
    print("\nPer-Split Image Counts:")
    for s in ["train", "val", "test"]:
        print(f"  - {s}: {per_split_counts[s]}")

    print("\nPer-Class Annotation Counts:")
    for cid, cname in YAML_CLASS_NAMES.items():
        cnt = per_class_counts.get(cid, 0)
        print(f"  - [{cid}] {cname}: {cnt}")

    print(
        f"\nBackground (No-Annotation) Images: {bg_count_actual} ({bg_count_actual / max(1, total_sampled):.1%})"
    )

    print("\nOriginal Dataset Filename Samples (showing 5 real HF filenames):")
    for fn in saved_filenames[:5]:
        print(f"  - {fn}")

    print("\nOpenCV Image Content Analysis for Real Sonar Sample:")
    print(f"  - Sample Image File: {first_image_path.relative_to(output_dir)}")
    print(f"  - Dimensions: {w}x{h} (Channels: {c})")
    print(f"  - Mean Pixel Intensity: {mean_val:.2f} (0-255 scale)")
    print(f"  - Intensity Std Dev: {std_val:.2f}")
    print(f"  - Min / Max Pixel Values: [{min_val}, {max_val}]")
    print("=" * 65)


def main():
    base_dir = Path(__file__).resolve().parent.parent
    output_dir = base_dir / "ghostvision_dataset"
    prepare_ghostvision_dataset(output_dir, max_samples=400)


if __name__ == "__main__":
    main()
