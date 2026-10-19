# Handoff: lead preview with logo + town pages (CRM lead 01M55WR8…)
From: claude · To: either · Date: 2026-10-19T18:30+03:00 (Europe/Vilnius)

## Objective
Free preview site for a real plumbing/heating lead at /perziura/<slug>, plus generator support for `logo`, `towns`, `lead`. Stop before publish/send; deploy only after Jarvis writes "deploy".

## User decisions & constraints
- No SMS/messages, real form submits, purchases (domains included) or production deploy until "deploy". Ask before deleting.
- No invented claims; real lead data never committed (public repo).

## State
- Done (verified): grabber `scripts/grab-paslaugos-profile.mjs`; optional `logo`/`towns`/`lead` in `scripts/preview/*`, `scripts/client-site.mjs`, `src/templates/heating/**`, `src/pages/perziura/[slug]/[vietove].astro`, `src/templates/heating/site/pages/[vietove].astro`; contract test extended. Merged to rebuild-2026-10 at 0e2be4a (branch preview-nerijus, dbf799b).
- Partial: Codex round-2 review verdict not obtained (delegate_task: parent_not_active). Codex round 1 = changes requested, fixed by Codex in dbf799b; Claude verified the fixes.
- Private details (slug, photo picks, brand/domain options, drafts, call checklist, exact deploy plan): Drive `Business/JarvisWeb/previews/<lead>/HANDOFF-2026-10-19.md`. Real preview files live only in the preview-nerijus worktree (git-ignored).

## Checks run
npm run check (worktree 19 pages ok; main 12 pages ok) · heating-contract-test 51/51 · image-size pass · git diff --check clean · demo HTML parity (CSS only; town pages one whitespace) · 9 adversarial logo inputs refused.

## External actions already taken
None (no deploy, send, submit or purchase).

## Next action + owner
Jarvis: review and write "deploy" → agent follows the private deploy plan (git archive + only this preview's files, prebuilt deploy, live checks, rollback id recorded).
