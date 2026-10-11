# JarvisWeb proof-site autonomous run
Lead: Codex parent; 2026-10-11. User enabled AI Powerhouse autonomous delegation.
Integration branch: rebuild-2026-10 in main checkout. Baseline: fc660a724034bfcee16db0df5d2cfdd4b56eaa04. Existing user edits backed up in main Drive Business/JarvisWeb/rebuild-2026-10/backups and committed.

| Stage | Owner / model / branch | Inputs → outputs | Owned files | Acceptance/status |
|---|---|---|---|---|
| Site rebuild | Claude Opus 5.5 high / rebuild-2026-10-site | spec + original evidence → Astro pages/beacons | src/**, public/**, root package*.json, astro.config.mjs, tsconfig.json | build/copy/JS/accessibility; committed 4080e59, review active |
| Tracking | Codex GPT-6.1-Sol high / rebuild-2026-10-worker | spec §4 → D1 Worker + tests | tracking/** | redirects/auth/bots/rate limits/retention/pagination; approved/merged 4315ec5; parent 19 tests/typecheck/dry-run pass |
| Site review | Codex GPT-6.1-Sol high | site commit → review | read only + own handoff | ≤2 fix rounds; active, pinned 4080e59, owns review-site worktree + handoff |
| Worker review | Claude Sonnet 5.5 high | Worker commit → review | read only + own handoff | approved round 1, merged 4315ec5; 19 tests + independent paging fuzz |
| Integration/verification/deploy | Codex parent GPT-6.1-Sol high | approved commits → preview/live receipts | coordination/integration only | focused checks and remote checks; pending |

Interfaces: page POST /t/e JSON {code,type} (sendBeacon application/json); types view,scroll_proof,cta_sms,cta_call,pdf,arbcut. r query captures into sessionStorage then is removed from address bar. No cookies/IP/full-UA storage. GET /t/events Bearer with stable event id and UTC timestamp cursor. Worker owns API details and reports early.

Constraints: no GUI until current-task approval; no deletions until approval and backup; no paid services; no live form submits/SMS; no CRM code edits (separate run owns §4.3). Current-task Computer Use and backed-up spec-named legacy removal approved by Jarvis. Parent alone edits this board; children return receipts and commit own handoff.

## Interface review receipt
GPT-6-Luna medium reviewed early Worker contract 22cd293 against CRM work in progress: normalized event mapping supports Worker types; puller not yet implemented at review. CRM owner must validate envelope events/next_cursor/has_more, inclusive since, same-since opaque paging and stable database+event ID dedup. No CRM code changed. Contract: ../JarvisCo-worktrees/worker/tracking/README.md.

## Deployment preparation update
Remote D1 migration 0001_events.sql passed (6 commands). Production config and EVENTS_TOKEN JSON prepared privately under ~/Library/Application Support/JarvisWeb, mode0600; token never printed/committed. Worker routes not enabled yet. Parent page QA: 360px no overflow, zoom/Esc/focus return pass, empty/valid fake-fetch form pass; rebuilt original-capture PDF 3 pages rendered/read. Main frozen only while an integration reviewer is actively merging.

Site review round 1: parent freezes main during reviewer rebase/approval/merge. Source branch 4080e59 is clean; original task runtime reports waiting_for_children although its implementation handoff declares done. Review owns no source edits. Documentation refresh: Claude Sonnet 5.5 low owns README.md + own handoff in documentation worktree; no merge until parent accepts.
