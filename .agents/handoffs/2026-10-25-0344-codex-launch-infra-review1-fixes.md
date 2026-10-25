# Handoff: launch-infra review1 fixes
From: codex (implementation sub-agent, existing Codex2 session) · To: lead → Claude final review2 · Date: 2026-10-25T03:44:52+03:00

## Objective
Apply only completed Claude2 Opus review1 findings P2 and P3 #2–#6. Preserve live d7605ac request/storage/receipt/origin/dedup/rate/privacy behavior. No final review dispatched by this stage.

## User decisions & constraints
- Continue existing worktree `/Users/matasbasinskas/Work/Code projects/JarvisCo-worktrees/launch-infra`, branch `infra/client-launch`, from ccda9ed + bf3f20d.
- Own only `tracking/**`, `docs/launch/**`, own handoff. **No board/main/other-worktree edits.**
- No deploys, Cloudflare/DNS writes, live CRM writes, sends, purchases or additional agents. Mobile deferred.
- Lead dispatches FINAL Claude review2 **after 05:00Z reset**. This stage did not launch it.
- User's budget figures: cumulative 3.2M estimate; original measured input 1.804M; about 1.4M additional estimated. No new measured usage/cost or savings claim. Work remained outside the 08:00–20:00 Vilnius capacity-reservation window; remaining account percentage is unknown.

## State
- Fix commit **b6399d48e2ae5859bed1357129c717429fb9c69b** (`fix(tracking): retain owner alerts on invalid client routing`). This metadata handoff is a separate following commit.
- Review source read in full: `/Users/matasbasinskas/WebAgency Biz/research/overnight-2026-10-25/resume-state.json`, fields `launchInfraReview`, `launchInfraReviewResult`. Review1 verdict: changes requested. All six requested responses below implemented locally; independent approval remains pending.
- This supersedes the previous handoff's description that invalid routing disables site mail. Invalid routing now attempts validated-owner-only warning mail. Missing/invalid owner still yields no send, preserving successful receipt/storage/claims.

## Finding → fix matrix
| Finding | Evidence / implementation | Verification |
|---|---|---|
| P2 — bad global/selected map silently loses owner alert | [alerts.ts](../../tracking/src/alerts.ts): invalid map/selected route returns only validated FORM_ALERT_TO, with fixed first body line “Maršrutizavimo konfigūracija neteisinga — klientui nepranešta”. No invalid-list prefix or another site's route is used. Valid selected routes ignore unrelated bad routes; unmapped valid maps keep ordinary owner behavior; funnel bodies unchanged. | [Worker-path tests](../../tracking/test/worker.test.mjs): arbcut + malformed global map, eight invalid meselektra map/route cases (successful receipts, two stored rows, one claim/mail on duplicate), missing/invalid/injected owner, unrelated invalid route, existing independent failure tests. |
| P3 #2 — runbook validator weaker than Worker; allowlist incomplete | [RUNBOOK §3](../../docs/launch/RUNBOOK.md): same mailbox regex + 1–254 length; locally parse actual private TOML with pinned Wrangler, validate every retained route's 1–10 mailboxes, assert every routed address and legacy FORM_ALERT_TO are exact members of allowed_destination_addresses. Secret owner value read only from private JSON if not in vars; four launching routes require distinct client + requested owner. No private recipients in git. | [Validator tests](../../tracking/test/launch-runbook.test.mjs): execute the documented snippet against synthetic TOML/JSON, success for vars/secret owner, refusal of quotes/non-ASCII/missing TLD/overlength, omitted client/retained-route/owner allowlist entries. Nine tests. |
| P3 #3 — no production migration-state command | [RUNBOOK §2](../../docs/launch/RUNBOOK.md): explicit remote SELECT ledger-existence preflight, then `wrangler d1 migrations list DB --remote --config "$PROD"`; require successful “No migrations to apply!” before §3. Missing ledger blocks list because pinned Wrangler initializes one if absent. No apply command added. | Verified syntax/behavior against installed Wrangler 4.149.0 implementation and official D1 command docs; **no remote command executed** in this continuation. |
| P3 #4 — secret bulk intermediate deployment omitted | [RUNBOOK §3](../../docs/launch/RUNBOOK.md): explicitly describe immediate deployment of currently live code; inventory deployments AND versions immediately after secret bulk in separate files; retain original pre-secret UUID/files as rollback target and stop on inventory failure. | Official Cloudflare secret-command documentation + pinned CLI inspection. No secret write or deploy executed. |
| P3 #5 — port and denied OPTIONS missing | [Worker-path tests](../../tracking/test/worker.test.mjs): :8443 in POST form/beacon refusals; HTTP/lookalike/:8443 preflights for both /t/form and /t/e across all four sites. | All denied 403; no Access-Control-Allow-Origin; zero rows in events/submissions/rate_limits/site_daily_budgets/form_alert_claims after denied preflights. |
| P3 #6 — shared daily ceiling unclear | [RUNBOOK §6](../../docs/launch/RUNBOOK.md): 100/day across all registered client/leadgen sites vs 30/site/day; four times30 =120 exceeds100; noisy sites may deny others until UTC day reset. Funnel budgets separate. | [index.ts](../../tracking/src/index.ts) unchanged byte-for-byte from d7605ac; no budgets raised. |

## Files & artifacts touched
Only five implementation files in b6399d4: `tracking/src/alerts.ts`, `tracking/test/worker.test.mjs`, new `tracking/test/launch-runbook.test.mjs`, `tracking/README.md`, `docs/launch/RUNBOOK.md`; plus this own handoff. No management board or another worktree touched.

## Checks run (command → result)
From the assigned worktree's `tracking/`:
- `npm test` → **141/141 passed; 0 failed, skipped or cancelled**. Includes 132 Worker-path tests and 9 executable-runbook validator tests (16 additional cases vs previous125, plus stronger assertions in existing cases). Log `/tmp/jarvisweb-launch-infra-review1-tests.log`.
- `npm run typecheck` → pass.
- `npm run deploy:check` → **local dry-run passed**, 34.41 KiB / gzip10.17 KiB. Uses repository placeholder IDs, not private production config. Log `/tmp/jarvisweb-launch-infra-review1-dry-run.log`.
From worktree root:
- `git diff d7605ac --exit-code -- tracking/src/index.ts tracking/migrations tracking/package.json tracking/package-lock.json tracking/wrangler.toml` → pass, no diff. Request/storage/migrations/budget/receipt/origin logic and deployment config unchanged from live baseline.
- `git diff --check`, staged equivalent → pass.
- Local Markdown-reference checker (excluding fenced code) → 7 valid implementation references. This handoff's references checked at finalization.
- All test mail uses inert local bindings/synthetic data. Real private recipients/config, remote D1 ledger and actual inbox delivery were not read or validated in this continuation.

## Exact remaining limits / limitations
- `tracking/src/index.ts`: **5 site forms/minute**, **30/site/UTC day**, **100 combined site forms/UTC day** shared with all client/leadgen sites; **300 combined site file writes/UTC day**. Excess returns429 without a successful receipt/notification. A busy site can exhaust the shared budget; no cap change authorized.
- Separate first-party funnel: 5 forms/minute per proof code, 10/minute uncoded homepage; **50 submissions/UTC day** and **300 MiB uploaded/UTC day**. Anonymous beacons remain **60/minute per site/code**.
- Existing upload limits: max8 files, max10 MiB each, max25 MiB combined, multipart body ceiling25 MiB+64 KiB; unchanged file types and privacy.
- `tracking/src/alerts.ts`: route lists1–10 strict ASCII mailboxes; duplicates case-insensitively collapsed preserving first spelling. Malformed routing sends only the validated owner warning; missing/invalid owner or provider/binding failure can still lose that warning. There is no alternate-client fallback, logging, outbox, retry or guaranteed delivery.
- Existing durable claim window **600,000ms (10minutes)** remains whole-attempt dedup, not per-recipient delivery confirmation. Duplicate POSTs still store separate submissions and consume budgets. Fixing map/owner/binding does not replay an active claim. One failed destination does not suppress another.
- Runtime missing map/route retains owner fallback without a warning; complete verified client+owner routing is still a mandatory deployment gate. Private allowlist validator checks configuration, not Cloudflare destination verification/inbox receipt.
- Remote migration state and original rollback UUID must be refreshed by the lead before mutations. The earlier recorded candidate remains historical, not refreshed by this stage.
- Mobile/browser QA deferred by current user instruction. No client builds, remote setup, Search Console or CRM launched state certified.

## Pending approvals / questions
No permission question from this stage. Independent FINAL review2 pending. Existing Matas/lead access, recipient-verification, Google and launch gates in the runbook remain.

## External actions already taken
This continuation: official documentation reads only, local code/docs/tests/commits and local dry-run. **No Cloudflare/DNS/API mutations, remote D1 query, migration apply, deployments, live forms, sends, CRM writes, purchases, GUI or agents.**
A heredoc delimiter collision interrupted one attempted documentation edit and unintentionally ran a local root `npm ci`; no tracked root file changed and no remote command ran. Corrected with patch edits; tracked scope verified. Ignored local dependency/build outputs remain local.

## Next action + owner
**Lead:** dispatch FINAL Claude review2 after05:00Z, with original brief/review1 findings, this matrix, implementation commit b6399d4 and prior commits ccda9ed/bf3f20d. Compare bounded fix with `git diff bf3f20d..b6399d4`, full tracking behavior with d7605ac. Do not use this implementation self-check as independent review approval. If approved, lead performs separately authorized integration/release following the runbook and current task constraints.

## Omitted context
Previous `.agents/handoffs/2026-10-25-0322-codex-launch-infra.md`; original baseline and Cloudflare/DNS snapshot in `docs/launch/READ-ONLY-CHECKS.md` (historical,125-test count there precedes this revision). No board edits in this continuation; lead owns status integration.
