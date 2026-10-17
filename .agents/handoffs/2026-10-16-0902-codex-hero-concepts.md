# Handoff: hero composite v2 and five new concepts
From: codex · To: either · Date: 2026-10-16T09:02:00+03:00 (Europe/Vilnius)

## Objective
Improve the diagonal hero-v2 phone replacement; generate two knolling, two frontal-belt and one incoming-call concept for Jarvis to choose. Prepare review assets only.

## User decisions & constraints (verbatim where possible)
- "the site keeps its current hero until Jarvis picks"; no pages/components or other worktrees/boards edited.
- Built-in subscription imagegen only; no paid APIs, deploys, real POSTs/messages or deletions.
- Own `scripts/showcase-assets.mjs`, a called `scripts/hero-composite.mjs`, `src/assets/hero/**`, plus this requested handoff. Never stage the existing `node_modules` symlink.

## State
- Done (verified how): implementation commit **7747b4fa52af8d761d329dd262eee7ea9a26dbff** on `offer-v2-hero-concepts`, base `347684a`. Soft key/despill, robust subpixel line fits, original bezel/pocket over content, source luminance map, mild glass/photographic matching and antialiased website resampling. Standalone CLI and one-command new-capture instructions in `src/assets/hero/PROVENANCE.md`.
- Done: five concepts, six imagegen calls (A1 extra proportion edit). All native 1536×1024, no source/hero upscaling. Exact prompts, attempts, actual sizes, hashes and green statistics in Drive PROMPTS.md + manifests. Model identifier/absolute tool maximum are not exposed.
- Done: all four green-screen concepts composited with the supplied current capture, plus the original diagonal hero-v2. A1 (attempt 2) and B2 selected within their families; C1 needs no composite. All five finished concepts appear on the side-by-side contact sheet.
- Capture treatment: top **146 image px / 73 CSS px** cropped from 780×1444 to remove the dark example bar. Website proportions retained with contain fitting/paper padding. B1/B2 lower glass corners are hidden by leather: receipts explicitly record visible-pocket boundary fitting, not recovered hidden corners.
- Existing site hero remains SHA-256 `c2cd328e832dc840f7611d4aad66f0977df62787e5c5a204c05be8f8dbef547a`; no candidate wired into the site. `git status` after implementation commit: only the pre-existing untracked `node_modules` symlink.
- Partial: final redesigned demo capture, Jarvis selection and integration belong to lead/Jarvis.
- Failed / blocked: none. Early JS syntax error and aliasing during development were corrected before the recorded verification.

## Files & artifacts touched (path + what changed; versions/commits)
- `scripts/hero-composite.mjs`; `scripts/showcase-assets.mjs` calls it and writes a versioned v2 candidate/receipt. The showcase wrapper still refreshes showcase screenshots; it was syntax-checked but not run end-to-end in this task to avoid touching unowned showcase assets.
- `src/assets/hero/{toolbelt-heating-v2,a1-knolling-finished,b2-frontal-belt-finished}.png`, alpha/light maps and individual receipts; PROVENANCE.md and generation-prompts.json. Original hero/RECEIPT.json unchanged.
- Main Drive `/Users/matasbasinskas/Library/CloudStorage/GoogleDrive-matasbasinskas1@gmail.com/My Drive/Personal Everything/research/2026-10-16-hero-concepts/`: `originals/`, `finished/`, `contact-sheet.png`, `PROMPTS.md`, generation/verification manifests, PROVENANCE.md.
- Drive `composite-v2/`: `before.png`, `after.png`, `before-after-full.png`, individual and paired `*-phone-3x.png`, cropped current capture and diagnostic alpha/light/receipt files.

## Checks run (command → result)
- `export PATH=/opt/homebrew/bin:$PATH; npm run check` → exit 0: Astro build, copy-check 9 pages, JS budgets, static links/assets/evidence/forms/tracking/redirect checks.
- `node --check scripts/hero-composite.mjs`; `node --check scripts/showcase-assets.mjs`; `git diff --check`; `git diff --cached --check` → exit 0.
- Independent `node --input-type=module` pixel verification on five composites → 0 changed pixels outside exported alpha; 0 bright-green pixels (G>140,R/B<64); 0 green-fringe pixels (G>max(R,B)+2) among mixed alpha pixels. Source/output hashes match receipts. Partial edge counts: diagonal 2825, A1 4978, B2 2556, A2 4126, B1 4442.
- Source-hash mismatch, capture-hash mismatch, invalid crop → rejected before output; identical rerun → byte-identical PNG; current hero hash unchanged.
- `sips -g pixelWidth -g pixelHeight <originals/*.png>` → six native 1536×1024 files. SHA checks confirm copies match tool originals. Full images/contact sheet and 3× before/after visually inspected. T3 HTML gallery preview: 728px, 627px content height, no console errors.
- Not verified: new demo capture; site browser/layout/Lighthouse/live behavior; wrapper end-to-end; Drive server-side sync; exact imagegen backend/absolute maximum. Local Drive files and hashes verified.

## Pending approvals / questions for the user
Jarvis picks direction. Design judgment: C1 expresses the phone-ringing outcome most directly; A1 demonstrates the website most clearly; B2 is the best continuation of the belt. No deployment approval requested in this asset task.

## External actions already taken (sent, uploaded, published — never repeat)
Six built-in subscription imagegen calls. Files copied/written to the locally mounted main Drive (cloud sync unverified). No deploys, POSTs, messages, deletions or other agent launches.

## Next action + owner
Jarvis: choose concept. Lead: review/cherry-pick implementation commit, rerun CLI with the redesigned bar-free capture using `--crop-top 0`, then integrate chosen asset in the separate UI task. This handoff is committed separately after the implementation commit.

## Omitted context (where to find it)
Drive PROMPTS.md/PROVENANCE.md/manifests, per-image receipts, source generation notes in `research/2026-10-15-hero-variants/PROMPTS.md`. Cleanup candidates retained: A1 attempt 1, superseded root `composite-v2-phone-inspection.png`, tool-managed generated-image copies. Delete nothing without the applicable approval/backup.
