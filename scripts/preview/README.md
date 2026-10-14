# Preview generator (`npm run preview -- <input.json>`)

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

## Privacy: read before committing a real preview

The GitHub repo is **public**. A real `previews/<slug>.json` holds the lead's business data and the form `submission` (their name and answers), and committing it would also list every slug. Do not commit real previews until the lead agrees how they are deployed (for example a prebuilt deploy from a local checkout, or a private repo). Never use a real lead's data in example files.

## Testing the /noriu form locally

`node scripts/preview-form-stub.mjs [port]` (after `npm run build`) serves `dist/` and answers `POST /t/form` and `POST /t/e`, logging each field and file it receives. `STUB_STATUS=400|413|415|429|500` makes `/t/form` fail with that status to check the error messages. It stores nothing and sends nothing anywhere.
