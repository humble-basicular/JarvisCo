/* Focused regressions for the Jarvis Systems homepage (review1, 2026-11-07). Run after a build:
   node src/checks/o2-check.mjs   (expects dist/ from O2_DRAFTS=1 O2_BOOKING=preview or production). */
import { readFileSync, existsSync } from 'node:fs';
const html = readFileSync('dist/index.html', 'utf8');
const css = readFileSync('src/styles/o2.css', 'utf8');
const ts = readFileSync('src/scripts/o2.ts', 'utf8');
const errors = [];
const check = (ok, msg) => { if (!ok) errors.push(msg); };
check(html.includes('/jarvis-systems/og-1200x630.jpg') && !html.includes('og-v4.png'), 'og image must be the Jarvis Systems kit card');
check(existsSync('public/jarvis-systems/og-1200x630.jpg'), 'og file missing');
check((html.match(/phone-right-mascot\.webp/g) ?? []).length >= 2 && (html.match(/\/jarvis-systems\/phone\.webp/g) ?? []).length >= 3, 'rows 2/4 must use the opposite-side frame, 1/3/5 the original');
for (const f of ['data-demo-form', 'data-book-form']) {
  const form = html.slice(html.indexOf(f), html.indexOf('</form>', html.indexOf(f)));
  check(/<button[^>]*type="submit"[^>]*disabled/.test(form), `${f}: submit must ship disabled until JS attaches`);
}
check(/<dialog[^>]*data-book-dialog/.test(html) && /data-book-open/.test(html), 'booking form must live in a dialog opened from the talk card');
check(!/<section class="talk"[\s\S]*?<form[\s\S]*?<\/section>/.test(html.slice(0, html.indexOf('data-book-dialog'))), 'talk card must stay short (no inline form)');
const preview = html.includes('data-build="preview"');
if (preview) {
  const i = ts.indexOf('if (preview)'); const f = ts.indexOf('fetch(`${api}/api/public/enquiry');
  check(i > 0 && f > i && /preview \? Promise\.resolve/.test(ts), 'preview demo must return before any remote enquiry/health request');
  check(/data-book-mode="preview"/.test(html), 'preview builds must not use the live booking route');
}
check(/@media \(max-width:1240px\)\{[^}]*\.hdr__nav[^}]*\}[^\n]*\.hdr__burger\{display:block/.test(css), 'burger must appear wherever the nav is hidden');
check(/\.hero__mascot\{height:748px/.test(css), 'hero figure must render at reference height');
check(/grid-template-rows:repeat\(2,auto\)/.test(css) && html.includes('steps__wave'), 'two-row trades carousel and wavy connector expected');
if (errors.length) { console.error(errors.map((e) => `o2-check: ${e}`).join('\n')); process.exit(1); }
console.log(`o2-check: ok (${preview ? 'preview' : 'production'} build)`);
