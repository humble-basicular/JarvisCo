/* Guards the video slot map in src/data/o2-videos.js (S2, 17 Nov 2026): the six slots for the 17 Nov videos carry
   `newId: 'TODO-ID'` until S5 uploads them; the three kept videos have no newId; every live `id` is a real 11-char YouTube ID.
   Also fails if the built site embeds a 'TODO-ID' anywhere (it must never reach a page). Run after a build. */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { VIDEOS, TODO_ID } from '../data/o2-videos.js';
const errors = [];
const YT = /^[A-Za-z0-9_-]{11}$/;
const NEW = ['intro', 'susisieksime', 'pokalbis', 'svetaine', 'skambuciai', 'atsiliepimai-sistema'];
const KEEP = ['kampanijos', 'seo', 'dezute'];
for (const [k, v] of Object.entries(VIDEOS)) {
  if (!YT.test(v.id)) errors.push(`${k}: live id "${v.id}" is not a YouTube ID`);
  if ('newId' in v && v.newId !== TODO_ID) {
    if (!YT.test(v.newId)) errors.push(`${k}: newId "${v.newId}" is neither ${TODO_ID} nor a YouTube ID`);
    else if (v.newId !== v.id) errors.push(`${k}: half-swapped slot: newId ${v.newId} is set but id ${v.id} still plays. Set id = newId, replace the poster, delete newId`);
    else errors.push(`${k}: swap finished, delete the leftover newId`);
  }
}
for (const k of NEW) if (!VIDEOS[k]) errors.push(`missing slot ${k}`);
for (const k of KEEP) { if (!VIDEOS[k]) errors.push(`missing slot ${k}`); else if ('newId' in VIDEOS[k]) errors.push(`${k} keeps its old video, remove newId`); }
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? (n === 'perziura' || n === 'previews' ? [] : walk(p)) : p.endsWith('.html') ? [p] : []; });
try { for (const f of walk('dist')) if (readFileSync(f, 'utf8').includes(TODO_ID)) errors.push(`${f} embeds ${TODO_ID}`); } catch { errors.push('dist/ missing: run npm run build first'); }
if (errors.length) { console.error(errors.map((e) => `video-slots-check: ${e}`).join('\n')); process.exit(1); }
console.log(`video-slots-check: ok (${NEW.filter((k) => VIDEOS[k].newId === TODO_ID).length} slots waiting for a new ID, ${KEEP.length} kept)`);
