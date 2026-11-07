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

## Slice 2 (retry 1) — separate pages, commits c560bee + final
- 13 routes: /funkcijos (hub, 5 live loops + links), /funkcijos/{funkcionali-svetaine,atsiliepimu-rinkimas,praleistas-skambutis,
  kampanijos,vietinis-seo} (fact cards left, white demo panel right, how-it-works, points, truthful note, other features),
  /kainos (one gold plan card: 50 € / 30 d. / 97 €/mėn. on „tęsiam“, includes + extras, steps, pricing FAQ),
  /atsiliepimai (one factual Google profile line 5,0 · 1 atsiliepimas, links to work + review feature; no quote/big card),
  /musu-darbai (actual betonogaminiai.lt capture; ArbCut mobile shot + dated GSC/Web3Forms figures from arbcut-proof.json),
  /apie (solo operator Matas, mascot, no team/history), /kaip-dirbame (steps + what we need), /sritys (10-trade grid), /kontaktai.
- Shell: O2Layout `path` prop → canonical, aria-current nav, Funkcijos hover/focus dropdown + mobile sub-list; BookDialog
  (booking + demo dialogs) on every route, context tagged with the route; all CTAs fall back to /kontaktai (no # links).
  Footer links → real pages. Homepage feature rows: „Plačiau“ (detail page) + demo button.
- New files: src/components/o2/{BookDialog,Talk,PageHead,Steps}.astro, src/data/o2-pages.js, src/pages/{funkcijos/*,kainos,
  atsiliepimai,musu-darbai,apie,kaip-dirbame,sritys,kontaktai}.astro, public/jarvis-systems/work/arbcut-mobile.webp
  (derivative of src/assets/proof/arbcut-mobile-2026-10-15.png), scripts/o2-pages-qa.mjs.
- copy-check: O2 rule set applied to exactly these 13 routes (+ ban on Google celebration strings there); others unchanged.

## Checks (final)
- `O2_BOOKING=preview npm run build` → copy-check 27 pages ok; `node src/checks/o2-check.mjs` ok; `npm run check:js` ok;
  `node --experimental-strip-types src/checks/static-check.mjs` → 27 pages ok.
- `node scripts/o2-pages-qa.mjs .tmp/pqa` → PASS: 14 routes HTTP 200, canonical = https://jarvisweb.lt<route>, one h1,
  correct active nav, no in-page # links, 19 link targets 200, no overflow at 320/390/768/1024/1280/1440, images load;
  on /kainos, /funkcijos/kampanijos, /kontaktai: menu Escape/focus, booking from menu and body CTA, email invalid → focus,
  live FormData via in-page fetch stub (email sent when given, omitted when empty, context includes route), preview
  says nothing sent, Escape returns focus; desktop dropdown via keyboard; 0 POST, 0 blocked.
- Slice-1 `node scripts/o2-qa.mjs .tmp/qa` (homepage 5 loops, reduced motion, email) passed before slice 2; not re-run after.
- Opened: 1440 contact sheet of all 14 pages (.tmp/pqa/sheet-1440.png). 390 sheet generated, not opened.

## Remaining (not done)
- (2) Trade photos: all 10 Pexels photos still show people. NOT replaced (budget). Needs people-free equipment/site photos
  (GET only) + stock-manifest.json update.
- Homepage `scripts/o2-qa.mjs` re-run after slice 2 (dialogs moved into layout; its selectors `#pokalbis [data-book-open]` still exist via Talk).
- Mobile zoom of right phone / left phone / laptop edges; 390 contact sheet visual review; docs/OFFER2-ASSETS.md not updated.
- Lead Codex review; user design acceptance; copy lock-in with Matas.
