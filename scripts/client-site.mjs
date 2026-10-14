#!/usr/bin/env node
/* Live client site: a standalone static build of the heating template.
   node scripts/client-site.mjs previews/<slug>.json --site <code> --domain <domain> [--test <origin>]
   Reads a previews/<slug>.json (made by `npm run preview -- <input.json>`),
   writes client-sites/<slug>/ (index, aciu, privatumo-politika, robots.txt,
   sitemap.xml, photos). The form posts to the Worker (spec §3); --test points
   form and beacons at a local stub instead and marks the build "never deploy".
   Details: scripts/preview/README.md. */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PREVIEWS = join(ROOT, 'previews');
const OUT = join(ROOT, 'client-sites');
const SLUG = /^[23456789abcdefghjkmnpqrstuvwxyz]{10}$/;
const SITE_CODE = /^[a-z][a-z0-9-]{2,31}$/;
const DOMAIN = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

const fail = (msg) => { console.error(`client-site: ${msg}`); process.exit(1); };
const inside = (dir, file) => file === dir || file.startsWith(dir + sep);

const argv = process.argv.slice(2);
const flag = (name) => { const i = argv.indexOf(`--${name}`); return i < 0 ? undefined : argv[i + 1]; };
const input = argv.find((a) => a.endsWith('.json'));
const code = flag('site');
const domain = flag('domain')?.toLowerCase();
const test = flag('test');

if (!input || !code || !domain) fail('usage: node scripts/client-site.mjs previews/<slug>.json --site <code> --domain <domain> [--test http://localhost:4330]');
if (!SITE_CODE.test(code)) fail(`--site "${code}" must match ${SITE_CODE}`);
if (!DOMAIN.test(domain)) fail(`--domain "${domain}" must be a bare host name like example.lt (no scheme, no path)`);
if (test && !/^http:\/\/(localhost|127\.0\.0\.1):\d{2,5}$/.test(test)) fail('--test must be http://localhost:<port>');

const file = resolve(process.env.INIT_CWD ?? process.cwd(), input);
if (!inside(PREVIEWS, file)) fail(`input must be inside previews/ (got ${relative(ROOT, file)})`);
if (!existsSync(file)) fail(`not found: ${relative(ROOT, file)}`);
let data;
try { data = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { fail(`invalid JSON: ${e.message}`); }
if (!data || typeof data !== 'object' || !SLUG.test(String(data.slug))) fail('slug must be a 10-character generated slug');
for (const k of ['business', 'phone', 'city']) if (typeof data[k] !== 'string' || !data[k]) fail(`${k} is missing`);
if (!Array.isArray(data.areas) || !Array.isArray(data.services) || !data.services.length) fail('areas / services are missing');

const slug = data.slug;
const target = join(OUT, slug);
if (!inside(OUT, target)) fail('output path escapes client-sites/');
const stage = join(OUT, `.build-${slug}`);

// Photos: previews/<slug> photos (public/previews/<slug>/N.jpg) → /foto/N.jpg, same files as the preview.
rmSync(stage, { recursive: true, force: true });
mkdirSync(join(stage, 'public', 'foto'), { recursive: true });
const srcPhotos = join(ROOT, 'public', 'previews', slug);
const photos = (data.photos ?? []).map((p, i) => {
  const name = `${i + 1}.jpg`;
  if (typeof p?.src !== 'string' || p.src !== `/previews/${slug}/${name}` || !existsSync(join(srcPhotos, name))) fail(`photo ${i + 1} is not in public/previews/${slug}/`);
  cpSync(join(srcPhotos, name), join(stage, 'public', 'foto', name));
  return { ...p, src: `/foto/${name}` };
});

const { submission, created, ...site } = data; // the lead's form answers never go into the published site
const build = {
  data: { ...site, photos },
  site: {
    code,
    domain,
    formEndpoint: test ? `${test}/t/form` : 'https://www.jarvisweb.lt/t/form',
    beaconEndpoint: test ? `${test}/t/e` : 'https://www.jarvisweb.lt/t/e',
    ...(test ? { testBuild: true } : {}),
  },
};
writeFileSync(join(stage, 'build.json'), JSON.stringify(build));

const started = Date.now();
process.env.CLIENT_SITE_BUILD = join(stage, 'build.json');
const { build: astroBuild } = await import('astro');
try {
  await astroBuild({
    root: ROOT,
    configFile: false,
    srcDir: join(ROOT, 'src/templates/heating/site'),
    publicDir: join(stage, 'public'),
    outDir: target,
    cacheDir: join(stage, 'cache'),
    site: `https://${domain}`,
    trailingSlash: 'ignore',
    build: { inlineStylesheets: 'always' },
    compressHTML: true,
    logLevel: 'warn',
  });
} finally {
  rmSync(stage, { recursive: true, force: true });
}

const index = readFileSync(join(target, 'index.html'), 'utf8');
if (/noindex/i.test(index)) fail('built index.html is noindex');
if (!index.includes(`<link rel="canonical" href="https://${domain}/">`)) fail('canonical missing in built index.html');
for (const f of ['aciu/index.html', 'privatumo-politika/index.html', 'robots.txt', 'sitemap.xml']) if (!existsSync(join(target, f))) fail(`missing ${f}`);

console.log(`Built ${relative(ROOT, target)}/ in ${((Date.now() - started) / 1000).toFixed(1)}s: ${readdirSync(target).join(', ')}`);
console.log(`Site ${code} → https://${domain}/   form: ${build.site.formEndpoint}`);
if (test) console.log('TEST BUILD (stub endpoints): never deploy this folder.');
else console.log('Not deployed. Add the site code + origins to the Worker SITES var first, then upload this folder to the client host.');
