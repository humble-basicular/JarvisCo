/* Shared PreviewInput validation: used by cli.mjs (raw input) and ../client-site.mjs (saved previews/<slug>.json). */
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

export function validateSubmission(sub) {
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

/** #rrggbb whose white-text contrast is at least 4.5:1 (buttons are white on accent). */
export function accent(value) {
  const v = text(value, 'accent', 7);
  if (!v) return undefined;
  if (!/^#[0-9a-f]{6}$/i.test(v)) throw new Error('accent must be #rrggbb');
  const lin = (i) => { const c = parseInt(v.slice(i, i + 2), 16) / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const l = 0.2126 * lin(1) + 0.7152 * lin(3) + 0.0722 * lin(5);
  if (1.05 / (l + 0.05) < 4.5) throw new Error(`accent ${v} is too light for white text (needs 4.5:1)`);
  return v.toLowerCase();
}

function legal(value) {
  if (value == null) return undefined;
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error('legal must be {name, code, address}');
  const out = { name: text(value.name, 'legal.name', 120), code: text(value.code, 'legal.code', 20), address: text(value.address, 'legal.address', 160) };
  return Object.values(out).some(Boolean) ? Object.fromEntries(Object.entries(out).filter(([, v]) => v)) : undefined;
}

/** Real client quotes only; the generator never writes any itself. */
function reviews(value) {
  if (value == null) return undefined;
  if (!Array.isArray(value) || value.length > 6) throw new Error('reviews must be a list of at most 6 {text, name, place}');
  return value.map((r, i) => ({ text: text(r?.text, `reviews[${i}].text`, 400, { required: true }), name: text(r?.name, `reviews[${i}].name`, 60, { required: true }), place: text(r?.place, `reviews[${i}].place`, 60) }));
}

function faq(value) {
  if (value == null) return undefined;
  if (!Array.isArray(value) || value.length > 8) throw new Error('faq must be a list of at most 8 {q, a}');
  return value.map((f, i) => ({ q: text(f?.q, `faq[${i}].q`, 160, { required: true }), a: text(f?.a, `faq[${i}].a`, 600, { required: true }) }));
}

/** Lithuanian national/international formats → E.164, else null. Keep in step with toE164 in src/templates/heating/content.ts. */
export function toE164(phone) {
  const p = phone.trim();
  const digits = p.replace(/\D/g, '');
  if (p.startsWith('+')) return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
  if (digits.startsWith('00')) return digits.length >= 10 ? `+${digits.slice(2)}` : null;
  if (digits.startsWith('370') && digits.length === 11) return `+${digits}`;
  if (/^[08]\d{8}$/.test(digits)) return `+370${digits.slice(1)}`;
  if (/^[3-9]\d{7}$/.test(digits)) return `+370${digits}`;
  return null;
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
    hours: text(raw.hours, 'hours', 120),
    brands: list(raw.brands, 'brands', 10, 40),
    accent: accent(raw.accent),
    legal: legal(raw.legal),
    reviews: reviews(raw.reviews),
    faq: faq(raw.faq),
  };
  if (!isPhone(data.phone)) throw new Error(`phone "${data.phone}" is not a phone number (digits, spaces, + - ( ), at least 8 digits)`);
  if (!toE164(data.phone)) throw new Error(`phone "${data.phone}" cannot be converted to +370… (use 8 6xx xxxxx, 06xx xxxxx, 6xx xxxxx or +370 6xx xxxxx)`);
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

/** A saved previews/<slug>.json (what the CLI wrote): the same checks as normalize(), plus the photo records. */
export function validateSaved(saved) {
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) throw new Error('input must be a JSON object');
  if (!Array.isArray(saved.photos ?? [])) throw new Error('photos must be a list');
  const photos = saved.photos ?? [];
  photos.forEach((p, i) => {
    if (!p || typeof p !== 'object' || typeof p.src !== 'string') throw new Error(`photos[${i}] must be {src, width, height, alt}`);
    for (const k of ['width', 'height']) if (!Number.isInteger(p[k]) || p[k] < 1 || p[k] > 20000) throw new Error(`photos[${i}].${k} must be a positive integer`);
    if (p.alt != null && typeof p.alt !== 'string') throw new Error(`photos[${i}].alt must be a string`);
  });
  const { data } = normalize({ ...saved, photos: photos.map((p) => ({ path: p.src, alt: p.alt })) });
  if (typeof saved.slug !== 'string') throw new Error('slug is missing');
  return { ...data, slug: saved.slug, photos: photos.map((p) => ({ src: p.src, width: p.width, height: p.height, ...(p.alt ? { alt: p.alt } : {}) })) };
}
