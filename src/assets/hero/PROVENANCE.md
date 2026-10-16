# Hero and showcase images: provenance

**Site hero since 2026-10-16: `a1-knolling-finished.png`** (concept A1, picked by Jarvis): AI-generated top-down flat lay of heating tools (ChatGPT Images via Codex; source `originals/a1-knolling-proportions-r2.png` in main Drive `Personal Everything/research/2026-10-16-hero-concepts/`, SHA-256 `ea816ae4…e8a0`), with a real headless-Chrome capture of our heating demo `/pavyzdys/sildymas` composited onto the phone by composite v2. The demo's example banner is cropped by its measured height (the capture is shot taller by the same amount), so the screen keeps 390 × 722 CSS px proportions. `RECEIPT.json` (written by `scripts/showcase-assets.mjs`) pins the capture commit, hashes and geometry. Shown as an illustration with a caption, never as a client.

Rebuild after any demo change, from the integration worktree with a clean demo template:
1. `npm run build && npx astro preview --host 127.0.0.1 --port <port>`
2. `node scripts/showcase-capture.mjs http://127.0.0.1:<port> client-sites/<capture-dir>`
3. `node scripts/showcase-assets.mjs client-sites/<capture-dir> "<Drive>/Personal Everything/research/2026-10-16-hero-concepts/originals/a1-knolling-proportions-r2.png"` (refreshes `../showcase/*.png` too)

Not used by any page any more (kept for review history; cleanup candidates): `toolbelt-heating.png`, `toolbelt-heating-v2*`, `b2-frontal-belt-finished*`, `RECEIPT-v2.json` if present.

## Composite v2 — 2026-10-16

Engine: `scripts/hero-composite.mjs` (Node + existing Sharp dependency, offline). `scripts/showcase-assets.mjs` now calls this engine and writes the versioned `toolbelt-heating-v2.png` and `RECEIPT-v2.json`, leaving the current hero/receipt in place. The showcase wrapper still refreshes showcase screenshots, so use the standalone command for hero-only work.

Committed candidates, all 1536 × 1024 (source-native, no upscaling):

- `toolbelt-heating-v2.png`: original diagonal hero-v2 photo with improved replacement.
- `a1-knolling-finished.png`: selected flat lay, generated attempt 2 (wider phone). Attempt 1 remains in Drive.
- `b2-frontal-belt-finished.png`: selected frontal dark leather belt.

Each candidate has `-alpha.png`, `-light.png`, and `-receipt.json` siblings. Receipts pin source/capture/output SHA-256, fitted lines with residuals/sample counts, subpixel corners, crop, lighting settings and verified safety checks. `generation-prompts.json` records exact prompts and the extra A1 edit attempt. Full source manifest, all original generations, the other finished variants, contact sheet and comparisons are in main Drive `Personal Everything/research/2026-10-16-hero-concepts/`.

### Recipe

1. Verify expected source and capture hashes. Find the connected chroma screen, then estimate continuous key coverage from excess green. No binary-mask dilation or expanded key mask.
2. Fit four robust lines to subpixel 50%-alpha crossings on straight runs, excluding rounded corners. Intersect these lines for the homography. For B1/B2, leather hides the physical bottom glass corners: `--bottom-occlusion` explicitly records that the fitted lower boundary is the visible pocket edge, rather than claiming recovered corners.
3. Remove 146 **image pixels** (73 CSS px at DPR 2) from the top of the supplied 780 × 1444 hero capture. This removes the dark PAVYZDYS/disclaimer bar. The remaining 780 × 1298 capture is in Drive `composite-v2/capture-current-cropped.png`; no fresh bar-free capture was available among the supplied inputs. Do not apply this crop to a redesigned capture that already omits the bar.
4. Lanczos-prefilter the website to the photographed display's pixel footprint before perspective sampling; use contain fitting with quiet paper padding to preserve website proportions. Content extends 0.75% per side underneath the original edge alpha. The phone body, rounded glass boundary and pocket stay above it through foreground recovery, not a painted rectangular overlay.
5. Recover foreground as original minus keyed green, removing green spill. Use a smoothed, normalized luminance map from the original green pixels for light variation; add mild vertical/edge falloff, a broad 2.1%-peak glass reflection, 0.35px optical blur and deterministic subpixel grain. Match paper white from the photograph with a slightly dimmer screen white and raised black floor. The generated screens are quite evenly lit, so the measured source light variation is small, not invented dramatic shading.
6. Check decoded output pixels outside the alpha support are identical to the source; reject remaining bright green (G > 140, R/B < 64). Verify PNG bytes decode to the checked pixels and both input hashes remain unchanged. Independent review also checked mixed edge pixels for green excess > 2: zero in all five composites. A website with intentionally bright-green UI would require revisiting this conservative safety check.

The existing diagonal phone is only about 135 × 241 pixels in the source. Its type cannot remain sharp at 3× inspection; the 3× files use nearest-neighbour enlargement solely to inspect edges. They are not upscaled hero assets.

### Re-run with a new capture — one command

Run from this worktree with Node 26 on PATH. Pin the **known original** source hash below; replace the capture path and its expected hash. `--crop-top 0` is correct for a new capture with no example bar. Generate at least enough capture pixels for the screen (the engine rejects upsampling).

```sh
node scripts/hero-composite.mjs \
  "$HOME/Library/CloudStorage/GoogleDrive-matasbasinskas1@gmail.com/My Drive/Personal Everything/research/2026-10-15-hero-variants/hero-v2.png" \
  /absolute/path/to/new-hero-screen.png \
  src/assets/hero/toolbelt-heating-v2.png \
  --source-sha 46da694eba0555f1e349879b2247c6226c48374d14a137b8c4f9d3bbf4468545 \
  --capture-sha EXPECTED_NEW_CAPTURE_SHA256 \
  --crop-top 0
```

For the supplied capture, use hash `83b4ba0e7f33a683ff7a6c8c727bb6e35fac996b0e8896116b0613af2810a0f7` and `--crop-top 146`. Hashes can be inspected with `shasum -a 256 /absolute/path/to/capture.png` before copying them into the command.

For A1 use Drive `originals/a1-knolling-proportions-r2.png`, source hash `ea816ae494030ab46aa2ba58dd0d4ea247bb8a9f106d048961c5ddb2d4b7e8a0`, output `src/assets/hero/a1-knolling-finished.png`. For B2 use `originals/b2-frontal-belt.png`, hash `146f7bf10598cec7518fc5be309f60e602aa27a992910f32546c505a9b366fab`, output `src/assets/hero/b2-frontal-belt-finished.png`, and add `--bottom-occlusion`.

The source photograph is never rewritten. Re-running intentionally replaces the named versioned candidate and its diagnostics; use a new output filename to keep another review version. Final demo redesign, hero selection and integration belong to the lead/Jarvis. No deployment or browser/site QA was performed in this asset-only task.

## Historical v1 provenance (current site asset)

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
