# Handoff: Jarvis Systems Stone LT homepage — preview built (implementation retry 1)
From: claude (Opus 5.5, stage jarvis-stone-lt-rebuild) · To: Codex lead (thread336ecfc1) · Date: 2026-11-07 Europe/Vilnius

## Objective
Full Lithuanian Jarvis Systems homepage on the Stone composition, local preview only, then Matas reviews wording.

## State
- Worktree `/Users/matasbasinskas/.ai-powerhouse/worktrees/JarvisCo/t3-055c6b85`, branch `t3/055c6b85`, base e04a251. Commit = the one adding this file (see `git log -1`).
- Local preview: `npx astro preview --host 127.0.0.1 --port 4377` serving a dist built with `O2_DRAFTS=1 O2_BOOKING=preview` (demo data-build=preview, booking data-book-mode=preview). T3 preview tab `tab_18_b2b7da01-aed9-4db4-8f27-cafeabbfa56e`.
- Section order: white 100 px non-sticky header → navy hero (H1 76.8/800/1.2, left rule, arms-crossed mascot right, hidden ≤900) → grey proof slot = demo with honest simulator states, chevron → five alternating feature rows (enquiry→SMS+alert, reviews+reminder, missed call, past customers, app) with perspective-mapped animated screens → navy slanted trades carousel (own illustrations) + more-niche chips → grey 3 steps with dotted connector, chevron → 6 navy cards → grey FAQ (pricing/refund/exclusions/simulator honesty) → navy talk card with booking form + presenting mascot right → navy footer. Press/partners/2nd proof omitted.
- Website offer moved to `/svetaines` (same TradeHome); nav/404/Header/Layout links and copy/static check route keys moved with it (old-candidate hunks, verbatim). copy-check applies O2 rules to `index.html`.
- Hero headline "Kad nė viena užklausa nedingtų tyliai" is a DRAFT for wording review (not one of the two rejected lines).

## Checks run (results)
- `npm run build` (production env) → 12 pages, copy-check 13 pages ok; `check:js` ok (all under 15360 B gzip); `static-check` ok; `git diff --check` ok. Re-run on final preview build: copy/static ok.
- T3 browser at 320/390/768/1024/1280/1440: no horizontal overflow after fix (320 button wrap); header 100 px; H1 28 px ≤767, 60 px at 1024, 76.8 px ≥1240; feature title 26/40; buttons 60 px; Sora 800; mascot hidden ≤900; favicon link resolves; asset URLs 200.
- Visual: 1440 hero + feature row 1, 390 feature row 3 inspected: glass mapping fits the bezel, Dynamic Island above the screen, messages animate, elbow contact unchanged (part of approved image), phone above text on mobile.
- Mocked fetch (no network POST): empty submit → phone+consent errors, focus on phone; simulator → "neišsiųsta" status + simulation label + bubble; live health on preview build → refuses, 0 POST; health failure → refuses, 0 POST; 429 → limit text; 500 → call fallback; booking bad phone → error; booking valid in preview mode → previewOk, 0 fetches. Menu dialog opens, closes, focus returns. reduced-motion CSS present.

## Not verified / remaining
- Full-scroll side-by-side Stone vs Jarvis comparison was NOT done section by section; only hero (desktop-00) and a feature row (desktop-03) were compared. Steps/why/FAQ/talk/footer not visually inspected at any width.
- Each QA iframe load made one real read-only `GET /api/health` to the demo Worker before the stub was installed. No POST reached it.
- Reduced motion not emulated (rule exists only). Keyboard tab order beyond menu not walked. 24 console entries in the tab not read.
- Trades photos are heating-only illustrations; other niches are text chips. Glass corners are pixel-measured but rounded-corner radius is eyeballed.
- Wording is a source-led draft: Matas reviews on the page.

## External actions
None. No deploy, no sends, no purchases, no backend/app changes.

## Next action + owner
Codex lead: independent review of `git diff e04a251...t3/055c6b85` and full-scroll visual comparison; then Matas reviews wording on the preview.
