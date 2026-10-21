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
| `services` | (string \| `{name, text?}`)[] | ≤ 12 items, names ≤ 60 chars, supplied descriptions ≤ 400 chars. Falls back to `submission.services` + `submission.services_other`. At least one is required |
| `standout` | string | Optional, ≤ 1000 chars. One bullet per line, `;` or sentence. Falls back to `submission.standout` |
| `photos` | (string \| `{path, alt, ai?}`)[] | Optional: ≤ 12 real photos + ≤ 12 AI illustrations (`ai: true`). Paths are relative to the input JSON. The first photo is the hero image unless `v3.photo.hero` says otherwise |
| `tagline` | string | Optional, ≤ 120 chars. The H1; otherwise derived from supplied services + city |
| `lead` | string | Optional, ≤ 300 chars. The sentence under the H1; otherwise `<business> – <first services>. <where>` |
| `logo` | string \| `{path, line?}` | Optional. Path (relative to the input JSON, inside its folder, no symlink) to a square `.svg` or `.png` read on a light background; `line` (≤ 60) is set under the name. Shown in the header, on the hero photo seal, in the footer, as the tab icon and (real sites) on the About panel. SVGs must be static drawings (paths, shapes, text and local gradients/references; no CSS, animation, prefixed elements or alternate namespaces): no script, `on…` handler, foreignObject, DOCTYPE/entity, `@import`, `javascript:`/`data:` or external `href`/`url()`; PNGs and SVGs must fully decode; ≤ 200 KB and ≤ 16,777,216 decoded pixels (`checkLogoFile` in `normalize.mjs`, checked again by `client-site.mjs`) |
| `towns` | (string \| `{name, text?, …}`)[] | Optional, ≤ 12. A town **with its own `text`** (≤ 1000) gets a page: `/perziura/<slug>/<vietove>` in the preview, `/<vietove>/` on the client site. Towns without `text` get no page and no link: the generator never fills a town page by swapping the name in shared text. Optional per town: `slug` (default: ASCII of the name, `Kėdainiai` → `kedainiai`; unique, not `aciu`/`privatumo-politika`/`foto`/…), `loc` (locative, default derived: `Jonava` → `Jonavoje`), `heading` (≤ 120), `tagline` (the town page H1, ≤ 120), `lead` (≤ 300), `distance` (≤ 80, e.g. "Apie 30 km nuo Kauno"), `note` (≤ 300), `places` (≤ 12 nearby places), `services` (≤ 8 names shown as "Ką galite užsakyti"), `faq` (≤ 4, replaces the business FAQ additions on that page) |
| `about` | string | Optional, ≤ 1000 chars. "Apie" text; omitted when not supplied |
| `email` | string | Optional, shown in the contact block |
| `hours` | string | Optional, ≤ 120 chars |
| `brands` | string[] | Optional, ≤ 10. Only brands the client named |
| `accent` | `#rrggbb` | Optional brand colour, any shade. The template puts white or ink text on it, whichever reaches 4.5:1, and darkens it only when neither does (`src/templates/heating/accent.ts`) |
| `legal` | `{name, code, address}` | Optional, shown in footer, privacy page and schema |
| `reviews` | `{text, name, place?, source?, url?, date?}[]` | Optional, ≤ 6. Real quotes only; the section is hidden without them |
| `faq` | `{q, a}[]` | Optional, ≤ 8, appended to the standard questions |
| `qualifications` | string[] | Optional, ≤ 6, each ≤ 160 chars; supplied facts only |
| `prices` | `{name, price, note?}[]` | Optional, ≤ 10; names ≤ 80, prices ≤ 40, notes ≤ 160 chars |
| `priceNote` | string | Optional price conditions, ≤ 300 chars |
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

The normalised input plus `slug` and `created` (UTC). `photos` become `{src, width, height, alt?}` with `src` under `/previews/<slug>/`; the logo is copied as is to `/previews/<slug>/logo.svg|png` and saved as `logo: {src, line?}` (any other `logo.src` is refused). The page reads only this file at build time.

Town pages (`towns` with `text`): `src/pages/perziura/[slug]/[vietove].astro`, built from `src/templates/heating/town-pages.ts` and `parts/Town.astro`. Same rules as the preview home: PERŽIŪRA banner, noindex,nofollow, inert form, out of the sitemap. The preview home lists them under "Aptarnaujame" and in the footer; the header logo on a town page goes back to the preview home.

## 0. Source material from Paslaugos.lt (`scripts/grab-paslaugos-profile.mjs`)

```bash
node scripts/grab-paslaugos-profile.mjs https://paslaugos.lt/<profile> "<Drive>/Business/JarvisWeb/previews/<lead>/source"
```

Opens that one profile in headed Chrome with the CRM scraper's persistent profile (Playwright from `~/MultiPurpose CRM/node_modules`, override with `CRM_DIR`), refuses to start while the CRM scraper holds the profile, and on a bot check prints "Solve the check in the Chrome window, then press Enter" and waits for a person (it never works around it). Saves the full-size gallery photos in gallery order (`01.jpg`, … from the lightbox links, ≥ 0.6 s apart), `profile.json` (name, area, badges, full description, services with prices and notes, reviews verbatim with author and date, photo ids/sizes and service captions, source URL, UTC time) and `page-snapshot.html`. The out dir holds real lead data: keep it outside the repo. Paslaugos.lt stamps its logo on gallery photos; crop it off the picks (and ask the client for originals) before using them.

## 2. Live client site

```bash
node scripts/client-site.mjs previews/<slug>.json --site <code> --domain <domain>
# local test build against the stub (never deploy this one):
node scripts/client-site.mjs previews/<slug>.json --site <code> --domain <domain> --test http://localhost:4330
```

`npm run client-site -- ...` is the package alias. Add `--retain-build` when deletion is forbidden: this requires fresh output/stage paths, leaves staging artifacts for inspection, and never runs cleanup. Ordinary mode retains its existing replacement/cleanup behavior.

- `<code>`: site code, `^[a-z][a-z0-9-]{2,31}$` (offer-v2 spec §1). `<domain>`: bare host, e.g. `kauno-silumas.lt`.
- Input must be a `previews/<slug>.json` with a generated slug; photos come from `public/previews/<slug>/`. The lead's `submission` is dropped, so form answers never reach the published HTML.
- Output `client-sites/<slug>/`: `index.html`, `aciu/`, `privatumo-politika/`, `robots.txt`, `sitemap.xml`, `foto/` (photos and `logo.svg|png`), and `<vietove>/index.html` per town with text: canonical `https://<domain>/<vietove>/`, listed in `sitemap.xml`, linked from the home page ("Aptarnaujame") and every footer. The script fails if a town page, its canonical, its sitemap entry or its home link is missing. Indexable, canonical `https://<domain>/`, `HVACBusiness` JSON-LD, no banner, no cookies, one small inline script.
- The form posts `kind=site_inquiry`, `site=<code>` to `https://www.jarvisweb.lt/t/form` with `Accept: application/json`; a verified JSON receipt redirects to `/aciu`; explicit rejection shows "Paskambinkite tiesiai" + the business `tel:`. Without JS the Worker's 303 lands on `/aciu` or `/aciu?klaida=1`. Call/SMS links send `{site,type}` beacons (text/plain) to `/t/e`. SMS only shows for +3706… numbers.
- **Before going live** the code and origins must be in the Worker `SITES` var (spec §1), and Jarvis must approve the privacy text (`privatumo-politika.astro`, `PROCESSOR` in `content.ts`). Deploying is Jarvis's call; the script never deploys or posts.
- Test: `node scripts/preview-form-stub.mjs 4330 client-sites/<slug> &` then `node scripts/client-site-form-test.mjs` (headless Chrome: success, 500 error, beacons, `/aciu`). Screenshots: `node scripts/screenshot.mjs http://localhost:4330/ out/prefix` (390 and 1440 px, full page).

## Git-ignored (real data stays local)

`previews/*.json`, `public/previews/`, `client-sites/` are in `.gitignore`. Only `scripts/preview/example/` (fake) is committed. Real previews and client sites are built and deployed from the local checkout, when Jarvis decides. Real previews claim nothing that is not in the answers (no invented years, reviews, certificates, warranties or numbers); only the labelled demo uses demo values.

## Privacy: read before committing a real preview

The GitHub repo is **public**. A real `previews/<slug>.json` holds the lead's business data and the form `submission` (their name and answers), and committing it would also list every slug. Do not commit real previews until the lead agrees how they are deployed (for example a prebuilt deploy from a local checkout, or a private repo). Never use a real lead's data in example files.

## Testing forms locally

`node scripts/preview-form-stub.mjs [port] [root-dir]` (after `npm run build`; root-dir defaults to `dist/`) serves it and answers `POST /t/form` and `POST /t/e`, logging each field and file it receives. `STUB_STATUS=400|413|415|429|500` makes `/t/form` fail with that status to check the error messages. It stores nothing and sends nothing anywhere.


## H1 design and form behavior (2026-10-15)

One editorial template: service/location headline, contact actions, problem-first service links, supplied service descriptions, process, captioned images, optional facts/prices/reviews, areas, FAQ, upload-enabled callback form. With zero photos the hero becomes a business identity panel; with one it shows that image once; additional photos create a gallery. Empty credentials, reviews, prices and about sections are omitted. Fonts are local Instrument Sans (latin + latin-ext) and Barlow Condensed 600; existing dependencies/licences remain in use.

`demo.ts` alone imports the five object illustrations. Each is visibly labelled as AI-generated, never a real job; see `src/templates/heating/assets/PROVENANCE.md` for source hashes, derivatives and fictional demo facts. Demo/preview phone/email links do not dial/send, forms have no outgoing field names, no beacons run and pages stay noindex and out of the sitemap. Do not set `demo` on real client input; the generator does not accept it.

The upload list adds new picks, supports per-file removal, and preserves files after errors. Counts/types and 8 / 10 MiB / 25 MiB limits block sending before fetch. Optional brand/model and error-code fields compose into the existing `message` field (2,000 characters total); they do not invent new wire fields. At least eight phone digits are required. A send in progress ignores a second submit. Explicit 4xx rejection is retryable. Network failure, 5xx or malformed success is **uncertain**: retain the form, block a blind repeat, and offer the business phone. This is not server idempotency; reloading can still retry, and no cross-page retry guarantee is claimed. A session receipt gates the thank-you message; direct/no-JS visits stay neutral rather than pretending receipt.

### Future leadgen configuration boundary (not implemented or deployed)

`Mode` remains `preview | live` for this client-site task. The future matching site must use the same visual components, not a separate design: its brand/operator and partner disclosures replace business claims, no telephone/SMS number or CTA is rendered, all action links lead to intake, the wire changes to `kind=job_request`, `site` maps to a configured leadgen site, and required `consent=yes` names the one real partner. Operator `Organization`/matching `Service` replaces `HVACBusiness`; privacy/receipt text describes forwarding to that partner. No public leadgen route, dummy partner, hidden consent or automatic fallback is provided now. These are configuration requirements for V7 after Jarvis supplies the partner, not an available `--leadgen` flag.

### Safe acceptance entrypoints

- `node scripts/screenshot.mjs <local-url> <out-prefix> --retain-profile`: 390/1440 full-page PNGs; retains Chrome's temporary profile without cleanup.
- `npm run check`: production build, copy, JS budget and static checks. Under a no-delete constraint, rename an existing `dist/` into an ignored audit folder before rebuilding (Astro normally replaces output).
- `node scripts/heating-contract-test.mjs`: validates optional data (including `logo`/`towns` and the logo file check), demo honesty/indexing, five symlink attack cases, a logo + towns client-site fixture, and any local preview with towns in `dist/`. Retains fixtures and moves adversarial preview/photo inputs into the printed ignored evidence folder; never deletes them.
- `node scripts/image-size-test.mjs`: header parser cases, in memory.
- `scripts/heating-browser-check.js`: evaluate its complete expression through T3 `preview_evaluate` on a local `--test` client build served by `preview-form-stub.mjs`. Checks submission, upload, error, uncertainty, receipt and beacon behavior against the local stub only; no browser launch or filesystem cleanup. Synthetic iframe state is removed afterward.
- Legacy `client-site-symlink-test.mjs` and `client-site-form-test.mjs` delete their temporary filesystem fixtures/profile; skip those under a no-delete instruction. The latter also launches standalone Chrome. Use the retained-fixture and T3 alternatives above; do not relax the checks.

Browser screenshots and checks cannot establish real iPhone/Android HEIC or screen-reader behavior. Lighthouse, production delivery and final legal/business facts require separate evidence before launch. Demo's deliberate `noindex` must not be removed to improve its SEO score.

## Template v3 (`v3` block, optional)
Add `"v3": {…}` to the input and the preview (home + town pages) renders on template v3
instead of the heating template. Shape: `V3Input` in `src/templates/v3/content.ts`; checked by
`v3()` in `normalize.mjs`. Example: the demo in `src/templates/v3/demo.ts` (`v3`).
- `theme`: the theme card (`src/templates/v3/theme.ts`). Make each client unique by combination:
  palette, `heading` font, `divider`, `hero` (`photo` needs a sharp ≥1400 px photo; `panel` suits
  phone photos), `services` (`tiles` needs one matching photo per service; else `cards`), `logo.shape`/`glyph`.
- Copy: `h1`, `heroChecks`, `trust` (3–5), `aboutTitle`, `steps` (3–5), `ctaTitle`, `ctaText` are required;
  only the client's own facts (no invented reviews, numbers, warranties).
- `photo`: indexes into `photos` for hero, pins (panel hero), about, faq, cta.
- Photo quality rule (Jarvis 2026-10-21): emphasised slots – hero and CTA backgrounds (≥ 1400 px) and
  service tiles (≥ 1000 px) – take a sharp real photo or an AI illustration (`ai: true`). AI images show
  the type of work only (no faces, logos, text, vans or credentials), never enter the work gallery or hero
  pins, and switch on a footer disclosure. `validateSaved` refuses a preview that breaks this.
  The FAQ photo counts as emphasised too (≥ 1000 px). Width alone does not prove sharpness: photos
  taken from Paslaugos.lt are often upscaled phone shots – look at every emphasised photo at full
  size and use an AI illustration when it is soft (Nerijus FAQ photo replaced 2026-10-21).
- Reviews: real quotes from `reviews` get their own section (`#atsiliepimai`); `v3.gbp.url` / `v3.gbp.reviewUrl`
  (https) add "Atsiliepimai Google" / "Palikti atsiliepimą" buttons. Without them the section shows
  "Google atsiliepimai – netrukus".
- Map: a live Google map loads with the page (no click step), pinned on the base town (town pages: that
  town). Once the Google Business Profile exists set `v3.map.query` to its name + address (optional `zoom` 5–18).
  Previews only (user decision 2026-10-21). Before a live launch: the embed sends visitor data to Google
  without consent; the launch gate needs a consent decision (load on existing Maps consent, otherwise a
  first-party pin map + outbound Google link) and a real privacy policy. Unresolved; do not ship as is.
- AI photos are refused without the `v3` block (the heating renderer would show them as real work).
- Rebuilding an already shared preview: `npm run preview -- <input.json> --slug <slug>` keeps the link.
