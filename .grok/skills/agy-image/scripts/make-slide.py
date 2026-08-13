#!/usr/bin/env python3
"""Crop an original photo to 16:9 for the category slider. No generation."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image

TARGET_AR = 16 / 9
OUT_W, OUT_H = 1920, 1080


def crop_16x9(im: Image.Image) -> Image.Image:
    w, h = im.size
    target_h = w / TARGET_AR
    if target_h <= h:
        top = max(0, int((h - target_h) * 0.28))
        box = (0, top, w, int(top + target_h))
    else:
        target_w = h * TARGET_AR
        left = int((w - target_w) / 2)
        box = (left, 0, int(left + target_w), h)
    cropped = im.crop(box)
    cw, ch = cropped.size
    if cw < OUT_W:
        scale = min(OUT_W / cw, 1.65)
        cropped = cropped.resize((int(cw * scale), int(ch * scale)), Image.Resampling.LANCZOS)
    elif cw > OUT_W:
        cropped = cropped.resize((OUT_W, OUT_H), Image.Resampling.LANCZOS)
    return cropped.convert("RGB")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--input", required=True, type=Path)
    p.add_argument("--output", required=True, type=Path)
    args = p.parse_args()
    if not args.input.is_file():
        raise SystemExit(f"missing input: {args.input}")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    out = crop_16x9(Image.open(args.input))
    out.save(args.output, "JPEG", quality=88, optimize=True, progressive=True)
    print(f"{args.output} {out.size[0]}x{out.size[1]}")


if __name__ == "__main__":
    main()
