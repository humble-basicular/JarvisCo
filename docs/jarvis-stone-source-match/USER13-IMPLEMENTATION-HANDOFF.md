# USER13 corrections — Claude implementation handoff (partial; 2026-11-08)

Branch `t3/51da137f`, worktree `~/.ai-powerhouse/worktrees/JarvisCo/t3-51da137f`, based on ad89da2 (ff-only, clean).
Stopped on the soft input budget (1.8M estimate exceeded). This is slice 1 of 3. No publication, no sends, no backend edits.

## Done in this commit
1. Laptop scene uses the ACTUAL captured betonogaminiai.lt (UAB „Dailius ir ko“) pixels: home → cursor clicks UŽSISAKYTI →
   real quote dialog → five fields typed by revealing captured filled pixels (white blank hides placeholder at first key) →
   submit press → same SMS phone phase. Cycle stays 13.99 s. The invented BG navy/gold demo is gone (`o2-check` guards it).
   Phones in all scenes carry the Dailius ir ko logo/name (SEO scene keeps neutral "Jūsų verslas", no ratings attributed to a real firm).
2. Device fit: `scripts/o2-device-masks.mjs` derives glass masks + quads from each original frame's own pixels
   (`public/jarvis-systems/device/*-glass.webp`, originals untouched). Screens over-cover by 3 px and are trimmed by the mask;
   the Dynamic Island is now the original pixels (copy layer removed). Zoomed render checked: corners, island and bezel clean.
3. Big Google proof section removed; "Turime įrodymų" card now links only to actual work (/rezultatai); small hero badge kept.
   Callback preview `/pavyzdys/pokalbis`: yellow preview notice and Google card removed; still noindex, no form/scripts.
4. Booking: optional `El. paštas (nebūtina)` type=email; validated if given; sent as `email` only when present
   (Worker already supports it; no backend edits). Preview mode still says nothing was sent.
5. Nav/footer "Atsiliepimai" now points to the existing reviews feature row (`#atsiliepimai-sistema`), because `#atsiliepimai` was removed.
6. QA updated to the new contract: `src/checks/o2-check.mjs`, `scripts/o2-qa.mjs` (email invalid/valid/omitted via
   fetch intercepted inside the page; callback no notice/no Google; new web scene frame times).

## Checks run (this commit)
- `O2_BOOKING=preview npm run build` → copy-check 14 pages ok; `node src/checks/o2-check.mjs` ok; `npm run check:js` ok.
- `node --experimental-strip-types src/checks/static-check.mjs` ok. Plain `npm run check:static` fails on Node 22.14 importing
  `src/templates/heating/content.ts` (pre-existing, not touched).
- `node scripts/o2-qa.mjs .tmp/qa` → PASS: 6 widths no overflow, 0 POST, 0 blocked, assets loaded, 5 loops advance/loop/pause offscreen,
  reduced motion 5:0, menu/dialog Escape+focus, emailInvalid, emailLive {withEmail: jonas@example.com, omitted → no key}.
- QA note: QA must run on an `O2_BOOKING=preview` build; on a default build the form is live and posts to the local server (405).
- Opened: scene-web 1.5/4.6/10 s, missed 7 s, zoomed web 4.6 / phone corner / reviews bottom edge.

## Remaining (not done)
- (2) Trade photos: all 10 current Pexels photos show people; the brief prefers people-free equipment/site photos instead of guessing ethnicity.
  Needs a new Pexels selection (GET only) + `stock-manifest.json` update. Not started.
- (6) Separate O2 pages: /funkcijos (+5 details), /kainos, /atsiliepimai, /musu-darbai, /apie, /kaip-dirbame, /sritys, /kontaktai,
  shared shell (booking + demo dialogs moved into O2Layout, per-page canonical, active nav), header/footer links switched. Not started.
- Right-phone directional zoom at mobile widths and laptop edge zoom only checked at 1440 desktop render.
- Lead Codex review; user design acceptance.
