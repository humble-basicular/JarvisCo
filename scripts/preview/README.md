# Preview + client-site generator

One heating template (`src/templates/heating/`) makes two outputs: the lead preview at `/perziura/<slug>` and the live client site (standalone static folder). The demo at `/pavyzdys/sildymas` uses the same template with invented values (`src/templates/heating/demo.ts`).

## 1. Preview (`npm run preview -- <input.json>`)

Turns one `PreviewInput` JSON into a lead's preview site at `/perziura/<slug>` (funnel spec §8). The slug is 10 random characters from the proof-code alphabet (`23456789abcdefghjkmnpqrstuvwxyz`), so previews cannot be guessed from proof codes.

```bash
export PATH=/opt/homebrew/bin:$PATH
npm run preview -- scripts/preview/example/example.json   # fake data, safe to run
npm run dev                                               # open the printed URL
```

The script:

1. validates the input (rules below) and stops with a clear message on the first problem;
2. writes `previews/<slug>.json`;
3. copies each photo to `public/previews/<slug>/<n>.jpg`: EXIF-rotated, at most 1600 px, JPEG, metadata (GPS etc.) stripped;
4. prints the local and live URLs.

Then edit the texts in `previews/<slug>.json` if needed (they are plain JSON) and rebuild. `npm run preview` **without** a JSON file still serves `dist/` (the old `astro preview`).

## `PreviewInput`

| Field | Type | Rule |
|---|---|---|
| `business` | string | Required, ≤ 80 chars. Shown as the site name |
| `phone` | string | Required (or `submission.phone`). ≤ 20 chars, digits/spaces/`+ - ( )`, ≥ 8 digits. Shown, never dialled |
| `city` | string | ≤ 60 chars. Required when `areas` is empty; defaults to the first area |
| `areas` | string[] | ≤ 12 items, each ≤ 60 chars. Falls back to `submission.area` + `submission.area_other` (comma-separated) |
| `services` | string[] | ≤ 12 items, each ≤ 60 chars. Falls back to `submission.services` + `submission.services_other`. At least one is required |
| `standout` | string | Optional, ≤ 1000 chars. One bullet per line, `;` or sentence. Falls back to `submission.standout` |
| `photos` | (string \| `{path, alt}`)[] | Optional, ≤ 12. Paths are relative to the input JSON. The first photo is the hero image |
| `tagline` | string | Optional, ≤ 120 chars. The H1; default "Šildymo sistemų montavimas, remontas ir priežiūra" |
| `about` | string | Optional, ≤ 1000 chars. "Apie mus" text; a plain default is used otherwise |
| `email` | string | Optional, shown in the contact block |
| `hours` | string | Optional, ≤ 120 chars |
| `brands` | string[] | Optional, ≤ 10. Only brands the client named |
| `accent` | `#rrggbb` | Optional brand colour; refused when white text on it is below 4.5:1 |
| `legal` | `{name, code, address}` | Optional, shown in footer, privacy page and schema |
| `reviews` | `{text, name, place?}[]` | Optional, ≤ 6. Real quotes only; the section is hidden without them |
| `faq` | `{q, a}[]` | Optional, ≤ 8, appended to the standard questions |
| `submission` | object | Optional: the `submission` object from `GET /t/events` (spec §5), copied into the output as is |

Top-level fields win; missing ones are filled from `submission`. Photos from the form (`submission.files`) are KV keys, not paths: download them through the CRM first and list the local paths in `photos`.

## Example (fake data)

[`example/example.json`](example/example.json), with two drawn placeholder photos in `example/photos/`:

```json
{
  "business": "Pavyzdinis Šildymas",
  "phone": "+370 600 00000",
  "city": "Kaunas",
  "areas": ["Kaunas", "Kauno r.", "Jonava"],
  "services": ["Katilų montavimas", "Katilų remontas", "Šilumos siurbliai", "Grindinis šildymas"],
  "standout": "10 metų patirtis\nGarantija darbams 2 metai\nAtvykstame per 24 valandas",
  "photos": [{ "path": "photos/katiline.jpg", "alt": "Sumontuota katilinė" }, "photos/radiatorius.jpg"],
  "submission": { "name": "Testas", "phone": null, "services": ["Katilų montavimas"], "services_other": null,
    "area": ["Kaunas"], "area_other": null, "photos_ok": "send_other", "standout": "10 metų patirtis",
    "contact_time": "evening", "files": [] }
}
```

## Output: `previews/<slug>.json`

The normalised input plus `slug` and `created` (UTC). `photos` become `{src, width, height, alt?}` with `src` under `/previews/<slug>/`. The page reads only this file at build time.

## 2. Live client site

```bash
node scripts/client-site.mjs previews/<slug>.json --site <code> --domain <domain>
# local test build against the stub (never deploy this one):
node scripts/client-site.mjs previews/<slug>.json --site <code> --domain <domain> --test http://localhost:4330
```

(`npm run client-site -- ...` needs one line in the root `package.json`: `"client-site": "node scripts/client-site.mjs"`; root package files belong to V4, so it is not added here.)

- `<code>`: site code, `^[a-z][a-z0-9-]{2,31}$` (offer-v2 spec §1). `<domain>`: bare host, e.g. `kauno-silumas.lt`.
- Input must be a `previews/<slug>.json` with a generated slug; photos come from `public/previews/<slug>/`. The lead's `submission` is dropped, so form answers never reach the published HTML.
- Output `client-sites/<slug>/`: `index.html`, `aciu/`, `privatumo-politika/`, `robots.txt`, `sitemap.xml`, `foto/`. Indexable, canonical `https://<domain>/`, `HVACBusiness` JSON-LD, no banner, no cookies, one small inline script.
- The form posts `kind=site_inquiry`, `site=<code>` to `https://www.jarvisweb.lt/t/form` with `Accept: application/json`; the thanks box replaces it, any error shows "Paskambinkite tiesiai" + the business `tel:`. Without JS the Worker's 303 lands on `/aciu` or `/aciu?klaida=1`. Call/SMS links send `{site,type}` beacons (text/plain) to `/t/e`. SMS only shows for +3706… numbers.
- **Before going live** the code and origins must be in the Worker `SITES` var (spec §1), and Jarvis must approve the privacy text (`privatumo-politika.astro`, `PROCESSOR` in `content.ts`). Deploying is Jarvis's call; the script never deploys or posts.
- Test: `node scripts/preview-form-stub.mjs 4330 client-sites/<slug> &` then `node scripts/client-site-form-test.mjs` (headless Chrome: success, 500 error, beacons, `/aciu`). Screenshots: `node scripts/screenshot.mjs http://localhost:4330/ out/prefix` (390 and 1440 px, full page).

## Git-ignored (real data stays local)

`previews/*.json`, `public/previews/`, `client-sites/` are in `.gitignore`. Only `scripts/preview/example/` (fake) is committed. Real previews and client sites are built and deployed from the local checkout, when Jarvis decides. Real previews claim nothing that is not in the answers (no invented years, reviews, certificates, warranties or numbers); only the labelled demo uses demo values.

## Privacy: read before committing a real preview

The GitHub repo is **public**. A real `previews/<slug>.json` holds the lead's business data and the form `submission` (their name and answers), and committing it would also list every slug. Do not commit real previews until the lead agrees how they are deployed (for example a prebuilt deploy from a local checkout, or a private repo). Never use a real lead's data in example files.

## Testing forms locally

`node scripts/preview-form-stub.mjs [port] [root-dir]` (after `npm run build`; root-dir defaults to `dist/`) serves it and answers `POST /t/form` and `POST /t/e`, logging each field and file it receives. `STUB_STATUS=400|413|415|429|500` makes `/t/form` fail with that status to check the error messages. It stores nothing and sends nothing anywhere.
