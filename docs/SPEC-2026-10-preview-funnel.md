# Preview funnel — wire spec (site ↔ Worker ↔ CRM)

2026-10-14 · lead: Claude Opus 5.5 (AI Powerhouse autonomous run) · source plan: main Drive `Personal Everything/research/2026-10-14-implementation-plan.md` §2.

Every stage builds against this file. Changes go through the lead; do not change a shape on your own.

## 1. Flow

SMS link `jarvisweb.lt/p/<code>` → Worker 302 → `/noriu?r=<code>` (landing: heating example site, results, big button "Taip, noriu nemokamos peržiūros") → form → `POST /t/form` → Worker stores in D1 (+ files in KV) → `GET /t/events` → CRM puller (every 5 min) → lead moves to Interested + task.

## 2. Per-niche switch = code prefix

- New prefix **`p`** → target **`/noriu`**. Existing `a` → `/rezultatai` is unchanged.
- Worker `PREFIXES` gets `p: '/noriu'`; CRM `PROOF_PREFIX_TARGETS` gets `p: '/noriu'`.
- A niche moves to the new flow when Jarvis sets its proof prefix to `p` (`set_niche_proof_prefix`). Codes already sent keep their old prefix and target.
- The site maps prefix → trade for the service checkboxes. `p` = heating (šildymas). No prefix (homepage) = free-text services.

## 3. Beacons (existing `POST /t/e`, JSON `{code,type}`)

New beacon type **`preview_cta`**: tap on the "Taip, noriu" button on `/noriu`. Same validation, bot classification and storage as the existing types.

## 4. `POST /t/form` (new, same origin as the site: `www.jarvisweb.lt/t/form`)

`multipart/form-data`. All text fields are trimmed; unknown fields are ignored.

| Field | Rule |
|---|---|
| `kind` | `preview_request` or `callback_request` (required) |
| `code` | 5-char proof code with a configured prefix, or empty (homepage form) |
| `name` | ≤ 80 chars, optional |
| `phone` | required when `code` is empty; optional otherwise. ≤ 20 chars, only digits, spaces, `+`, `-`, `(`, `)`; at least 8 digits |
| `services` | repeated, each ≤ 60 chars, max 12 |
| `services_other` | ≤ 200 chars |
| `area` | repeated, each ≤ 60 chars, max 12 |
| `area_other` | ≤ 200 chars |
| `photos_ok` | `yes`, `send_other` or empty |
| `standout` | ≤ 1000 chars |
| `contact_time` | `morning`, `day`, `evening`, `sms` or empty |
| `files` | repeated File, max 8, each ≤ 10 MB, total ≤ 25 MB. Allowed types: `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/heif`, `image/gif`, `application/pdf`, `.doc/.docx/.xls/.xlsx` MIME types, `text/plain`. The site downsizes images to ≤ 2000 px JPEG before upload when it can |
| `website` | honeypot; must be empty. When filled: respond 200 `{ok:true}` and store nothing |

- `callback_request` needs only `code` or `phone`; the other fields are optional and stored when given.
- Responses: `200 {ok:true,id:"<submission id>"}`; `400 {error:"invalid",field:"<name>"}`; `413 {error:"too_large"}`; `415 {error:"file_type"}`; `429 {error:"rate_limited"}`.
- Rate limit (lead decision 2026-10-14, stricter than beacons): 5 forms/min per code, 10/min for the no-code bucket, and a daily cap of 50 submissions and 300 MB of files in total; no IP, full UA or cookies stored (as today). `ua_class` is stored as for events.
- Storage: D1 table `submissions` (row id, code nullable, kind, at UTC, ua_class, payload JSON). Files in a **Workers KV** namespace `FILES` (free plan, no card), key `s/<submission uuid>/<n>` (opaque; the `/` is not percent-encoded; the form response `id` is this uuid, not the feed event id), metadata `{name,type,size}`. Retention: same 12-month window as events (KV `expirationTtl` 366 days). File names are sanitized (no control chars or `/`, ≤ 100 code points, `file` if empty).
- Why KV: R2 needs a payment method on the account; KV is on the free Workers plan. Free limits (1 GB stored, 1,000 writes/day) are far above expected volume.

## 5. `GET /t/events` additions (existing token, paging and cursor rules)

- New `type` values: `preview_cta`, `preview_request`, `callback_request`.
- `code` becomes nullable **only** for `preview_request` / `callback_request` from the homepage form.
- Events of those two types carry an extra field `submission`:

```json
{
  "id": "42", "code": "p7k3m", "type": "preview_request", "at": "2026-10-15T09:12:00.000Z", "ua_class": "human",
  "submission": {
    "name": "Tomas", "phone": null,
    "services": ["Katilų montavimas", "Šilumos siurbliai"], "services_other": null,
    "area": ["Kaunas", "Kauno r."], "area_other": null,
    "photos_ok": "yes", "standout": "15 metų patirtis", "contact_time": "evening",
    "files": [{"key": "s/0b8e…uuid/0", "name": "logo.png", "type": "image/png", "size": 48211}]
  }
}
```

Empty strings become `null`; empty lists stay `[]`.

## 6. `GET /t/files/<key>` (new)

Same Bearer token as `/t/events`. Returns the bytes with the stored `Content-Type`, `Content-Disposition: attachment`, `Cache-Control: no-store`. 404 for unknown keys. KV is eventually consistent: the CRM retries a 404 a few times over ~2 minutes right after ingest before marking the file missing. The CRM downloads every file once during ingest into the local data dir (`~/Library/Application Support/MultiPurpose CRM/files/<lead id>/`) and serves it to the web UI from there.

## 7. CRM behaviour

- `preview_request`: store the answers and file list on the lead; stage → **Interested** (forward only: never move a lead back from a later stage); create task **"Peržiūra iki {Vilnius date time, +48 h}"** due at +48 h.
- `callback_request`: stage → Interested (forward only); task **"Perskambinti"** (+ contact_time) due now.
- No code: match an existing lead by normalized phone; otherwise create a new lead (source `site_form`) so nothing is lost. Both appear on Today.
- New lead action **`preview_sent`** (UI button "Peržiūra išsiųsta"): records the event, completes the preview task, stage → **Offer sent**.
- **Link-preview fetches** are not human visits: a `proof_click` within 60 s of the message's `sent_at` with no `proof_view` from the same code in the following 10 minutes counts as `link_preview`, not as opened.
- Report per campaign/batch: sent → human visits → button taps (`preview_cta`) → form submits (`preview_request` + `callback_request`) → previews sent (`preview_sent`, and how many within 48 h) → paid.
- No automatic SMS anywhere in this flow.

## 8. Preview pages (site)

- Template route `/perziura/<slug>`; `<slug>` = random 10 chars from the proof-code alphabet (not the proof code, so previews are not guessable). `noindex,nofollow`, excluded from the sitemap, a fixed "PERŽIŪRA" banner, and no form posts anywhere real.
- Input file `previews/<slug>.json` (shape `PreviewInput`, see `scripts/preview` README): business name, phone, city/areas, services, standout, photos (paths), plus the §5 `submission` object.
- `npm run preview -- <input.json>` creates the slug and data file and prints the local URL; Jarvis edits texts, then deploys.
- The landing page shows the same template filled with demo heating data at `/pavyzdys/sildymas` (noindex) as the example site.

## 9. Not decided here (Jarvis)

- Privacy-policy text for form data and files (drafted by the site stage, approved by Jarvis before the form goes live in production).
- Lithuanian copy on `/noriu` (Jarvis checks).
