#!/usr/bin/env node
/* Local stub for testing the /noriu form without the Worker: serves dist/ and
   answers POST /t/form and POST /t/e on the same origin. It logs what the form
   sent (field names, values, file names, types, sizes) and stores nothing.
   Usage: npm run build && node scripts/preview-form-stub.mjs [port] [root-dir]
   root-dir defaults to dist/; pass client-sites/<slug> to test a live client site
   (built with --test http://localhost:<port>). Like the Worker (offer-v2 spec §2.1)
   it answers CORS preflight, and when Accept lacks application/json it answers
   303 to <Origin>/aciu (or /aciu?klaida=1 on error) instead of JSON.
   STUB_STATUS=400|413|415|429|500 makes /t/form fail with that status.
   Test helpers: /__stub/status/<code>, /__stub/count (form posts), /__stub/last
   (fields of the last form post as JSON), /__stub/beacons (beacon bodies). */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const DIST = resolve(process.argv[3] ?? process.env.STUB_ROOT ?? 'dist'); // e.g. client-sites/<slug>
const PORT = Number(process.argv[2] ?? 4330);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.xml': 'application/xml', '.txt': 'text/plain' };
const ERRORS = { 400: { error: 'invalid', field: 'phone' }, 413: { error: 'too_large' }, 415: { error: 'file_type' }, 429: { error: 'rate_limited' }, 500: { error: 'server' } };
let id = 0;
let posts = 0; // /t/form requests seen (test helper: /__stub/count)
let last = null; // fields of the last /t/form post (test helper: /__stub/last)
const beacons = []; // beacon bodies (test helper: /__stub/beacons)
let forced = Number(process.env.STUB_STATUS ?? 200);

const json = (res, status, body, extra = {}) => {
  res.writeHead(status, { 'content-type': 'application/json', ...extra });
  res.end(JSON.stringify(body));
};

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const origin = req.headers.origin;
  if (url.pathname.startsWith('/__stub/status/')) { // test helper: /__stub/status/500 (or 200) switches /t/form
    forced = Number(url.pathname.split('/').pop()) || 200;
    return json(res, 200, { status: forced });
  }
  if (url.pathname === '/__stub/count') { res.writeHead(200, { 'content-type': 'text/plain' }); return res.end(String(posts)); }
  if (url.pathname === '/__stub/last') return json(res, 200, last);
  if (url.pathname === '/__stub/beacons') return json(res, 200, beacons);
  const cors = origin ? { 'access-control-allow-origin': origin, vary: 'Origin' } : {};
  if (req.method === 'OPTIONS' && url.pathname.startsWith('/t/')) {
    res.writeHead(204, { ...cors, 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type, accept', 'access-control-max-age': '600' }).end();
    return;
  }
  if (req.method === 'POST' && url.pathname.startsWith('/t/')) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    if (url.pathname === '/t/e') {
      console.log('[beacon]', body.toString());
      beacons.push(body.toString());
      res.writeHead(204, cors).end();
      return;
    }
    if (url.pathname === '/t/form') {
      posts++;
      const request = new Request(url, { method: 'POST', headers: { 'content-type': req.headers['content-type'] ?? '' }, body });
      console.log(`[form] content-type: ${req.headers['content-type']} · ${body.length} bytes`);
      try {
        const data = await request.formData();
        last = [...data].map(([key, value]) => [key, typeof value === 'string' ? value : { name: value.name, type: value.type, size: value.size }]);
        for (const [key, value] of data) {
          console.log(typeof value === 'string' ? `  ${key} = ${JSON.stringify(value)}` : `  ${key} = File(${JSON.stringify(value.name)}, ${value.type || '(no type)'}, ${value.size} B)`);
        }
      } catch (error) {
        console.log('  (not multipart)', error.message);
        return json(res, 400, { error: 'invalid', field: 'kind' });
      }
      const status = forced;
      if (!String(req.headers.accept ?? '').includes('application/json')) {
        res.writeHead(303, { ...cors, location: `${origin ?? `http://localhost:${PORT}`}/aciu${status === 200 ? '' : '?klaida=1'}` }).end();
        return;
      }
      return status === 200 ? json(res, 200, { ok: true, id: String(++id) }, cors) : json(res, status, ERRORS[status] ?? { error: 'server' }, cors);
    }
  }
  // Static files: /path, /path/index.html, /path.html
  let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  for (const candidate of [path, join(path, 'index.html'), `${path}.html`]) {
    const file = join(DIST, candidate);
    if (!file.startsWith(DIST)) break;
    try {
      if ((await stat(file)).isFile()) {
        res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
        res.end(await readFile(file));
        return;
      }
    } catch {}
  }
  res.writeHead(404, { 'content-type': 'text/html' }).end(await readFile(join(DIST, '404.html')).catch(() => 'Not found'));
}).listen(PORT, () => console.log(`stub: http://localhost:${PORT} (dist/ + POST /t/form, /t/e)`));
