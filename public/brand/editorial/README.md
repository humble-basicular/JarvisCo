# JarvisCo editorial logo (option 2)

Vector assets for the logo direction the user picked on 2026-10-12 ("ig use 2"). The reference is `02-editorial.png` in main Drive `Business/JarvisWeb/rebuild-2026-10/logo-options-2026-10-12/` (SHA-256 `b084b226…c5734079`).

All files are self-contained SVG: filled paths only, transparent unless stated, no fonts, `<text>`, `<style>`, raster images or external references.

| File | Use on | viewBox (ratio) | Letters / accent |
|---|---|---|---|
| `jarvisco-wordmark-dark.svg` | dark backgrounds (ink `#06110C`) | `0 0 1010 228` (4.43 : 1) | paper `#F4F1E8` / lime `#C8F560` |
| `jarvisco-wordmark-light.svg` | light backgrounds (paper `#F4F1E8`) | `0 0 1010 228` (4.43 : 1) | ink `#06110C` / lime `#C8F560` |
| `jarvisco-j-dark.svg` | standalone J mark on dark | `0 0 136 228` (0.596 : 1) | paper / lime |
| `jarvisco-j-light.svg` | standalone J mark on light | `0 0 136 228` (0.596 : 1) | ink / lime |
| `jarvisco-favicon.svg` | browser tab icon, any tab theme | `0 0 64 64` (1 : 1) | ink rounded tile (rx 14), paper J, lime accent |

## Sizing
- Wordmark: 140–180 px wide in the header (≈ 32–41 px tall), about 300 px in the footer. Don't go below 120 px wide: the hairline serifs start to drop out.
- Standalone J: 16 px tall at the smallest. For icons, use `jarvisco-favicon.svg`, whose tile keeps the J readable on both light and dark browser chrome.
- Clear space: keep at least the height of the lime accent (about 22% of the mark's height) free on every side.
- Always set both `width` and `height` (or `aspect-ratio`) so the image reserves its box and causes no layout shift.

## Integration
```html
<!-- header on dark -->
<img src="/brand/editorial/jarvisco-wordmark-dark.svg" width="160" height="36" alt="JarvisCo">
<!-- light surfaces -->
<img src="/brand/editorial/jarvisco-wordmark-light.svg" width="300" height="68" alt="JarvisCo">
<!-- favicon -->
<link rel="icon" type="image/svg+xml" href="/brand/editorial/jarvisco-favicon.svg">
```
Height = width × 228 / 1010. If the logo sits inside a link that already has a text label, use `alt=""` instead.

Not included here, so the integration stage should add them: PNG/ICO favicon fallbacks, `apple-touch-icon` (180 px PNG, since iOS ignores SVG icons) and OG images. Render them from `jarvisco-favicon.svg` and the wordmarks rather than from the raster reference.

## Provenance and licence
- The outlines are a trace of the selected raster concept, which was generated with ChatGPT's built-in image generation for this project. No typeface was used or embedded, so there is no font licence to carry. This is not a font, and other words can't be set in this style.
- Method: separate the paper letters by colour → 4× Lanczos upscale → Gaussian blur (radius 6.4 px at 4×) → threshold → `potrace 1.16 -s -a 1.15 -O 1.0 -t 60` → convert to absolute coordinates with 2-decimal precision. RMSE against the reference crop is 0.077, and the differences are only along anti-aliased edges.
- Hand-rebuilt geometry: the lime accent is an exact parallelogram (slant 0.42 ≈ 22.8°, sharing the stem's x-edges 100–159.1). The J stem's top edge was straightened to run parallel to the accent, with a constant 11.2-unit gap. The traced stem had a small dent and a slope that didn't match.
- Kept on purpose from the reference: the a–r foot join, the r/v/i serifs touching, the s nearly touching C, and C overlapping o. Together these give it a tight, ligature-like editorial look. Separating them would change the approved design.
- Brand colours: ink `#06110C`, paper `#F4F1E8`, lime `#C8F560`, emerald `#1FBF75` (emerald isn't used in these files).

## Known limits
- On paper, the lime accent has very low luminance contrast (about 1.1 : 1). It still shows through saturation, as in the reference light panel. If the accent must stand out on light backgrounds, swap its `fill` to emerald `#1FBF75`. That is a design change and needs the user's approval.
- In the 16 px favicon, the gap between the accent and the stem shrinks to a sub-pixel line. The J and the lime accent both stay recognisable (checked at 16/32/48 px).
