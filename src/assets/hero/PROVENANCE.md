# Hero and showcase images: provenance

Machine-readable receipt (hashes, corners, capture viewports, source commit): `RECEIPT.json`, written by `scripts/showcase-assets.mjs`.

## `toolbelt-heating.png` (hero)
- Object: AI-generated (ChatGPT Images through Codex, 2026-10-15), variant `hero-v2.png` in main Drive `Personal Everything/research/2026-10-15-hero-variants/`. Prompts and checks are in `PROMPTS.md` there. No people, hands, text or logos.
- Size: 1536 × 1024, the tool's native output. Not upscaled; the plan's 2400 px target was not met.
- Phone screen: a real headless Chrome capture (390 × 722 CSS px, DPR 2) of our own demo `/pavyzdys/sildymas` at the commit in the receipt. It is composited only inside the generated green screen; the receipt records `outsideMaskDifference: 0` (no pixel outside the screen changed) and `greenPixelsLeft: 0`.
- Recipe: mask near-green pixels (g > 0.55, r < 0.25, b < 0.25); corners = extremes of x+y / x−y over the mask; expand the quad 4 % from its centre for the rounded screen; perspective-distort the capture onto it; alpha = mask dilated Disk:1.5 + blur 0x0.6.
- Shown on the site as an illustration of the product, never as a client. The caption under the hero says so.

## `../showcase/*.png` (Pavyzdys section and before/after strip)
- `heating-mobile.png` 390 × 844, `heating-desktop.png` 1440 × 900 (both DPR 2) and `heating-mobile-tall.png` (whole page, 390 CSS px wide, DPR 1.4): headless Chrome captures of `/pavyzdys/sildymas` by `scripts/showcase-capture.mjs`. Metadata stripped, pixels unchanged.
- The demo business „Šilumos ratas“ and its data are made up; its photos are AI-generated objects (H2b, no people).

## Rebuild
1. `node scripts/showcase-capture.mjs http://127.0.0.1:<port> <out-dir>` against a local build with a clean demo template.
2. `node scripts/showcase-assets.mjs <out-dir> <path to hero-v2.png>` (checks the source hash before compositing).
