# jarvisweb.lt main business site — spec v2

Date: 2026-10-11 · Owner: Jarvis (Matas Bašinskas) · Author: Claude parent
Supersedes `SPEC-2026-10-proof-site.md` §3.2 (home) and §5 (design) for every page except the SMS landing page budgets noted below. §2 "what the old site got wrong", §4 tracking, §6 legal and §7.10 tone still apply.

## 1. What Jarvis asked for (2026-10-11)

The first rebuild turned the whole site into a copy of the proof PDF: one plain page, light theme, system font. Jarvis rejected it: "too simple and basic, and the design is also poor". The home page must be **the main business site** like the old jarvisweb.lt (full agency site: navigation, hero, services, case study, process, about, FAQ, contact), but **fancy** and with **current information**: the 199 € offer and the real ArbCut results. Rethink everything; do not copy the PDF.

## 2. Pages

Decided by Jarvis 2026-10-11 17:23: **no niche pages.** One main site plus one results page that every SMS links to.

| Route | Purpose | Notes |
|---|---|---|
| `/` | Main business site; results are the highlight | Sections in §3 |
| `/rezultatai` | The SMS landing page for every niche: states clearly everything a prospect needs and wants to know | §3a |
| `/arboristams` | Retired | 301 → `/rezultatai` (old links and the CRM fallback template keep working) |
| `/privatumo-politika`, `/taisykles`, `404` | Legal / error | New design system, text unchanged |

Remove `src/pages/[niche].astro` and the `niches` data. Tracking: prefix `a` (and any future prefix) targets `/rezultatai` in both `tracking/src/index.ts` and `src/data/tracking.js`; beacon contract otherwise unchanged.

## 3a. `/rezultatai`

Generic copy (no niche wording in headings), same design system as `/`. Order: the headline number (20 užklausų per 3 mėnesius) and price → every ArbCut result with its original screenshot, date and honest note (zoom, PDF link, arbcut.lt link) → what 199 € buys → costs table and ownership → 5 steps → who Matas is → FAQ → SMS/call buttons and form. It continues the SMS: same number first, same price, same payback idea. Sticky SMS/call bar on mobile. Fires the existing beacons (`view`, `scroll_proof`, `cta_sms`, `cta_call`, `pdf`, `arbcut`).

## 3. Home sections (`/`)

1. **Header**: sticky, translucent on scroll; logo, anchors (Paslaugos, Rezultatai, Kaina, Procesas, Apie, D.U.K.), CTA „Susisiekti". Mobile: menu sheet + sticky SMS/call bar.
2. **Hero**: strong headline about getting clients from Google for local service businesses, sub line, price line „199 € vieną kartą, be mėnesinių mokesčių", two CTAs (Parašyti SMS / Peržiūrėti rezultatus). Visual: device mockups built from the real `arbcut-desktop.webp` / `arbcut-mobile.webp`, with floating stat chips (20 užklausų, 573 paspaudimai) that link to the results section.
3. **Results** (bento grid): 20 form inquiries (Aug + Sep 2026), 573 clicks and 11 362 impressions (Search Console, 2026-07-05 – 2026-10-04), Kaunas and Jonava Google results. Count-up numbers, each tile opens its original screenshot (zoom). Honest notes in small text (proof spec §3.1.2).
4. **Case study**: ArbCut — who (arborist Mantas Gerulis, Kaunas/Jonava), what was built, what happened; links to `/rezultatai` and arbcut.lt.
5. **Services / offer**: the 199 € website package as a premium card: what is included (proof spec §3.1.3), costs table and ownership line (§3.1.4), Paslaugos.lt PRO comparison. „Kam tinka": local service businesses, examples as text (medžių darbai, vejos priežiūra, …), no logos.
6. **Process**: 5 steps (proof spec §3.1.5) as a visual timeline. No delivery time, no payment split.
7. **About**: photo, Matas Bašinskas, Kaunas, individuali veikla, works alone end to end; Google Business Profile link.
8. **FAQ**: accordion, answers from proof spec §3.1.7.
9. **Contact**: SMS / call / e-mail buttons + Web3Forms form.
10. **Footer**: name, „Individuali veikla", contacts, legal links, socials from `brand`.

## 4. Design direction

- Premium agency look, not a document. Dark hero (deep ink with a soft green/teal aurora gradient and subtle grain, CSS only) flowing into light content sections; bento cards, layered device mockups, generous whitespace, large display type.
- One self-hosted variable display font with Lithuanian glyphs (e.g. via `@fontsource-variable/*`, subset latin-ext, `font-display: swap`) plus a system or same-family body font.
- Motion: CSS only where possible: scroll-reveal (`animation-timeline: view()` with an IntersectionObserver fallback), hover lift/tilt on cards and mockups, count-up on result numbers. All motion off under `prefers-reduced-motion`.
- Keep brand green as the accent family; contrast WCAG AA everywhere; tap targets ≥ 48 px; body ≥ 17 px.
- No WebGL, Three.js, GSAP or animation libraries.

## 5. Budgets and checks

| | `/` | `/rezultatai` |
|---|---|---|
| JS (gzip) | ≤ 30 KB | ≤ 15 KB |
| Lighthouse mobile Performance / Accessibility | ≥ 90 / ≥ 95 | ≥ 95 / ≥ 95 |
| CLS | < 0.05 | < 0.05 |

Also: `npm run check` (build + copy + JS budget, budgets updated per page), no horizontal scroll at 360 px, keyboard and screen-reader pass on menu/accordion/zoom, `git diff --check`, screenshots of `/` and `/rezultatai` at 390 px and 1440 px for Jarvis.

## 6. Content rules (unchanged)

- No 500 €, 47 €/mėn, monthly plans, automations, missed-call SMS, review funnels, invented reviews, the Mantas quote, fake logos or unverified numbers. Every number has its original screenshot on the same page. Never use the `01–03 *-maketas.png` redraws.
- Lithuanian, formal „Jūs", plain tone, no exclamation marks, no hype words.
- One content file (`src/data/content.js`) remains the single text source.

## 7. Do not touch

`tracking/**`; the beacon contract in `src/scripts/track.ts` and `src/data/tracking.js` (event types, `?r=` capture and removal); `sms:`/`tel:` hrefs and the sending number; the Web3Forms key; the privacy text about link codes. Production deploy only after Jarvis approves a preview.
