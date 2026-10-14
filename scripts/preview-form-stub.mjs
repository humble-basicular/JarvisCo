#!/usr/bin/env node
/* Local stub for testing the /noriu form without the Worker: serves dist/ and
   answers POST /t/form and POST /t/e on the same origin. It logs what the form
   sent (field names, values, file names, types, sizes) and stores nothing.
   Usage: npm run build && node scripts/preview-form-stub.mjs [port]
   STUB_STATUS=400|413|415|429|500 makes /t/form fail with that status. */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const DIST = resolve('dist');
const PORT = Number(process.argv[2] ?? 4330);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.xml': 'application/xml', '.txt': 'text/plain' };
const ERRORS = { 400: { error: 'invalid', field: 'phone' }, 413: { error: 'too_large' }, 415: { error: 'file_type' }, 429: { error: 'rate_limited' }, 500: { error: 'server' } };
let id = 0;

const json = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
};

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (req.method === 'POST' && url.pathname.startsWith('/t/')) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    if (url.pathname === '/t/e') {
      console.log('[beacon]', body.toString());
      res.writeHead(204).end();
      return;
    }
    if (url.pathname === '/t/form') {
      const request = new Request(url, { method: 'POST', headers: { 'content-type': req.headers['content-type'] ?? '' }, body });
      console.log(`[form] content-type: ${req.headers['content-type']} · ${body.length} bytes`);
      try {
        const data = await request.formData();
        for (const [key, value] of data) {
          console.log(typeof value === 'string' ? `  ${key} = ${JSON.stringify(value)}` : `  ${key} = File(${JSON.stringify(value.name)}, ${value.type || '(no type)'}, ${value.size} B)`);
        }
      } catch (error) {
        console.log('  (not multipart)', error.message);
        return json(res, 400, { error: 'invalid', field: 'kind' });
      }
      const status = Number(process.env.STUB_STATUS ?? 200);
      return status === 200 ? json(res, 200, { ok: true, id: String(++id) }) : json(res, status, ERRORS[status] ?? { error: 'server' });
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
