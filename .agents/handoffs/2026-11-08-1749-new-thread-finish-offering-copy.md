# Handoff: finish Jarvis offering and Lithuanian copy in a new thread
From: codex · To: new top-level thread / Matas · Date: 2026-11-08T17:49:59.266219+02:00

## Objective
User20: “OK now im here, lets continue in a new thread and finish this all”. Continue with Matas to finish offering and Lithuanian copy across the current Stone-matched Jarvis website, implement the agreed changes, and verify the final local preview. Do not redo the accepted visual rebuild or revert the corrected Betono source.

## User decisions & constraints
- User18: “wtf? ok mum reikes sutvarkyti offering ir tekstus”. His screenshot shows the current “Kas įeina” list (form-to-SMS, missed-call SMS, review requests, former-customer campaigns, business number/app) plus “Atskirai: nauja svetainė, vietinis SEO, reklamos biudžetas ir naujas domenas”. The correct commercial scope/pricing is NOT settled; do not treat those current words as approved terms.
- Work WITH Matas on offer/package/pricing/inclusions/exclusions and public wording. Inspect current files and prior approved decisions first, then present a concrete draft and ask only the few material business questions that remain. Do not invent prices, guarantees, integrations, results, reviews or commitments. User is here for this discussion.
- Retain Stone-derived section structure, actual animations, Jarvis identity, separate real routes, clean hardware masks. No invented sections.
- Latest not-yet-live Betono rebuild is the demo source, NOT live site/old main9a94599. Its preview header is removed in actual source, not by screenshot DOM tricks.
- Small genuine Google badge only (5.0 / 1 review); no oversized social proof claims. Existing stock/crops and real proof remain.
- No production release, outbound sends, paid services or provider/backend configuration. Finishing this thread means locally verified agreed website, not deployment. No separate threads/subagents/fan-outs beyond this explicitly requested new top-level thread unless needed and authorized.

## State
- OWN worktree: /Users/matasbasinskas/Work/Code projects/JarvisCo-worktrees/jarvis-stone-lt-review-20261107
- Branch: review/jarvis-stone-lt-20261107. Starting HEAD ed96930 (then this handoff commit). Clean before handoff.
- Main checkout /Users/matasbasinskas/Work/Code projects/JarvisCo is board/integration only. Board .agents/BOARD.md has current ownership; preserve existing dirt. Other author worktrees frozen.
- Latest media correction completed: Jarvis source a158d7d, report/handoff ed96930. Correct Betono basef589695 → actual source header removalbbc95da, final9bb6253 on own fix/jarvis-demo-banner-20261108 at ../betonogaminiai-site-worktrees/jarvis-demo-20261108.
- Existing 14 O2 routes (homepage + 13 real pages), shared layout/menu/dialog, optional booking email, 5 animated cycles, mobile/desktop masks, stock provenance. Offering/text remains the unfinished joint task.

## Files & artifacts / shortest sufficient context
1. Read this note and main .agents/BOARD.md first.
2. Read docs/jarvis-stone-source-match/USER19-BETONO-CORRECTION.md for the corrected media source/verification. Historical USER13 acceptance incorrectly called9a94599 “latest”; that source claim is superseded.
3. Inspect current src/data/o2* (offer, pricing/page copy), src/pages/index.astro and relevant O2 routes/components. Read local AGENTS.md instructions where applicable. Avoid reloading entire old thread/history unless resolving a specific decision.
4. User18 rejected-offering screenshot: /Users/matasbasinskas/.ai-powerhouse/userdata/attachments/336ecfc1-621e-4fff-84f2-6687f5646574-64a4bf75-9cf8-4592-ab68-6213b77adad8.png
5. User19 old/wrong-demo screenshot (historical, now fixed): /Users/matasbasinskas/.ai-powerhouse/userdata/attachments/336ecfc1-621e-4fff-84f2-6687f5646574-3fe8b7ae-e2a6-4083-994d-df0579182df2.png
6. Design source docs/jarvis-stone-source-match/SPEC.md only as needed. Do not restart design analysis.

## Checks already run
- O2_BOOKING=preview npm run check:27pages build/copy/JS/static PASS under Node26.7; node src/checks/o2-check.mjs PASS (media hashes tied to correct capture receipt).
- Homepage6widths,5loops/nativeplayback/repeat/offscreenpause/reducedmotion, menu/dialog focus/email/no-send PASS.8affectedroutes19links6widthsPASS;14DPR2mobileframes.0POST/missing.
- Actual Betono40generatedpages: no header, noindex, real2-step preview submission inert;390/1440 verified.
- Native T3 preview tools now work; preview_status first. Existing repo CDP QA scripts remain available. No need repeat unchanged media checks while deciding copy. After changes run focused checks, then relevant desktop/mobile visual review.

## Preview
Jarvis http://127.0.0.1:4381/ and /funkcijos/funkcionali-svetaine ; Betono http://127.0.0.1:4382/. Both HTTP200 and6Jarvismedia HTTP hashes verified at prior completion; recheck process before assuming persistent. Current native T3 tab belongs to old thread; use own new-thread tab after preview_status.

## Pending approvals / questions
No technical approval pending. Exact offering, inclusion of website/SEO, package/pricing, and final Lithuanian wording need to be resolved with Matas from current draft. Do not assume “finish all” means publish.

## External actions already taken
Only local source/build/browser and existing mainDrive project review subset.11artifact SHA readback verified in Business/JarvisWeb/branding-2026-11-07/website-rebuild-20261107/final-review-20261108/user19-betono-correction/. Cloudsync unknown. No deployment/sends/provider changes/purchase; never repeat external actions.

## Next action + owner
New-thread lead takes sole ownership of this review worktree and scoped O2 offering/copy files, updates main board with its thread ID, inspects current offering, then starts a concise decision-oriented discussion with Matas. Implement agreed text consistently across all relevant pages, verify local preview, commit and record handoff. Old thread does no further source work after launch.

## Omitted context
Prior thread336ecfc1-621e-4fff-84f2-6687f5646574; latest older handoff2026-11-08-1201-codex-user19-betono-source-corrected.md. Current reports/receipts are the source of truth; retrieve old messages only for a specific missing decision.
