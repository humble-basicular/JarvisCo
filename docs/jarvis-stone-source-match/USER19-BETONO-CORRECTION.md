# USER19 — correct newest Betono source

User correction: use the newest **not-yet-live website we built**, and remove the preview header in that website source. The USER13 acceptance statement that main `9a94599` was the latest version was wrong; this report supersedes that source claim.

## Implemented

- Latest local Betono implementation found on `feat/brain-rebuild-20261106` at `f589695`, including the Nov7 audit. Own checkout `../betonogaminiai-site-worktrees/jarvis-demo-20261108`, branch `fix/jarvis-demo-banner-20261108`.
- Source commit **bbc95da5e09b8142477b00268a3faeca5a029bdf** removes the preview header markup from `src/layouts/Base.astro`, its unused CSS, and updates the preview-mode comment. `PREVIEW` remains true: noindex and inert forms remain enabled. No header removal in capture DOM.
- Jarvis source commit **a158d7d21928f72e9c9ab0f494856d1b1f198ff3** replaces home/form/logo media, adds real delivery-step captures, updates field/cursor positions and timing, and uses the delivery image in the work page. All existing Betono phone backgrounds share the replaced home asset. Device frames and glass masks unchanged.
- Actual latest hero has the factory background, product-first headline and five-field form at right, including email. Animation follows that form → real Toliau → quantity/address/delivery → SMS illustration. No old centered modal or old hero remains in the active demo assets.
- Added capture SHA256/provenance checks to the existing O2 regression script.

## Verified

- Betono `npm run build`: 40 generated pages. All40 have no preview banner and retain `noindex, nofollow`. The separate static Google verification HTML file is unchanged (initial count assertion included it, then was corrected).
- Actual browser capture1440×783: correct hero/inline form, five values including email copied to the real delivery dialog, required address valid, final preview-only submission displays UNSENT and produces **0POST**. Actual390px page has no header and no horizontal overflow. Two automatic Google map GETs blocked in this isolated capture. Cookie notice dismissed only for media; the preview header was removed in source.
- Jarvis `O2_BOOKING=preview npm run check`: build/copy/JS budget/static PASS (27pages); `node src/checks/o2-check.mjs` PASS, including hashes of all6 actual Betono images.
- `node scripts/o2-qa.mjs /tmp/jarvis-user19-home`: PASS. Six widths320/390/768/1024/1280/1440, five loops, real playback/repeat/offscreen pause, reduced motion, menu/dialog focus, optional email, all assets; **0POST/blocked/missing**.
- Focused existing pages workflow (ROUTES restricted to8 affected routes in `/tmp/jarvis-user19-pages-qa.mjs`): PASS; 19linktargets, six widths, no overflow, subpage interactions; **0POST/blocked/missing**. No full re-audit of unrelated pages claimed.
- 14DPR2 mobile frames320/390 via `/tmp/jarvis-user19-edge-qa.mjs`; noPOST/blocked. Visually opened new inline typing, delivery transition/final details, desktop and mobile feature page, actual source hero, and native T3 preview. Boundaries remain inside the existing device masks.
- Native T3 navigation/snapshots now work. Jarvis feature page visibly displays the correct new source; no fallback failure this run. Screenshots retained with the review artifacts.

## Preview and evidence

- Jarvis: http://127.0.0.1:4381/funkcijos/funkcionali-svetaine
- Actual newest Betono source without preview header: http://127.0.0.1:4382/
- Repo receipts: `qa/betono-actual-capture-user19.json`, `qa/user19-{home,pages,edges}.json`.
- Review subset copied into existing main Drive project `Business/JarvisWeb/branding-2026-11-07/website-rebuild-20261107/final-review-20261108/user19-betono-correction/`; local SHA readback checked separately. Cloud sync not verified.

## Limits / next

No production release, customer sends, backend/provider configuration or purchases. Original Betono author worktrees and main source unchanged; the corrected latest source is on the named own branch. Existing offering/copy unchanged; Matas and agent still need to settle those together. Actual SMS/CRM delivery, physical devices and Safari not verified. Lead reviewed this bounded correction directly; no new delegated review claimed.
