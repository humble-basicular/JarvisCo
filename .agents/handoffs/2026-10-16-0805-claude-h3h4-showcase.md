# Handoff: hero plan H3/H4 — tool-belt hero, one heating showcase, before/after
From: claude · To: either · Date: 2026-10-16T08:05+03:00 (Europe/Vilnius)

## Objective
Hero plan (main Drive `Personal Everything/research/2026-10-15-hero-and-examples-plan.md`) §4–§6: Fervor-style hero with the AI tool belt + a real demo screenshot on the phone; one heating example (phone + desktop, live link, slow scroll); generic before/after strip.

## User decisions & constraints (verbatim where possible)
- Plan §0 D1–D5, D7. Hero variant hero-v2 is a provisional pick; Jarvis still chooses (plan §10.2).
- No production or preview deploy in this stage, no real Worker POSTs, no deletions, no AI people, no fake client evidence.

## State
- Done (verified how): implementation committed `0190511` on `offer-v2-claude-showcase` (base `2991682`, H1 + receipt fix). `npm run check` exit 0 and `git diff --check` clean at `0190511`.
- The original Claude stage (thread `hero-examples-H3H4-claude-retry-1`) did the work and QA, then sat 5.5 h on a false-positive "Delete" approval for a read-only `grep rmSync`. The new lead (thread 3e61cbcb) interrupted it, then finished: repo-relative paths in `RECEIPT.json` (repo is public), new `src/assets/hero/PROVENANCE.md`, COPY-DRAFT update, and a tracked arbcut.lt link in the results caption (`Proof.astro`) because the static check requires a `data-track="arbcut"` link and the old example card held the only one.
- Partial: cross-provider review (Codex) pending.

## Files & artifacts touched
- `src/components/v4/Hero.astro` (belt picture, AVIF q50 / WebP q72 srcset 640–1536, eager + fetchpriority high, 1536×1024 attrs, caption), `Examples.astro` (now Showcase + BeforeAfter), new `Showcase.astro`, `BeforeAfter.astro`, `Proof.astro` (tracked arbcut.lt link), `src/data/v4.js` (hero alt/caption, examples, proof.site), `docs/COPY-DRAFT-V4.md`.
- Assets: `src/assets/hero/{toolbelt-heating.png,RECEIPT.json,PROVENANCE.md}`, `src/assets/showcase/heating-{mobile,desktop,mobile-tall}.png`.
- Scripts: `scripts/showcase-capture.mjs`, `scripts/showcase-assets.mjs`, `scripts/showcase-qa.mjs`.
- QA (gitignored): `client-sites/showcase-qa-r7/qa.json` + screenshots; capture work `client-sites/showcase-capture-r2/`.
- Drive `research/2026-10-15-v4-r3-screens/`: `lighthouse/lh-{home,sildymui,pavyzdys-sildymas}.report.{html,json}`, `form-receipt.json`.

## Checks run (command → result)
- `npm run check` at `0190511` → exit 0 (static check ok, JS budgets ok).
- `git diff --check` → clean.
- By the original stage on the same code minus the Proof caption/receipt-path edits: `scripts/showcase-qa.mjs` r7 → 390/1440 on `/`, `/sildymui`, `/pavyzdys/sildymas`: overflowX 0, broken images 0, CLS 0, console errors 0; hero widths 768/1024/1280/1920 inspected; reduced-motion captures. Lighthouse 13.5.0 mobile: `/` 98/100/100/100 (LCP 2.3 s), `/sildymui` 98/100/100/100 (LCP 2.4 s, 682 KiB), `/pavyzdys/sildymas` 100/100/100/66 (SEO 66 = intended noindex). `npm run check:browser` mocked form: 14 cases PASS, no real requests.

## Pending approvals / questions for the user
- Pick the hero variant (hero-v2 is provisional). OK the demo name „Šilumos ratas“.
- Cleanup candidates (not deleted): now-unreferenced `src/assets/arbcut/mantas-lajoje.jpg`, `src/assets/proof/sildymas-mobile-2026-10-15.png`, `src/assets/proof/arbcut-mobile-2026-10-15.png`; QA dirs `client-sites/showcase-qa-r1..r6`, `showcase-capture-r1`; `/tmp/h34-claude/`.

## External actions already taken
None (no deploys, POSTs, messages).

## Next action + owner
Codex review of `2991682...0190511` → lead integrates H1 (`95328ef`) + H3/H4 into `offer-v2`, reruns plan §8 checks, then Vercel preview (never `--prod`).

## Omitted context
CRM board `~/MultiPurpose CRM/.agents/BOARD.md` last sections; H1 handoffs in `../offer-v2-codex-heating/.agents/handoffs/`.
