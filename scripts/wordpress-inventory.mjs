#!/usr/bin/env node
// Read-only public GET inventory. No credentials, cookies, POSTs or browser execution.
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, realpathSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
export async function inventory(out) {
  const origin = 'https://vensland.lt';
  const queue = ['/', '/robots.txt', '/sitemap.xml', '/sitemap_index.xml', '/wp-sitemap.xml', '/wp-json/wp/v2/pages?per_page=100&_fields=id,link,slug,title,content', '/wp-json/wp/v2/posts?per_page=100&_fields=id,link,slug,title,content'];
  const seen = new Set(), publicUrls = new Set([origin + '/']), records = [];
  function add(value, from, page = true) {
    let u; try { u = new URL(value.replace(/&amp;|&#038;/g, '&'), from); } catch { return; }
    if (!['vensland.lt', 'www.vensland.lt'].includes(u.hostname) || !['https:', 'http:'].includes(u.protocol)) return;
    u.hash = ''; u.protocol = 'https:'; u.hostname = 'vensland.lt';
    if (/^\/(wp-admin|wp-json|wp-content|wp-includes)(\/|$)|\/wp-[^/]+\.php$/.test(u.pathname)) return;
    if (/\.(png|jpg|svg|css|js|woff2|pdf)$/i.test(u.pathname)) return;
    if (page) publicUrls.add(u.href);
    queue.push(u.pathname + u.search);
  }
  while (queue.length) {
    const path = queue.shift(); if (seen.has(path)) continue; seen.add(path);
    if (seen.size > 150) throw new Error('inventory bound exceeded; expand explicitly');
    const url = origin + path;
    const r = await fetch(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(30000) });
    const body = await r.text(), links = [];
    for (const m of body.matchAll(/<loc>\s*([^<]+)\s*<\/loc>|\bhref=["']([^"']+)["']/gi)) {
      const link = m[1] ?? m[2]; links.push(link); add(link, url, !/\.xml(?:\?|$)/.test(link));
    }
    if (path === '/robots.txt') for (const m of body.matchAll(/^Sitemap:\s*(\S+)/gmi)) add(m[1], url, false);
    if (r.headers.get('content-type')?.includes('application/json')) {
      const json = JSON.parse(body);
      if (Array.isArray(json)) for (const p of json) { if (p.link) { links.push(p.link); add(p.link, url); } if (p.content?.rendered) for (const m of p.content.rendered.matchAll(/\bhref=["']([^"']+)["']/gi)) { links.push(m[1]); add(m[1], p.link ?? url); } }
      if (Number(r.headers.get('x-wp-totalpages')) > 1) throw new Error('pagination required');
    }
    records.push({ url, effectiveUrl: r.url, status: r.status, contentType: r.headers.get('content-type'), bytes: Buffer.byteLength(body), sha256: createHash('sha256').update(body).digest('hex'), title: body.match(/<title>([^<]*)<\/title>/)?.[1] ?? null, comingSoon: body.includes('hsr-coming-soon-body'), links });
  }
  const result = { capturedAt: new Date().toISOString(), method: 'unauthenticated public GET only', records, publicUrls: [...publicUrls].sort(), limitation: records.some(r => r.comingSoon) ? 'Hostinger coming-soon intercepts homepage, public pages and sitemap requests. Public REST pages/posts supplemented discovery. Hidden/unlinked/private URLs cannot be established; lead must re-inventory after disabling coming-soon and compare an authenticated WordPress page/export before activation.' : null };
  mkdirSync(out, { recursive: true }); writeFileSync(join(out, 'live-url-inventory.json'), JSON.stringify(result, null, 2) + '\n'); return result;
}
if (process.argv[1] && realpathSync(resolve(process.argv[1])) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await inventory(process.argv[2]), null, 2));
