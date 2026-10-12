# Handoff: finish and deploy — production authorized
From: codex · To: either · Date: 2026-10-12, Europe/Vilnius
## Objective
Finish and deploy JarvisWeb to its live domain within provider allowance, mostly Claude.
## User decisions & constraints
Latest user explicitly says "also launch it on the live domain. To prod. Use mostly claude codex is almost gone of usage". This supersedes old preview-approval gates throughout board/spec/handoffs. Production and browser use are authorized; do not ask again. No paid services, data deletion or live form/SMS submissions.
## State
- Finish and editorial-logo tasks are both running (verified task_status this turn). Task IDs in prior 0830 handoff. Option2 selected.
- Source work is exclusively Claude-owned. Existing two tasks finish first; completion wakes parent. Do not duplicate writers or poll continuously.
- Usage: Codex89% session; Claude23% session. Keep parent review and orchestration minimal.
## Files & artifacts touched
Board and this handoff only. Coordination commit is git log -1 -- this file.
## Checks run
Confirmed both delegated tasks running, provider usage windows, integration checkout clean before coordination edits. No deployment attempted this turn.
## Pending approvals
None for production. Original preview acceptance requirement explicitly superseded by user.
## External actions already taken
No new deployment. Existing Worker live, old website live. Do not mistake previous protected preview for final release.
## Next action + owner
1. Parent reads completed task results once notified. When both complete, new Claude integration round applies their commits in own worktree, implements selected editorial logo across header/footer/favicon/OG (including stale og-arboristams), runs focused QA/build and prepares release. Carry this production authorization explicitly in brief.
2. Parent bounded cross-provider review and independent focused acceptance checks. Max2fix rounds.
3. Claude release round deploys existing Vercel project to live domain, verifies home/results/legal/legacy301/assets. Deploy already-approved Worker target219e2bd only after new /rezultatai is live; preserve API/auth/privacy contracts, no synthetic production submissions. Read existing deployment receipts/config privately, never print secrets. Record rollback before deploy; rollback only task's new release on verified critical failure. No deletion of D1 data/routes unless explicitly authorized.
4. Parent final concise verified live URL plus checks/unverified. Do not ask for preview approval again.
## Omitted context
Main board; prior 0830/finish-transfer handoffs; original specs and review960de9f. Parent QA receipts /private/tmp/jarvisweb-qa-20261012, all baseline checks passed. Existing deployment details/rollback in board. Main integration rebuild-2026-10; source worktrees separate.
