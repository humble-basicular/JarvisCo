// Per-page transferred JS: gzip each local file separately, recursively include
// static/dynamic imports and modulepreloads, plus executable inline scripts.
// JSON-LD is data, not executable JS. Remote scripts cannot pass an unmeasured
// budget. Cloudflare's edge-injected analytics needs parent deployment QA.
import { readFileSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { gzipSync } from 'node:zlib';
import { init, parse } from 'es-module-lexer';
import { pages, attr } from './html.mjs';

await init;
const root = resolve('dist');
const origin = 'https://static-budget.invalid';
let failed = false;
for (const page of pages()) {
  const limit = (page.path === 'index.html' ? 30 : 15) * 1024;
  const loaded = new Set();
  let size = 0;
  const readImports = (source, base) => {
    const [imports] = parse(source);
    for (const item of imports) {
      if (item.d === -2) continue; // import.meta
      if (!item.n) throw new Error('Non-literal dynamic import cannot be budgeted');
      load(item.n, base);
    }
  };
  const load = (specifier, base) => {
    const url = new URL(specifier, base);
    if (url.origin !== origin) throw new Error(`Unmeasured remote script: ${url.href}`);
    const file = resolve(root, `.${decodeURIComponent(url.pathname)}`);
    if (relative(root, file).startsWith('..') || !existsSync(file)) throw new Error(`Missing local JS: ${specifier}`);
    if (loaded.has(file)) return;
    loaded.add(file);
    const source = readFileSync(file, 'utf8');
    size += gzipSync(source).length;
    readImports(source, url);
  };
  try {
    const base = new URL(`/${page.path}`, origin);
    for (const node of page.nodes) {
      if (node.tagName === 'link' && attr(node, 'rel') === 'modulepreload') load(attr(node, 'href'), base);
      if (node.tagName !== 'script') continue;
      const type = attr(node, 'type');
      if (type && !['module', 'text/javascript', 'application/javascript'].includes(type)) continue;
      const src = attr(node, 'src');
      if (src) load(src, base);
      else {
        const source = (node.childNodes ?? []).map((child) => child.value ?? '').join('');
        if (!source.trim()) continue;
        size += gzipSync(source).length;
        if (type === 'module') readImports(source, base);
      }
    }
    if (size > limit) failed = true;
    console.log(`${page.file}: ${size} B / ${limit} B gzip JS (${loaded.size} local files)${size > limit ? ' — OVER BUDGET' : ''}`);
  } catch (error) {
    failed = true;
    console.error(`${page.file}: ${error.message}`);
  }
}
process.exitCode = failed ? 1 : 0;
