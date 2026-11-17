#!/usr/bin/env node
/* Fills the video slots in src/data/o2-videos.js from src/data/video-ids.json (S5, 18 Nov 2026).
   npm run videos:fill                  -> write the IDs (slots still TODO-ID are left waiting)
   npm run videos:fill -- --require-all -> all six slots must be filled and swapped, else exit 1 and NOTHING is written
   npm run videos:fill -- --build       -> afterwards: npm run build, check:js, check:o2, check:video-slots (stops on the first failure)
   Per slot: `id` becomes the new ID and `newId` is deleted. If "poster" is a file it is converted to WebP at the size of the
   existing cover and written over public/video/<same name>.webp (filename stays, no page changes); the poster is handled
   independently of the ID, so it can be supplied in a later run too.
   All validation and image conversion happens first; files are written only if everything succeeded (no half-applied state).
   Idempotent. ID format: 11 chars [A-Za-z0-9_-]. */
import { readFileSync, writeFileSync, existsSync, renameSync, unlinkSync } from 'node:fs';
import { execSync } from 'node:child_process';
import sharp from 'sharp';

const MAP = 'src/data/video-ids.json', DATA = 'src/data/o2-videos.js';
const REQUIRED = ['intro', 'susisieksime', 'pokalbis', 'svetaine', 'skambuciai', 'atsiliepimai-sistema'];
const args = process.argv.slice(2);
const requireAll = args.includes('--require-all');
const YT = /^[A-Za-z0-9_-]{11}$/;
const map = JSON.parse(readFileSync(MAP, 'utf8'));
let src = readFileSync(DATA, 'utf8');
const errors = [], done = [], waiting = [], posters = [];
const blockRe = (key) => new RegExp(`(?:'${key}'|\\b${key}\\b):\\s*\\{[^}]*\\}`);
if (requireAll) for (const k of REQUIRED) if (!(k in map)) errors.push(`${k}: missing from ${MAP}`);
for (const key of [...new Set([...REQUIRED, ...Object.keys(map)])]) {
  if (key.startsWith('_')) continue;
  const v = map[key] ?? {};
  const id = String(v.id ?? '').trim();
  const m = src.match(blockRe(key));
  if (!m) { errors.push(`${key}: slot not found in ${DATA}`); continue; }
  let block = m[0];
  const cur = (block.match(/\bid:\s*'([^']+)'/) ?? [])[1];
  const hasNew = /\bnewId:/.test(block);
  if (id === '' || id === 'TODO-ID') { if (hasNew) waiting.push(key); }
  else if (!YT.test(id)) { errors.push(`${key}: "${id}" is not an 11-character YouTube ID`); continue; }
  else if (hasNew) { block = block.replace(/\bid:\s*'[^']+',\s*newId:\s*(?:TODO_ID|'[^']*'),?\s*/, `id: '${id}', `); done.push(`${key} ${cur} -> ${id}`); }
  else if (cur === id) done.push(`${key} (already ${id})`);
  else { errors.push(`${key}: slot already swapped to ${cur}, mapping says ${id}`); continue; }
  src = src.replace(m[0], block);
  if (v.poster) {
    const pm = block.match(/\bposter:\s*'([^']+)'/);
    if (!pm || !existsSync(v.poster)) { errors.push(`${key}: poster file or slot poster missing (${v.poster})`); continue; }
    const target = `public${pm[1]}`;
    try { const meta = await sharp(target).metadata(); posters.push({ key, target, buf: await sharp(v.poster).resize(meta.width, meta.height, { fit: 'cover' }).webp({ quality: 88 }).toBuffer(), size: `${meta.width}x${meta.height}` }); }
    catch (e) { errors.push(`${key}: poster conversion failed: ${e.message}`); }
  } else if (!v.poster && id && id !== 'TODO-ID') console.log(`note: ${key} has no poster, the old cover stays`);
}
if (requireAll) {
  for (const k of REQUIRED) { const b = (src.match(blockRe(k)) ?? [''])[0]; if (/\bnewId:/.test(b)) errors.push(`${k}: still waiting (TODO-ID / not swapped)`); }
}
if (errors.length) { console.error(errors.map((e) => 'fill-video-ids: ' + e).join('\n') + '\nnothing written'); process.exit(1); }
// Stage every output as a .tmp file first; the originals are replaced only after ALL temp files were written.
const staged = [[DATA, Buffer.from(src)], ...posters.map((p) => [p.target, p.buf])];
try { for (const [t, buf] of staged) writeFileSync(t + '.tmp', buf); }
catch (e) { for (const [t] of staged) try { unlinkSync(t + '.tmp'); } catch {} console.error('fill-video-ids: could not stage outputs (' + e.message + '), nothing written'); process.exit(1); }
for (const [t] of staged) renameSync(t + '.tmp', t);
for (const p of posters) done.push(`${p.key} poster -> ${p.target} (${p.size})`);
console.log('filled:\n  ' + (done.join('\n  ') || '(nothing)'));
console.log('still waiting: ' + (waiting.join(', ') || 'none'));
if (args.includes('--build')) for (const c of ['npm run build', 'npm run check:js', 'npm run check:o2', 'npm run check:video-slots']) { console.log('> ' + c); execSync(c, { stdio: 'inherit' }); }
