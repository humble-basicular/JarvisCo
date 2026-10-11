# Handoff: README docs stage — jarvisweb.lt proof site
From: claude (Haiku 5.5) · To: codex parent (integration/review) · Date: 2026-10-11T17:02+03:00 (Europe/Vilnius, EEST, from `date`)

## Objective
Bring `README.md` in branch `rebuild-2026-10-docs` in line with the current site and the autonomous-run rules. Own only `README.md` and this note.

## User decisions & constraints (verbatim where possible)
- "Own ONLY README.md + dated own handoff." Do not merge, touch main, edit source, or deploy.
- Replace the "production only after preview URL approval" line with review and a verified preview before deploy. Computer Use and deletion are pre-approved for the current task.
- Parent verified that local preview works even when beacons fail. Document that the static preview has no beacon endpoint. Remove the unexplained "not tested whether the page tolerates that" sentence.
- Local Worker instructions were wrong: the Worker handles only the API and does not serve the static landing. Test the full flow on the deployed proxied site, or with an explicit dev reverse proxy. Do not create one.
- A new niche needs a matching Worker prefix and D1 schema changes. A `content.js` entry alone is not enough.

## State
- Done (verified how): `README.md` updated in this branch (see Files). Paths in README checked with `test -e` against this worktree; all present except `tracking/README.md` and `tracking/wrangler.toml`, which live on the integration branch `rebuild-2026-10` and are not in this worktree. README links to them as before.
- Partial: none.
- Failed / blocked: none.
- Correction to earlier claim: handoff `2026-10-11-1800-claude-readme-docs.md` did not exist on disk or in git. The `.agents/handoffs/` directory held only `2026-10-11-1650-site-rebuild.md`. This note replaces that false claim. Its timestamp is the verified clock time from `date`.
- The statement "full tracked flow tested on production" is the parent's report, copied into the README. I did not re-run it.

## Files & artifacts touched
- `README.md`: local preview section rewritten (static preview works, beacons fail with no `/t/e`; full flow via deployed site or dev proxy; no proxy created). Deployment line changed from "after Jarvis approves a preview URL" to "after code review and a verified preview; Computer Use and deletion pre-approved for the current autonomous task; spending needs a user decision". New-niche paragraph expanded: `niches` entry, Worker `prefixes` plus `TRACKING_PREFIXES`, D1 schema changes.
- `.agents/handoffs/2026-10-11-1702-claude-readme-docs.md`: this note.
- Commit: see the hash in the reply to the parent (written after commit).

## Checks run
- `git diff --check` → clean.
- Path check of every README path in this worktree (`test -e`) → all present except the two `tracking/` files noted above.
- `grep "not tested whether"` in README → 0 matches.

## Pending approvals / questions for the user
- None for this stage. Spec D1 (post-handover changes) is still open per the spec; the README does not state it.

## External actions already taken (sent, uploaded, published — never repeat)
- None. No SMS, no form submission, no deploy, no Drive upload.

## Next action + owner
- Parent (Codex): review the README diff `git diff <integration>...rebuild-2026-10-docs`, then merge into the integration branch if it passes. Parent owns the board and deployment.

## Omitted context (where to find it)
- Spec: `docs/SPEC-2026-10-proof-site.md` §4 (tracking), §6 (privacy), §8 (decisions).
- Worker and D1 details: `tracking/README.md` on branch `rebuild-2026-10`.
- Site rebuild state: `.agents/handoffs/2026-10-11-1650-site-rebuild.md`.
