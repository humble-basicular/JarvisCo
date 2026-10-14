#!/usr/bin/env node
/* `npm run preview -- <input.json>`: validate a PreviewInput, pick a random
   slug, copy (and shrink) the photos and write previews/<slug>.json for the
   /perziura/<slug> page. Shape and example: scripts/preview/README.md.
   `npm run preview` without a file still serves dist/ (astro preview). */
import { spawn } from 'node:child_process';
import { randomInt } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const input = args.find((a) => a.endsWith('.json'));

/* Same alphabet as proof codes (no 0/o/1/l/i), but 10 chars: not guessable. */
const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';
const PHOTO_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.avif', '.tif', '.tiff']);

function text(value, field, max, { required = false } = {}) {
  if (value == null || value === '') {
    if (required) throw new Error(`${field} is required`);
    return undefined;
  }
  if (typeof value !== 'string') throw new Error(`${field} must be a string`);
  const v = value.trim();
  if (required && !v) throw new Error(`${field} is required`);
  if (v.length > max) throw new Error(`${field} is longer than ${max} characters`);
  return v || undefined;
}

function list(value, field, max = 12, each = 60) {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new Error(`${field} must be a list`);
  const out = value.map((v, i) => text(v, `${field}[${i}]`, each)).filter(Boolean);
  if (out.length > max) throw new Error(`${field} has more than ${max} items`);
  return [...new Set(out)];
}

/** Free-text "Kita" answers: comma, semicolon or new line separated. */
const splitOther = (value) => (typeof value === 'string' ? value.split(/[,;\n]/u).map((s) => s.trim()).filter(Boolean) : []);

function validateSubmission(sub) {
  if (sub == null) return undefined;
  if (typeof sub !== 'object' || Array.isArray(sub)) throw new Error('submission must be the §5 object');
  return {
    name: text(sub.name, 'submission.name', 80) ?? null,
    phone: text(sub.phone, 'submission.phone', 20) ?? null,
    services: list(sub.services, 'submission.services'),
    services_other: text(sub.services_other, 'submission.services_other', 200) ?? null,
    area: list(sub.area, 'submission.area'),
    area_other: text(sub.area_other, 'submission.area_other', 200) ?? null,
    photos_ok: ['yes', 'send_other'].includes(sub.photos_ok) ? sub.photos_ok : null,
    standout: text(sub.standout, 'submission.standout', 1000) ?? null,
    contact_time: ['morning', 'day', 'evening', 'sms'].includes(sub.contact_time) ? sub.contact_time : null,
    files: Array.isArray(sub.files) ? sub.files : [],
  };
}

function isPhone(value) {
  return value.length <= 20 && /^[0-9 +\-()]+$/.test(value) && (value.match(/\d/g)?.length ?? 0) >= 8;
}

/** Top-level fields win; missing ones are filled from the form submission. */
export function normalize(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('input must be a JSON object');
  const submission = validateSubmission(raw.submission);
  const sub = submission ?? {};
  const services = list(raw.services, 'services');
  const areas = list(raw.areas, 'areas');
  const data = {
    business: text(raw.business, 'business', 80, { required: true }),
    phone: text(raw.phone ?? sub.phone, 'phone', 20, { required: true }),
    city: text(raw.city, 'city', 60),
    areas: areas.length ? areas : [...(sub.area ?? []), ...splitOther(sub.area_other)].slice(0, 12),
    services: services.length ? services : [...(sub.services ?? []), ...splitOther(sub.services_other)].slice(0, 12),
    standout: text(raw.standout, 'standout', 1000) ?? sub.standout ?? undefined,
    tagline: text(raw.tagline, 'tagline', 120),
    about: text(raw.about, 'about', 1000),
    email: text(raw.email, 'email', 120),
  };
  if (!isPhone(data.phone)) throw new Error(`phone "${data.phone}" is not a phone number (digits, spaces, + - ( ), at least 8 digits)`);
  if (!data.city && !data.areas.length) throw new Error('city or areas is required');
  data.city ??= data.areas[0];
  if (!data.areas.length) data.areas = [data.city];
  if (!data.services.length) throw new Error('services (or submission.services / services_other) is required');
  const photos = raw.photos ?? [];
  if (!Array.isArray(photos) || photos.length > 12) throw new Error('photos must be a list of at most 12 paths');
  data.photos = photos.map((p, i) => {
    const item = typeof p === 'string' ? { path: p } : p;
    if (!item || typeof item.path !== 'string') throw new Error(`photos[${i}] must be a path or {path, alt}`);
    return { path: item.path, alt: text(item.alt, `photos[${i}].alt`, 160) };
  });
  return { data, submission };
}

function newSlug() {
  for (;;) {
    const slug = Array.from({ length: 10 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
    if (!existsSync(join(ROOT, 'previews', `${slug}.json`))) return slug;
  }
}

async function generate(file) {
  const raw = JSON.parse(readFileSync(file, 'utf8'));
  const { data, submission } = normalize(raw);
  const base = dirname(file);
  for (const p of data.photos) {
    const src = resolve(base, p.path);
    if (!existsSync(src)) throw new Error(`photo not found: ${p.path}`);
    if (!PHOTO_EXT.has(extname(src).toLowerCase())) throw new Error(`not a photo: ${p.path}`);
    p.file = src;
  }

  const slug = newSlug();
  const outDir = join(ROOT, 'public', 'previews', slug);
  const photos = [];
  if (data.photos.length) {
    const { default: sharp } = await import('sharp');
    mkdirSync(outDir, { recursive: true });
    for (const [i, p] of data.photos.entries()) {
      const name = `${i + 1}.jpg`;
      // Rotate by EXIF, ≤ 1600 px, JPEG, metadata (GPS etc.) stripped.
      const info = await sharp(p.file).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toFile(join(outDir, name));
      photos.push({ src: `/previews/${slug}/${name}`, width: info.width, height: info.height, ...(p.alt ? { alt: p.alt } : {}) });
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
    ...(data.about ? { about: data.about } : {}),
    ...(data.email ? { email: data.email } : {}),
    photos,
    ...(submission ? { submission } : {}),
  };
  mkdirSync(join(ROOT, 'previews'), { recursive: true });
  const target = join(ROOT, 'previews', `${slug}.json`);
  writeFileSync(target, `${JSON.stringify(out, null, 2)}\n`);

  console.log(`Wrote ${relative(ROOT, target)}${photos.length ? ` and ${photos.length} photo(s) in ${relative(ROOT, outDir)}/` : ''}`);
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
