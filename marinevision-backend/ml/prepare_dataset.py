#!/usr/bin/env python3
import argparse
import random
from collections import Counter
from pathlib import Path
import yaml

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}


def load_data_yaml(yaml_path: Path):
    if not yaml_path.exists():
        raise FileNotFoundError(f"data.yaml not found at: {yaml_path}")
    with open(yaml_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    names_raw = data.get("names", {})
    if isinstance(names_raw, dict):
        class_names = {int(k): str(v) for k, v in names_raw.items()}
    elif isinstance(names_raw, list):
        class_names = {i: str(v) for i, v in enumerate(names_raw)}
    else:
        class_names = {}
    return data, class_names


def validate_dataset(dataset_dir: Path, show_sample: bool = False):
    yaml_path = dataset_dir / "data.yaml"
    _, class_names = load_data_yaml(yaml_path)

    splits = ["train", "val", "test"]

    total_images_all = 0
    total_labels_all = 0
    total_missing_labels = 0
    total_missing_images = 0
    global_class_counts = Counter()

    print("=" * 65)
    print(f"YOLO Dataset Validation: {dataset_dir.resolve()}")
    print("=" * 65)
    print(f"Classes defined in data.yaml ({len(class_names)} total):")
    for cid, cname in sorted(class_names.items()):
        print(f"  [{cid}] {cname}")
    print("-" * 65)

    for split in splits:
        img_dir = dataset_dir / "images" / split
        lbl_dir = dataset_dir / "labels" / split

        if not img_dir.exists():
            print(f"\n[Split: {split}] Directory not found: {img_dir}")
            continue

        image_files = [f for f in img_dir.iterdir() if f.is_file() and f.suffix.lower() in IMAGE_EXTENSIONS]
        label_files = [f for f in lbl_dir.iterdir() if f.is_file() and f.suffix.lower() == ".txt"] if lbl_dir.exists() else []

        img_stems = {img.stem: img for img in image_files}
        lbl_stems = {lbl.stem: lbl for lbl in label_files}

        missing_labels = [img for stem, img in img_stems.items() if stem not in lbl_stems]
        missing_images = [lbl for stem, lbl in lbl_stems.items() if stem not in img_stems]

        split_class_counts = Counter()
        matched_pairs = []

        for stem, img_path in img_stems.items():
            if stem in lbl_stems:
                lbl_path = lbl_stems[stem]
                matched_pairs.append((img_path, lbl_path))
                try:
                    with open(lbl_path, "r", encoding="utf-8") as f:
                        for line in f:
                            parts = line.strip().split()
                            if parts:
                                class_id = int(parts[0])
                                split_class_counts[class_id] += 1
                                global_class_counts[class_id] += 1
                except Exception as e:
                    print(f"  [Warning] Error reading label file {lbl_path}: {e}")

        total_images_all += len(image_files)
        total_labels_all += len(label_files)
        total_missing_labels += len(missing_labels)
        total_missing_images += len(missing_images)

        print(f"\n[Split: {split}]")
        print(f"  - Images found: {len(image_files)}")
        print(f"  - Labels found: {len(label_files)}")
        print(f"  - Matching image/label pairs: {len(matched_pairs)}")
        print(f"  - Images missing labels: {len(missing_labels)}")
        if missing_labels:
            for m in missing_labels[:5]:
                print(f"    * {m.name}")
            if len(missing_labels) > 5:
                print(f"    ... and {len(missing_labels) - 5} more")
        print(f"  - Labels missing images: {len(missing_images)}")
        if missing_images:
            for m in missing_images[:5]:
                print(f"    * {m.name}")
            if len(missing_images) > 5:
                print(f"    ... and {len(missing_images) - 5} more")

        print("  - Class distribution (annotations):")
        if split_class_counts:
            for cid in sorted(class_names.keys() | split_class_counts.keys()):
                cname = class_names.get(cid, f"Unknown (ID {cid})")
                cnt = split_class_counts.get(cid, 0)
                print(f"    * [{cid}] {cname}: {cnt}")
        else:
            print("    * No annotations found")

        if show_sample and matched_pairs:
            sample_count = min(5, len(matched_pairs))
            samples = random.sample(matched_pairs, sample_count)
            print(f"\n  --- Sample Pairs for '{split}' (showing {sample_count}) ---")
            for idx, (s_img, s_lbl) in enumerate(samples, 1):
                try:
                    content = s_lbl.read_text(encoding="utf-8").strip()
                    display_content = content if content else "(empty label file)"
                except Exception as e:
                    display_content = f"(error reading file: {e})"
                print(f"  Sample #{idx}:")
                print(f"    Image: {s_img.relative_to(dataset_dir)}")
                print(f"    Label: {s_lbl.relative_to(dataset_dir)}")
                print("    Content:")
                for line in display_content.splitlines():
                    print(f"      {line}")

    print("\n" + "=" * 65)
    print("DATASET SUMMARY TOTALS")
    print("=" * 65)
    print(f"Total Images: {total_images_all}")
    print(f"Total Label Files: {total_labels_all}")
    print(f"Total Missing Labels: {total_missing_labels}")
    print(f"Total Missing Images: {total_missing_images}")
    print("Global Class Distribution:")
    for cid in sorted(class_names.keys() | global_class_counts.keys()):
        cname = class_names.get(cid, f"Unknown (ID {cid})")
        cnt = global_class_counts.get(cid, 0)
        print(f"  [{cid}] {cname}: {cnt}")
    print("=" * 65)


def main():
    parser = argparse.ArgumentParser(
        description="Validate YOLO dataset and print class and split statistics."
    )
    base_dir = Path(__file__).resolve().parent.parent
    parser.add_argument(
        "--dataset-dir",
        type=Path,
        default=base_dir / "dataset",
        help="Path to YOLO dataset root directory (default: dataset/)",
    )
    parser.add_argument(
        "--sample",
        action="store_true",
        help="Print 5 random image/label pairs per split as a sanity check",
    )

    args = parser.parse_args()
    validate_dataset(args.dataset_dir, show_sample=args.sample)


if __name__ == "__main__":
    main()
