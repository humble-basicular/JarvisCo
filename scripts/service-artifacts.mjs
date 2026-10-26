import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'parse5';
const nodes = (n) => [n, ...(n.childNodes ?? []).flatMap(nodes)];
const attr = (n, key) => n.attrs?.find((a) => a.name === key)?.value;
export function checkSeoArtifacts(dir, { domain, test = false, services = [] }) {
  const problems = [];
  const sitemap = existsSync(join(dir, 'sitemap.xml')) ? readFileSync(join(dir, 'sitemap.xml'), 'utf8') : '';
  const read = (path) => {
    if (!existsSync(join(dir, path))) { problems.push(`missing ${path}`); return []; }
    return nodes(parse(readFileSync(join(dir, path), 'utf8')));
  };
  const index = read('index.html');
  const missing = read('404.html');
  if (!missing.some((n) => attr(n, 'name') === 'robots' && attr(n, 'content') === 'noindex,nofollow')) problems.push('404.html must be noindex,nofollow');
  if (sitemap.includes('/404') || sitemap.includes('/aciu/')) problems.push('sitemap lists a 404 or thank-you page');
  if (!sitemap) problems.push('missing or empty sitemap.xml');
  for (const [, location] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    let url;
    try { url = new URL(location); } catch { problems.push('invalid sitemap URL'); continue; }
    if (url.origin !== `https://${domain}` || url.search || url.hash || /(?:^|\/)\.\.?(?:\/|$)/.test(url.pathname)) { problems.push(`invalid sitemap location ${location}`); continue; }
    const path = url.pathname === '/' ? 'index.html' : `${url.pathname.replace(/^\/+|\/+$/g, '')}/index.html`;
    const page = read(path);
    if (!page.some((n) => attr(n, 'rel') === 'canonical' && attr(n, 'href') === location)) problems.push(`${path}: sitemap/canonical mismatch`);
    if (!page.some((n) => attr(n, 'name') === 'robots' && attr(n, 'content') === (test ? 'noindex,nofollow' : 'index,follow'))) problems.push(`${path}: incorrect sitemap page robots`);
  }
  for (const service of services) {
    const href = `/paslaugos/${service.slug}/`, canonical = `https://${domain}${href}`;
    const page = read(`paslaugos/${service.slug}/index.html`);
    if (!page.some((n) => attr(n, 'rel') === 'canonical' && attr(n, 'href') === canonical)) problems.push(`${href}: missing self canonical`);
    if (!page.some((n) => attr(n, 'name') === 'robots' && attr(n, 'content') === (test ? 'noindex,nofollow' : 'index,follow'))) problems.push(`${href}: incorrect robots`);
    if (!sitemap.includes(`<loc>${canonical}</loc>`)) problems.push(`${href}: missing from sitemap`);
    if (!index.some((n) => n.tagName === 'a' && attr(n, 'href') === href)) problems.push(`${href}: not linked from home`);
    if (!page.some((n) => n.tagName === 'form' && attr(n, 'method') === 'post')) problems.push(`${href}: missing live form`);
    if (!test) {
      const schema = page.find((n) => n.tagName === 'script' && attr(n, 'type') === 'application/ld+json');
      try {
        const json = JSON.parse(schema.childNodes.map((n) => n.value ?? '').join(''));
        if (!json['@graph']?.some((n) => n['@type'] === 'Service' && n.url === canonical) || !json['@graph'].some((n) => n['@type'] === 'BreadcrumbList')) throw new Error();
      } catch { problems.push(`${href}: invalid or missing service/breadcrumb schema`); }
    }
  }
  return problems;
}
