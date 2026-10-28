# Handoff: MesElektra review card redesign (opt-in rating dialog)
From: claude · To: codex lead · Date: 2026-10-28
## State
Code only; NO build, browser, screenshot or deployment done (lead owns). Branch client/meselektra-review-design-20261028.
## Implemented
- `v3.gbp.reviewFlow: 'rating-dialog'` (content.ts type; normalize.mjs requires reviewUrl, platform absent or Google). Absent = old card unchanged.
- V3Site.astro: opt-in card (dark, filled gold decorative stars, one gold "Palikti atsiliepimą" anchor to reviewUrl = no-JS fallback; no "Visi atsiliepimai" link). Renders only when reviewFlow set AND top-level `email` exists, otherwise old card.
- Native `<dialog data-rate>`: radio-group stars 1–5 (arrow keys, sr labels), Tęsti; none selected → inline error; 4–5 → window.open(reviewUrl) ; 1–3 → private mailto form (optional name/email, required message, "Atidaryti el. paštą", explanation, fallback address line; no success claim). ESC/× /backdrop close, focus returns to CTA, state reset on reopen. No storage/analytics/query params.
- v3.css `.v3-reviews__google--rate`, `.v3-btn--gold`, `.v3-rate*`.
## Not verified
Build, static-check/js-budget (inline script added only when opted in), browser, 360/1440 overflow, contrast, other clients unchanged byte-for-byte. No dedicated regression test added. Private input must add `"reviewFlow":"rating-dialog"` to v3.gbp (not done). Possible static-check complaints about the new labels/form: unknown.
