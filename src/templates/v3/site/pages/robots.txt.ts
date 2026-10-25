import { loadBuild } from '../load';
export function GET() {
  const { site } = loadBuild();
  return new Response(site.testBuild ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\nDisallow: /aciu\n\nSitemap: https://${site.domain}/sitemap.xml\n`, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
