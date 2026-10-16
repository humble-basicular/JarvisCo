#!/usr/bin/env node
/* Screenshots of local heating pages through CDP device emulation (not Chrome's
   --window-size, which lays out wider than 390 px).
   node scripts/heating-shots.mjs <out-dir> [--widths=390,768,1024,1440,1920] [--first] <name>=<http://localhost:port/path> [...]
   For each page and width: <name>-<width>-first.png (one screen) and
   <name>-<width>-full.png (whole page; skipped with --first). Default widths
   390 (390×844, DPR 2, mobile) and 1440 (1440×900, DPR 1). Prints horizontal
   overflow per page and width. Local URLs only. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chrome, sleep } from './heating-cdp.mjs';

const args = process.argv.slice(2);
const outArg = args.shift();
const widthsArg = args.find((a) => a.startsWith('--widths='));
const firstOnly = args.includes('--first');
const pages = args.filter((a) => !a.startsWith('--')).map((p) => { const i = p.indexOf('='); return { name: p.slice(0, i), url: p.slice(i + 1) }; });
if (!outArg || !pages.length || pages.some((p) => !p.name || !/^http:\/\/(localhost|127\.0\.0\.1):\d+\//.test(p.url))) {
  console.error('usage: heating-shots.mjs <out-dir> [--widths=390,1440] [--first] <name>=http://localhost:<port>/path ...');
  process.exit(1);
}
const out = resolve(outArg);
mkdirSync(out, { recursive: true });
const viewport = (w) => (w < 640 ? { width: w, height: 844, dpr: 2, mobile: true } : { width: w, height: w >= 1800 ? 1080 : w >= 1280 ? 900 : w >= 1000 ? 768 : 1024, dpr: 1, mobile: false });
const widths = widthsArg ? widthsArg.slice(9).split(',').map(Number) : [390, 1440];

const browser = await chrome();
const { cdp, evaluate, open } = browser;
const shot = async (file) => {
  const { data } = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(join(out, file), Buffer.from(data, 'base64'));
  console.log(join(out, file));
};
try {
  for (const page of pages) {
    for (const w of widths) {
      const vp = viewport(w);
      await open(page.url, vp);
      const overflow = await evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth');
      console.log(`${overflow > 0 ? 'WARN' : 'OK  '} ${page.name} ${w}: horizontal overflow ${overflow}px`);
      await sleep(300);
      await shot(`${page.name}-${w}-first.png`);
      if (firstOnly) continue;
      // Lazy images: scroll through, then grow the viewport to the page height.
      await evaluate('(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } scrollTo(0, 0); await Promise.race([new Promise((r) => setTimeout(r, 4000)), Promise.all([...document.images].map((i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; })))]); return true; })()');
      const height = await evaluate('document.documentElement.scrollHeight');
      // Chrome tiles (repeats) captures taller than ~16k device pixels: lower the DPR for long pages.
      await cdp('Emulation.setDeviceMetricsOverride', { width: vp.width, height, deviceScaleFactor: Math.min(vp.dpr, Math.floor((16000 / height) * 100) / 100), mobile: vp.mobile });
      await sleep(400);
      await shot(`${page.name}-${w}-full.png`);
    }
  }
} finally {
  browser.close();
  console.log(`Chrome profile left at ${browser.profile} (cleanup candidate)`);
}
