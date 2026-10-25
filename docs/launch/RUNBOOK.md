# Client launch runbook

Prepared 25 October 2026. **This stage prepares code, tests and read-only evidence only.** Every Cloudflare/DNS mutation, deployment, verification email and live form test below is future lead/Matas work after Claude review and the applicable launch authorization. No new client thread or automation is required. Evidence: [read-only receipt](READ-ONLY-CHECKS.md), [site additions](../../tracking/config/client-sites.json), [alert contract](../../tracking/README.md#client-launch-recipient-routing).

## 1. Resolve each domain and its owner gates

Proposed Pages project names below are uncreated and availability is unverified. Use the exact `<project>.pages.dev` hostname returned by Cloudflare, not an assumed one. All four registrations are `kind: client`, with **only HTTPS apex + www** origins. Pages preview URLs stay unregistered.

- **meselektra.lt / site `meselektra` / project `jarvisweb-meselektra`:** user reports unpurchased; public DNS NXDOMAIN. **Matas:** complete IV.lt purchase using confirmed registrant details, then change IV.lt nameservers to the two assigned to this new Cloudflare zone. Lead follows full-zone path in §4, binds apex + www, uses private MesElektra recipient plus `matas@jarvisweb.lt`, builds `previews/cg6j485ktf.json` with its private config. Rollback: retain purchase/receipt; restore the saved pre-cutover nameservers/parking records if a cutover fails; do not cancel/delete the domain or zone.
- **laikam.lt / site `laikam` / project `jarvisweb-laikam`:** public NS are Hostinger `artemis.dns-parking.com` + `hermes.dns-parking.com`; this establishes DNS hosting, not the account holder. **Matas:** resolve who controls the current DNS/registrar account and get zone export/access. Preserve Hostinger mail, including current MX priorities 5/10, SPF and all actual DKIM/DMARC/mail records. Full apex + www Pages launch requires moving authoritative DNS to a Cloudflare zone. If current DNS stays at Hostinger, §4's www-only CNAME alternative cannot satisfy the current apex canonical build. Private client destination must be confirmed against the existing client mailbox; do not infer a forwarding inbox. Build `previews/ejgb7a33zs.json`. Rollback: restore saved web A/AAAA/www CNAME or old nameservers as appropriate; keep email untouched and old host running.
- **masaukstalipiai.lt / site `masaukstalipiai` / project `jarvisweb-masaukstalipiai`:** user reports unpurchased; public DNS NXDOMAIN. **Matas:** buy at IV.lt, then apply the Cloudflare-assigned nameservers. Full-zone path, apex + www, private client destination plus owner. **Unknown:** final preview slug, reviewed standalone build and confirmed recipient. Resolve before launch. Rollback: same new-domain parking/NS restoration as MesElektra; retain purchase.
- **vensland.lt / site `vensland` / project `jarvisweb-vensland`:** user reports Hostinger registration; public NS `horizon.dns-parking.com` + `orbit.dns-parking.com`. **Matas: obtain Hostinger access from Tomas.** Preserve MX **5 mx1.hostinger.com**, **10 mx2.hostinger.com**, existing SPF and full email records. Full-zone path supports apex + www; staying at Hostinger permits only the www CNAME alternative below. **Unknown:** final preview slug, reviewed standalone build and confirmed recipient. Rollback: restore saved apex A/AAAA/www and/or original nameservers; keep Hostinger mail and the old website available.

**Rollback of preparation:** if access, recipient, privacy/controller copy, build approval or Google login is missing, leave the site pending; change nothing live. Matas supplies the missing input. No dates are assumed.

## 2. Capture rollback evidence before any mutation

Use an existing private Drive launch folder per client for configs, receipts, full DNS exports and test results. Store temporary command outputs in a private directory outside git. Do not commit client recipient emails, secrets or customer records. Keep the old host/site until acceptance.

From the reviewed/integrated `tracking/` checkout:

```sh
export PATH=/opt/homebrew/bin:$PATH
PROD="$HOME/Library/Application Support/JarvisWeb/wrangler-production.toml"
LAUNCH_PRIVATE="$HOME/Library/Application Support/JarvisWeb/client-launch/$(date +%Y%m%d-%H%M%S)"
umask 077
mkdir -p "$LAUNCH_PRIVATE"
npx --no-install wrangler whoami
npx --no-install wrangler deployments list --config "$PROD" --json > "$LAUNCH_PRIVATE/worker-deployments-before.json"
npx --no-install wrangler versions list --config "$PROD" --json > "$LAUNCH_PRIVATE/worker-versions-before.json"
cp -p "$PROD" "$LAUNCH_PRIVATE/wrangler-production-before.toml"
```

Before any release mutation, run this **remote read-only preflight** against the existing production migration ledger. The default ledger is `d1_migrations`; if private `migrations_table` overrides it, substitute that exact name in the SELECT. First confirm the ledger already exists:

```sh
npx --no-install wrangler d1 execute DB --remote --config "$PROD" --command "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'd1_migrations';" > "$LAUNCH_PRIVATE/d1-ledger-before.txt"
```

If that read returns no ledger, **stop**: pinned Wrangler 4.149.0's list command can initialize a missing ledger (`CREATE TABLE IF NOT EXISTS`), so do not run it against an uninitialized database. With the existing ledger confirmed, list unapplied migrations without applying them:

```sh
npx --no-install wrangler d1 migrations list DB --remote --config "$PROD" > "$LAUNCH_PRIVATE/d1-migrations-before.txt"
```

**Release gate: the command must succeed and report “No migrations to apply!”** Any pending migration, missing ledger, failed query or uncertain migration state blocks §3. Reconcile with live d7605ac and the database owner; no migration apply is authorized in this stage. Check private `migrations_dir` points to the reviewed `tracking/migrations/` before this comparison. [D1 migration-list command](https://developers.cloudflare.com/workers/wrangler/commands/d1/#d1-migrations-list).

Record the currently deployed **version UUID** (not source commit or deployment UUID), existing `SITES`, `FORM_ALERT_TO`, recipient-map value if already present, and Email binding restrictions. The 25 October read-only rollback candidate was **`30f2e5ef-029b-4396-9272-4378913cd45f`** (deployment `3bbb6b97-3e77-4586-92dc-b2efe1b308c4`, 100%); refresh before rollout. Keep recoverable prior secret values in the existing private secret store; the API cannot reveal an old secret. Export all pending D1 migration state and use the existing normal database backup procedure. This change introduces no migration beyond live d7605ac's 0006: never drop/recreate alert claims or budgets during rollout/rollback.

Also capture existing Pages production deployment ID (if project already exists), old web responses, DNS export/TTL and registrar NS/DS state. Record actual Cloudflare zone nameservers individually. Domain purchases, client addresses, Google account access and DNS account control remain prerequisites.

Rollback: preparation is read-only except private local backups; keep those backups. If any rollback input is missing, stop before changing production.

## 3. Prepare and deploy Worker routing first — lead only

`tracking/config/client-sites.json` is a **SITES addition set**, not a replacement or automatic runtime default. The runtime remains driven by the existing private `SITES`. Keep every existing jarvisweb/preview/other-site entry and value. Save the current SITES object privately as `sites-before.json`. Merge selected launch entries without overwriting conflicts (from `tracking/`):

```sh
python3 - "$LAUNCH_PRIVATE" <<'PY'
import json, pathlib, sys
p = pathlib.Path(sys.argv[1])
old = json.loads((p/'sites-before.json').read_text())
add = json.loads(pathlib.Path('config/client-sites.json').read_text())
assert isinstance(old, dict)
for code, config in add.items():
    if code in old and old[code] != config:
        raise SystemExit('Conflicting site entry: '+code)
    old[code] = config
(p/'sites-merged.json').write_text(json.dumps(old, separators=(',', ':'))+'\n')
PY
```

The four origins can be registered together, but do not expose a client's form before its recipients are verified. Merge the JSON from `sites-merged.json` into the **existing `[vars].SITES`** in the private production TOML; do not create another `[vars]` table or move/delete existing secrets. Preserve existing D1/KV IDs, tokens, `FORM_PROOF_LINKS`, routes, logging/metrics/privacy configuration and compatibility settings. Set private `main` and `migrations_dir` to the reviewed checkout; repository placeholders are not deployable production IDs.

Create a **private** `site-recipients.json` object, mapping each launching site to `[confirmed client mailbox, "matas@jarvisweb.lt"]`. Preserve any pre-existing routing entries. Use no submitted email address as a routing destination. Validate every recipient and verify both exact destinations in Cloudflare Email Routing before sending. A forwarding alias and a verified destination are different: if the requested owner alias cannot be verified, Matas must resolve it; do not silently substitute another inbox. Client domain MX stays at Hostinger; sending from `forms@jarvisweb.lt` does not require enabling Email Routing on client domains.

The existing single-destination email binding must become an explicit union allowlist including the current owner recipient and all approved client/owner destinations:

```toml
[[send_email]]
name = "FORM_EMAIL"
allowed_destination_addresses = ["<existing verified owner destination>", "<verified requested owner alias>", "<verified client destination>"]
```

Replace the existing `destination_address` restriction in this binding; do not keep both restriction forms or duplicate the binding. Populate all actually launching clients, deduplicated. Never use an unrestricted binding or paid arbitrary-recipient sending. [Binding restrictions](https://developers.cloudflare.com/email-service/configuration/send-bindings/) and [verified destination pricing](https://developers.cloudflare.com/email-service/platform/pricing/) support this setup. Matas/client verification emails are future owner actions, not performed in this stage.

Validate the private map against **the actual private TOML binding** and encode the new secret without printing addresses. Run from `tracking/` after dependencies are installed. This uses pinned Wrangler's local TOML parser, not a network call. If `FORM_ALERT_TO` is a secret rather than `[vars]`, copy its exact recoverable value from the private secret store into `owner-recipient.json` as a JSON string in `$LAUNCH_PRIVATE` (never git). Do not infer the owner from a route. The validator uses the same ASCII mailbox regex and length rule as `tracking/src/alerts.ts`; it checks every retained route, not just the launching subset.

```sh
npm ci --no-audit --no-fund
node --input-type=module - "$LAUNCH_PRIVATE" "$PROD" <<'JS'
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { experimental_readRawConfig } from 'wrangler';
const privateDir = process.argv[2];
const { rawConfig } = experimental_readRawConfig({ config: process.argv[3] });
const mailbox = /^[A-Za-z0-9_+%-]+(?:\.[A-Za-z0-9_+%-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;
const valid = value => typeof value === 'string' && value.length > 0 && value.length <= 254 && mailbox.test(value);
// Fixed assertion messages never include a private mailbox or route value.
const check = (ok, message) => assert.ok(ok, message);
const routes = JSON.parse(readFileSync(join(privateDir, 'site-recipients.json'), 'utf8'));
check(routes && typeof routes === 'object' && !Array.isArray(routes), 'Invalid recipient map');
const bindings = (rawConfig.send_email ?? []).filter(binding => binding.name === 'FORM_EMAIL');
check(bindings.length === 1 && bindings[0].destination_address === undefined, 'Expected one allowlist email binding');
const allowed = bindings[0].allowed_destination_addresses;
check(Array.isArray(allowed) && allowed.length > 0 && allowed.every(valid), 'Invalid destination allowlist');
const owner = rawConfig.vars?.FORM_ALERT_TO ?? JSON.parse(readFileSync(join(privateDir, 'owner-recipient.json'), 'utf8'));
check(valid(owner) && allowed.includes(owner), 'Owner must be valid and explicitly allowlisted');
for (const [site, addresses] of Object.entries(routes)) {
  check(/^[a-z][a-z0-9-]{2,31}$/.test(site), 'Invalid route site code');
  check(Array.isArray(addresses) && addresses.length > 0 && addresses.length <= 10 && addresses.every(valid), 'Invalid route mailboxes');
  // Exact membership also preserves the spelling configured on the binding.
  check(addresses.every(to => allowed.includes(to)), 'Every routed recipient must be explicitly allowlisted');
}
for (const site of ['meselektra', 'laikam', 'masaukstalipiai', 'vensland']) {
  // For a subset launch, replace this list with the exact authorized ready sites.
  const addresses = routes[site];
  check(Array.isArray(addresses) && addresses.length === 2, 'Launching site requires two recipients');
  check(addresses.includes('matas@jarvisweb.lt') && new Set(addresses.map(to => to.toLowerCase())).size === 2, 'Launching site requires distinct client and requested owner');
}
writeFileSync(join(privateDir, 'recipient-secret.json'), JSON.stringify({ FORM_SITE_RECIPIENTS: JSON.stringify(routes) }));
JS
npm test
npm run typecheck
npx --no-install wrangler secret bulk "$LAUNCH_PRIVATE/recipient-secret.json" --config "$PROD"
npx --no-install wrangler deployments list --config "$PROD" --json > "$LAUNCH_PRIVATE/worker-deployments-after-secret.json"
npx --no-install wrangler versions list --config "$PROD" --json > "$LAUNCH_PRIVATE/worker-versions-after-secret.json"
npx --no-install wrangler deploy --dry-run --config "$PROD"
npx --no-install wrangler deploy --config "$PROD"
npx --no-install wrangler deployments list --config "$PROD" --json > "$LAUNCH_PRIVATE/worker-deployments-after.json"
```

`wrangler secret bulk` **immediately creates and deploys an intermediate Worker version using the currently live code**, before the later code deployment. Record that intermediate deployment/version from the two reads immediately after it; never overwrite `worker-deployments-before.json` / `worker-versions-before.json` or replace the original **pre-secret rollback UUID** with this intermediate UUID. If either inventory read fails, stop before the next deployment and recover the version record. Secret updates are production mutations too. [Cloudflare secret command behavior](https://developers.cloudflare.com/workers/wrangler/commands/workers/#secret). Capture the previous live version **before** secret/binding changes. If pending migrations unexpectedly appear, stop and reconcile with live d7605ac rather than blindly applying. Retain the deploy output, new UUID and old UUID in the private receipt. `worker.configured: true` is an operator attestation after this step; a successful build does not prove the live Worker was configured.

Rollback: restore prior private TOML/SITES/binding/map (or remove the new secret only if absent previously), then use the saved pre-change version UUID:

```sh
npx --no-install wrangler rollback '<saved-pre-change-version-UUID>' --config "$PROD" --message 'Client launch rollback'
```

Read back active version/config; if version rollback cannot restore bindings/secrets, redeploy the exact saved d7605ac code with the saved private configuration and secret values. Keep D1/KV/submissions/claims intact. Missing/invalid owner configuration or failed email delivery still stores successful forms and claims; invalid routing attempts owner-only mail with the fixed warning “Maršrutizavimo konfigūracija neteisinga — klientui nepranešta”. Unmapped sites keep normal owner mail. Fixing configuration does not replay a still-active ten-minute claim. Use a unique test message after recovery.

## 4. Create Pages project, zone and domains — per-domain lead/Matas

Set the matching site/project/domain from §1; these variables are examples for MesElektra and must change together for each client:

```sh
SITE_CODE=meselektra
SITE_DOMAIN=meselektra.lt
PAGES_PROJECT=jarvisweb-meselektra
npx --no-install wrangler pages project list --json
npx --no-install wrangler pages project create "$PAGES_PROJECT" --production-branch main
```

Use free Pages Direct Upload. The `main` production branch above is a Pages upload label, not a claim that JarvisCo has a git branch named main. Capture account/project/returned Pages hostname. If project already exists, inspect ownership/deployments before reuse; do not create duplicates. Do not expose production forms on Pages preview hostnames (not allowed Worker origins).

For full **apex + www** (required by current canonical build): add the domain as a **Free Cloudflare zone in the same account as Pages**. Export/import the complete existing DNS zone first. For LaiKam and Vensland verify the two Hostinger MX records, SPF, DKIM, DMARC and all mail hostnames match the source; keep mail records DNS-only, never proxy MX targets. Remove only conflicting old website A/AAAA/CNAME records when replacing those exact web names. Do not alter mail service or enable client-domain Email Routing. Check DNSSEC: if currently enabled, follow registrar/Cloudflare migration procedure so old DS does not cause SERVFAIL; record DS for rollback. Resolve CAA restrictions if certificate issuance is blocked.

Matas changes NS at IV.lt after each new-domain purchase. For existing domains, Matas obtains registrar/DNS access (Tomas for Vensland) and applies the exact Cloudflare-assigned pair. Wait for zone active; compare NS via recursive and authoritative queries, MX/TXT against the saved export before routing web traffic. Do not copy jarvisweb.lt nameservers by assumption.

In Pages project → **Custom domains → Set up a domain**, add **both** `$SITE_DOMAIN` and `www.$SITE_DOMAIN`, following Cloudflare's generated web CNAME targets; record each activation/TLS status. Keep apex canonical consistent with the build. Before public traffic, complete §5's reviewed deployment; domain activation may require that first upload. Avoid a redirect rule that catches `/t/*` on jarvisweb.lt; client DNS never needs a Worker route.

**Hostinger DNS alternative (www only):** first attach `www.<domain>` in Pages Custom domains, then replace only the existing `www` CNAME at Hostinger with the exact returned `<project>.pages.dev` target. Preserve apex web records and every MX/TXT/mail record. This does **not** provide apex Pages hosting; Hostinger apex CNAME tricks are not a supported substitute for the required Cloudflare zone. Keep launch pending until Matas approves either full NS migration or a separate www-canonical build plus an existing-host apex HTTPS redirect. The current apex build validator/config does not implement that alternative. [Cloudflare custom-domain requirements](https://developers.cloudflare.com/pages/configuration/custom-domains/).

Rollback project/zone creation: retain the unused resources; do not delete evidence. Rollback domain attachment/web routing: restore saved website RRsets (including AAAA), detach the failed new custom domain only after restoring the old destination, and keep mail unchanged. Rollback NS migration: keep both zones' email records in sync during propagation, restore original NS/DS safely and verify mail again. Reverting NS is not instantaneous. For new domains return to recorded parking DNS. Keep old hosting until both web and mail checks pass.

## 5. Rebuild, check and deploy static output

Use the reviewed client branch containing `ef321e4` or its integrated successor. The infra worktree intentionally owns no template/build changes. **Matas:** confirm client controller/privacy copy and exact recipients; the private config uses business name + client email and consent-based/disabled maps, not unapproved legal identity. Confirm the config matches actual live Worker registration/recipients, then set `worker.configured: true` in that private file.

From the approved client build checkout (select exact per-domain input/config):

```sh
node scripts/client-site.mjs previews/cg6j485ktf.json --site meselektra --domain meselektra.lt --config '<private-MesElektra-launch-config.json>'
node scripts/client-site-deploy-check.mjs client-sites/cg6j485ktf
```

For LaiKam substitute `ejgb7a33zs`, `laikam`, `laikam.lt`, its private config. For Masaukštalipiai/Vensland obtain the reviewed slugs/configs; do not guess them. **No `--pending-worker`, no `--allow-pending-worker`, no `--test`.** Require production manifest `workerRegistered: true`, correct domain/site, form endpoint `https://www.jarvisweb.lt/t/form`, no noindex/localhost/preview assets, correct canonical/sitemap, consent map and reviewed privacy. Require the batch review fixes: real browser Origin retained by referrer policy, stripped logo metadata, both HTTPS origins required. Check dialog/form/map on 320–390 and 1440 before upload with current-task GUI approval if needed.

From `tracking/`, use its pinned Wrangler to upload only the exact built directory:

```sh
npx --no-install wrangler pages deployment list --project-name "$PAGES_PROJECT" --environment production --json > "$LAUNCH_PRIVATE/$SITE_CODE-pages-before.json"
npx --no-install wrangler pages deploy '<absolute-reviewed-client-sites/slug>' --project-name "$PAGES_PROJECT" --branch main
npx --no-install wrangler pages deployment list --project-name "$PAGES_PROJECT" --environment production --json > "$LAUNCH_PRIVATE/$SITE_CODE-pages-after.json"
```

Record source commit, build/config hash, Pages production deployment ID and URL, previous production ID, TLS/custom-domain statuses. Never upload the monorepo `dist`, private launch configs, `.git` or unrelated previews.

Rollback build: use the archived prior build/config. Rollback upload: Pages Deployments → previous successful **production** deployment → Rollback to this deployment; preview deployments cannot be rollback targets. On a first launch there is no previous production ID: restore old web DNS/host or parking and detach the new domains, retaining the project and failed build for diagnosis. [Pages rollback](https://developers.cloudflare.com/pages/configuration/rollbacks/).

## 6. Acceptance, live test, Search Console and owner confirmation

Lead records GET/TLS checks on both apex/www, `/`, one town/service page, `/aciu/`, `/privatumo-politika/`, `/robots.txt`, `/sitemap.xml` and one real asset. Check actual content/canonical, no pending markers, no mixed content, no extra cookies/PII tracking. Confirm existing jarvisweb pages and unauthorized `/t/events` denial remain intact. Compare MX/TXT and mailbox send/receive with Matas/client; do not infer email delivery from DNS alone.

After permission for actual test notifications, make one **synthetic** inquiry per domain, with a unique marker and no real customer details. Prefer the site's actual form (JS success/receipt redirect, dialog and Origin behavior), plus a no-JS test only if required. Terminal equivalent for API diagnosis, not a browser integration proof:

```sh
curl --fail-with-body 'https://www.jarvisweb.lt/t/form' \
  -H "Origin: https://$SITE_DOMAIN" -H 'Accept: application/json' \
  -F 'kind=site_inquiry' -F "site=$SITE_CODE" -F 'phone=00000000' \
  -F 'name=LAUNCH TEST' -F "message=LAUNCH TEST $SITE_CODE <unique timestamp>"
```

Record receipt ID/time and authenticated feed/CRM ingestion, **both exact inbox receipts**, and one anonymous `cta_call`/form event with correct site. Test the www Origin too; an identical immediate retry should store another row but schedule no new mail for ten minutes. Use different unique markers for distinct delivery tests; stay below **5 forms/site/minute**, **30/site/day**, **100 global/day**, and existing file budgets. Expected: missing/foreign/cross-client Origin refused; no client site can submit as another site. Do not make actual phone calls or send client outreach. Do not delete test records without named backup/deletion authorization; label them in the private receipt.

**Existing shared capacity limit (unchanged):** the 100 site forms/day budget is shared across **all registered client and leadgen sites**, including older sites, while each site is limited to 30/day. Four clients each attempting 30/day would total 120 and exceed the shared 100/day allowance; busy/spammy sites can exhaust it and block other sites until the next UTC day even if those sites have not reached 30. Site limits are 5 forms/minute and 30/day, and the global site file-write cap is 300/day. A rejected form returns 429 and does not get a success receipt or alert. The jarvisweb preview/callback funnel has separate budgets (50 submissions and 300 MiB uploads/day); no global cap is raised in this stage. Lead must check current budget usage before acceptance and treat increasing capacity as a separate change.

Rollback failed acceptance: direct traffic back to the prior host/Pages deployment; if routing leaks or existing paths regress, restore Worker version/config per §3. Retain stored inquiries, use authenticated feed for recovery; no automatic resend or backfill is added.

**Matas: Google login required.** Open Search Console in the approved account, add Domain property for each exact domain, obtain its unique verification TXT and add it at the current authoritative DNS provider without overwriting SPF or other verification records. Verify ownership, then submit the site's actual `https://<domain>/sitemap.xml` URL (ensure HTTPS/canonical URL set and sitemap pages return correctly). On a www-only future variant use its real canonical URL. Save property/sitemap status; submission is not proof of indexing. Do not create a new Google account or infer permission from existing login. [Google verification instructions](https://support.google.com/webmasters/answer/9008080?hl=en).

Rollback Search Console: correct/remove only this launch's erroneous sitemap entry or verification token when specifically authorized; preserve other owners' tokens and SPF. During a web rollback retain valid ownership and correct the sitemap to actual live URLs. Never claim indexing guaranteed.

**CRM `launched` is owner-only.** Lead hands Matas the domain, deployment IDs, test/inbox receipts, email-preservation check, Search Console result and outstanding gaps, and asks him to confirm launch. Agents do not force the terminal journey state or invent the trial start. Matas records `launched` after acceptance; any check-in/reminder setup is a separate CRM action. If owner confirmation is absent, status remains pending confirmation. Rollback an incorrect CRM launch requires Matas to correct it using the recorded evidence; agents do not override owner truth.
