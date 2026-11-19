/* Focused regressions for the Jarvis Systems homepage — source-match contract (USER7, 2026-11-07).
   Run after a build: node src/checks/o2-check.mjs */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
const html = readFileSync('dist/index.html', 'utf8');
const ts = readFileSync('src/scripts/o2.ts', 'utf8');
const errors = [];
const check = (ok, msg) => { if (!ok) errors.push(msg); };
check(html.includes('/jarvis-systems/og-1200x630.jpg') && existsSync('public/jarvis-systems/og-1200x630.jpg'), 'og image must be the Jarvis Systems kit card');
const scenes = [...html.matchAll(/data-scene="(\w+)" data-side="(\w+)"/g)].map((m) => `${m[1]}:${m[2]}`);
check(scenes.join() === 'web:left,missed:right,reviews:left,campaign:right,seo:left,inbox:right', `five feature scenes + inbox row in order with alternating phones, got ${scenes}`);
// Round 2 (17 Nov 2026, Matas 2eeb25e4): the laptop keeps the real captured Betono home as background, but the enquiry form on
// top is OUR two-step form (Matas: the captured two-step form is "terrible"); its captured form/detail pixels are no longer shown.
check(html.includes('laptop-blank.webp') && html.includes('/jarvis-systems/demo/betono-actual/home.webp') && /class="fm /.test(html) && (html.match(/class="fm__pane"/g) ?? []).length === 2, 'first feature: real Betono home behind the own two-step form (2 panes)');
check(!/betono-actual\/(?:form-empty|form-filled|details-empty|details-filled)\.webp/.test(html), 'round 2: the old captured form pixels must stay off the homepage');
check((html.match(/\/jarvis-systems\/app\/icon-h\.png/g) ?? []).length >= 3 && existsSync('public/jarvis-systems/app/icon-h.png'), 'owner notifications / app screens show the Jarvis Systems app icon');
check(!/class="scr__sig"|class="own__ic"/.test(html) && (html.match(/class="sb /g) ?? []).length + (html.match(/class="sb"/g) ?? []).length === 6, 'clean iOS status bar on every phone, old battery bar and letter avatar gone');
check(html.includes('šildymas kaunas') && html.includes('sildymaskaune.com') && !/šulinio žiedai kaunas/.test(html), 'SEO scene: generic heating example, not the father\'s business');
check(!/class="vbox"/.test(html) && /data-demo-open="dezute" data-demo-yt="z7ns8qtnBbE"/.test(html), 'inbox: animated row replaces the lone video box; the old video stays behind the demo button');
const betono = JSON.parse(readFileSync('docs/jarvis-stone-source-match/qa/betono-actual-capture-user19.json', 'utf8'));
check(Object.entries(betono.assets).every(([name, asset]) => createHash('sha256').update(readFileSync(`public/jarvis-systems/demo/betono-actual/${name}`)).digest('hex') === asset.sha256), 'Betono media must match the verified latest-source capture receipt');
check(!/demo\/bg-hero\.webp|site__form|>BG<|Betono gaminiai/.test(html), 'invented BG demo site/brand must stay gone (USER13)');
check(['phone-left', 'phone-right', 'laptop'].every((d) => html.includes(`/jarvis-systems/device/${d}-glass.webp`) && existsSync(`public/jarvis-systems/device/${d}-glass.webp`)) && !html.includes('dev__isl'), 'device screens must be trimmed by the derived glass masks');
check(!/class="proof|proof__/.test(html) && (html.match(/class="pbar"/g) ?? []).length === 1 && /pbar__it[^>]*Google įvertinimas/.test(html), 'USER13: big Google proof slot removed; Matas 2026-11-12: Stone-style hero proof bar with Google');
check(!/Google įvertinim[aą]\b(?![^<]*iš 5)/.test(html.replace(/aria-label="Google įvertinimas [^"]*"/, '')), 'no Google boast outside the hero badge');
const reg = readFileSync('dist/registracija/index.html', 'utf8');
// Booking quiz (Matas 2026-11-12): 4 choice slides, then phone → email → name → company, all required; no contact time.
const steps = [...reg.matchAll(/data-q-step="(\d+)"/g)].map((m) => m[1]);
check(steps.join() === '0,1,2,3,4,5,6,7', `quiz needs 8 slides in order, got ${steps}`);
check(['Kam dirbate?', 'Kaip dabar sekasi?', 'Kada norėtumėte tai išspręsti?', 'Mėnesio apyvarta?'].every((q) => reg.includes(`>${q}</legend>`)), 'quiz questions Q1–Q4');
check((reg.match(/data-q-pick=/g) ?? []).length === 16 && reg.includes('data-q-pick="Neturiu paslaugų verslo"') && reg.includes('data-q-pick="daugiau nei 30 tūkst. €"'), 'four answers per question');
check([...reg.matchAll(/data-q-field="(\w+)"/g)].map((m) => m[1]).join() === 'phone,email,name,company', 'fields in order phone → email → name → company');
check(['phone', 'email', 'name', 'company'].every((n) => new RegExp(`<input[^>]*name="${n}"[^>]*required|<input[^>]*required[^>]*name="${n}"`).test(reg)), 'every quiz field is required');
check(/>Daugiau užklausų Jūsų verslui už<\/h2>\s*<p class="quiz__price">97 €\/mėn\.<\/p>/.test(reg) && reg.includes('>Taip, noriu daugiau užklausų</button>') && /aria-valuenow="50"/.test(reg), 'quiz title, final button, progress starts at 50 %');
check(!/name="contact_time"/.test(reg) && /name="website"/.test(reg), 'contact time removed, honeypot kept');
check(/validPhone = \(v: string\) => \/\^\(\?:\\\+370\|00370\|8\)\?\[3-9\]/.test(ts) && /body\.append\('email', email\)/.test(ts) && /body\.append\('company', company\)/.test(ts) && /\.\.\.answers/.test(ts), 'LT phone check; live POST carries email, company and the quiz answers in standout');
check(/class="pbar"[\s\S]*?>611<[\s\S]*?>26<[\s\S]*?<\/ul>/.test(html) && !/786|807|betonogaminiai\.lt/.test(html.slice(html.indexOf('class="pbar"'), html.indexOf('</ul>', html.indexOf('class="pbar"')))), 'landing proof bar: Google | 611 | 26 (ArbCut), no Betono');
const cb = readFileSync('dist/susisieksime/index.html', 'utf8');
check(cb.includes('>611<') && cb.includes('>26<') && !/786|807|betonogaminiai/.test(cb) && !/data-cb-time|rytą|vakare/.test(cb), '/susisieksime: ArbCut 611 + 26 proof, no Betono, no contact time');
const gated = (h) => /<button class="yt__btn"[^>]*data-book-open[^>]*data-yt-gate/.test(h) && /<dialog[^>]*data-book-dialog/.test(h);
check(gated(reg), '/registracija: video click opens the quiz until it is done');
check(gated(cb) && cb.includes('data-gate data-locked') && !cb.includes('fnl__lock') && cb.includes("sessionStorage.getItem('o2_reg')"), '/susisieksime: same video gate, quiz dialog on page');
const darbai = readFileSync('dist/musu-darbai/index.html', 'utf8');
check((darbai.match(/<a href="[^"]+\.webp" data-zoom/g) ?? []).length >= 3 && !/case__gsc"><a[^>]*target="_blank"/.test(darbai) && /data-zoom-dialog/.test(darbai) && /betonogaminiai/.test(darbai), '/musu-darbai: GSC + forms shots open in the lightbox; Betono stays');
check(!/data-demo-form|Pavyzdys<|Iliustracija\.|Nuotraukos – iliustracijos|Kad nė viena|Septintos neradome|tcard--txt|programele"/.test(html), 'removed demo section, captions, placeholders and rejected copy must stay gone');
check((html.match(/trades-stock\/[a-z-]+\.webp/g) ?? []).length === 10, 'all 10 trade cards need stock photos');
check(html.includes('href="https://jarvisweb-sistema.jarvisworks-co.workers.dev/"'), 'login must point to the verified app entry');
check((html.match(/data-demo-open=/g) ?? []).length === 6 && /<dialog[^>]*data-demo-dialog/.test(html), 'each feature row (5 + inbox) needs its own short-demo action');
// Matas 2026-11-12: like Stone, every „Užsiregistruoti pokalbiui“ is a plain link to the funnel page /registracija.
check(!/data-book-dialog|data-book-open/.test(html) && (html.match(/<a[^>]*href="\/registracija"/g) ?? []).length >= 4, 'home: CTAs are plain links to /registracija, no booking dialog');
check(/<dialog[^>]*data-book-dialog/.test(reg) && /data-book-form[\s\S]*?<button[^>]*type="submit"[^>]*disabled/.test(reg) && /<button class="fnl__cta"[^>]*data-book-open/.test(reg) && !/class="hdr"|class="ftr"/.test(reg) && /noindex/.test(reg), '/registracija: Stone funnel page (logo only), green button opens the quiz dialog');
check((html.match(/class="why__card"/g) ?? []).length === 6, 'six why cards');
check(/if \(menuNav\) \{ menuNav = false; return; \} menuOpener\?\.focus\(\)/.test(ts), 'menu close must always restore the opener');
check(!/api\/public\/enquiry|api\/health/.test(ts), 'no demo backend calls from the homepage');
if (/data-book-mode="preview"/.test(html)) check(/bookMode !== 'live'[\s\S]*?return;[\s\S]*?fetch\(book\.action/.test(ts), 'preview booking must return before any POST');
// S5 (18 Nov 2026): every OFFER §1 term is on /taisykles; no superseded refund, old names or domain-included wording.
const terms = readFileSync('dist/taisykles/index.html', 'utf8').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ');
for (const [label, re] of [
  ['97 €/mėn.', /97 €\/mėn\./], ['no setup fee', /Įrengimo mokesčio nėra/], ['refund 50 % = 48,50 € within 30 days of the first payment', /30 dienų skaičiuojame nuo pirmo 97 € mokėjimo.{0,120}grąžiname 50 % pirmo mokėjimo \(48,50 €\)/],
  ['7-day launch', /per 7 dienas/], ['300 SMS month one, then 100 + 0,08 €', /Pirmą mėnesį į kainą įskaičiuota 300 SMS segmentų.{0,200}100 SMS segmentų per mėnesį.{0,120}0,08 €/], ['extra SMS outside the refund', /garantija taikoma pirmam 97 € mokėjimui, ne papildomoms SMS/], ['domain 15 € one-time when none', /neturite, taikomas vienkartinis 15 € domeno mokestis/], ['cancel anytime', /atsisakyti galite bet kada/i],
  ['everything off on cancel', /Atsisakius viskas išjungiama/], ['999 € buy-out', /999 € vienkartinai/], ['numbers switched off at exit', /Sistemos numeriai išjungiami/],
]) check(re.test(terms), `/taisykles is missing the term: ${label}`);
const allHtml = [];
const walkHtml = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) { if (n !== 'perziura' && n !== 'previews' && n !== '_astro') walkHtml(p); } else if (p.endsWith('.html')) allHtml.push(p); } };
walkHtml('dist');
const DOMAIN_INCLUDED = /domen\w*(?:\s+\w+){0,2}\s+(?:įskaičiuot|įeina)|(?:įskaičiuot|įeina)\w*(?:\s+\w+){0,3}\s+domen/i;
for (const f of allHtml) {
  const raw = readFileSync(f, 'utf8').replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, ' ');
  const labels = [...raw.matchAll(/\b(?:alt|aria-label|title|content|placeholder|data-caption|data-alt|data-messages)="([^"]*)"/g)].map((m) => m[1]).join(' ');
  const t = `${raw.replace(/<[^>]+>/g, ' ')} ${labels}`.replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ');
  if (/JarvisCo|Žinutė po praleisto skambučio|58,20/.test(t)) errors.push(`${f}: old brand/card name or 58,20 € in visible text, metadata or labels`);
  if (/(?<![\d,.])60\s?%/.test(t)) errors.push(`${f}: "60 %" in visible text, metadata or labels (refund is 50 % = 48,50 €)`);
  if (DOMAIN_INCLUDED.test(t)) errors.push(`${f}: says the domain is included (it is 15 € one-time when the client has none)`);
}
check(!/facebook|instagram|messenger/i.test(readFileSync('src/components/o2/Scene.astro', 'utf8')), 'inbox scene shows no Facebook/Instagram (Matas 17 Nov: left out)');
check(existsSync('src/data/video-ids.json') && existsSync('scripts/fill-video-ids.mjs') && existsSync('scripts/apply-logo.mjs'), 'S5 tooling present: video-ids.json, fill-video-ids.mjs, apply-logo.mjs');
if (errors.length) { console.error(errors.map((e) => `o2-check: ${e}`).join('\n')); process.exit(1); }
console.log('o2-check: ok');
