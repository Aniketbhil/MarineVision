#!/usr/bin/env python3
import os
import sys
import shutil
import json
import random
import zipfile
import urllib.request
from pathlib import Path

FIGSHARE_ARTICLE_API = "https://api.figshare.com/v2/articles/24574879"
YEAR_ZIPS = ["2010.zip", "2015.zip", "2017.zip", "2018.zip", "2021.zip"]

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_ZIPS_DIR = BASE_DIR / "data" / "mine_raw_zips"
EXTRACTED_DIR = BASE_DIR / "data" / "mine_raw_extracted"
OUTPUT_DIR = BASE_DIR / "mine_dataset"


def fetch_figshare_file_urls():
    """Queries Figshare API for direct download URLs of the 5 year-based zip files."""
    print(f"Querying Figshare API endpoint: {FIGSHARE_ARTICLE_API}...")
    req = urllib.request.Request(FIGSHARE_ARTICLE_API, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"Error querying Figshare API: {e}", file=sys.stderr)
        sys.exit(1)

    file_urls = {}
    for item in data.get("files", []):
        filename = item.get("name")
        download_url = item.get("download_url")
        if filename in YEAR_ZIPS and download_url:
            file_urls[filename] = download_url

    missing = [fz for fz in YEAR_ZIPS if fz not in file_urls]
    if missing:
        print(f"ERROR: Could not find download URLs for files: {missing}", file=sys.stderr)
        sys.exit(1)

    return file_urls


def download_zip_files(file_urls):
    """Downloads all 5 year-based zip files into data/mine_raw_zips/."""
    RAW_ZIPS_DIR.mkdir(parents=True, exist_ok=True)
    for fname in YEAR_ZIPS:
        url = file_urls[fname]
        dst_path = RAW_ZIPS_DIR / fname
        if dst_path.exists() and dst_path.stat().st_size > 0:
            print(f"Zip file already present: {dst_path.name} ({dst_path.stat().st_size / 1e6:.1f} MB)")
            continue

        print(f"Downloading {fname} from {url}...")
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req) as resp, open(dst_path, "wb") as out_f:
            total_bytes = 0
            while True:
                chunk = resp.read(1024 * 1024)
                if not chunk:
                    break
                out_f.write(chunk)
                total_bytes += len(chunk)
        print(f"Saved {fname} ({total_bytes / 1e6:.1f} MB)")


def extract_zip_files():
    """Extracts all 5 year-based zip files into data/mine_raw_extracted/."""
    if EXTRACTED_DIR.exists() and len(list(EXTRACTED_DIR.glob("*"))) > 0:
        print(f"Extracted directory already exists: {EXTRACTED_DIR}")
        return

    EXTRACTED_DIR.mkdir(parents=True, exist_ok=True)
    for fname in YEAR_ZIPS:
        zip_path = RAW_ZIPS_DIR / fname
        print(f"Extracting {zip_path.name} into {EXTRACTED_DIR}...")
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(EXTRACTED_DIR)


def collect_image_label_pairs():
    """
    Scans data/mine_raw_extracted for all image files and matches them with .txt label files.
    Returns: list of dicts {'img_path': Path, 'lbl_path': Path}
    """
    image_extensions = {".jpg", ".jpeg", ".png", ".bmp"}
    all_image_paths = []

    for root, _, files in os.walk(EXTRACTED_DIR):
        for f in files:
            p = Path(root) / f
            if p.suffix.lower() in image_extensions:
                all_image_paths.append(p)

    pairs = []
    orphan_images = 0

    for img_p in all_image_paths:
        lbl_p = img_p.with_suffix(".txt")
        if lbl_p.exists():
            pairs.append({"img_path": img_p, "lbl_path": lbl_p})
        else:
            orphan_images += 1
            pairs.append({"img_path": img_p, "lbl_path": None})

    return pairs


def rebalance_and_split_dataset(pairs):
    """
    Categorizes pairs into:
      - Positive (MILCO present)
      - NOMBO-only background
      - Zero-annotation background
    Subsamples background images to 120 total (49 NOMBO + 71 zero-annotation),
    keeps ALL 255 positive images (375 total), splits 70/20/10, and writes mine_dataset/.
    """
    random.seed(42)

    pos_pairs = []
    nombo_pairs = []
    zero_pairs = []

    for item in pairs:
        lbl_src = item["lbl_path"]
        has_milco = False
        has_nombo = False
        if lbl_src and lbl_src.exists():
            lines = lbl_src.read_text(encoding="utf-8").strip().splitlines()
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                cls_id = line.split()[0]
                if cls_id == "0":
                    has_milco = True
                elif cls_id == "1":
                    has_nombo = True

        if has_milco:
            pos_pairs.append(item)
        elif has_nombo:
            nombo_pairs.append(item)
        else:
            zero_pairs.append(item)

    print("\n--- RAW DATASET ANNOTATION BREAKDOWN ---")
    print(f"Total Raw Images:                 {len(pairs)}")
    print(f"Positive Images (with MILCO):      {len(pos_pairs)}")
    print(f"NOMBO-Only Background Images:     {len(nombo_pairs)}")
    print(f"Zero-Annotation Background:        {len(zero_pairs)}")
    print(f"Total Raw Background Images:       {len(nombo_pairs) + len(zero_pairs)}")

    # Subsample background: ALL NOMBO-only (49) + 71 zero-annotation = 120 background images
    target_zero_count = 71
    random.shuffle(zero_pairs)
    selected_zero_pairs = zero_pairs[:target_zero_count]

    selected_bg_pairs = nombo_pairs + selected_zero_pairs
    selected_all_pairs = pos_pairs + selected_bg_pairs
    random.shuffle(selected_all_pairs)

    total_rebalanced = len(selected_all_pairs)
    train_end = int(0.70 * total_rebalanced)
    val_end = int(0.90 * total_rebalanced)

    train_items = selected_all_pairs[:train_end]
    val_items = selected_all_pairs[train_end:val_end]
    test_items = selected_all_pairs[val_end:]

    splits = {
        "train": train_items,
        "val": val_items,
        "test": test_items,
    }

    # Reset OUTPUT_DIR
    if OUTPUT_DIR.exists():
        shutil.rmtree(OUTPUT_DIR)

    for split in ["train", "val", "test"]:
        (OUTPUT_DIR / "images" / split).mkdir(parents=True, exist_ok=True)
        (OUTPUT_DIR / "labels" / split).mkdir(parents=True, exist_ok=True)

    total_milco_kept = 0
    total_nombo_discarded = 0
    final_bg_count = 0
    split_counts = {}

    for split, split_items in splits.items():
        split_counts[split] = len(split_items)
        for item in split_items:
            img_src = item["img_path"]
            lbl_src = item["lbl_path"]

            dest_filename = img_src.name
            img_dst = OUTPUT_DIR / "images" / split / dest_filename
            lbl_dst = OUTPUT_DIR / "labels" / split / f"{img_src.stem}.txt"

            shutil.copy2(img_src, img_dst)

            milco_boxes = []
            if lbl_src and lbl_src.exists():
                lines = lbl_src.read_text(encoding="utf-8").strip().splitlines()
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    parts = line.split()
                    cls_id = parts[0]
                    if cls_id == "0":
                        milco_boxes.append(" ".join(["0"] + parts[1:]))
                        total_milco_kept += 1
                    elif cls_id == "1":
                        total_nombo_discarded += 1

            if milco_boxes:
                lbl_dst.write_text("\n".join(milco_boxes) + "\n", encoding="utf-8")
            else:
                lbl_dst.write_text("", encoding="utf-8")
                final_bg_count += 1

    # Generate data.yaml
    data_yaml_content = f"""path: {OUTPUT_DIR.resolve()}
train: images/train
val: images/val
test: images/test

names:
  0: Mine
"""
    (OUTPUT_DIR / "data.yaml").write_text(data_yaml_content, encoding="utf-8")

    bg_ratio = (final_bg_count / total_rebalanced) * 100

    print("\n" + "=" * 70)
    print("REBALANCED MINE DATASET PREPARATION SUMMARY REPORT")
    print("=" * 70)
    print(f"Total Rebalanced Images:      {total_rebalanced}")
    print(f"  - Positive (Mine) Images:   {len(pos_pairs)}")
    print(f"  - Subsampled Background:    {final_bg_count} ({len(nombo_pairs)} NOMBO-originated + {len(selected_zero_pairs)} Zero-annotation)")
    print(f"  - Resulting Background Ratio: {bg_ratio:.1f}%")
    print(f"\nPer-Split Composition (70/20/10):")
    print(f"  - Train split:              {split_counts['train']} images")
    print(f"  - Val split:                {split_counts['val']} images")
    print(f"  - Test split:               {split_counts['test']} images")
    print(f"\nAnnotations:")
    print(f"  - Total MILCO Kept:         {total_milco_kept} (Class 0: 'Mine')")
    print(f"  - Total NOMBO Discarded:    {total_nombo_discarded} (Class 1 stripped)")
    print(f"Output Directory:             {OUTPUT_DIR.resolve()}")
    print("=" * 70)


def main():
    print("=" * 70)
    print("PREPARING & REBALANCING MINE DETECTION DATASET (FIGSHARE 24574879)")
    print("=" * 70)

    file_urls = fetch_figshare_file_urls()
    download_zip_files(file_urls)
    extract_zip_files()
    pairs = collect_image_label_pairs()
    rebalance_and_split_dataset(pairs)


if __name__ == "__main__":
    main()
