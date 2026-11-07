/* Focused regressions for the Jarvis Systems homepage — source-match contract (USER7, 2026-11-07).
   Run after a build: node src/checks/o2-check.mjs */
import { readFileSync, existsSync } from 'node:fs';
const html = readFileSync('dist/index.html', 'utf8');
const ts = readFileSync('src/scripts/o2.ts', 'utf8');
const errors = [];
const check = (ok, msg) => { if (!ok) errors.push(msg); };
check(html.includes('/jarvis-systems/og-1200x630.jpg') && existsSync('public/jarvis-systems/og-1200x630.jpg'), 'og image must be the Jarvis Systems kit card');
const scenes = [...html.matchAll(/data-scene="(\w+)" data-side="(\w+)"/g)].map((m) => `${m[1]}:${m[2]}`);
check(scenes.join() === 'web:left,reviews:right,missed:left,campaign:right,seo:left', `five source scenes in order with alternating phones, got ${scenes}`);
check(html.includes('laptop-blank.webp') && html.includes('/jarvis-systems/demo/bg-hero.webp'), 'first feature must include the laptop website scene');
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
