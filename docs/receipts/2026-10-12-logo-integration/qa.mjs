// Visual + layout QA for jarvisweb.lt preview. Usage: node qa.mjs <baseUrl> <outDir>
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire('/Users/matasbasinskas/.npm/_npx/0f94ee7615faf582/node_modules/');
const puppeteer = require('puppeteer-core');
const [base, out] = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const report = { overflow: [], header: [], keyboard: [], logo: [] };
async function open(path, width, height = 900) {
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', (r) => (r.url().startsWith(base) || r.url().startsWith('data:') ? r.continue() : r.abort()));
  await page.evaluateOnNewDocument(() => { navigator.sendBeacon = () => true; });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto(base + path, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  return page;
}
const pages = ['/', '/rezultatai', '/privatumo-politika', '/taisykles', '/404'];
for (const path of pages) for (const w of [360, 390, 430, 768, 1024, 1440]) {
  const p = await open(path, w);
  const r = await p.evaluate(() => {
    const sw = document.documentElement.scrollWidth;
    const imgs = [...document.querySelectorAll('img[src*="wordmark"]')].map((i) => {
      const b = i.getBoundingClientRect();
      return { cls: i.className || i.parentElement.className, w: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10, loaded: i.complete && i.naturalWidth > 0, visible: b.width > 0 };
    });
    const bar = document.querySelector('.hdr__bar').getBoundingClientRect();
    const burger = document.querySelector('.hdr__burger').getBoundingClientRect();
    const cta = document.querySelector('.hdr__cta').getBoundingClientRect();
    const logo = document.querySelector('.hdr .logo').getBoundingClientRect();
    return { sw, iw: innerWidth, imgs, bar: [bar.left, bar.right], logoRight: logo.right, burgerLeft: burger.width ? burger.left : null, ctaLeft: cta.width ? cta.left : null };
  });
  report.overflow.push({ path, w, ok: r.sw <= r.iw, sw: r.sw });
  report.logo.push({ path, w, imgs: r.imgs, gapToControl: Math.round(((r.burgerLeft ?? r.ctaLeft ?? 0) - r.logoRight) * 10) / 10 });
  await p.close();
}
// Full-page screenshots (reduced motion) and header close-ups.
for (const [path, name] of [['/', 'home'], ['/rezultatai', 'results']]) for (const w of [390, 1440]) {
  const p = await open(path, w, w === 390 ? 844 : 900);
  // Scroll through so lazy images load, then return to top.
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } scrollTo(0, 0); await new Promise((r) => setTimeout(r, 300)); });
  await p.screenshot({ path: `${out}/${name}-${w}-full.png`, fullPage: true });
  await p.close();
}
for (const [path, name] of [['/', 'home'], ['/rezultatai', 'results']]) {
  const p = await open(path, 360, 740);
  await p.setViewport({ width: 360, height: 740, deviceScaleFactor: 2 });
  await p.screenshot({ path: `${out}/${name}-360-header.png`, clip: { x: 0, y: 0, width: 360, height: 100 } });
  // Keyboard: Tab to the menu button, Enter opens, Esc closes and returns focus.
  await p.keyboard.press('Tab'); // skip link
  let steps = 0, f = '';
  while (steps++ < 6 && !(f = await p.evaluate(() => document.activeElement.matches('[data-menu-open]') ? 'burger' : document.activeElement.className))?.includes?.('burger')) await p.keyboard.press('Tab');
  await p.keyboard.press('Enter');
  await new Promise((r) => setTimeout(r, 300));
  const opened = await p.evaluate(() => document.querySelector('[data-menu]').open);
  await p.screenshot({ path: `${out}/${name}-360-menu.png` });
  await p.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 200));
  const closed = await p.evaluate(() => ({ open: document.querySelector('[data-menu]').open, focusBack: document.activeElement.matches('[data-menu-open]') }));
  report.keyboard.push({ path, menu: { reachedBurger: f === 'burger', opened, closed: !closed.open, focusBack: closed.focusBack } });
  // FAQ: first <summary> toggles with keyboard.
  const faq = await p.evaluate(() => { const s = document.querySelector('details summary'); if (!s) return null; s.focus(); return document.activeElement === s; });
  if (faq) { await p.keyboard.press('Enter'); report.keyboard.at(-1).faq = await p.evaluate(() => document.querySelector('details').open); }
  // Zoom dialog: first zoom trigger opens via keyboard, Esc closes, focus returns.
  const z = await p.evaluate(() => { const b = document.querySelector('[data-zoom]'); if (!b) return null; b.scrollIntoView(); b.focus(); return document.activeElement === b; });
  if (z) {
    await p.keyboard.press('Enter'); await new Promise((r) => setTimeout(r, 300));
    const zo = await p.evaluate(() => document.querySelector('[data-zoom-dialog]')?.open);
    await p.keyboard.press('Escape'); await new Promise((r) => setTimeout(r, 300));
    const zc = await p.evaluate(() => ({ open: document.querySelector('[data-zoom-dialog]')?.open, back: document.activeElement.matches('[data-zoom]') }));
    report.keyboard.at(-1).zoom = { opened: zo, closed: !zc.open, focusBack: zc.back };
  } else report.keyboard.at(-1).zoom = 'no [data-zoom] trigger found';
  await p.close();
}
// Footer close-ups.
for (const w of [390, 1440]) {
  const p = await open('/', w);
  const el = await p.$('footer');
  await el.screenshot({ path: `${out}/footer-${w}.png` });
  await p.close();
}
await browser.close();
writeFileSync(`${out}/qa-report.json`, JSON.stringify(report, null, 1));
console.log('overflow fails:', report.overflow.filter((o) => !o.ok));
console.log(JSON.stringify(report.keyboard, null, 1));
console.log(JSON.stringify(report.logo.filter((l) => [360, 1440].includes(l.w) && l.path === '/'), null, 0));
