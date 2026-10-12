// Renders the JarvisCo OG images (1200×630) with headless Chrome.
// Usage: node render-og.mjs <repoRoot> <outDir>
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const require = createRequire('/Users/matasbasinskas/.npm/_npx/0f94ee7615faf582/node_modules/');
const puppeteer = require('puppeteer-core');
const [root, out] = process.argv.slice(2);
const fs = (p) => '"file://' + encodeURI(join(root, 'node_modules', p)) + '"';
const wordmark = readFileSync(join(root, 'public/brand/editorial/jarvisco-wordmark-dark.svg'), 'utf8');
const css = `
@font-face{font-family:B;src:url(${fs('@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-opsz-normal.woff2')});font-weight:200 800}
@font-face{font-family:B;src:url(${fs('@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-ext-opsz-normal.woff2')});font-weight:200 800;unicode-range:U+0100-02BA}
@font-face{font-family:I;src:url(${fs('@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')});font-weight:100 900}
@font-face{font-family:I;src:url(${fs('@fontsource-variable/inter/files/inter-latin-ext-wght-normal.woff2')});font-weight:100 900;unicode-range:U+0100-02BA}
*{margin:0;box-sizing:border-box}
html,body{width:1200px;height:630px}
body{position:relative;overflow:hidden;background:
  radial-gradient(55% 70% at 100% 0%, rgba(31,191,117,.30), transparent 70%),
  radial-gradient(45% 55% at 0% 100%, rgba(200,245,96,.10), transparent 70%), #06110C;
  color:#F4F1E8;font-family:I,sans-serif;padding:64px 76px 60px;display:flex;flex-direction:column}
.wm{width:300px;display:block}
.wm svg{width:300px;height:auto;display:block}
h1{font:700 88px/1.0 B,sans-serif;font-variation-settings:'opsz' 96;letter-spacing:-.035em;margin-top:auto;max-width:1000px}
h1 em{font-style:normal;color:#C8F560}
h1.big{font-size:96px}
h1.big em{display:block;font-size:150px;line-height:.92;letter-spacing:-.045em}
.row{display:flex;align-items:center;justify-content:space-between;margin-top:44px;padding-top:28px;border-top:1px solid rgba(244,241,232,.16)}
.pill{font:600 30px/1 B,sans-serif;letter-spacing:-.01em;padding:18px 28px;border-radius:999px;background:#C8F560;color:#06110C}
.sub{font:500 30px/1.25 I,sans-serif;color:rgba(244,241,232,.78)}
.dom{font:500 24px/1 I,sans-serif;color:rgba(244,241,232,.6);letter-spacing:.01em}
`;
const pages = {
  'og.png': `<h1>Svetainė, kuri <em>atneša užklausas</em> iš Google.</h1>
    <div class="row"><span class="pill">199 € vieną kartą</span><span class="dom">jarvisweb.lt</span></div>`,
  'og-rezultatai.png': `<h1 class="big"><em>20 užklausų</em>per 2&nbsp;mėnesius</h1>
    <div class="row"><span class="sub">arbcut.lt rezultatai su ekrano kopijomis</span><span class="dom">jarvisweb.lt/rezultatai</span></div>`,
};
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--allow-file-access-from-files'] });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
for (const [file, body] of Object.entries(pages)) {
  const html = join(out, file.replace('.png', '.html'));
  writeFileSync(html, `<!doctype html><html lang="lt"><meta charset="utf-8"><style>${css}</style><body><div class="wm">${wordmark}</div>${body}</body></html>`);
  await page.goto('file://' + html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const fams = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family + ' ' + f.unicodeRange.slice(0, 12)));
  const fit = await page.evaluate(() => [...document.querySelectorAll('h1,.row *')].every((e) => e.scrollWidth <= e.clientWidth + 1 && e.getBoundingClientRect().right <= 1200 - 60));
  await page.screenshot({ path: join(out, file), type: 'png' });
  console.log(file, 'fonts:', fams.join(' | '), 'fit:', fit);
}
await browser.close();
