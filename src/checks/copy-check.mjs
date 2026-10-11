// Fails if built pages contain copy the spec forbids (§2, §6, §7.1, §7.10).
// Run after `astro build`: node src/checks/copy-check.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const banned = [
  /500\s?€/, /47\s?€/, /€\s?\/\s?mėn/, /prenumerat/i, /atsiliepim/i, /\/atsiliepimas/,
  /Kazlausk|Vaitkut|Petrausk|Stankevič|Jankausk/, /TOP pozicij/i, /5,0\s?★/, /100\+/, /<\s?1 s/,
  /praleisto skambučio/i, /three\.js|gsap/i, /geriausi|revoliucin/i, /!/,
];
const required = { 'arboristams/index.html': ['20', '573', '199 €', '11,4 tūkst.'] };

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
  const text = readFileSync(file, 'utf8')
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/g, ' ');
  for (const re of banned) {
    const m = text.match(re);
    if (m) { failed = true; console.error(`${file}: forbidden "${m[0]}" (${re})`); }
  }
  const rel = file.slice('dist/'.length);
  for (const must of required[rel] ?? []) {
    if (!text.includes(must)) { failed = true; console.error(`${file}: missing "${must}"`); }
  }
}
console.log(`copy-check: ${files.length} pages, ${failed ? 'FAILED' : 'ok'}`);
process.exit(failed ? 1 : 0);
