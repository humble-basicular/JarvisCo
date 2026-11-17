#!/usr/bin/env node
/* Logo slot: swap the Jarvis Systems logo by dropping files into a folder and running ONE command.
   node scripts/apply-logo.mjs <dir> [--out public/jarvis-systems] [--dry]      (npm run logo:apply -- <dir>)
   Input files in <dir> (svg, png, webp or jpg; first match wins):
     logo-on-white.*   horizontal logo for light backgrounds (header, mobile menu, funnel pages)   [or logo.*]
     logo-on-navy.*    horizontal logo for the dark footer (falls back to logo-on-white)
     icon.*            square app icon (favicons, apple-touch icon, app icon in the phone animations)
     og.*              optional 1200x630 share card (otherwise the existing one stays)
   Outputs (all inside --out, default public/jarvis-systems; layout keeps its fixed 560x205 logo box):
     logo-on-white.webp, logo-on-navy.webp, favicon/{favicon-16,32,48,icon-192,icon-512,apple-touch-icon-180}.png,
     favicon/favicon.ico, ../apple-touch-icon.png, app/icon.svg, og-1200x630.jpg (if og.* given).
   Nothing else in the site changes, so reverting = `git checkout -- public`. */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import sharp from 'sharp';

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const dir = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--out');
if (!dir || !existsSync(dir)) { console.error('usage: apply-logo.mjs <dir with logo-on-white.*, icon.*> [--out public/jarvis-systems] [--dry]'); process.exit(2); }
const OUT = resolve(opt('--out', 'public/jarvis-systems'));
const PUBLIC_ROOT = resolve(OUT, '..');
const files = readdirSync(dir);
const pick = (...bases) => {
  for (const b of bases) { const f = files.find((x) => new RegExp(`^${b}\\.(svg|png|webp|jpe?g)$`, 'i').test(x)); if (f) return join(dir, f); }
  return null;
};
// Also accepts the Marketing folder naming (foundation-20261118/BRAND/logo-v2/<X>/): lockup-horizontal-on-white|navy, app-icon-1024.
const white = pick('logo-on-white', 'lockup-horizontal-on-white', 'logo');
const navy = pick('logo-on-navy', 'lockup-horizontal-on-navy') ?? white;
const icon = pick('icon', 'app-icon-1024');
const og = pick('og');
if (!white) { console.error('missing logo-on-white.* (or logo.*) in ' + dir); process.exit(2); }
if (!icon) { console.error('missing icon.* (square app icon) in ' + dir); process.exit(2); }

const write = (path, buf) => { if (flag('--dry')) { console.log('[dry] ' + path); return; } mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, buf); console.log('wrote ' + path); };
const logoBox = (src) => sharp(src, { density: 300 }).resize(560, 205, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 92 }).toBuffer();
const square = (src, n) => sharp(src, { density: 300 }).resize(n, n, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();

write(join(OUT, 'logo-on-white.webp'), await logoBox(white));
write(join(OUT, 'logo-on-navy.webp'), await logoBox(navy));
for (const n of [16, 32, 48]) write(join(OUT, 'favicon', `favicon-${n}.png`), await square(icon, n));
for (const n of [192, 512]) write(join(OUT, 'favicon', `icon-${n}.png`), await square(icon, n));
write(join(OUT, 'favicon', 'apple-touch-icon-180.png'), await sharp(icon, { density: 300 }).resize(180, 180, { fit: 'contain', background: '#ffffff' }).flatten({ background: '#ffffff' }).png().toBuffer());
write(join(PUBLIC_ROOT, 'apple-touch-icon.png'), await sharp(icon, { density: 300 }).resize(180, 180, { fit: 'contain', background: '#ffffff' }).flatten({ background: '#ffffff' }).png().toBuffer());
// .ico with 16/32 PNG frames (PNG-in-ICO is valid for every current browser)
const p16 = await square(icon, 16), p32 = await square(icon, 32);
const head = Buffer.alloc(6); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(2, 4);
const ent = (px, buf, off) => { const e = Buffer.alloc(16); e[0] = px; e[1] = px; e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(buf.length, 8); e.writeUInt32LE(off, 12); return e; };
write(join(OUT, 'favicon', 'favicon.ico'), Buffer.concat([head, ent(16, p16, 6 + 32), ent(32, p32, 6 + 32 + p16.length), p16, p32]));
// app icon used inside the phone animations (referenced as /jarvis-systems/app/icon.svg)
const iconSvg = /\.svg$/i.test(icon) ? readFileSync(icon) : Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Jarvis Systems"><image href="data:image/png;base64,${(await square(icon, 256)).toString('base64')}" width="64" height="64"/></svg>`);
write(join(OUT, 'app', 'icon.svg'), iconSvg);
if (og) write(join(OUT, 'og-1200x630.jpg'), await sharp(og).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 88 }).toBuffer());
console.log(flag('--dry') ? 'dry run: nothing written' : 'logo applied. Next: npm run build && npm run check:o2');
