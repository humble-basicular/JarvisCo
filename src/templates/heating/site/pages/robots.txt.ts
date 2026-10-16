import { loadBuild } from '../load';

export function GET() {
  const { site } = loadBuild();
  const body = site.testBuild
    ? 'User-agent: *\nDisallow: /\n' // local test build: never meant to be crawled or deployed
    : `User-agent: *\nAllow: /\nDisallow: /aciu\n\nSitemap: https://${site.domain}/sitemap.xml\n`;
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
