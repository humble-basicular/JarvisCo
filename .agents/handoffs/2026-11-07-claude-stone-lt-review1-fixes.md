# Handoff: Jarvis Systems Stone LT homepage — review1 fixes (implementation retry 2)
From: claude (Opus 5.5, stage jarvis-stone-lt-rebuild) · To: Codex lead (root review2) · Date: 2026-11-07 Europe/Vilnius

## Objective
Apply Codex review1 (`docs/jarvis-stone-lt-review/review1.md`, Verdict: changes requested) plus Matas's opposite-side phone request; stop source edits for root review2.

## State
- Worktree `/Users/matasbasinskas/.ai-powerhouse/worktrees/JarvisCo/t3-055c6b85`, branch `t3/055c6b85`. Lead commit e639173 cherry-picked as deebcc9; fixes in the commit adding this file.
- Local preview `http://127.0.0.1:4377/` (`npx astro preview`, dist built with `O2_DRAFTS=1 O2_BOOKING=preview`), T3 tab `tab_18_b2b7da01-aed9-4db4-8f27-cafeabbfa56e`.

## Fixes (review item → change)
1. Opposite phone: rows 2/4 use `phone-right-mascot.webp`, rows 1/3/5 `phone.webp`; each frame has its own glass quad + island measured by line-fitting the inner bezel of its pixels (`src/data/o2-device.js` FRAMES). Not mirrored.
2. Tablet nav: burger shows whenever nav hides (≤1240); header CTA kept 768–1240, hidden ≤767.
3. Hero/feature inner padding 16 px (H1 x=74 at 1440 vs Stone 76). Mascot derivatives trimmed of transparent margins (sharp trim on the presentation WebP; kit files untouched); hero figure renders 274×748 at ≥1240, 220×600 at 1024, hidden ≤900.
4. Talk card short: title, text, one CTA (`<a href=tel data-book-open>` → opens booking `<dialog>`; no-JS falls back to a phone call), presenter mascot right. Booking form unchanged inside the dialog; close button, Escape, backdrop click, focus to first field and back to opener.
5. Preview demo: no health GET, no enquiry POST; local simulation with "niekas neišsiųsta ir neišsaugota" + simulation label and a preview badge. Live path (health→enquiry) kept for production builds only. Both form submits ship `disabled` and are enabled by o2.ts; `<noscript>` call fallback in the demo.
6. OG: `/jarvis-systems/og-1200x630.jpg` (kit website/og) with width/height meta; other pages keep og-v4.
- Polish: two-row trades carousel (5 own illustrations interleaved with text-only niche cards, ≤600 one row); wavy dotted SVG connector on desktop, vertical dotted line ≤900.
- New focused check `npm run check:o2` (src/checks/o2-check.mjs): og card, frame alternation, disabled submits, booking dialog/no inline talk form, preview no-remote ordering, burger breakpoint, hero height, two-row carousel + wave.

## Checks run
- Production `npm run build` → copy-check 13 ok; `check:o2` ok (production); static-check ok; check:js 13 pages within budget.
- Preview build (`O2_DRAFTS=1 O2_BOOKING=preview`) → copy ok, `check:o2` ok (preview), static ok; `git diff --check` ok; og + right frame 200.
- T3 iframes at 320/390/768/1024/1280/1440: no horizontal overflow; burger visible exactly where nav hidden; Resource Timing shows 0 requests to workers.dev or /t/form after load AND after demo + booking submits (768, 1440); demo shows preview simulation + label; booking dialog opens, focus on name, previewOk, closes with focus back on opener. Menu opens at 768.
- Visual: 1440 row 2 (right frame) — glass fit, island above overlay, mascot right with elbow contact, text unmirrored.

## Not verified / remaining
- Talk section re-measured after commit: 480 px section / 400 px card at 1440 (Stone ~450); 666 px at 390 (stacked mascot).
- Full-scroll side-by-side Stone comparison still not done section-by-section; steps wave, trades two rows, FAQ, talk card, footer not visually inspected after changes.
- Reduced motion only by CSS rule; no pre-load CDP network barrier run (preview path makes no remote calls by construction and Resource Timing confirmed 0).
- Menu focus-return in the 768 test failed only because the test clicked without focusing first (390 test with focus passed earlier); not re-tested by keyboard.
- Glass quads are line-fit; rounded corner radius eyeballed.

## External actions
None (no deploy, sends, purchases, backend/app edits).

## Next action + owner
Codex lead: review2 of `git diff e04a251...t3/055c6b85`, full-scroll visual acceptance. Then Matas reviews wording on the preview.
