#!/usr/bin/env node
/* Live client site: a standalone static build of the heating template.
   node scripts/client-site.mjs previews/<slug>.json --site <code> --domain <domain> [--test <origin>]
   Reads a previews/<slug>.json (made by `npm run preview -- <input.json>`),
   writes client-sites/<slug>/ (index, aciu, privatumo-politika, robots.txt,
   sitemap.xml, photos). The form posts to the Worker (spec §3); --test points
   form and beacons at a local stub instead and marks the build "never deploy".
   Details: scripts/preview/README.md. */
import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkLogoFile, toE164, validateSaved } from './preview/normalize.mjs';

const ROOT = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const PREVIEWS = join(ROOT, 'previews');
const OUT = join(ROOT, 'client-sites');
const SLUG = /^[23456789abcdefghjkmnpqrstuvwxyz]{10}$/;
const SITE_CODE = /^[a-z][a-z0-9-]{2,31}$/;
const DOMAIN = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

const fail = (msg) => { console.error(`client-site: ${msg}`); process.exit(1); };
const inside = (dir, file) => file === dir || file.startsWith(dir + sep);
const shown = (p) => relative(ROOT, p) || '.';
/** Path (absent is fine) whose every existing component below ROOT is a real directory/file, never a symlink. */
function noSymlinks(path) {
  if (!inside(ROOT, path)) fail(`${path} is outside the repo`);
  let cur = ROOT;
  for (const part of relative(ROOT, path).split(sep).filter(Boolean)) {
    cur = join(cur, part);
    let st;
    try { st = lstatSync(cur); } catch (e) { if (e.code === 'ENOENT') return path; throw e; }
    if (st.isSymbolicLink()) fail(`refusing symlink: ${shown(cur)}`);
  }
  return path;
}
/** Existing regular file/dir whose real path stays inside `root` (a real path itself). */
function contained(root, path, kind) {
  noSymlinks(path);
  let real;
  try { real = realpathSync(path); } catch { fail(`not found: ${shown(path)}`); }
  if (!inside(root, real)) fail(`${shown(path)} resolves outside ${shown(root)}`);
  const st = lstatSync(real);
  if (kind === 'file' ? !st.isFile() : !st.isDirectory()) fail(`${shown(path)} is not a ${kind === 'file' ? 'regular file' : 'directory'}`);
  return real;
}

const argv = process.argv.slice(2);
const flag = (name) => { const i = argv.indexOf(`--${name}`); return i < 0 ? undefined : argv[i + 1]; };
const input = argv.find((a) => a.endsWith('.json'));
const code = flag('site');
const domain = flag('domain')?.toLowerCase();
const test = flag('test');
const TEST_MARKER = 'TEST-BUILD-DO-NOT-DEPLOY.txt';
// Opt-in audit mode retains all staging artifacts and refuses existing output.
const retainBuild = argv.includes('--retain-build');

if (!input || !code || !domain) fail('usage: node scripts/client-site.mjs previews/<slug>.json --site <code> --domain <domain> [--test http://localhost:4330]');
if (!SITE_CODE.test(code)) fail(`--site "${code}" must match ${SITE_CODE}`);
if (!DOMAIN.test(domain)) fail(`--domain "${domain}" must be a bare host name like example.lt (no scheme, no path)`);
if (test && !/^http:\/\/(localhost|127\.0\.0\.1):\d{2,5}$/.test(test)) fail('--test must be http://localhost:<port>');

// Everything is validated before the first filesystem change.
const lexical = resolve(process.env.INIT_CWD ?? process.cwd(), input);
if (!inside(PREVIEWS, lexical)) fail(`input must be inside previews/ (got ${shown(lexical)})`);
const file = contained(contained(ROOT, PREVIEWS, 'dir'), lexical, 'file');
let data;
try { data = validateSaved(JSON.parse(readFileSync(file, 'utf8'))); } catch (e) { fail(`invalid preview: ${e.message}`); }
if (!SLUG.test(data.slug)) fail('slug must be a 10-character generated slug');
if (!toE164(data.phone)) fail(`phone "${data.phone}" cannot be converted to +370…`);
if (join(PREVIEWS, `${data.slug}.json`) !== file) fail('file name must be <slug>.json');

const slug = data.slug;
const target = join(OUT, slug);
const stage = join(OUT, `.build-${slug}`);
const srcPhotos = join(ROOT, 'public', 'previews', slug);
const photoFiles = data.photos.map((p, i) => {
  const name = `${i + 1}.jpg`;
  if (p.src !== `/previews/${slug}/${name}`) fail(`photo ${i + 1} is not in public/previews/${slug}/`);
  return { name, real: contained(realpathSync(contained(ROOT, join(ROOT, 'public', 'previews'), 'dir')), join(srcPhotos, name), 'file') };
});
// Logo (optional): public/previews/<slug>/logo.svg|png → /foto/logo.svg|png, checked again (the file may have been edited).
const logoFile = data.logo ? (() => {
  const name = data.logo.src.split('/').pop();
  const real = contained(realpathSync(contained(ROOT, join(ROOT, 'public', 'previews'), 'dir')), join(srcPhotos, name), 'file');
  try { checkLogoFile(readFileSync(real), extname(name)); } catch (e) { fail(e.message); }
  return { name, real };
})() : undefined;
const towns = (data.towns ?? []).filter((t) => t.text).map((t) => t.slug);
for (const p of [OUT, target, stage]) noSymlinks(p); // existing output dirs must be real directories

// Photos: previews/<slug> photos (public/previews/<slug>/N.jpg) → /foto/N.jpg, same files as the preview.
const removeStage = () => { noSymlinks(stage); if (inside(OUT, stage) && stage !== OUT) rmSync(stage, { recursive: true, force: true }); };
if (retainBuild) {
  if (existsSync(stage) || existsSync(target)) fail('--retain-build requires fresh stage and output paths');
} else removeStage();
mkdirSync(join(stage, 'public', 'foto'), { recursive: true });
noSymlinks(join(stage, 'public', 'foto'));
const photos = data.photos.map((p, i) => {
  copyFileSync(photoFiles[i].real, join(stage, 'public', 'foto', photoFiles[i].name));
  return { ...p, src: `/foto/${photoFiles[i].name}` };
});

if (logoFile) copyFileSync(logoFile.real, join(stage, 'public', 'foto', logoFile.name));
const logo = logoFile ? { ...data.logo, src: `/foto/${logoFile.name}` } : undefined;

const { submission, created, ...site } = data; // the lead's form answers never go into the published site
const build = {
  data: { ...site, photos, ...(logo ? { logo } : {}) },
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
  if (!retainBuild) removeStage();
}

const index = readFileSync(join(target, 'index.html'), 'utf8');
if (test) {
  // Artifact-level guard: scripts/client-site-deploy-check.mjs refuses any folder with this marker.
  writeFileSync(join(target, TEST_MARKER), 'Local test build with stub form endpoints. Never deploy this folder.\n');
  if (!/name="robots" content="noindex,nofollow"/.test(index)) fail('test build index.html must be noindex');
  if (!/Disallow: \/\n/.test(readFileSync(join(target, 'robots.txt'), 'utf8'))) fail('test build robots.txt must disallow everything');
} else {
  if (/noindex/i.test(index)) fail('built index.html is noindex');
  if (/localhost|127\.0\.0\.1/.test(index)) fail('live build points at a local endpoint');
}
if (!index.includes(`<link rel="canonical" href="https://${domain}/">`)) fail('canonical missing in built index.html');
for (const f of ['aciu/index.html', 'privatumo-politika/index.html', 'robots.txt', 'sitemap.xml', ...towns.map((t) => `${t}/index.html`)]) if (!existsSync(join(target, f))) fail(`missing ${f}`);
const sitemap = readFileSync(join(target, 'sitemap.xml'), 'utf8');
for (const t of towns) {
  if (!readFileSync(join(target, t, 'index.html'), 'utf8').includes(`<link rel="canonical" href="https://${domain}/${t}/">`)) fail(`canonical missing in ${t}/index.html`);
  if (!sitemap.includes(`<loc>https://${domain}/${t}/</loc>`)) fail(`sitemap.xml does not list /${t}/`);
  if (!index.includes(`href="/${t}/"`)) fail(`index.html does not link to /${t}/`);
}
if (logo && !index.includes(`src="${logo.src}"`)) fail('logo missing in built index.html');

console.log(`Built ${relative(ROOT, target)}/ in ${((Date.now() - started) / 1000).toFixed(1)}s: ${readdirSync(target).join(', ')}`);
console.log(`Site ${code} → https://${domain}/   form: ${build.site.formEndpoint}${towns.length ? `   towns: ${towns.map((t) => `/${t}/`).join(' ')}` : ''}`);
if (test) console.log('TEST BUILD (stub endpoints): never deploy this folder.');
else console.log('Not deployed. Add the site code + origins to the Worker SITES var first, then upload this folder to the client host.');
