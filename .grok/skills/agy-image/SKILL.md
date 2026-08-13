---
name: agy-image
description: >
  Create or recrop site images with the Antigravity CLI (`agy`) from original
  photos. Use when the user says "agy", "tạo ảnh", "ảnh slide", "crop 16:9",
  "ảnh gốc", "hình nhèo", missing project photos, or runs /agy-image.
  Do not invent facades of real client restaurants — start from the original file.
---

# agy-image

Make images that fit the page from **existing photos**. Prefer crop/reframe over generation.

## When to use

- Slider looks stretched or soft
- A new dự án needs a 16:9 slide
- User asks to use `agy` for images

Do **not** generate a fake storefront for Crust, 4P's, Truffle, etc. If there is no original, say so.

## Sizes

| Slot | Aspect | Output | Path |
|---|---|---|---|
| Category slider | 16:9 | ≤ 1920×1080 JPEG | `public/images/slides/{slug}.jpg` |
| Featured / gallery | keep original | do not replace | CMS `featured_image` / `gallery` |

New projects: put the 16:9 file in `public/images/slides/{slug}.jpg` **and** upload the same file to the `slide_image` field in admin.

## Run agy

```bash
agy --print --print-timeout 10m --dangerously-skip-permissions --add-dir "$PWD" -p "$PROMPT"
```

`$PROMPT` must include:

1. Absolute input path(s) under `uploads/` or `public/images/`
2. Absolute output path `public/images/slides/{slug}.jpg`
3. "Crop the original to 16:9. Do not invent architecture, logos, or people. Storefronts: keep the facade in the upper-middle of the frame. LANCZOS. JPEG quality 88. Print the output path when done."

If `agy` is missing, run the helper instead:

```bash
python3 .grok/skills/agy-image/scripts/make-slide.py \
  --input uploads/SOURCE.jpg \
  --output public/images/slides/SLUG.jpg
```

Then add `SLUG` to `SLIDE_SLUGS` in `src/utils/slide-image.ts` if the project has no CMS `slide_image` yet.

## After writing files

Commit and `git push` (user rule). Deploy is required before production shows new `public/` images.
