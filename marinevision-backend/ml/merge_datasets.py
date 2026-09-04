#!/usr/bin/env python3
import os
import sys
import shutil
from pathlib import Path
from collections import Counter

BASE_DIR = Path(__file__).resolve().parent.parent
GHOST_DIR = BASE_DIR / "ghostvision_dataset"
MINE_DIR = BASE_DIR / "mine_dataset"
COMBINED_DIR = BASE_DIR / "combined_dataset"

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}


def check_source_datasets():
    if not GHOST_DIR.exists():
        print(f"ERROR: Source dataset not found at {GHOST_DIR}", file=sys.stderr)
        sys.exit(1)
    if not MINE_DIR.exists():
        print(f"ERROR: Source dataset not found at {MINE_DIR}", file=sys.stderr)
        sys.exit(1)


def merge_datasets():
    check_source_datasets()

    print("=" * 70)
    print("MERGING GHOSTVISION AND MINE DATASETS INTO COMBINED_DATASET")
    print("=" * 70)

    # 1. Recreate COMBINED_DIR
    if COMBINED_DIR.exists():
        shutil.rmtree(COMBINED_DIR)

    splits = ["train", "val", "test"]
    for split in splits:
        (COMBINED_DIR / "images" / split).mkdir(parents=True, exist_ok=True)
        (COMBINED_DIR / "labels" / split).mkdir(parents=True, exist_ok=True)

    # Collect all GhostVision image filenames to detect collisions
    ghost_filenames = set()
    for split in splits:
        ghost_img_dir = GHOST_DIR / "images" / split
        if ghost_img_dir.exists():
            for f in ghost_img_dir.iterdir():
                if f.is_file() and f.suffix.lower() in IMAGE_EXTENSIONS:
                    ghost_filenames.add(f.name)

    print(f"Collected {len(ghost_filenames)} GhostVision image filenames for collision checking.")

    collisions_found = 0
    ghost_copied = Counter()
    mine_copied = Counter()

    # 2. Copy GhostVision Dataset (Class 0: Derelict-Fishing-Gear stays Class 0)
    print("\n--- Copying GhostVision Dataset (Class 0 -> 0: Derelict-Fishing-Gear) ---")
    for split in splits:
        ghost_img_dir = GHOST_DIR / "images" / split
        ghost_lbl_dir = GHOST_DIR / "labels" / split

        if not ghost_img_dir.exists():
            continue

        for img_p in ghost_img_dir.iterdir():
            if not (img_p.is_file() and img_p.suffix.lower() in IMAGE_EXTENSIONS):
                continue

            dest_img_p = COMBINED_DIR / "images" / split / img_p.name
            dest_lbl_p = COMBINED_DIR / "labels" / split / f"{img_p.stem}.txt"

            shutil.copy2(img_p, dest_img_p)

            lbl_src = ghost_lbl_dir / f"{img_p.stem}.txt"
            if lbl_src.exists():
                lines = lbl_src.read_text(encoding="utf-8").strip().splitlines()
                # Class 0 remains Class 0
                dest_lbl_p.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")
            else:
                dest_lbl_p.write_text("", encoding="utf-8")

            ghost_copied[split] += 1

    print(f"GhostVision images copied per split: {dict(ghost_copied)}")

    # 3. Copy Mine Dataset (Class 0: Mine -> Class 1: Mine)
    print("\n--- Copying Mine Dataset (Class 0 -> 1: Mine) with Collision Check ---")
    for split in splits:
        mine_img_dir = MINE_DIR / "images" / split
        mine_lbl_dir = MINE_DIR / "labels" / split

        if not mine_img_dir.exists():
            continue

        for img_p in mine_img_dir.iterdir():
            if not (img_p.is_file() and img_p.suffix.lower() in IMAGE_EXTENSIONS):
                continue

            if img_p.name in ghost_filenames:
                collisions_found += 1
                dest_name = f"mine_{img_p.name}"
                dest_stem = f"mine_{img_p.stem}"
            else:
                dest_name = img_p.name
                dest_stem = img_p.stem

            dest_img_p = COMBINED_DIR / "images" / split / dest_name
            dest_lbl_p = COMBINED_DIR / "labels" / split / f"{dest_stem}.txt"

            shutil.copy2(img_p, dest_img_p)

            lbl_src = mine_lbl_dir / f"{img_p.stem}.txt"
            converted_lines = []
            if lbl_src.exists():
                lines = lbl_src.read_text(encoding="utf-8").strip().splitlines()
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    parts = line.split()
                    # Convert class 0 ("Mine") -> class 1 ("Mine")
                    converted_lines.append(f"1 {' '.join(parts[1:])}")

            if converted_lines:
                dest_lbl_p.write_text("\n".join(converted_lines) + "\n", encoding="utf-8")
            else:
                dest_lbl_p.write_text("", encoding="utf-8")

            mine_copied[split] += 1

    print(f"Mine images copied per split: {dict(mine_copied)}")
    print(f"Filename collisions detected and prefixed with 'mine_': {collisions_found}")

    # 4. Generate combined_dataset/data.yaml
    data_yaml_content = f"""path: {COMBINED_DIR.resolve()}
train: images/train
val: images/val
test: images/test

names:
  0: Derelict-Fishing-Gear
  1: Mine
"""
    (COMBINED_DIR / "data.yaml").write_text(data_yaml_content, encoding="utf-8")

    # 5. Print Combined Dataset Summary
    print("\n" + "=" * 70)
    print("COMBINED DATASET MERGE SUMMARY")
    print("=" * 70)
    print(f"GhostVision Total Images: {sum(ghost_copied.values())} (280 train, 80 val, 40 test)")
    print(f"Mine Total Images:        {sum(mine_copied.values())} (262 train, 75 val, 38 test)")
    print(f"Combined Total Images:    {sum(ghost_copied.values()) + sum(mine_copied.values())} (expected: 775)")
    print(f"Output Directory:         {COMBINED_DIR.resolve()}")
    print("=" * 70)


def main():
    merge_datasets()


if __name__ == "__main__":
    main()
