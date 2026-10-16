# Handoff: heating example site v2, direction B finished
From: claude (design sub-agent) · To: lead · Date: 2026-10-16 13:15 +03:00 (Europe/Vilnius)

## Objective
Finish direction B as the single heating template: the jarvisweb.lt demo, the hero example and the generator template for lead previews and client sites.

## User decisions & constraints (verbatim where possible)
- "Direction B is the design. Make it the single template used by /pavyzdys/sildymas, /perziura/[slug] and the client-site generator."
- "Do NOT delete files yourself … LIST them in your handoff; the lead removes them."
- Hard rules kept: PAVYZDYS banner; no invented reviews, ratings, permissions or people; noindex on the demo and previews; 5-field form with upload and callback; receipt flow; tel:/sms:; safe-area dock; no deploys or real POSTs.

## State
- Done (verified: checks below plus screenshots at 390/768/1024/1440/1920):
  - One template: `HeatingSite.astro` with `heating.css`. Direction plumbing is removed from layout, pages, load.ts and types.
  - Accent contrast is computed in `accent.ts`. The field gets white text, ink text on light accents, or a darkened field if neither passes. Accent text on paper, the on-ink accent and the main field button are separate tokens. `normalize.mjs` now accepts any #rrggbb.
  - Gallery: large tiles (`gallerySpans`), a swipe row on phones, one DI note, 768w srcsets.
  - Middle block (`parts/Details.astro`): identity "livery" panel with service names, About with counted facts (areas, brands, services), price card with the note, area chips beside hours. FAQ is on white.
  - Process band: big numerals on a subgrid.
  - Fixtures: `example-long.json` plus four placeholder photos (portrait, blurry, low quality).
- Partial: none.
- Failed / blocked: none.

## Files & artifacts touched
- Commit `4998b53` on `offer-v2-heating-v2`: src/templates/heating/** (new `accent.ts`, 4 new `*-768.webp`), src/pages/pavyzdys/*, src/pages/perziura/[slug].astro, scripts/heating-contract-test.mjs, scripts/heating-shots.mjs (`--widths`, `--first`), new scripts/heating-cdp.mjs, scripts/preview/** (normalize accent, README, example-long + photos).
- Drive `Personal Everything/research/2026-10-16-heating-site-v2/final/`: 14 PNGs + README.md.
- Local, gitignored: previews/*.json and client-sites/* generated during checks (accent fixture inputs were moved to `client-sites/accent-fixtures-*`, never deleted).

## Files for the lead to remove (unreferenced now)
- `src/templates/heating/SiteA.astro`, `src/templates/heating/site-a.css` (direction A)
- `src/templates/heating/SiteB.astro`, `src/templates/heating/site-b.css` (B's old markup/CSS, merged into HeatingSite.astro + heating.css)
- `src/pages/pavyzdys/sildymas-b.astro` (only a noindex forward to /pavyzdys/sildymas now; satisfies static-check meanwhile)
- Optional cleanup candidates: Chrome temp profiles `heating-cdp-*` / `heating-shots-*` in `$TMPDIR`; retained `client-sites/h1-symlink-*`, `client-sites/accent-fixtures-*`.

## Checks run (command → result)
- `npm run check` → build ok, copy-check 20 pages ok, js-budget ok, static-check ok.
- `node scripts/heating-contract-test.mjs` → 31/31 PASS. Includes: 4,913-colour token sweep ≥ 4.5:1; dark/light/blue fixture client sites built and every visible text and icon measured in Chrome at 390 and 1440, 0 failures and 0 overflow. A negative control (forcing white on yellow) produced 38 failures, so the audit does catch bad contrast.
- `node scripts/heating-receipt-test.mjs` → 7/7 PASS.
- `node scripts/image-size-test.mjs` → all passed.
- Generator: `npm run preview` on example.json (2 photos), example-no-photos.json and example-long.json → ok. `npm run client-site -- previews/<slug>.json --site demo-silumos --domain pavyzdys-silumos.lt --test … --retain-build` → built.
- `scripts/heating-browser-check.js` via CDP on a --test site served by preview-form-stub (port 4499, because old stubs from earlier runs hold 4433 and 4434, PIDs 78887 and 77306) → 37/37 with `Emulation.setFocusEmulationEnabled`. Without it, 36/37: "mobile dock hides while typing" fails because headless Chrome has no window focus. client.js is unchanged.
- Lighthouse 13.5.0 mobile, `--blocked-url-patterns='*/t/*'`: /pavyzdys/sildymas → perf 99, a11y 100, BP 100 (LCP 2.0 s, CLS 0); client site → 99/100/100 (LCP 2.1 s, CLS 0).
- Horizontal overflow 0 at 390/768/1024/1440/1920 (demo) and at 390/1440 for all client sites.
- `git diff --check` → clean.

## Pending approvals / questions for the user
- The heading "Šildymo / sistemos Kaune / ir Kauno rajone" sets "Šildymo" on its own first line at ≥1024 px. That is the balanced 3-line split, not an orphan. A 2-line H1 would need a smaller size or a wider column. Jarvis can judge it on the 1440 render.
- The About facts include "N paslaugos" (count only). It is accurate but low value; drop it if Jarvis finds it filler.

## External actions already taken
None. No deploys, POSTs (form traffic went only to the local stub), messages or paid APIs.

## Next action + owner
Lead: review the renders, remove the files listed above, merge `offer-v2-heating-v2`. The old stubs on 4433/4434 can be stopped if no one uses them.

## Omitted context
Design inputs: Drive `research/2026-10-15-website-design-report.md` §4/§11. WIP decision: `research/2026-10-16-heating-site-v2/directions-wip-54359e3/README.md`.
