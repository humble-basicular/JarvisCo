# Launch infrastructure: read-only receipt

As of **25 October 2026 (Europe/Vilnius)**. These are observed records, not launch completion. No GUI, API mutations, deployment, purchase, DNS change or email was performed.

## Source baseline

- Requested `main` does not exist (`git log -1 main` failed). Actual integration is `rebuild-2026-10`, documented in the main checkout `.agents/BOARD.md`; worktree started at `c2c9ed3`.
- Own branch/worktree: `infra/client-launch`, `/Users/matasbasinskas/Work/Code projects/JarvisCo-worktrees/launch-infra`.
- Integration did not include live alert source. Restored **all `tracking/` from `d7605aca53031fb5e4e54f4c110e0d0ca603cfdd`**, then extended only alerts/config/tests/docs. This includes migration 0006 and the email test loader. `tracking/src/index.ts`, migrations, package/lock and Wrangler config match that live source exactly.
- User identifies `d7605ac` as live; the remote deployment annotation also names that commit. An annotation is source attribution, not an independent byte comparison of deployed source.
- Client build source read only: `client/batch1-20261024` at `f275e93`, including review fixes `ef321e4`; handoffs `.agents/handoffs/2026-10-24-2130-claude-batch1-sites.md` (Next 2–3) and `2026-10-25-0313-claude-batch1-sites.md`.

## Cloudflare

Commands ran from this worktree's `tracking/` using locally pinned Wrangler **4.149.0**:

- `./node_modules/.bin/wrangler whoami`: successful OAuth login, account associated with `jarvisworks.co@gmail.com`; scopes include Pages and zone read. Credential contents were not printed or copied.
- `./node_modules/.bin/wrangler pages project list --json`: **`[]`** (zero projects visible to this account/token).
- Cloudflare API `GET /client/v4/zones?per_page=50&page=1` using existing Wrangler OAuth locally, success, pagination exhausted: **one zone**, `jarvisweb.lt`, **active**, nameservers `dahlia.ns.cloudflare.com`, `jacob.ns.cloudflare.com`. No client zones returned. Those nameservers belong to jarvisweb.lt: do not reuse for a new zone unless Cloudflare assigns them.
- `./node_modules/.bin/wrangler deployments list --name jarvisweb-proof-tracking --json`: latest returned deployment **`3bbb6b97-3e77-4586-92dc-b2efe1b308c4`**, created **2026-10-22T07:15:12.772147Z**, 100% version **`30f2e5ef-029b-4396-9272-4378913cd45f`**, message “Reviewed form alerts d7605ac; recipient confirmed by Matas; owner test requested”. This is the observed pre-launch rollback version candidate. Recheck the active deployment before changing anything; a deployment UUID and a version UUID are not interchangeable.

## Public DNS

Queries: `dig +time=3 +tries=1 +noall +answer <domain> NS|MX|A|AAAA|TXT @1.1.1.1`, plus `www.<domain> CNAME`. Rechecked LaiKam NS/MX directly against `artemis.dns-parking.com` and Vensland MX against `horizon.dns-parking.com`.

- **meselektra.lt / masaukstalipiai.lt:** recursive NS queries return **NXDOMAIN**, no A/AAAA/MX/TXT/CNAME answers. This supports the user's unpurchased status; DNS alone does not establish registry availability or price.
- **laikam.lt:** authoritative NS `artemis.dns-parking.com`, `hermes.dns-parking.com` (Hostinger infrastructure). DNS is served there; account holder, registrar and ability to edit are **unknown**. MX **5 mx1.hostinger.com**, **10 mx2.hostinger.com** (TTL 14400). SPF `v=spf1 include:_spf.mail.hostinger.com ~all` (TTL 3600). Apex A `2.57.91.133`, `88.222.222.35`; AAAA `2a02:4780:84:9998:8633:3a38:488f:11a7`, `2a02:4780:84:cbc0:1dda:4403:b996:aa6b` (TTL 60). `www` CNAME `www.laikam.lt.cdn.hstgr.net` (TTL 300).
- **vensland.lt:** authoritative NS `horizon.dns-parking.com`, `orbit.dns-parking.com`. User reports Hostinger registration and no DNS access yet. MX **5 mx1.hostinger.com**, **10 mx2.hostinger.com** (TTL 14400). SPF `v=spf1 include:_spf.mail.hostinger.com ~all` (TTL 3600). Apex A `46.202.142.106`; AAAA `2a02:4780:9:2178:0:219e:7876:2` (TTL 1800). `www` CNAME `vensland.lt` (TTL 300).

A public DNS query is not a full zone export. DKIM selectors, DMARC, mail/autodiscover records, DNSSEC/DS, CAA and other records must be exported/read from the current DNS account before a nameserver migration. No zone contents were changed. Provider attribution is an inference from the returned nameservers and Hostinger's [official explanation of dns-parking.com nameservers](https://www.hostinger.com/support/8671230-how-to-look-up-domain-nameservers-at-hostinger/); it does not identify the human account controller.

## Implementation checks

- `npm test`: **125/125 passed**, zero failed/skipped, including **13 new launch tests**; final log `/tmp/jarvisweb-launch-infra-tests-final.log` (temporary, rerun command is authoritative).
- `npm run typecheck`: passed.
- `npm run deploy:check`: passed, **local dry-run only**, 34.04 KiB (gzip 10.06 KiB); uses repository placeholder D1/KV IDs, not validation of the private production configuration.
- `git diff --check` and staged equivalent: passed; local Markdown file references checked (7 valid before handoff).
- `git diff d7605ac --exit-code -- tracking/src/index.ts tracking/migrations tracking/package.json tracking/package-lock.json tracking/wrangler.toml`: passed, preserving those live baseline files exactly.

Local tests use ephemeral D1, synthetic mailboxes and inert email bindings; they do not send mail. No production form or anonymous beacon was submitted. See the implementation handoff for final commit IDs.

Capacity: local time during work was outside the user's 08:00–20:00 reserved window. Remaining Codex2 account percentage was not exposed by an available usage tool; no percentage is claimed.
