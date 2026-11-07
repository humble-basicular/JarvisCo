# Handoff: Jarvis Systems Stone LT homepage rebuild — stopped before source edits
From: claude (Opus 5.5, implementation stage jarvis-stone-lt-rebuild) · To: Codex lead (thread336ecfc1) · Date: 2026-11-07 Europe/Vilnius

## Objective
Build the Stone-reference Lithuanian homepage PREVIEW for Jarvis Systems in this app-isolated worktree (primary brief: brand-kit-20261107/.agents/handoffs/2026-11-07-new-thread-stone-lt-rebuild.md).

## State
- NOT DONE. No source file changed. Stage stopped on a lead steer: soft input budget exceeded (532,757 > 500,000) during orientation reads.
- Worktree: /Users/matasbasinskas/.ai-powerhouse/worktrees/JarvisCo/t3-055c6b85, branch t3/055c6b85, base e04a251. Only this handoff is committed.
- node_modules absent here: `npm ci` needed before any build.

## Verified findings (reuse; do not re-read)
1. e04a251 has NO src/pages/svetaines.astro. Current `/` = `Layout` + `components/v4/TradeHome.astro` (src/pages/index.astro, 8 lines). Keeping the website offer reachable means moving it to /svetaines, as the old candidate did: new src/pages/svetaines.astro (same 8 lines) + one-line link edits in src/components/Header.astro (formHref default `/svetaines#forma`), src/layouts/Layout.astro (nav prefix `/svetaines`), src/pages/404.astro, src/data/content.js `nav.other` (4 hrefs), src/checks/copy-check.mjs (heading map + V4_PAGES key `svetaines/index.html`, add O2 rule set for index.html) and src/checks/static-check.mjs (WIRE route `/svetaines`). These files are OUTSIDE the board's listed scope: lead must grant or own them.
2. Old candidate offer2-stone-rebuild-20261107 (6f4412e) proven behaviour to port verbatim: src/scripts/o2.ts (menu <dialog> with focus restore, reveal with reduced-motion, mobile sticky CTA, demo form with health-gated simulator/live/unknown modes and preview-build no-post, booking form with preview no-send mode) and src/data/o2-env.js (showDrafts, bookingLive). DOM contracts: data-menu/-open/-close/-link, data-in, data-sticky, data-hero, #pokalbis, data-demo-form (data-api, data-tenant, data-build, data-messages), data-status, data-demo-result/-bubble/-sim, data-sim-badge, data-err, data-book-form (data-book-mode, data-messages), data-book-fields.
3. Old src/data/o2.js holds the verified facts block (first 5: 50 € preparation, 30 d. from verified launch, 97 €/mėn. only on explicit "tęsiam"; domain ~15 €/m. extra; business number not transferred on exit; push/Telegram alerts; 10-min reminder; one review reminder; STOP in campaigns; refund 4 rules from 3 Nov). Unresolved and never to state: SMS allowance, later setup price, setup duration, support hours. Its copy uses JarvisCo/"meistrams"/black-orange and the rejected audience framing: rename to Jarvis Systems, widen audience to businesses whose orders start with a call or written enquiry, and do not reuse either rejected hero headline.
4. Old candidate added @fontsource/poppins and lucide-static: do NOT carry Poppins; Sora must come from the v4 kit's supplied font (FONT-LICENSE.txt in kit root).
5. Stone spec tokens/section order: branding-2026-11-07/STONE-SPEC-2026-11-07.md (read; header 100 white nonsticky, hero H1 76.8/900→Sora 800, containers 1320/1140, buttons 60 px/20 px/600, mobile titles 28/26).

## Not started / remaining (all acceptance items)
- Assets: copy approved logo/favicon/mascot poses/presenter/current iPhone frame from kit v4 into public/jarvis-systems/ (not yet inventoried: read kit WEBSITE-HANDOFF.md asset paths + channel-map.json only).
- O2Layout, components/o2/**, o2.css, o2.ts, o2.js, index.astro; five perspective-mapped phone screen overlays; trade carousel with licensed/owned photos; docs/OFFER2-ASSETS.md.
- Stone archive screenshots/text.txt not opened; T3 preview not opened; no build/checks/browser QA/visual comparison run.

## External actions
None. No deploy, send, purchase or provider change.

## Next action + owner
Codex lead: decide the out-of-scope /svetaines link files (finding 1), then re-queue implementation with a larger task-sized budget (estimate: a full page plus QA is well above 500k input tokens). The next implementer starts from findings 1–5 and skips re-reading the old candidate.
