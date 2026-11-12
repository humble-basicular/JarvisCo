/* Focused regressions for the Jarvis Systems homepage — source-match contract (USER7, 2026-11-07).
   Run after a build: node src/checks/o2-check.mjs */
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
const html = readFileSync('dist/index.html', 'utf8');
const ts = readFileSync('src/scripts/o2.ts', 'utf8');
const errors = [];
const check = (ok, msg) => { if (!ok) errors.push(msg); };
check(html.includes('/jarvis-systems/og-1200x630.jpg') && existsSync('public/jarvis-systems/og-1200x630.jpg'), 'og image must be the Jarvis Systems kit card');
const scenes = [...html.matchAll(/data-scene="(\w+)" data-side="(\w+)"/g)].map((m) => `${m[1]}:${m[2]}`);
check(scenes.join() === 'web:left,reviews:right,missed:left,campaign:right,seo:left', `five source scenes in order with alternating phones, got ${scenes}`);
check(html.includes('laptop-blank.webp') && ['home', 'form-empty', 'form-filled', 'details-empty', 'details-filled'].every((f) => html.includes(`/jarvis-systems/demo/betono-actual/${f}.webp`)), 'first feature must show both actual steps of the latest non-live Betono rebuild');
const betono = JSON.parse(readFileSync('docs/jarvis-stone-source-match/qa/betono-actual-capture-user19.json', 'utf8'));
check(betono.initial.compact && !betono.initial.banner && !betono.capture.previewHeaderDOMRemoval && betono.source.baseCommit !== '9a94599' && betono.details.stage === 'details', 'USER19: use the rebuilt inline form, with the banner removed in website source');
check(Object.entries(betono.assets).every(([name, asset]) => createHash('sha256').update(readFileSync(`public/jarvis-systems/demo/betono-actual/${name}`)).digest('hex') === asset.sha256), 'Betono media must match the verified latest-source capture receipt');
check(!/demo\/bg-hero\.webp|site__form|>BG<|Betono gaminiai/.test(html), 'invented BG demo site/brand must stay gone (USER13)');
check(['phone-left', 'phone-right', 'laptop'].every((d) => html.includes(`/jarvis-systems/device/${d}-glass.webp`) && existsSync(`public/jarvis-systems/device/${d}-glass.webp`)) && !html.includes('dev__isl'), 'device screens must be trimmed by the derived glass masks');
check(!/class="proof|proof__/.test(html) && (html.match(/class="pbar"/g) ?? []).length === 1 && /pbar__it[^>]*Google įvertinimas/.test(html), 'USER13: big Google proof slot removed; Matas 2026-11-12: Stone-style hero proof bar with Google');
check(!/Google įvertinim[aą]\b(?![^<]*iš 5)/.test(html.replace(/aria-label="Google įvertinimas [^"]*"/, '')), 'no Google boast outside the hero badge');
// Booking quiz (Matas 2026-11-12): 4 choice slides, then phone → email → name → company, all required; no contact time.
const steps = [...html.matchAll(/data-q-step="(\d+)"/g)].map((m) => m[1]);
check(steps.join() === '0,1,2,3,4,5,6,7', `quiz needs 8 slides in order, got ${steps}`);
check(['Kam dirbate?', 'Kaip dabar sekasi?', 'Kada norėtumėte tai spręsti?', 'Mėnesio apyvarta?'].every((q) => html.includes(`>${q}</legend>`)), 'quiz questions Q1–Q4');
check((html.match(/data-q-pick=/g) ?? []).length === 16 && html.includes('data-q-pick="Neturiu paslaugų verslo"') && html.includes('data-q-pick="daugiau nei 30 tūkst. €"'), 'four answers per question');
check([...html.matchAll(/data-q-field="(\w+)"/g)].map((m) => m[1]).join() === 'phone,email,name,company', 'fields in order phone → email → name → company');
check(['phone', 'email', 'name', 'company'].every((n) => new RegExp(`<input[^>]*name="${n}"[^>]*required|<input[^>]*required[^>]*name="${n}"`).test(html)), 'every quiz field is required');
check(/Daugiau užklausų Jūsų verslui už 97(?:\u00a0|&nbsp;| )€\/mėn\./.test(html) && html.includes('>Taip, noriu daugiau užklausų</button>') && /aria-valuenow="50"/.test(html), 'quiz title, final button, progress starts at 50 %');
check(!/name="contact_time"/.test(html) && /name="website"/.test(html), 'contact time removed, honeypot kept');
check(/validPhone = \(v: string\) => \/\^\(\?:\\\+370\|00370\|8\)\?\[3-9\]/.test(ts) && /body\.append\('email', email\)/.test(ts) && /body\.append\('company', company\)/.test(ts) && /\.\.\.answers/.test(ts), 'LT phone check; live POST carries email, company and the quiz answers in standout');
check(/class="pbar"[\s\S]*?>605<[\s\S]*?>31<[\s\S]*?<\/ul>/.test(html) && !/786|betonogaminiai\.lt/.test(html.slice(html.indexOf('class="pbar"'), html.indexOf('</ul>', html.indexOf('class="pbar"')))), 'landing proof bar: Google | 605 | 31 (ArbCut), no Betono');
const cb = readFileSync('dist/susisieksime/index.html', 'utf8');
check(cb.includes('>605<') && cb.includes('>31<') && !/786|betonogaminiai/.test(cb) && !/data-cb-time|rytą|vakare/.test(cb), '/susisieksime: ArbCut 605 + 31 proof, no Betono, no contact time');
const darbai = readFileSync('dist/musu-darbai/index.html', 'utf8');
check((darbai.match(/<a href="[^"]+\.webp" data-zoom/g) ?? []).length >= 3 && !/case__gsc"><a[^>]*target="_blank"/.test(darbai) && /data-zoom-dialog/.test(darbai) && /betonogaminiai/.test(darbai), '/musu-darbai: GSC + forms shots open in the lightbox; Betono stays');
check(!/data-demo-form|Pavyzdys<|Iliustracija\.|Nuotraukos – iliustracijos|Kad nė viena|Septintos neradome|tcard--txt|programele"/.test(html), 'removed demo section, captions, placeholders and rejected copy must stay gone');
check((html.match(/trades-stock\/[a-z-]+\.webp/g) ?? []).length === 10, 'all 10 trade cards need stock photos');
check(html.includes('href="https://jarvisweb-sistema.jarvisworks-co.workers.dev/"'), 'login must point to the verified app entry');
check((html.match(/data-demo-open=/g) ?? []).length === 5 && /<dialog[^>]*data-demo-dialog/.test(html), 'each feature needs its own short-demo action');
check(/<dialog[^>]*data-book-dialog/.test(html) && /data-book-form[\s\S]*?<button[^>]*type="submit"[^>]*disabled/.test(html), 'booking form lives in a dialog with submit disabled until JS');
check((html.match(/class="why__card"/g) ?? []).length === 6, 'six why cards');
check(/if \(menuNav\) \{ menuNav = false; return; \} menuOpener\?\.focus\(\)/.test(ts), 'menu close must always restore the opener');
check(!/api\/public\/enquiry|api\/health/.test(ts), 'no demo backend calls from the homepage');
if (/data-book-mode="preview"/.test(html)) check(/bookMode !== 'live'[\s\S]*?return;[\s\S]*?fetch\(book\.action/.test(ts), 'preview booking must return before any POST');
if (errors.length) { console.error(errors.map((e) => `o2-check: ${e}`).join('\n')); process.exit(1); }
console.log('o2-check: ok');
