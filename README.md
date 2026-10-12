# JarvisCo — jarvisweb.lt

Static Astro 5 site for jarvisweb.lt (Lithuanian copy): the main business site plus the page that cold-SMS proof links land on. A visitor sees the real ArbCut results with original screenshots, the 199 € offer, plain costs and the owner, then replies by SMS or call. Mobile first, no WebGL, no animation libraries, no cookies.

Specs: [`docs/SPEC-2026-10-main-site.md`](docs/SPEC-2026-10-main-site.md) (current site) and [`docs/SPEC-2026-10-proof-site.md`](docs/SPEC-2026-10-proof-site.md) (proof rules, tracking, evidence). Approved design: [`docs/design/concept-2026-10-11.html`](docs/design/concept-2026-10-11.html). Tracked-link Worker: [`tracking/README.md`](tracking/README.md) (lives in the integration branch `rebuild-2026-10`).

## Pages

| URL | File | Purpose |
|---|---|---|
| `/` | `src/pages/index.astro` | Main site: hero, results bento, case study, offer, process, about, FAQ, contact |
| `/rezultatai` | `src/pages/rezultatai.astro` | Proof page every SMS link lands on (`/p/a…` → `/rezultatai?r=…`); results first, same offer and contact |
| `/arboristams` | `vercel.json`, `astro.config.mjs` | 301 to `/rezultatai` (old links and the CRM fallback template). Vercel should keep `?r=` (verify with `curl -sI <preview>/arboristams?r=a2345`); the static meta-refresh fallback drops it |
| `/privatumo-politika`, `/taisykles` | `src/pages/*.astro` | Legal pages (privacy covers per-recipient link codes) |
| `/404` | `src/pages/404.astro` | Not found |

There are no niche pages. A new tracked-link prefix needs a matching entry in the Worker (`tracking/`) and in `TRACKING_PREFIXES` in `src/data/tracking.js`; prefix `a` targets `/rezultatai`. The legacy `/atsiliepimas` review funnel was removed on purpose (review gating).

## Content

- `src/data/content.js` is the single text source (brand, offer, cost comparison, steps, FAQ, proof captions, page copy).
- `src/data/tracking.js` mirrors the Worker contract the page depends on (beacon endpoint `/t/e`, event types, code pattern, link prefixes). Keep it in sync with `tracking/`.
- `src/scripts/`: `track.ts` (reads `?r=<code>`, keeps it in `sessionStorage`, removes it from the address bar, sends beacons with `sendBeacon`), `zoom.ts` (tap-to-zoom dialog, never upscales an original), `inquiry-form.ts` (Web3Forms form), `effects.ts` (progressive effects; all of them stop under reduced motion).

## Proof sources

Only original screenshots are used, from the jarvisworks.co Drive folder `Work - WebAgency/ArbCut rezultatu vaizdai/`. The `01–03 *-maketas.png` mockups and the old `ArbCut-formos-rezultatai-2026-08-09.pdf` (contains AI redraws) must not be used.

- `src/assets/proof/`: crops/resizes of the originals. Crop boxes and sources per file: [`src/assets/proof/PROVENANCE.md`](src/assets/proof/PROVENANCE.md). Pixels are not edited.
- `public/assets/arbcut-irodymai-2026-10.pdf`: 3-page proof PDF printed from `src/assets/proof/irodymai-pdf.html` using only those files. Re-print it if a proof image changes.
- Figures: 20 form submissions (7 in August + 13 in September, Web3Forms), 573 clicks, and Search Console impressions shown as **11,4 tūkst.** — rounded, because the screenshot tile reads "11.4K" and the exact 11 362 is not visible in any capture. Do not write 11 362 on the site without a capture that shows it. The Google attribution of the 20 inquiries is not confirmed; the copy does not claim it.
- Google result screenshots carry the save date 2026-10-09 (file metadata), not a confirmed capture moment.

## Commands

Node 26 (`export PATH=/opt/homebrew/bin:$PATH`).

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # static output in dist/
npm run preview      # serve dist/ (run build first)
npm run check:copy   # forbidden/required copy in dist/ (needs a build)
npm run check:js     # gzipped JS budget per page (needs a build)
npm run check:static # links, anchors, IDs, images, form, tracking and redirect wiring (needs a build)
npm run check        # build + check:copy + check:js + check:static
```

- `check:js`: `/` ≤ 30 KB, every other page ≤ 15 KB gzipped JS, including imports and inline scripts. Do not raise the budgets.
- `check:copy`: blocks the old 500 €/47 € and `€/mėn.` monthly-plan offers, attributing the 20 form inquiries to Google, "20 … per 3 mėn.", invented reviews/names, hype words, exclamation marks and the Three.js/GSAP leftovers. The Paslaugos.lt PRO "~50 € kas mėnesį" comparison is explicitly allowed (self-tested on every run). It requires the figures (`20`, `573`, `11,4 tūkst.`, `5 %`, `8,2`, `199 €`, period and save dates), offer rows and FAQ on `/` and `/rezultatai`, and checks each H1's real `textContent` (no missing spaces).
- `check:static` is build-only. Layout, keyboard, reduced motion and Lighthouse need a browser (see the newest receipt under `docs/receipts/`).

## Local preview with tracking

`npm run preview` serves the static pages and is verified to work: the page renders and the tracked-link UI behaves, even though beacons fail. The static preview has no `/t/e` endpoint, because the Worker is not part of it, so beacon POSTs return errors there. This is expected and is not a page bug.

The Worker in `tracking/` handles only the API routes (`/p/*`, `/t/*`). It does not serve the static landing page, so running it locally does not give a full tracked flow. To test the full flow, use the deployed site behind the Cloudflare routes (`jarvisweb.lt/p/<code>`), or a dev reverse proxy that routes `/t/*` to the Worker and everything else to the site. No dev proxy is included.

## Testing rules

- No live form submission: `inquiry-form.ts` is tested with a stubbed `fetch`; never submit the real Web3Forms form.
- No SMS is sent from code, tests or scripts. Check the `sms:`/`tel:` buttons by tapping them on a phone; the number is the sending number +370 676 99395 (spec D2).
- Use synthetic codes (for example `a2345`) only.

## Deployment

- Hosting: Vercel (free plan). Astro is detected automatically (build `astro build`, output `dist`), no adapter. Domain: `jarvisweb.lt` (DNS on Cloudflare). Production deploys only after code review and a verified preview (see Testing rules and Commands).
- Analytics: Cloudflare Web Analytics (cookieless). Either set `PUBLIC_CF_ANALYTICS_TOKEN` in the build environment (Vercel project settings), or enable Cloudflare's automatic setup. With neither, no analytics script is emitted. The token is never committed.
- State (2026-10-12): production still serves the previous Vercel deployment. The new site is only local/preview; production waits for Jarvis's approval of a checked preview. The live Worker still sends `/p/a…` to `/arboristams`; the `/rezultatai` target is merged but not deployed, and the `/arboristams` 301 covers it once the new site is live.
- Tracking Worker: Cloudflare Worker + D1 on routes `jarvisweb.lt/p/*`, `jarvisweb.lt/t/*` and the `www.` equivalents, deployed from `tracking/`. The repo's `tracking/wrangler.toml` holds a placeholder `database_id`; the real production Wrangler config and the `EVENTS_TOKEN` JSON are kept privately outside the repo (`~/Library/Application Support/JarvisWeb/`, mode 0600). Never copy them, or any token value, into the repo. Steps and verification: `tracking/README.md`.
- Domain change: update `SITE_URL` in `astro.config.mjs` and `brand.url` in `src/data/content.js`.
