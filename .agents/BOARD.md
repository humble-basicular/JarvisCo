# JarvisWeb proof-site autonomous run
Lead: Codex parent; 2026-10-11. User enabled AI Powerhouse autonomous delegation.
Integration branch: rebuild-2026-10 in main checkout. Baseline: fc660a724034bfcee16db0df5d2cfdd4b56eaa04. Existing user edits backed up in main Drive Business/JarvisWeb/rebuild-2026-10/backups and committed.

| Stage | Owner / model / branch | Inputs → outputs | Owned files | Acceptance/status |
|---|---|---|---|---|
| Site rebuild | Claude Opus 5.5 high / rebuild-2026-10-site | spec + original evidence → Astro pages/beacons | src/**, public/**, root package*.json, astro.config.mjs, tsconfig.json | build/copy/JS/accessibility; active |
| Tracking | Codex GPT-6.1-Sol high / rebuild-2026-10-worker | spec §4 → D1 Worker + tests | tracking/** | redirects/auth/bots/rate limits/retention/pagination; active |
| Site review | Codex GPT-6.1-Sol high | site commit → review | read only + own handoff | ≤2 fix rounds; pending |
| Worker review | Claude Sonnet 5.5 high | Worker commit → review | read only + own handoff | ≤2 fix rounds; pending |
| Integration/verification/deploy | Codex parent GPT-6.1-Sol high | approved commits → preview/live receipts | coordination/integration only | focused checks and remote checks; pending |

Interfaces: page POST /t/e JSON {code,type} (sendBeacon application/json); types view,scroll_proof,cta_sms,cta_call,pdf,arbcut. r query captures into sessionStorage then is removed from address bar. No cookies/IP/full-UA storage. GET /t/events Bearer with stable event id and UTC timestamp cursor. Worker owns API details and reports early.

Constraints: no GUI until current-task approval; no deletions until approval and backup; no paid services; no live form submits/SMS; no CRM code edits (separate run owns §4.3). Parent alone edits this board; children return receipts and commit own handoff.
