# jarvisweb.lt rebuild + tracked proof links — spec v1

Date: 2026-10-11 · Owner: Jarvis (Matas Bašinskas) · Spec author: Claude (CRM session B1)
Repo: `~/Work/Code projects/JarvisCo` (github.com/jarvisworksco/JarvisCo) · Domain: jarvisweb.lt (DNS on Cloudflare, site currently on Vercel)

## 1. Why

Cold SMS to Paslaugos.lt service businesses (arborists first) ends with a link. The person who taps it must see, in under a minute on a phone, everything needed to trust the offer: the real result, the proof, what 199 € buys, what it costs later, and who Matas is. Then reply by SMS or call.

Each SMS carries a **per-lead link** (`jarvisweb.lt/p/<code>`). A click is logged and later shown in the CRM on that lead ("viewed proof"). This measures interest per lead and per template before anyone replies.

First real batch is planned for 2026-10-12, send window 10:00–17:00 Europe/Vilnius. Order of work: (1) `/arboristams` page live, (2) §4 Worker live, (3) generic home page. The home page may land after the batch; `/arboristams` and the Worker may not.

**Fallback if the CRM `{proof_link}` variable (§4.3) is not ready by the batch:** the SMS uses the plain link `jarvisweb.lt/arboristams` (no per-lead tracking; page analytics only). Per-lead links switch on for the next batch. Neither side blocks the other.

The first SMS that lands here (exact text, approved 2026-10-11):

```
20 uzklausu del medziu darbu per 3 menesius.

Sveiki, cia Matas. Tiek uzklausu sulauke mano kurta svetaine arboristui Mantui Geruliui, arbcut.lt.

Tokia svetaine galiu sukurti ir jums. Klientai jus rastu Google ir skambintu tiesiai, papildomai prie Paslaugos.lt.

Kaina 199 EUR viena karta, be menesiniu mokesciu. Uztenka vieno uzsakymo, kad atsipirktu, o svetaine lieka jusu ir dirba toliau.

Ar jums tai butu naudinga?

Rezultatai: jarvisweb.lt/p/<code>
```

The page must continue this message: same number first, same price, same payback idea, same plain tone.

## 2. Approach: full rebuild

Rebuild the whole site from scratch on current best practice (Astro 5 static, minimal JS, mobile first). Do not patch the old components; they are five months old and built for a different offer. Reuse only the assets listed under "Keep". The table lists what the old site got wrong, so none of it comes back.

### What the current site got wrong

| Problem | Where | Why it must go |
|---|---|---|
| 500 € one-off + 47 €/month plan | `src/data/content.js:74`, `:97`, `:250` | Contradicts the SMS offer (199 € one-off, no monthly fee). |
| Six invented reviews (Tomas Kazlauskas, Rūta Vaitkutė, …) | `content.js` `reviews.items` | Fabricated reviews are illegal in the EU/LT (unfair commercial practices) and destroy trust if noticed. |
| Mantas Gerulis quote | `content.js` case study `quote`, `reviews.items[0]` | Not given by Mantas. Use only if he provides one in writing. |
| Unverified numbers "TOP pozicijos", "5,0★", "100+ atsiliepimų", "<1 s" | case study `results` | Every number on the site must be backed by a screenshot or link. |
| Review funnel `/atsiliepimas` (1–3★ diverted, 4–5★ to Google) | `src/pages/atsiliepimas.astro` | "Review gating" breaks Google's review policy. Delete the page. |
| "Missed-call SMS", review automation, growth subscription | services, FAQ | Not offered in this test. |
| Three.js particle hero + GSAP | `Hero.astro`, `animations.js` | Heavy on older phones on mobile data; this traffic comes from SMS on phones. |

Keep (assets only): Matas's photos, `arbcut-*.webp` screenshots, Web3Forms access key, `brand` contact data, Google Business Profile link, the idea of one content file as the single text source, privacy/terms pages rewritten per §6, sitemap. Everything else is new: layout, components, styles, copy.

The repo has uncommitted changes (`src/components/InquiryForm.astro`, `src/scripts/email_validation.js`). Ask Jarvis before discarding them; commit the rebuild on a new branch (`rebuild-2026-10`).

## 3. Pages and content

Language: Lithuanian, formal "Jūs", diacritics allowed (only SMS is GSM-7). Tone: plain, concrete, no hype words ("geriausi", "revoliucinis").

### 3.1 `/arboristams` — the page SMS links land on (build first)

Order of sections, mobile first:

1. **Hero**
   - H1: „20 užklausų dėl medžių darbų per 3 mėnesius"
   - Sub: „Tiek per rugpjūtį ir rugsėjį sulaukė mano sukurta svetainė arboristui Mantui Geruliui – arbcut.lt. Tokią pačią galiu sukurti ir Jums."
   - Price line: „199 € vieną kartą. Be mėnesinių mokesčių."
   - Payback line: „Užtenka vieno užsakymo, kad atsipirktų. Svetainė lieka Jūsų ir dirba toliau."
   - Comparison (small, under the costs table in 3.1.4): „Palyginimui: Paslaugos.lt PRO kainuoja apie 50 € kas mėnesį." (verified in Jarvis's account: €49.99/month, 2026-10-06).
   - Buttons: „Parašyti SMS" and „Skambinti" (§3.4). Small round photo of Matas + „Matas Bašinskas".
2. **Proof** — real captures only, each with caption and date:
   - Web3Forms: August 7 + September 13 submissions = 20 (`11-web3forms-rugpjutis-original.png`, `10-web3forms-rugsejis-original.png`).
   - Google Search Console, arbcut.lt, 2026-07-05 – 2026-10-04: 573 paspaudimai, 11 362 parodymai (`12-google-search-console-original.jpg`).
   - Google results for Kaunas and Jonava, with capture date (`14-google-kaunas-original.jpg`, `13-google-jonava-original.jpg`).
   - Source folder: jarvisworks.co Drive `Work - WebAgency/ArbCut rezultatu vaizdai/`. **Never use `01–03 *-maketas.png`** (AI redraws, not proof).
   - Honest notes in small text: „Tai formos užklausos, ne visos tapo užsakymais." „Tai vieno kliento rezultatas, ne garantija." „Paspaudimai nėra užklausos."
   - Link „Aplankyti arbcut.lt" and „Atsisiųsti įrodymus (PDF)" (`ArbCut-formos-rezultatai-2026-08-09.pdf`, or its rebuilt version).
   - Images: compressed WebP, tap to zoom (lightweight, no library over 5 KB).
3. **What you get for 199 €** (from the agreed offer):
   - Pagrindinis puslapis su paslaugomis, darbų pavyzdžiais ir kontaktais
   - Iki 3 aptarnaujamų vietovių puslapių
   - Užklausos forma
   - Pritaikymas telefonui, paieškos (SEO) pagrindai
   - Vienas korekcijų etapas
4. **Costs, plainly** (small table):
   | | |
   |---|---|
   | Sukūrimas | 199 € vieną kartą |
   | Domenas | 15 € per metus, registruojamas Jūsų vardu |
   | Talpinimas | 0 € |
   | Mėnesinis mokestis | Nėra |
   Line under it: „Svetainė, failai ir domenas – Jūsų. Galite ją perkelti kur norite."
5. **How it goes** (5 short steps): Atsakote į SMS → trumpai aptariame paslaugas ir vietoves → atsiunčiu rašytinį pasiūlymą → kuriu, Jūs peržiūrite, viena korekcija → perduodu svetainę ir prieigas. No delivery time promised. No payment split stated (not decided).
6. **Who I am**: photo, „Matas Bašinskas, Kaunas. Individuali veikla. Svetaines kuriu pats ir atsakau pats – be tarpininkų." Link to Google Business Profile (`brand.gbp`), phone, e-mail.
7. **FAQ** (short answers):
   - Ar garantuojate klientų? — „Ne. Konkretaus skaičiaus nežadu. Rezultatas priklauso nuo vietovės, konkurencijos, sezono ir paslaugų. Galiu parodyti, ką gavo Mantas."
   - Paslaugos.lt man ir taip veikia. — „Jo atsisakyti nereikia. Svetainė – papildomas kanalas, kur klientai kreipiasi tiesiogiai Jums."
   - Jau turiu svetainę. — „Tada šis pasiūlymas gali netikti. Jei ji neatneša užklausų, parašykite – pasižiūrėsiu."
   - Kas priklausys man? — ownership line from §3.1.4.
   - Ką reikės pateikti? — „Paslaugas, vietoves, kelias darbų nuotraukas ir kontaktus. Tekstus parašysiu pats."
   - O jei vėliau reikės pakeitimų? — **DECISION OPEN (Jarvis)**. Default text: „Mėnesinio mokesčio nėra. Po paleidimo 30 dienų smulkius pataisymus darau nemokamai. Vėliau – susitarsime atskirai, tik jei to norėsite."
   - Kodėl tokia kaina? — „Tai nedidelės, aiškios apimties svetainė. Sudėtingos sistemos į 199 € neįeina."
8. **Final CTA**: „Ar tai Jums būtų naudinga? Parašykite – atsakau pats." + the two buttons.

### 3.2 `/` — generic home

Same layout and components as `/arboristams`, generic copy: hero „Svetainė paslaugų verslui – 199 € vieną kartą", ArbCut as the case study, same costs/steps/FAQ. Niche list may stay as text, no fake logos. Remove `ChatWidget` unless it works end to end.

### 3.3 Niche pages later

Build `/arboristams` from a data object (`niches.arboristai = { h1, sub, proof[], faq[] }`) so the next niche (`/vejos-prieziura`, …) is a new data entry, not new components.

### 3.4 Contact buttons

- Sticky bottom bar on mobile (≤ 768 px): „Parašyti SMS" = `sms:<phone>?&body=Sveiki, domina svetainė` (works on Android and iOS), „Skambinti" = `tel:<phone>`.
- **DECISION OPEN (Jarvis):** `<phone>` must be the number the SMS was sent from (the S24 TELE2 SIM). Site currently shows +370 676 99395 — confirm it is that SIM.
- Keep the Web3Forms inquiry form lower on the page for people who prefer it.

## 4. Tracked links (`/p/<code>`)

Runs as a **Cloudflare Worker** on the routes `jarvisweb.lt/p/*`, `www.jarvisweb.lt/p/*`, `jarvisweb.lt/t/*` and `www.jarvisweb.lt/t/*` (Vercel redirects the apex to `www`, so both hosts need the routes) (the domain is already proxied by Cloudflare), with **D1** for storage. Independent of where the static site is hosted. Free tier.

### 4.1 Link format
- `jarvisweb.lt/p/<code>`, no `https://`, no `www` in the SMS (saves characters).
- `<code>` = 5 chars, lowercase, alphabet `23456789abcdefghjkmnpqrstuvwxyz` (no 0/o/1/l/i). First char = niche prefix (`a` = arboristai). Generated by the CRM, one per lead, never reused.
- Worker config `prefixes: { a: '/arboristams' }`; unknown prefix or malformed code → redirect to `/`.

### 4.2 Endpoints
| Method/path | Does | Auth |
|---|---|---|
| `GET /p/:code` | Insert `click(code, at, ua_class)`; 302 to `<target>?r=<code>` | public |
| `POST /t/e` | Beacon from the page: `{code, type}`, `type` ∈ `view`, `scroll_proof`, `cta_sms`, `cta_call`, `pdf`, `arbcut` | public, rate-limited per code |
| `GET /t/events?since=<ISO>&limit=500` | Events since time, oldest first, for the CRM to pull | `Authorization: Bearer <token>` (Worker secret) |

- `ua_class`: `bot` when the user agent matches link-preview/scanner bots (facebookexternalhit, WhatsApp, TelegramBot, Slackbot, Twitterbot, SkypeUriPreview, Googlebot, bingbot, Google-PageRenderer, generic `bot|crawler|spider|preview`), else `human`. A click counts as a real view only when a `view` beacon arrives (bots rarely run JS).
- Page JS: read `r` from the URL, store it in `sessionStorage`, remove it from the address bar (`history.replaceState`), send beacons with `navigator.sendBeacon`. No cookies.
- Stored per event: code, type, UTC time, ua_class. **No IP, no full user agent.** Retention 12 months.
- Times in UTC.

### 4.3 CRM side (not in this repo — Codex, via the CRM board)
- Lead gets `proof_code`; template variable `{proof_link}` renders `jarvisweb.lt/p/<proof_code>`; GSM-7 counter counts the rendered length.
- Server pulls `/t/events` every 5 min (outbound only; the CRM stays LAN-only); records `proof_viewed` etc. as lead events; lead card, Today and campaign report show views per lead and per template/variant.
- Worker token stored in CRM settings, never committed.

## 5. Design and performance

- Mobile first (360–430 px), then desktop. Light theme, high contrast, body text ≥ 17 px, large tap targets (≥ 48 px).
- Visual hierarchy: the number and the price are the two biggest things on the screen. Proof screenshots right below the hero.
- No WebGL, no animation libraries; CSS transitions only. Total JS ≤ 15 KB gzipped (beacon + zoom + sticky bar).
- System font stack or one self-hosted variable font with Lithuanian glyphs.
- Targets on a mid-range Android over 4G: LCP < 1.5 s, CLS < 0.05, Lighthouse mobile Performance ≥ 95, Accessibility ≥ 95.
- Hosting: stays on Vercel (free plan), decided by Jarvis 2026-10-11. The tracking Worker runs on Cloudflare in front of it.
- Site analytics: Cloudflare Web Analytics (cookieless, no consent banner needed).

## 6. Privacy and legal

- Update `privatumo-politika`: per-recipient link codes record when a link was opened and which buttons were used, to measure interest in the offer; no IP stored; kept 12 months; legitimate interest; contact for objections.
- Footer: name, „Individuali veikla", contact e-mail and phone.
- No fake reviews, quotes, logos or numbers anywhere. Every number on the site has its source screenshot on the same page.

## 7. Acceptance checks

1. No mention of 500 €, 47 €/mėn, invented reviews, the Mantas quote (unless supplied), or `/atsiliepimas`.
2. Every figure on `/arboristams` matches §3.1.2 and has its screenshot.
3. `jarvisweb.lt/p/a2345` → 302 to `/arboristams?r=a2345`; address bar ends clean; D1 has a `human` click and a `view` beacon.
4. Same URL with `User-Agent: WhatsApp/2.0` → click stored as `bot`.
5. `GET /t/events` without token → 401; with token → JSON events since the given time.
6. `sms:` button opens the SMS app with the prefilled text on an Android phone; `tel:` dials.
7. No horizontal scroll at 360 px; Lighthouse mobile thresholds in §5 met (attach report).
8. `astro build` passes; `git diff --check` clean.
9. Deploy to production **only after Jarvis approves a preview URL**.
10. Style: no exclamation marks in page copy, no hype words, every sentence plain and direct (Jarvis's tone).

## 8. Open decisions (Jarvis)

| # | Decision | Default in this spec |
|---|---|---|
| D1 | Changes/repairs after handover, no monthly fee | 30 days free small fixes, then agreed separately |
| D2 | Phone number on the site = sending SIM? | **Decided 2026-10-11:** +370 676 99395 is the sending number |
| D3 | Move hosting to Cloudflare Pages? | **Decided 2026-10-11:** stay on Vercel (free plan) |
| D4 | Mantas quote available? | No quote |

## 9. Source evidence

- Offer and copy rules: `Personal Everything/research/2026-10-09-arboristu-sms-pardavimo-eiga.md` (main Drive).
- 20 inquiries: `research/arborist-outreach-2026-10-09/web3forms-proof-review.md` (Aug 7 + Sep 13 on the old form; Google attribution not confirmed — don't claim "iš Google" for the 20).
- Playbook decisions: Miro "SMS playbook (all niches)"; CRM `REQUIREMENTS.md` S2/S5/S7.
