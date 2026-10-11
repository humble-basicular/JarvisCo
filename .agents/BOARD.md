# JarvisWeb proof-site autonomous run
Lead: Codex parent; 2026-10-11. User enabled AI Powerhouse autonomous delegation.
Integration branch: rebuild-2026-10 in main checkout. Baseline: fc660a724034bfcee16db0df5d2cfdd4b56eaa04. Existing user edits backed up in main Drive Business/JarvisWeb/rebuild-2026-10/backups and committed.

| Stage | Owner / model / branch | Inputs → outputs | Owned files | Acceptance/status |
|---|---|---|---|---|
| Site rebuild | Claude Opus 5.5 high / rebuild-2026-10-site | spec + original evidence → Astro pages/beacons | src/**, public/**, root package*.json, astro.config.mjs, tsconfig.json | build/copy/JS/accessibility; approved/merged b273bec; footer48px fix active |
| Tracking | Codex GPT-6.1-Sol high / rebuild-2026-10-worker | spec §4 → D1 Worker + tests | tracking/** | redirects/auth/bots/rate limits/retention/pagination; approved/merged 4315ec5; parent 19 tests/typecheck/dry-run pass |
| Site review | Codex GPT-6.1-Sol high | site commit → review | read only + own handoff | round1 approved/merged b273bec; round2 only footer fix |
| Worker review | Claude Sonnet 5.5 high | Worker commit → review | read only + own handoff | approved round 1, merged 4315ec5; 19 tests + independent paging fuzz |
| Integration/verification/deploy | Codex parent GPT-6.1-Sol high | approved commits → preview/live receipts | coordination/integration only | focused checks and remote checks; pending |

Interfaces: page POST /t/e JSON {code,type} (sendBeacon application/json); types view,scroll_proof,cta_sms,cta_call,pdf,arbcut. r query captures into sessionStorage then is removed from address bar. No cookies/IP/full-UA storage. GET /t/events Bearer with stable event id and UTC timestamp cursor. Worker owns API details and reports early.

Constraints: no GUI until current-task approval; no deletions until approval and backup; no paid services; no live form submits/SMS; no CRM code edits (separate run owns §4.3). Current-task Computer Use and backed-up spec-named legacy removal approved by Jarvis. Parent alone edits this board; children return receipts and commit own handoff.

## Interface review receipt
GPT-6-Luna medium reviewed early Worker contract 22cd293 against CRM work in progress: normalized event mapping supports Worker types; puller not yet implemented at review. CRM owner must validate envelope events/next_cursor/has_more, inclusive since, same-since opaque paging and stable database+event ID dedup. No CRM code changed. Contract: ../JarvisCo-worktrees/worker/tracking/README.md.

## Deployment preparation update
Remote D1 migration 0001_events.sql passed (6 commands). Production config and EVENTS_TOKEN JSON prepared privately under ~/Library/Application Support/JarvisWeb, mode0600; token never printed/committed. Worker routes not enabled yet. Parent page QA: 360px no overflow, zoom/Esc/focus return pass, empty/valid fake-fetch form pass; rebuilt original-capture PDF 3 pages rendered/read. Main frozen only while an integration reviewer is actively merging.

Site review round 1 completed; main unfrozen. Source branch 4080e59 is clean; original task runtime reports waiting_for_children although its implementation handoff declares done. Review owns no source edits. Documentation refresh: Sonnet 5.5 low + Haiku 5.5 low corrections accepted/cherry-picked through1b0c3c5. Parent now owns README final release wording and coordination.

Parent preflight: independent local Lighthouse all100,LCP784ms,CLS0. CFWebAnalytics automatic injection switched from excludeEU to enable, persisted afterreload and script verified onwww. ProductionWrangler dryrun passes9.85KiB/gzip3.63 afterremoving config-location tsconfig override (compiler discovers source tsconfig); noWorker routes enabled. Rollback previousVercel dpl_3mb1Y1Sic2js48HF1KPvshnvQkoY (jarvis-ddag2echm-jarvisworkscos-projects.vercel.app); if coreflowfails, rollbackVercel and remove ONLYfournewWorker routes, keepD1data. FooterstageownsFooter.astro + ownhandoff branchrebuild-2026-10-footer; no packagechanges.

## Claude takeover — 2026-10-11 17:15 (Codex session limit until 21:27)
Lead: Claude Opus 5.5 parent (same T3 thread). Footer fix e4976c6 reviewed by Claude parent (1-line CSS, not cross-provider) and merged. astro build pass, git diff --check clean, banned-content grep clean, no copy exclamation marks.
Vercel PREVIEW (protected, log in as jarvisworksco): https://jarvis-6yw6au1gs-jarvisworkscos-projects.vercel.app — /arboristams H1 matches build, sms:/tel: +37067699395, /atsiliepimas 404. Production NOT deployed: spec §7.9 gate, awaiting Jarvis approval.
Worker LIVE: jarvisweb-proof-tracking version 4b9d1c4b, four routes, EVENTS_TOKEN set via secret bulk. Live: /p/a2345 302 → /arboristams?r=a2345 (human), WhatsApp UA → bot, malformed → /, beacon 204, /t/events 401 without token, JSON with token. 19 Worker tests pass. Synthetic a2345 rows (ids 1–3) remain in D1; delete only with Jarvis approval.
