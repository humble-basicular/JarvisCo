#!/usr/bin/env node
/* `npm run preview -- <input.json>`: validate a PreviewInput, pick a random
   slug, copy (and shrink) the photos and write previews/<slug>.json for the
   /perziura/<slug> page. Shape and example: scripts/preview/README.md.
   `npm run preview` without a file still serves dist/ (astro preview). */
import { spawn } from 'node:child_process';
import { randomInt } from 'node:crypto';
import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, extname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
import { checkLogoFile, normalize } from './normalize.mjs';
const args = process.argv.slice(2);
const input = args.find((a) => a.endsWith('.json'));

/* Same alphabet as proof codes (no 0/o/1/l/i), but 10 chars: not guessable. */
const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';
const PHOTO_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.avif', '.tif', '.tiff']);


function newSlug() {
  for (;;) {
    const slug = Array.from({ length: 10 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
    if (!existsSync(join(ROOT, 'previews', `${slug}.json`))) return slug;
  }
}

/** A file named in the input: inside the input JSON's directory and not a symlink. */
function inputFile(base, path, what) {
  const src = resolve(base, path);
  if (!existsSync(src)) throw new Error(`${what} not found: ${path}`);
  if (lstatSync(src).isSymbolicLink()) throw new Error(`${what} is a symlink: ${path}`);
  const rel = relative(realpathSync(base), realpathSync(src));
  if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) throw new Error(`${what} outside the input folder: ${path}`);
  return src;
}

async function generate(file) {
  const raw = JSON.parse(readFileSync(file, 'utf8'));
  const { data, submission } = normalize(raw);
  const base = dirname(file);
  for (const p of data.photos) {
    p.file = inputFile(base, p.path, 'photo');
    if (!PHOTO_EXT.has(extname(p.file).toLowerCase())) throw new Error(`not a photo: ${p.path}`);
  }
  let logoFile;
  if (data.logo) {
    logoFile = inputFile(base, data.logo.path, 'logo');
    await checkLogoFile(readFileSync(logoFile), extname(logoFile));
  }

  // `--slug <existing>` rebuilds an already shared preview in place (same link for the client).
  const keep = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : undefined;
  if (keep !== undefined && !/^[2-9a-hjkmnp-z]{10}$/.test(keep)) throw new Error('--slug must be an existing 10-character preview slug');
  if (keep !== undefined && !existsSync(join(ROOT, 'previews', `${keep}.json`))) throw new Error(`--slug ${keep}: previews/${keep}.json does not exist`);
  const slug = keep ?? newSlug();
  const outDir = join(ROOT, 'public', 'previews', slug);
  const photos = [];
  let logo;
  if (logoFile) {
    // Copied as is (already checked): /previews/<slug>/logo.svg|png.
    const name = `logo${extname(logoFile).toLowerCase()}`;
    mkdirSync(outDir, { recursive: true });
    copyFileSync(logoFile, join(outDir, name));
    logo = { src: `/previews/${slug}/${name}`, ...(data.logo.line ? { line: data.logo.line } : {}) };
  }
  if (data.photos.length) {
    const { default: sharp } = await import('sharp');
    mkdirSync(outDir, { recursive: true });
    for (const [i, p] of data.photos.entries()) {
      const name = `${i + 1}.jpg`;
      // Rotate by EXIF, ≤ 1600 px, JPEG, metadata (GPS etc.) stripped.
      const info = await sharp(p.file).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toFile(join(outDir, name));
      photos.push({ src: `/previews/${slug}/${name}`, width: info.width, height: info.height, ...(p.alt ? { alt: p.alt } : {}), ...(p.ai ? { ai: true } : {}) });
    }
  }

  const out = {
    slug,
    created: new Date().toISOString(),
    business: data.business,
    phone: data.phone,
    city: data.city,
    areas: data.areas,
    services: data.services,
    ...(data.standout ? { standout: data.standout } : {}),
    ...(data.tagline ? { tagline: data.tagline } : {}),
    ...(data.lead ? { lead: data.lead } : {}),
    ...(data.about ? { about: data.about } : {}),
    ...(data.email ? { email: data.email } : {}),
    ...(data.hours ? { hours: data.hours } : {}),
    ...(data.brands.length ? { brands: data.brands } : {}),
    ...(data.accent ? { accent: data.accent } : {}),
    ...(data.legal ? { legal: data.legal } : {}),
    ...(data.reviews?.length ? { reviews: data.reviews } : {}),
    ...(data.faq?.length ? { faq: data.faq } : {}),
    ...(data.qualifications.length ? { qualifications: data.qualifications } : {}),
    ...(data.prices?.length ? { prices: data.prices } : {}),
    ...(data.priceNote ? { priceNote: data.priceNote } : {}),
    ...(logo ? { logo } : {}),
    ...(data.towns?.length ? { towns: data.towns } : {}),
    ...(data.v3 ? { v3: data.v3 } : {}),
    photos,
    ...(submission ? { submission } : {}),
  };
  mkdirSync(join(ROOT, 'previews'), { recursive: true });
  const target = join(ROOT, 'previews', `${slug}.json`);
  writeFileSync(target, `${JSON.stringify(out, null, 2)}\n`);

  console.log(`Wrote ${relative(ROOT, target)}${photos.length || logo ? ` and ${photos.length} photo(s)${logo ? ' + logo' : ''} in ${relative(ROOT, outDir)}/` : ''}`);
  for (const t of out.towns?.filter((x) => x.text) ?? []) console.log(`Town:   http://localhost:4321/perziura/${slug}/${t.slug}`);
  console.log(`Local:  http://localhost:4321/perziura/${slug}   (npm run dev)`);
  console.log(`Live:   https://jarvisweb.lt/perziura/${slug}   (after deploy)`);
}

if (!input) {
  // No input file: behave like the old `npm run preview` (serve the build).
  const child = spawn('npx', ['astro', 'preview', ...args], { cwd: ROOT, stdio: 'inherit' });
  child.on('exit', (code) => process.exit(code ?? 0));
} else {
  try {
    await generate(resolve(process.env.INIT_CWD ?? process.cwd(), input)); // npm runs scripts from the repo root
  } catch (error) {
    console.error(`preview: ${error.message}`);
    process.exit(1);
  }
}
