# Batch launch preparation

Implementation for review; no remote operations are implemented. Run from this tooling checkout. The frontend is deliberately a separate, explicitly selected checkout: the integrated tooling/main tree is not the accepted client frontend.

```sh
node scripts/client-launch.mjs \
  --frontend '/Users/matasbasinskas/Work/Code projects/JarvisCo-worktrees/batch1-release' \
  --expect-commit ba0d439
```

Default `plan` reads local files and git only. It validates four known site/domain/slug/project identities, private config schema and existing hosting records. It does not write state, call services, rebuild, infer payment or approve a launch. The default private root is the main Drive's `Business/JarvisWeb/previews`; `--private-root` selects an alternative private root outside either source checkout. Stdout contains public identities, hashes and fixed issue codes; builder diagnostics stay in private logs.

For an explicitly approved local preparation run, substitute `build` before the flags. `check` runs only the existing artifact checker. `--clients meselektra,laikam` selects a subset. `build --resume` skips a previously successful build only when the fingerprint and output bytes still match; it reruns both candidate and strict production artifact checks. Neither mode deploys anything. Do not use these modes against shared client output while its frontend owner is building it.

The frontend HEAD must exactly match `--expect-commit` and descend from accepted frontend `ba0d439acf61d138c5cb74626272ab3500eb9a2d`. After the separate factual corrections are reviewed/integrated, select that checkout and its actual commit explicitly. This runner does not integrate those corrections. It calls that checkout's `scripts/client-site.mjs` and `scripts/client-site-deploy-check.mjs` with that checkout as cwd and `INIT_CWD`. It never calls the agency's `npm run build`.

`frontendDirty` and `frontendDirtyCount` report git changes scoped to `src`, `scripts`, `package.json`, `package-lock.json` and `astro.config.mjs`, including untracked source files. A dirty `plan` is allowed and visibly reports working-tree bytes rather than implying accepted-commit bytes. `build`/`check` refuse dirty source unless `--allow-dirty` is explicit; private receipts record that choice and the dirty flag/count. Ignored generated preview/media/output and `node_modules` do not enter this source-dirty count. Per-client `inputsHash` and `outputHash` expose hashes only (output is null if absent), for comparison with acceptance records. Preview/media remain independently hashed. A divergent frontend reports `frontend-lineage-mismatch`.

Private path mappings (relative to the default previews root):

- MesElektra: `meselektra-re307/launch-2026-10-24/launch-config.json`.
- LaiKam: `laikam-ls671/launch-2026-10-24/launch-config.json`.
- MAS: `masaukstalipiai/launch/launch-config.json`.
- Vensland: `vensland/launch/launch-config.draft-unverified.json` — schema validity does not confirm its candidate mailbox.

Each client's existing `launch/hosting-preparation-2026-10-25.json` must match the known project UUID/name/hostname/production label. The four prepared projects are reused as records; the runner never creates them or claims their current remote state. Private inputs/configs are never rewritten. `worker.configured:false` causes the existing builder's `--pending-worker` mode; candidate-check success remains pending production registration. A `true` value is only a config claim, and cannot close the separate live Worker gate.

## State and recovery

Explicit `build`/`check` writes private `launch/batch-orchestration/state.json`, a separate receipt per run, and unique build/candidate/production logs (files mode 0600, new directories 0700). Existing builder behavior backs up prior client output before rebuilding. No old output or receipt is deleted by the runner. A client failure does not stop the other clients and yields overall exit 1. Exit 2 means pending gates; exit 0 means evidence is recorded for lead review, never that a site was launched.

The fingerprint includes public identity, selected frontend path and HEAD, actual source/scripts/package/lockfile bytes, private config and hosting-record hashes, preview JSON/media bytes, runner/identity/registration code, and Node version. Output hashes must also match before reuse. Dirty/untracked source bytes under `src`/`scripts` are included. Failed, changed, unbound or interrupted runs cannot be reused as successful builds. Installed dependency contents are not independently attested by hashing the lockfile; use the checkout's already prepared dependencies. A local hash proves byte identity, not client factual correctness or review approval.

An exclusive per-client private `active.lock` prevents concurrent runs sharing that receipt folder. Abrupt termination can leave it behind. The lead must inspect its PID/time and preserve the interrupted receipt before manually recovering that lock; the command never deletes an unknown/stale lock. Do not run two different private roots against the same frontend output. Corrupt receipts fail closed and require operator inspection, not silent replacement. A `check` of an old output with no matching build receipt is explicitly `checked-unbound-output`.

If the owned lock disappears during execution, that client's receipt is failed/stale and the remaining clients continue. Cleanup tolerates a missing lock and checks its filesystem identity before removal; a replacement lock is preserved. Cleanup errors are recorded for that client without replacing an earlier failure or aborting the batch.

## External gates

No external gate is inferred from a config, hosting-preparation record or build. An operator may supply private `launch/gate-evidence.json` after authorized work. Its shape is:

```json
{
  "version": 1,
  "identity": {"site":"meselektra","slug":"cg6j485ktf","domain":"meselektra.lt","project":"jarvisweb-meselektra","projectId":"2198c0eb-a05f-4136-9976-6a6f6f2cbdd2"},
  "fingerprint": "copy the current plan fingerprint exactly",
  "gates": {
    "workerLiveRegistration": {
      "status": "confirmed",
      "checkedAt": "2026-10-25T12:00:00Z",
      "files": [{"path":"launch/actual-private-worker-receipt.json","sha256":"actual SHA-256 of that file"}]
    }
  }
}
```

This is a format example, not evidence. Identity key order matches the command's public identity fields above. Every confirmed gate needs a parseable past timestamp and at least one nonempty, hash-matching regular evidence file beneath the private client folder. Resolve dot segments before checking exclusions, conservatively folding case and Unicode normalization for APFS aliases. References into `launch/batch-orchestration/`, legacy `batch-orchestration/` or `client-sites/` are refused, including receipts/logs/locks. The actual launch-config path (including the dated MesElektra/LaiKam folders), hosting-preparation record and `launch/gate-evidence.json` itself are also refused: these runner inputs/outputs cannot prove external work. Symlinks and paths escaping the client folder are refused. Ordinary operator evidence remains allowed and is labelled `operator-attested`; content and authenticity still need human/lead review, and copied/renamed claims are not semantically authenticated by a hash. Inspect the exported gate names in [clients.mjs](../../scripts/launch/clients.mjs).

Missing gates stay pending. Conservatively, **every** supplied gate becomes stale when the fingerprint changes, including source/tool changes unrelated to domain purchase or DNS. Refresh/review the underlying evidence and re-attest against the current fingerprint; independent gate lifetimes are not implemented in this stage.

Use the existing [runbook](RUNBOOK.md) for authorized purchase/registrar/DNS/Worker/deployment/Search Console work. Its project-creation statements are historical: all four projects were subsequently prepared; see source handoff `2026-10-25-0749-codex-launch-infra-integrated.md`. This runner automates local batching, validation, builder/check invocation, failure isolation and evidence freshness only. Purchase approval, registrant/domain ownership, registrar access, DNS/mail backup and preservation (especially Hostinger), live Worker/recipient configuration, inbox receipts, remote deployment/TLS, Google ownership/GBP verification, interlink inspection and client confirmation remain external gates. No spending, new accounts, QR generation, scheduler, email/SMS/form submission or CRM action is implemented.

Current policy: manual after-call sending; an approved fully working launch starts 60 days even if external GBP verification remains pending. Only `gbpExternalVerification` is nonblocking for the evidence-ready result; it remains visibly pending. Trial start itself is never executed here. Silence means expiry +72 hours; explicit rejection means immediate offline, while ordinary objections are not rejection. These are policy statements, not authorization or code to shut down any real site. QR is Tomas-only. Full-flow/live tests wait until agent preparation and review are finished.

Focused checks: `node --test scripts/launch/batch.test.mjs`. Synthetic executables exercise orchestration and use the accepted frontend's real config validator from its git object; they do not certify actual Astro output or external services.
