// Fails if any built page ships more than 15 KB of gzipped JS (spec §5).
// Counts inline scripts and every /_astro/*.js the page references.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const LIMIT = 15 * 1024;
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (name.endsWith('.html')) files.push(path);
  }
})('dist');

let failed = false;
for (const file of files) {
  const html = readFileSync(file, 'utf8');
  let js = '';
  for (const [, attrs, body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/ld\+json/.test(attrs)) continue;
    const src = attrs.match(/src="([^"]+)"/)?.[1];
    if (src?.startsWith('/') && existsSync(join('dist', src))) js += readFileSync(join('dist', src), 'utf8');
    js += body;
  }
  const size = gzipSync(js).length;
  if (size > LIMIT) failed = true;
  console.log(`${file}: ${size} B gzip JS${size > LIMIT ? ' — OVER BUDGET' : ''}`);
}
process.exit(failed ? 1 : 0);
