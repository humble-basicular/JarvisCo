# Offer v2: wire spec (client sites + heating lead-gen ↔ Worker ↔ CRM)

2026-10-14 · lead: Claude Opus 5.5 (AI Powerhouse autonomous run) · source plan: main Drive `Personal Everything/research/2026-10-14-offer-v2-plan.md` §1–§3, stages V1–V3, V5, V7.

This **extends** `SPEC-2026-10-preview-funnel.md`; everything there stays valid. Every stage builds against this file. Shape changes go through the lead.

## 1. Site codes

- Every client site and every lead-gen site has one **site code**: `^[a-z][a-z0-9-]{2,31}$`, for example `arbcut` or `sildymas-kaunas`. It is not a secret.
- **Worker config** `SITES`: a JSON string var (private production toml; a fixture in tests):
  ```json
  {"arbcut": {"kind": "client", "origins": ["https://arbcut.lt", "https://www.arbcut.lt"]},
   "sildymas-kaunas": {"kind": "leadgen", "origins": ["https://example-sildymas.lt"]}}
  ```
  Origins are exact `scheme://host[:port]` strings. Adding a site = edit the var + deploy (runbook V5p). A Vercel preview URL may be added for a dry run.
- The **CRM** owns the mapping site code → workspace, lead (client sites), and lifecycle (§4). The Worker only checks the code and the origin.

## 2. Worker additions

### 2.1 `POST /t/form`: new kinds `site_inquiry` and `job_request`

`multipart/form-data`, same parsing, trimming, file and honeypot rules as the funnel spec §4.

| Field | `site_inquiry` (client site callback form) | `job_request` (lead-gen form) |
|---|---|---|
| `site` | required, configured code of kind `client` | required, configured code of kind `leadgen` |
| `code` | ignored | ignored |
| `name` | ≤ 80, optional | ≤ 80, optional |
| `phone` | **required**, same rule as today | **required** |
| `message` | ≤ 2000, optional | ≤ 2000, optional |
| `service` | ≤ 120, optional (what the customer needs) | ≤ 120, optional (problem, e.g. "Katilas neįsijungia") |
| `location` | ≤ 120, optional (town / district) | ≤ 120, optional (Kaunas district) |
| `brand` | ignored | ≤ 60, optional (boiler brand) |
| `contact_time` | same enum, optional | same enum, optional |
| `consent` | ignored | **must be `yes`** (data passed to the named partner) |
| `files` | same rules as today | same rules as today |
| `website` | honeypot | honeypot |

- Errors as today, plus: unknown/wrong-kind `site` → `400 {error:"invalid",field:"site"}`; `Origin` header missing or not in the site's `origins` → `403 {error:"origin"}`.
- **CORS** (these two kinds and the site beacons only): answer `OPTIONS` preflight for allowed origins; add `Access-Control-Allow-Origin: <that origin>`, `Vary: Origin`. No wildcard. Existing kinds stay same-origin.
- **No-JS fallback:** when the request's `Accept` does not contain `application/json`, success answers `303 Location: <Origin>/aciu` and any error answers `303 Location: <Origin>/aciu?klaida=1`. The JS path sends `Accept: application/json` and gets JSON as today.
- **Budgets:** per site, 5 submissions/min and 30/UTC day; all sites together ≤ 100 submissions and ≤ 300 file writes per UTC day (keeps KV under the free 1,000 writes/day). These kinds do **not** consume the existing jarvisweb.lt global cap (50/day), and jarvisweb.lt forms do not consume theirs. Same atomic D1 budget mechanism; no IP, full UA, cookie or phone in the limiter.
- Storage: same `submissions` table + KV keys; `site` stored on the row (migration).

### 2.2 `POST /t/e`: beacons from sites

- Body `{"site":"<code>","type":"cta_call"|"cta_sms"}` (sent as a `text/plain` sendBeacon string; the existing parser already accepts it). `code` and `site` are mutually exclusive.
- Same Origin check and CORS as §2.1. Rate limit per site: the existing 60 events/min window, keyed by site.

### 2.3 `GET /t/events`

- Every event gets a nullable **`site`** field (null for all existing proof-code events). When `site` is set, `code` is null.
- New types `site_inquiry` and `job_request` carry `submission`:
  ```json
  {"id":"97","code":null,"site":"arbcut","type":"site_inquiry","at":"2026-11-03T08:14:00.000Z","ua_class":"human",
   "submission":{"name":"Rasa","phone":"+37061234567","message":"Reikia nupjauti 2 beržus","service":null,
     "location":"Garliava","brand":null,"contact_time":"day","consent":false,
     "files":[{"key":"s/0b8e…uuid/0","name":"medis.jpg","type":"image/jpeg","size":812331}]}}
  ```
  Empty strings → `null`; `consent` is a boolean (`true` only when `yes` was posted).
- Beacons from sites appear as `{type:"cta_call"|"cta_sms", code:null, site:"arbcut"}` without `submission`.
- `GET /t/files/<key>` unchanged.
- The live CRM parser rejects unknown types and fields, so the **CRM ships first**, then the Worker (same order as before).

### 2.4 Email on the jarvisweb.lt preview form (Jarvis, 2026-10-15)

Applies to the existing `preview_request` and `callback_request` kinds (funnel spec §4). Two new optional fields:

| Field | Rule |
|---|---|
| `email` | ≤ 254 chars after trim, stored lower-case, must match `^[^\s@]+@[^\s@]+\.[^\s@]+$` |
| `preview_via` | `sms`, `email` or empty: where the lead wants the preview link |

- `preview_request`: `preview_via=email` requires `email` (`400 field:"email"`). `preview_via=sms` or empty keeps today's phone rule (phone required when `code` is empty). Without a code at least one way to reach them is required.
- `callback_request`: unchanged (needs `code` or `phone`); `email` is stored when given.
- Feed `submission` (funnel spec §5) gains `"email": "<string>|null"` and `"preview_via": "sms"|"email"|null`. Old rows without them are read as `null`.
- CRM: show both on the lead's answers; the preview task note ends with "→ el. paštu {email}" when `preview_via=email`. A homepage submission with email only creates a new `site_form` lead (no email matching in v1). **No automatic email** anywhere: Jarvis sends the link by hand.
- Order: CRM ships before the Worker emits these fields (the CRM parser is strict).

## 3. Client-site and lead-gen pages (V5, V7)

- **Client site** (generated, V5): a prominent callback form "Palikite numerį, perskambinsiu" with name, phone, message, files → `kind=site_inquiry`, `site=<code>`, posted to `https://www.jarvisweb.lt/t/form` with `Accept: application/json`. Call/SMS buttons send the §2.2 beacons. Thank-you on the page; no automatic SMS. On any error the page shows the business's `tel:` link ("Paskambinkite tiesiai"). Privacy line: the business is the controller, JarvisCo processes the form for it. Previews (`/perziura/<slug>`) keep inert forms and send nothing.
- **Lead-gen site** (V7): `kind=job_request`; consent checkbox text names the partner ("Sutinku, kad užklausa būtų perduota {partner}, kuris su manimi susisieks"). No phone number on the site in v1. No Google Business Profile.

## 4. CRM model and behaviour (V1 contracts, V3 server; Codex names the exact fields)

### 4.1 Sites
- `Site`: workspace, `site_code` (unique), `kind` `client` | `leadgen`, `lead_id` (client only), `domain`, `preview_url`, notes.
- Client lifecycle `status`: `preview` → `trial` → `paying` → `cancelled`, or `bought_out` from `trial`/`paying`. Lead-gen `status`: `active` | `paused`.
- Client billing fields: `live_at`, `trial_deadline` (= `live_at` + 3 calendar months in Europe/Vilnius, day clamped to month end), `trial_ends_at`, `first_inquiry_id`, `monthly_price` (EUR, default 39.00), `billing_day` (1–31, from the trial end date), `cancelled_at`, `offline_at`.
- **One free trial per business:** if the lead already had a site that reached `trial`, `go_live` goes straight to `paying` (billing starts at `live_at`).

### 4.2 Site inquiries
- Each `site_inquiry` event creates one `SiteInquiry`: site, `source_event_key`, `received_at`, submission + local files (same download/missing rules as today), `status` `pending` | `confirmed` | `rejected` | `duplicate`, `reject_reason` `spam` | `test` | `unrelated` | null, `confirmed_at`.
- **Dedup:** same site + same normalized phone + same Vilnius calendar day as an earlier non-rejected inquiry → `duplicate` automatically (kept and visible, never counts).
- Every non-duplicate inquiry → task "Persiųsti užklausą klientui: {lead name}" due now (Jarvis forwards by hand). For a site in `trial` the task note adds "Patvirtink → bandomasis baigiasi → sąskaita".
- **Confirm** (human only, §4.5): `pending` → `confirmed`. If the site is in `trial` and `received_at` < `trial_deadline`: `trial_ends_at = received_at`, `first_inquiry_id` set, status → `paying`, `billing_day` = Vilnius day of `trial_ends_at`, task **"Sąskaita: {lead name}, {price} € už mėnesį į priekį, apmokėti per 7 d."** due now. Later confirmations change nothing in billing.
- **Reject** (human only): `pending` → `rejected` with a reason.

### 4.3 Scheduled checks (inside the existing 5-minute loop, idempotent)
- `trial` and now ≥ `trial_deadline` → `trial_ends_at = trial_deadline`, status → `paying`, same invoice task.
- `trial` and `trial_deadline` − now ≤ 7 days → once: task "Bandomasis baigiasi {Vilnius date}: {lead name}".
- `paying` → once per billing month on `billing_day` (clamped): task "Sąskaita: {lead name} {YYYY-MM}, {price} €".
- **Cancel** (human only): from `trial` → `cancelled`, `offline_at` = now; from `paying` → `cancelled`, `offline_at` = next billing date. Task "Išjungti svetainę {domain}" due at `offline_at`.
- **Buy out** (human only): `trial`/`paying` → `bought_out`; task "Sąskaita: išpirkimas 199 €".

### 4.4 Monthly numbers per client site
Per Vilnius calendar month: inquiries (non-duplicate, non-rejected), confirmed inquiries, human `cta_call` taps, human `cta_sms` taps. Exposed in a read API + MCP read tool. Jarvis sends the "X užklausų, Y paspaudimų skambinti" SMS by hand.

### 4.5 Lead-gen
- `Partner`: workspace, name, phone (E.164), trade, areas, `status` `active` | `paused`, `free_leads` (default 3), price note, notes.
- `JobRequest` (one per `job_request` event): site, `source_event_key`, `received_at`, submission + files, `status` `new` | `with_partner` | `accepted` | `unplaced` | `rejected`, and `forwards[]`: partner, `sent_at`, `state` `sent` | `accepted` | `declined` | `returned`, `responded_at`, `contacted` (bool | null), `free` (bool), `billable` (bool), `refund_reason`.
- **One partner at a time:** a new forward is allowed only when no forward is `sent` or `accepted`. A lead is never sold twice.
- On ingest: task "Nauja užklausa (šildymas): {location}, {service}" due now.
- **Forward** (human): the UI shows a copyable text ("Klientas {location}, {brand} {service}, tel. {phone}. Imate?"); Jarvis sends it from his own phone. The CRM records `sent`, sets `with_partner`, and creates task "Partneris neatsakė? Grąžinti užklausą" due at `sent_at` + **2 staffed hours** (Mon–Fri 08:00–18:00 Europe/Vilnius; public holidays not handled in v1).
- **Accepted** → job `accepted`; `free` = true while the partner has free leads left (decrement), else `billable` = true at 10 € (report only); task "Ar susisiekė? {partner}" due next working day 10:00 Vilnius. **Declined / returned** → job back to `new`. **Unplaced** = nobody took it; Jarvis tells the customer. **Refund** (human) clears `billable` with a reason (fake / unreachable).
- Report: job requests per week, accepted within 2 staffed hours, contacted yes/no, free vs billable per partner.

### 4.6 Safety rules (unchanged hard rules)
- **No SMS from code** anywhere in §4: every message to a client, partner or customer is sent by Jarvis by hand.
- **Human-only actions** (web UI user session, not MCP agent credentials): confirm/reject inquiry, go-live, cancel, buy out, forward/accept/decline/return/refund. MCP may list/get everything, create a `Site` in `preview` and create/edit `Partner` notes.
- Unknown `site` code in the feed: store it as an orphan record + task "Nežinomas svetainės kodas {site}"; consume the event so the feed never blocks.
- DNC: an inquiry from a phone on the DNC list is still recorded (it's the client's customer, not our outreach target); DNC only governs our outgoing SMS.

## 5. Not decided here (Jarvis)
Lithuanian copy, partner name/terms, lead-gen domain, per-lead price after real calls, virtual numbers (v2), LT public holidays in the 2-hour clock.
