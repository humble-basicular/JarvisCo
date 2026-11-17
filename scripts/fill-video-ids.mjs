#!/usr/bin/env node
/* Fills the video slots in src/data/o2-videos.js from src/data/video-ids.json (S5, 18 Nov 2026).
   npm run videos:fill                 -> write the IDs (slots still TODO-ID are left waiting)
   npm run videos:fill -- --build      -> also: npm run build, check:js, check:o2, check:video-slots (stops on the first failure)
   npm run videos:fill -- --require-all -> exit 1 if any of the six slots is still TODO-ID
   Per slot: `id` becomes the new ID and `newId` is deleted. If "poster" is a file, it is converted to WebP at the size of the
   existing poster and written over public/video/<same name>.webp (the cover filename stays, so no page changes).
   Idempotent: a slot that is already swapped is skipped. Validation: 11 chars [A-Za-z0-9_-]. */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import sharp from 'sharp';

const MAP = 'src/data/video-ids.json', DATA = 'src/data/o2-videos.js';
const args = process.argv.slice(2);
const YT = /^[A-Za-z0-9_-]{11}$/;
const map = JSON.parse(readFileSync(MAP, 'utf8'));
let src = readFileSync(DATA, 'utf8');
const done = [], waiting = [], errors = [];
for (const [key, v] of Object.entries(map)) {
  if (key.startsWith('_')) continue;
  const id = String(v.id ?? '').trim();
  const esc = key.replace(/[-]/g, '\\-');
  const re = new RegExp(`(^\\s*(?:'${esc}'|${esc}):\\s*\\{\\s*)id:\\s*'([^']+)',\\s*newId:\\s*(?:TODO_ID|'[^']*'),`, 'm');
  const m = src.match(re);
  if (id === 'TODO-ID' || id === '') { waiting.push(key); continue; }
  if (!YT.test(id)) { errors.push(`${key}: "${id}" is not an 11-character YouTube ID`); continue; }
  if (!m) { const already = new RegExp(`(?:'${esc}'|${esc}):\\s*\\{\\s*id:\\s*'${id}'`).test(src); if (already) { done.push(`${key} (already ${id})`); continue; } errors.push(`${key}: slot not found or already swapped to another ID`); continue; }
  src = src.replace(re, `$1id: '${id}',`);
  done.push(`${key} ${m[2]} -> ${id}`);
  if (v.poster) {
    const pm = src.match(new RegExp(`(?:'${esc}'|${esc}):[^\\n]*poster:\\s*'([^']+)'`));
    if (!pm || !existsSync(v.poster)) { errors.push(`${key}: poster file or slot poster missing (${v.poster})`); continue; }
    const target = `public${pm[1]}`;
    const meta = await sharp(target).metadata();
    await sharp(v.poster).resize(meta.width, meta.height, { fit: 'cover' }).webp({ quality: 88 }).toFile(target + '.tmp');
    (await import('node:fs')).renameSync(target + '.tmp', target);
    done.push(`${key} poster -> ${target} (${meta.width}x${meta.height})`);
  } else console.log(`note: ${key} has no poster, the old cover stays`);
}
if (errors.length) { console.error(errors.map((e) => 'fill-video-ids: ' + e).join('\n')); process.exit(1); }
writeFileSync(DATA, src);
console.log('filled:\n  ' + (done.join('\n  ') || '(nothing)'));
console.log('still waiting: ' + (waiting.join(', ') || 'none'));
if (args.includes('--require-all') && waiting.length) { console.error('fill-video-ids: --require-all but slots are still waiting'); process.exit(1); }
if (args.includes('--build')) for (const c of ['npm run build', 'npm run check:js', 'npm run check:o2', 'npm run check:video-slots']) { console.log('> ' + c); execSync(c, { stdio: 'inherit' }); }
