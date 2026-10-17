import { loadBuild } from '../load';

export function GET() {
  const { site } = loadBuild();
  const urls = ['/', '/privatumo-politika'].map((p) => `  <url><loc>https://${site.domain}${p}</loc></url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
}
