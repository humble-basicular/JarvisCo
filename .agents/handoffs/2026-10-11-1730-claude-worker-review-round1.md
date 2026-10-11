# Handoff: Worker review round 1 (tracking/**)
From: claude (Sonnet 5.5 high) · To: either (parent lead) · Date: 2026-10-11T17:30:00+03:00

## Objective
Cross-provider review of Worker implementation 5290e5f (contract 465fc05, impl 8c29637), `git diff 9aa84e6...5290e5f`, against SPEC-2026-10-proof-site.md §4. Review branch `rebuild-2026-10-worker-review`. No code edited.

## User decisions & constraints (verbatim where possible)
- "Own only a uniquely named .agents/handoffs review note in YOUR worktree, no code edits."
- "If approved: write/commit handoff then merge YOUR approved branch fast-forward-only into integration branch rebuild-2026-10 ... and rerun tracking focused checks there."
- No provisioning/deployment, no SMS, no real form submission, no new subagents, parent owns board/secrets/deploy.

## State
- Verdict: **APPROVED, no blockers.** Findings below are non-blocking.
- Done (verified how): read spec, contract README, migration, wrangler.toml, `src/index.ts` (252 lines) and all 19 tests; ran checks; wrote an independent paging fuzz (scratch, outside repo, not committed).

## Review findings (all non-blocking)
Correctness checked and found sound: redirect/validation (`src/index.ts:228-239`), atomic limiter (`:137-147`; counter+gated insert in one D1 batch), body cap/streaming (`:93-119`), auth via SHA-256 digest compare (`:181-195`), (at,id) cursor with snapshot high-water (`:197-223`), retention string compare (same ms-Z format on both sides), prepared statements everywhere, no console/log of secrets, no IP/UA stored.

1. **Schema hardcodes prefix `a`** (`migrations/0001_events.sql:4` `substr(code,1,1)='a'`) while Worker has `PREFIXES` config. Adding a niche (spec §3.3, e.g. `v`→`/vejos-prieziura`) would redirect fine but every click insert would fail the CHECK, and the failure is swallowed (`index.ts:88`, `.catch(() => {})`) — silent data loss. Fix when adding a prefix: new migration that rebuilds `events` without that CHECK (or drop it now). Not a Monday blocker (only `a` is used).
2. **Clicks (`GET /p/<valid-syntax code>`) are not rate limited** and not tied to CRM-issued codes: anyone can fill D1 free-tier writes/rows with syntactically valid codes (documented limitation for beacons only). Redirect still works. Mitigation if it matters: one Cloudflare WAF rate-limit rule on `/p/*`; CRM ignores unknown codes.
3. **HEAD on `/p/*` returns 405** (`:229`). Some SMS/link scanners probe with HEAD; they would see a failing link. Consider treating HEAD like GET without insert. Humans unaffected.
4. **Generic `bot` regex false positives**, as spec literally says: e.g. UAs containing "Cubot"/"Robotek" classify as `bot` (verified with the regex). Real phones from other makers (Samsung, iPhone, Xiaomi Chrome UAs) classify `human`. Because real views are confirmed by the `view` beacon and the classifier is stored per event, impact is small. A `view` beacon from such a phone would be stored as `bot`; CRM should decide whether to ignore `ua_class` on `view` beacons.
5. **`since` must be URL-encoded** when it carries `+HH:MM` (a literal `+` decodes to a space → 400). README only calls out encoding for the cursor. CRM should send UTC `Z` or encode.
6. **Click/beacon-time D1 failures are invisible** (observability disabled, errors swallowed). Intended by the privacy design; the operator learns of outages only through the 503 on `/t/e`/`/t/events` or missing events. Smoke-test `/t/events` after deploy.
7. **Fixed 60 s window** permits ≤120 events in a short burst across a minute boundary. Documented as abuse mitigation only.
8. **Event ordering assumes D1 `at` is non-decreasing in ID order** (single primary writer). A backwards clock step could place a later ID before an already-ingested `at`, and the next `since=max(at)` poll would miss it. Very unlikely; replication/read replicas are not enabled and should not be without revisiting the cursor.
9. **Cross-origin beacons unsupported** (no CORS): the page must post to the same host it was served from (apex or www), so vercel.app preview pages cannot send beacons to production routes. Fine for production; relevant when testing the page preview.
10. Tooling: `miniflare` is pinned to an `-alpha` build to match Wrangler 4.149.0; tests rely on `convertV4MiniflareOptions`. Revisit when upgrading Wrangler. Fresh `npm ci` prints install-script warnings only.

## Files & artifacts touched
- This note only. Scratch fuzz at `/tmp/review-worker-scratch/fuzz.mjs` (outside repo, not committed). `tracking/node_modules` and `dist/` in the review worktree are git-ignored.

## Checks run (command → result)
- `npm ci` in review worktree `tracking/` → OK (lockfile honored, no manifest changes).
- `npm test` → PASS 19/19 (7.2 s, local workerd + D1).
- `npm run typecheck` → PASS.
- `npm run deploy:check` → PASS (dry run only; 9.80 KiB / gzip 3.60 KiB; binding DB detected; nothing uploaded).
- `git diff --check 9aa84e6...5290e5f` → clean.
- Independent fuzz: 60 CRM-style poll rounds, limit 1–5, tied timestamps, inserts between pages, `since=max(at)` replay → 18,104 inserted, 18,104 distinct IDs ingested, no gap, no duplicate loss.
- Merge into `rebuild-2026-10` and re-run of focused checks there: see "Merge receipt" below.

## Pending approvals / questions for the user
None. Parent decisions: whether to add a WAF rate-limit rule and HEAD handling (findings 2–3) before the first batch; both optional.

## External actions already taken (sent, uploaded, published — never repeat)
None. Only an `npm ci` download of locked dependencies. No Cloudflare, SMS, form or CRM interaction.

## Next action + owner
Parent: relay `tracking/README.md` to the CRM owner (finding 5), provision remote per README prerequisites (D1 empty id already created; replace the placeholder `database_id`, apply migration before routes, set secret, deploy after preview approval), then smoke-test with synthetic events.

## Omitted context (where to find it)
Worker handoff: `.agents/handoffs/2026-10-11-1647-codex-worker-implementation.md`. Spec: `docs/SPEC-2026-10-proof-site.md`.

## Merge receipt
Fast-forward-only merge of this branch into `rebuild-2026-10` (main checkout) was performed after this commit; the merged hash equals this branch HEAD and is reported in the review return message. Focused checks were re-run in the main checkout `tracking/` (results in the return message).
