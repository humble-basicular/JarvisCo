import { serviceHref } from '../../service-pages.mjs';
import { loadBuild } from '../load';
import { pagedTowns } from '../../../heating/town-pages';
export function GET() {
  const { data, site } = loadBuild();
  const urls = ['/', ...pagedTowns(data).map((t) => `/${t.slug}/`), ...(data.v3.servicePages ?? []).map((p) => serviceHref(p.slug)), '/privatumo-politika/'];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((p) => `<url><loc>https://${site.domain}${p}</loc></url>`).join('\n')}\n</urlset>\n`, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
}
