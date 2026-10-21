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

/** Accept supplied service descriptions without inventing any for real businesses. */
function servicesList(value) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > 12) throw new Error('services must be a list of at most 12');
  return value.map((item, i) => {
    if (typeof item === 'string') return text(item, `services[${i}]`, 60, { required: true });
    return { name: text(item?.name, `services[${i}].name`, 60, { required: true }),
      ...(item?.text ? { text: text(item.text, `services[${i}].text`, 400) } : {}) };
  });
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

/** Any #rrggbb brand colour. The template keeps it readable: white or ink text on
 *  it, darkened only when neither reaches 4.5:1 (src/templates/heating/accent.ts). */
export function accent(value) {
  const v = text(value, 'accent', 7);
  if (!v) return undefined;
  if (!/^#[0-9a-f]{6}$/i.test(v)) throw new Error('accent must be #rrggbb');
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
  return value.map((r, i) => {
    const url = text(r?.url, `reviews[${i}].url`, 300);
    if (url && !/^https:\/\/[^\s"'<>]+$/u.test(url)) throw new Error(`reviews[${i}].url must be an https:// link`);
    const out = {
      text: text(r?.text, `reviews[${i}].text`, 400, { required: true }),
      name: text(r?.name, `reviews[${i}].name`, 60, { required: true }),
      place: text(r?.place, `reviews[${i}].place`, 60),
      source: text(r?.source, `reviews[${i}].source`, 60),
      url,
      date: text(r?.date, `reviews[${i}].date`, 30),
      rating: r?.rating == null ? undefined : (Number.isInteger(r.rating) && r.rating >= 1 && r.rating <= 5 ? r.rating : (() => { throw new Error(`reviews[${i}].rating must be a whole number 1–5`); })()),
    };
    return Object.fromEntries(Object.entries(out).filter(([, v]) => v));
  });
}

/** Prices the client gave: [{name, price, note?}]. */
function prices(value) {
  if (value == null) return undefined;
  if (!Array.isArray(value) || value.length > 10) throw new Error('prices must be a list of at most 10 {name, price, note}');
  return value.map((p, i) => {
    const out = { name: text(p?.name, `prices[${i}].name`, 80, { required: true }), price: text(p?.price, `prices[${i}].price`, 40, { required: true }), note: text(p?.note, `prices[${i}].note`, 160) };
    return Object.fromEntries(Object.entries(out).filter(([, v]) => v));
  });
}

function faq(value) {
  if (value == null) return undefined;
  if (!Array.isArray(value) || value.length > 8) throw new Error('faq must be a list of at most 8 {q, a}');
  return value.map((f, i) => ({ q: text(f?.q, `faq[${i}].q`, 160, { required: true }), a: text(f?.a, `faq[${i}].a`, 600, { required: true }) }));
}

/** Town URL part: lower case ASCII, words joined by "-" ("Kėdainiai" → "kedainiai", "Kauno r." → "kauno-r"). */
export function townSlug(name) {
  return name.toLocaleLowerCase('lt').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
/* Paths the client site (and /perziura/<slug>/…) already use. */
const RESERVED_TOWN_SLUGS = new Set(['aciu', 'privatumo-politika', 'foto', 'robots-txt', 'sitemap-xml', 'index', '404', 'perziura', 'previews', 'pradzia']);

/** Towns for town (GEO) pages. Only towns with their own `text` get a page (see the README); the
 *  generator never fills a page by swapping the name in shared text. */
function towns(value) {
  if (value == null) return undefined;
  if (!Array.isArray(value) || value.length > 12) throw new Error('towns must be a list of at most 12 {name, text?}');
  const seen = new Set();
  return value.map((raw, i) => {
    const item = typeof raw === 'string' ? { name: raw } : raw;
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error(`towns[${i}] must be a name or {name, text?}`);
    const f = `towns[${i}]`;
    const name = text(item.name, `${f}.name`, 60, { required: true });
    const slug = item.slug == null ? townSlug(name) : text(item.slug, `${f}.slug`, 40, { required: true });
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length < 2 || slug.length > 40) throw new Error(`${f}.slug "${slug}" must be 2–40 characters a-z, 0-9 and "-"`);
    if (RESERVED_TOWN_SLUGS.has(slug)) throw new Error(`${f}.slug "${slug}" is a reserved path`);
    if (seen.has(slug)) throw new Error(`${f}: two towns have the slug "${slug}"`);
    seen.add(slug);
    const townFaq = faq(item.faq);
    if (townFaq && townFaq.length > 4) throw new Error(`${f}.faq has more than 4 questions`);
    const places = list(item.places, `${f}.places`, 12, 60);
    const services = list(item.services, `${f}.services`, 8, 60);
    const out = {
      name, slug,
      loc: text(item.loc, `${f}.loc`, 60),
      text: text(item.text, `${f}.text`, 1000),
      heading: text(item.heading, `${f}.heading`, 120),
      tagline: text(item.tagline, `${f}.tagline`, 120),
      lead: text(item.lead, `${f}.lead`, 300),
      distance: text(item.distance, `${f}.distance`, 80),
      note: text(item.note, `${f}.note`, 300),
      places: places.length ? places : undefined,
      services: services.length ? services : undefined,
      faq: townFaq,
    };
    return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined));
  });
}

/** Logo: a path (relative to the input JSON) or {path, line}. SVG or PNG; `line` is set under the name. */
const LOGO_EXT = /\.(svg|png)$/i;
function logo(value) {
  if (value == null) return undefined;
  const item = typeof value === 'string' ? { path: value } : value;
  if (!item || typeof item !== 'object' || Array.isArray(item) || typeof item.path !== 'string') throw new Error('logo must be a path or {path, line}');
  const path = text(item.path, 'logo.path', 300, { required: true });
  if (!LOGO_EXT.test(path)) throw new Error('logo must be an .svg or .png file');
  const line = text(item.line, 'logo.line', 60);
  return { path, ...(line ? { line } : {}) };
}

/** A logo file is published on jarvisweb.lt and on the client's domain, and a browser that opens an SVG
 *  directly runs its scripts. Accept only plain drawing SVGs (no script, event handler, external or
 *  javascript: reference, foreignObject, entity) and real PNGs; both ≤ 200 KB. */
export async function checkLogoFile(buffer, ext) {
  if (buffer.length > 200 * 1024) throw new Error('logo file is larger than 200 KB');
  if (/^\.?png$/i.test(ext)) {
    if (!buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) throw new Error('logo .png is not a PNG file');
    await decodeLogo(buffer, 'png');
    return;
  }
  if (!/^\.?svg$/i.test(ext)) throw new Error('logo must be .svg or .png');
  const svg = buffer.toString('utf8');
  if (!/^\s*(?:<\?xml[^>]*\?>\s*)?(?:<!--[\s\S]*?-->\s*)*<svg[\s>]/i.test(svg)) throw new Error('logo .svg must start with <svg');
  const bad = [
    [/<script/i, '<script>'], [/<foreignObject/i, '<foreignObject>'], [/<!(?:ENTITY|DOCTYPE)/i, 'DOCTYPE/ENTITY'],
    [/\son[a-z]+\s*=/i, 'an on… event attribute'], [/javascript:|(?<![\w-])data:|vbscript:/i, 'a script/data URL'],
    [/(?:xlink:)?href\s*=\s*["']\s*(?!#)/i, 'an external href'], [/url\(\s*["']?\s*(?!#)/i, 'an external url()'],
    [/@import/i, '@import'], [/<(?:iframe|embed|object|use)\b[^>]*\b(?:src|data)\s*=/i, 'an embedded document'],
  ];
  for (const [re, what] of bad) if (re.test(svg)) throw new Error(`logo .svg contains ${what}`);
  // Parse the element tree as well as checking raw text: XML namespace prefixes can
  // otherwise hide <script> / <foreignObject> from a spelling-based denylist.
  // Only static drawing elements and presentation attributes are accepted. No CSS,
  // animation, alternate namespaces or processing instructions can fetch/run content.
  const markup = svg.replace(/^\s*<\?xml\s[^>]*\?>/i, '');
  if (/<\?/.test(markup)) throw new Error('logo .svg contains a processing instruction');
  const { parseFragment } = await import('parse5');
  const drawing = new Set('svg g defs path circle ellipse rect line polyline polygon linearGradient radialGradient stop clipPath mask title desc text tspan use'.split(' '));
  const attributes = new Set(('id viewBox width height x y x1 x2 y1 y2 cx cy r rx ry d points transform ' +
    'fill fill-rule fill-opacity stroke stroke-width stroke-linecap stroke-linejoin stroke-miterlimit stroke-dasharray stroke-dashoffset stroke-opacity ' +
    'opacity color vector-effect preserveAspectRatio gradientUnits gradientTransform spreadMethod offset stop-color stop-opacity ' +
    'clip-path clip-rule clipPathUnits mask maskUnits maskContentUnits fx fy fr ' +
    'font-family font-size font-weight text-anchor dominant-baseline dx dy textLength lengthAdjust href role aria-label aria-hidden focusable').split(' '));
  const visit = (node, depth = 0) => {
    if (depth > 64) throw new Error('logo .svg is nested too deeply');
    if (node.tagName) {
      if (node.namespaceURI !== 'http://www.w3.org/2000/svg' || !drawing.has(node.tagName)) throw new Error(`logo .svg contains unsupported element ${node.tagName}`);
      for (const attr of node.attrs) {
        if (attr.name === 'xmlns' && !attr.prefix && attr.value === 'http://www.w3.org/2000/svg') continue;
        if (attr.prefix || attr.namespace || !attributes.has(attr.name)) throw new Error(`logo .svg contains unsupported attribute ${attr.name}`);
        if (attr.name === 'href' && !/^#[A-Za-z_][\w.:-]*$/.test(attr.value)) throw new Error('logo .svg href must reference a local drawing');
        if (/\\/.test(attr.value) || (/url\s*\(/i.test(attr.value) && !/^url\(\s*#[A-Za-z_][\w.:-]*\s*\)$/i.test(attr.value))) throw new Error('logo .svg contains an external or escaped reference');
      }
    }
    for (const child of node.childNodes ?? []) visit(child, depth + 1);
  };
  const document = parseFragment(markup);
  const roots = document.childNodes.filter((n) => n.nodeName !== '#comment' && !(n.nodeName === '#text' && !n.value.trim()));
  if (roots.length !== 1 || roots[0].tagName !== 'svg') throw new Error('logo .svg must contain one SVG drawing');
  visit(document);
  await decodeLogo(buffer, 'svg');
}

async function decodeLogo(buffer, format) {
  try {
    const { default: sharp } = await import('sharp');
    // A signature alone is not an image. Decode every pixel before publishing,
    // with a bound on decompressed size even for tiny compressed inputs.
    await sharp(buffer, { limitInputPixels: 16_777_216 }).raw().toBuffer();
  } catch {
    throw new Error(`logo .${format} is not a valid ${format.toUpperCase()} drawing/image`);
  }
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
/* Template v3 block (src/templates/v3/content.ts V3Input + theme.ts Theme). Keep these lists in sync. */
const V3_ENUMS = {
  archetype: ['water', 'heat', 'outdoor', 'heavy', 'electric', 'clean', 'craft'],
  heading: ['archivo-black', 'barlow-condensed', 'space-grotesk'],
  divider: ['angle', 'wave', 'zigzag', 'notch'],
  hero: ['photo', 'panel'],
  services: ['tiles', 'cards'],
  process: ['line', 'chevron', 'frames'],
  shape: ['round', 'shield', 'square'],
  glyph: ['flame', 'drop', 'bolt', 'lens'],
  link: ['google', 'facebook', 'paslaugos'],
};
const V3_ICONS = ['phone', 'camera', 'tag', 'calendar', 'wrench', 'verified', 'pin', 'clock', 'team', 'wallet', 'arrow', 'check', 'flame', 'mail', 'facebook', 'list', 'drop', 'radiator', 'floor', 'fan', 'washer', 'pump', 'quote', 'map', 'bolt', 'lens', 'wifi', 'shield'];
const HEX = /^#[0-9a-f]{6}$/i;

function oneOf(value, field, allowed) {
  if (!allowed.includes(value)) throw new Error(`${field} must be one of ${allowed.join(', ')}`);
  return value;
}
function obj(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${field} must be an object`);
  return value;
}
function v3Items(value, field, min, max) {
  if (!Array.isArray(value) || value.length < min || value.length > max) throw new Error(`${field} must be a list of ${min}–${max} items`);
  return value.map((it, i) => ({
    icon: oneOf(obj(it, `${field}[${i}]`).icon, `${field}[${i}].icon`, V3_ICONS),
    title: text(it.title, `${field}[${i}].title`, 70, { required: true }),
    text: text(it.text, `${field}[${i}].text`, 220, { required: true }),
  }));
}
function index(value, field) {
  if (value == null) return undefined;
  if (!Number.isInteger(value) || value < 0 || value > 23) throw new Error(`${field} must be a photo index 0–23`);
  return value;
}
function v3(value) {
  if (value == null) return undefined;
  const v = obj(value, 'v3');
  const t = obj(v.theme, 'v3.theme');
  const logo = obj(t.logo, 'v3.theme.logo');
  const theme = {
    archetype: oneOf(t.archetype, 'v3.theme.archetype', V3_ENUMS.archetype),
    ...Object.fromEntries(['base', 'base2', 'accent', 'accentHi', 'paper'].map((k) => {
      if (!HEX.test(t[k] ?? '')) throw new Error(`v3.theme.${k} must be #rrggbb`);
      return [k, t[k].toLowerCase()];
    })),
    heading: oneOf(t.heading, 'v3.theme.heading', V3_ENUMS.heading),
    divider: oneOf(t.divider, 'v3.theme.divider', V3_ENUMS.divider),
    hero: oneOf(t.hero, 'v3.theme.hero', V3_ENUMS.hero),
    services: oneOf(t.services, 'v3.theme.services', V3_ENUMS.services),
    process: t.process == null ? undefined : oneOf(t.process, 'v3.theme.process', V3_ENUMS.process),
    logo: {
      shape: oneOf(logo.shape, 'v3.theme.logo.shape', V3_ENUMS.shape),
      glyph: oneOf(logo.glyph, 'v3.theme.logo.glyph', V3_ENUMS.glyph),
      ring: text(logo.ring, 'v3.theme.logo.ring', 32, { required: true }),
      line: text(logo.line, 'v3.theme.logo.line', 60, { required: true }),
    },
  };
  const h1 = obj(v.h1, 'v3.h1');
  const pair = (x, f, a = 70, b = 220) => (x == null ? undefined : { title: text(obj(x, f).title, `${f}.title`, a, { required: true }), text: text(x.text, `${f}.text`, b, { required: true }) });
  const opt = (k, max) => text(v[k], `v3.${k}`, max);
  const photo = v.photo == null ? undefined : obj(v.photo, 'v3.photo');
  const out = {
    theme,
    h1: { lead: text(h1.lead, 'v3.h1.lead', 60, { required: true }), hot: text(h1.hot, 'v3.h1.hot', 30, { required: true }), ...(h1.tail ? { tail: text(h1.tail, 'v3.h1.tail', 30) } : {}) },
    pill: opt('pill', 90),
    heroChecks: list(v.heroChecks, 'v3.heroChecks', 4, 50),
    trust: v3Items(v.trust, 'v3.trust', 3, 5),
    aboutTitle: text(v.aboutTitle, 'v3.aboutTitle', 90, { required: true }),
    aboutChecks: list(v.aboutChecks, 'v3.aboutChecks', 4, 160),
    stamp: v.stamp == null ? undefined : { title: text(obj(v.stamp, 'v3.stamp').title, 'v3.stamp.title', 40, { required: true }), text: text(v.stamp.text, 'v3.stamp.text', 50, { required: true }) },
    quoteSub: opt('quoteSub', 160), formHint: opt('formHint', 80),
    tilePhotos: v.tilePhotos == null ? undefined : (Array.isArray(v.tilePhotos) ? v.tilePhotos.map((x, i) => index(x, `v3.tilePhotos[${i}]`)) : (() => { throw new Error('v3.tilePhotos must be a list'); })()),
    steps: v3Items(v.steps, 'v3.steps', 3, 5),
    stepsTitle: opt('stepsTitle', 70), galleryNote: opt('galleryNote', 160),
    promise: pair(v.promise, 'v3.promise', 60, 220),
    areasTitle: opt('areasTitle', 90), areasText: opt('areasText', 220), townLabel: opt('townLabel', 40), baseLine: opt('baseLine', 60),
    links: v.links == null ? undefined : (Array.isArray(v.links) ? v.links : []).map((l, i) => {
      const kind = oneOf(obj(l, `v3.links[${i}]`).kind, `v3.links[${i}].kind`, V3_ENUMS.link);
      if (l.url != null && !/^https:\/\/[^\s"<>]+$/.test(l.url)) throw new Error(`v3.links[${i}].url must be https://…`);
      return { kind, ...(l.url ? { url: l.url } : {}) };
    }),
    gbp: v.gbp == null ? undefined : (() => {
      const g = obj(v.gbp, 'v3.gbp');
      for (const k of ['url', 'reviewUrl']) if (g[k] != null && !/^https:\/\/[^\s"<>]+$/.test(g[k])) throw new Error(`v3.gbp.${k} must be https://…`);
      return { ...(g.url ? { url: g.url } : {}), ...(g.reviewUrl ? { reviewUrl: g.reviewUrl } : {}) };
    })(),
    // Use the client's own logo file (top-level `logo`) instead of the generated badge; intrinsic size for the <img>.
    clientLogo: v.clientLogo == null ? undefined : (() => {
      const c = obj(v.clientLogo, 'v3.clientLogo');
      for (const k of ['width', 'height']) if (!Number.isInteger(c[k]) || c[k] < 1 || c[k] > 4000) throw new Error(`v3.clientLogo.${k} must be an integer 1–4000`);
      return { width: c.width, height: c.height };
    })(),
    map: v.map == null ? undefined : (() => {
      const m = obj(v.map, 'v3.map');
      if (m.zoom != null && (!Number.isInteger(m.zoom) || m.zoom < 5 || m.zoom > 18)) throw new Error('v3.map.zoom must be an integer 5–18');
      return { ...(m.query ? { query: text(m.query, 'v3.map.query', 120) } : {}), ...(m.zoom ? { zoom: m.zoom } : {}) };
    })(),
    ctaTitle: text(v.ctaTitle, 'v3.ctaTitle', 80, { required: true }),
    ctaText: text(v.ctaText, 'v3.ctaText', 200, { required: true }),
    photo: photo && Object.fromEntries(Object.entries({ hero: index(photo.hero, 'v3.photo.hero'), about: index(photo.about, 'v3.photo.about'), faq: index(photo.faq, 'v3.photo.faq'), cta: index(photo.cta, 'v3.photo.cta'), reviews: index(photo.reviews, 'v3.photo.reviews'),
      pins: photo.pins == null ? undefined : (Array.isArray(photo.pins) && photo.pins.length <= 3 ? photo.pins.map((x, i) => index(x, `v3.photo.pins[${i}]`)) : (() => { throw new Error('v3.photo.pins must be a list of at most 3'); })()) }).filter(([, x]) => x !== undefined)),
  };
  if (!out.heroChecks.length) throw new Error('v3.heroChecks is required');
  return JSON.parse(JSON.stringify(out)); // drop undefined keys
}

export function normalize(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('input must be a JSON object');
  const submission = validateSubmission(raw.submission);
  const sub = submission ?? {};
  const services = servicesList(raw.services);
  const areas = list(raw.areas, 'areas');
  const data = {
    business: text(raw.business, 'business', 80, { required: true }),
    phone: text(raw.phone ?? sub.phone, 'phone', 20, { required: true }),
    city: text(raw.city, 'city', 60),
    areas: areas.length ? areas : [...(sub.area ?? []), ...splitOther(sub.area_other)].slice(0, 12),
    services: services.length ? services : [...(sub.services ?? []), ...splitOther(sub.services_other)].slice(0, 12),
    standout: text(raw.standout, 'standout', 1000) ?? sub.standout ?? undefined,
    tagline: text(raw.tagline, 'tagline', 120),
    lead: text(raw.lead, 'lead', 300),
    about: text(raw.about, 'about', 1000),
    email: text(raw.email, 'email', 120),
    hours: text(raw.hours, 'hours', 120),
    brands: list(raw.brands, 'brands', 10, 40),
    accent: accent(raw.accent),
    legal: legal(raw.legal),
    reviews: reviews(raw.reviews),
    faq: faq(raw.faq),
    qualifications: list(raw.qualifications, 'qualifications', 6, 160),
    prices: prices(raw.prices),
    priceNote: text(raw.priceNote, 'priceNote', 300),
    logo: logo(raw.logo),
    towns: towns(raw.towns),
    v3: v3(raw.v3),
  };
  if (!isPhone(data.phone)) throw new Error(`phone "${data.phone}" is not a phone number (digits, spaces, + - ( ), at least 8 digits)`);
  if (!toE164(data.phone)) throw new Error(`phone "${data.phone}" cannot be converted to +370… (use 8 6xx xxxxx, 06xx xxxxx, 6xx xxxxx or +370 6xx xxxxx)`);
  if (data.v3?.clientLogo && !data.logo) throw new Error('v3.clientLogo needs a top-level logo file');
  if (!data.city && !data.areas.length) throw new Error('city or areas is required');
  data.city ??= data.areas[0];
  if (!data.areas.length) data.areas = [data.city];
  if (!data.services.length) throw new Error('services (or submission.services / services_other) is required');
  const photos = raw.photos ?? [];
  // Up to 12 real work photos plus up to 12 AI illustrations ({path, alt, ai: true}) for emphasised slots.
  if (!Array.isArray(photos) || photos.length > 24) throw new Error('photos must be a list of at most 24 paths');
  data.photos = photos.map((p, i) => {
    const item = typeof p === 'string' ? { path: p } : p;
    if (!item || typeof item.path !== 'string') throw new Error(`photos[${i}] must be a path or {path, alt, ai}`);
    if (item.ai != null && typeof item.ai !== 'boolean') throw new Error(`photos[${i}].ai must be true or false`);
    return { path: item.path, alt: text(item.alt, `photos[${i}].alt`, 160), ...(item.ai ? { ai: true } : {}) };
  });
  if (data.photos.filter((p) => !p.ai).length > 12) throw new Error('at most 12 real photos (AI illustrations are separate)');
  if (data.photos.filter((p) => p.ai).length > 12) throw new Error('at most 12 AI illustrations');
  // Only template v3 keeps AI images out of the work gallery and discloses them.
  if (!data.v3 && data.photos.some((p) => p.ai)) throw new Error('AI illustrations (ai: true) need the v3 block');
  return { data, submission };
}

/* Emphasised slots (hero and CTA backgrounds, service tiles) must be sharp: a real high-resolution
   photo or an AI illustration of the trade. Keep in sync with EMPHASIS_MIN_WIDTH in src/templates/v3/content.ts. */
const EMPHASIS_MIN_WIDTH = { background: 1400, tile: 1000 };
function checkEmphasis(v3, photos, services) {
  const pick = (i, fallback) => photos[i ?? fallback] ?? photos[fallback % photos.length] ?? photos[0];
  const need = (p, min, slot) => {
    if (p && p.width < min) throw new Error(`${slot} photo ${p.src} is ${p.width} px wide; emphasised slots need ≥ ${min} px – use a sharp real photo or an AI illustration (ai: true)`);
  };
  need(pick(v3.photo?.hero, 0), EMPHASIS_MIN_WIDTH.background, 'v3.photo.hero');
  need(pick(v3.photo?.cta, 3), EMPHASIS_MIN_WIDTH.background, 'v3.photo.cta');
  need(pick(v3.photo?.reviews ?? v3.photo?.hero, 0), EMPHASIS_MIN_WIDTH.background, 'v3.photo.reviews');
  need(pick(v3.photo?.faq, 2), EMPHASIS_MIN_WIDTH.tile, 'v3.photo.faq'); // large framed photo by the FAQ (Jarvis 2026-10-21)
  if (v3.theme.services === 'tiles') services.forEach((_, n) => {
    const i = v3.tilePhotos?.[n];
    if (i != null && !photos[i]) throw new Error(`v3.tilePhotos[${n}] points to photo ${i}, which does not exist`);
    need(pick(i, n), EMPHASIS_MIN_WIDTH.tile, `v3.tilePhotos[${n}]`);
  });
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
  if (saved.logo != null && (typeof saved.logo !== 'object' || typeof saved.logo.src !== 'string')) throw new Error('logo must be {src, line}');
  const { data } = normalize({ ...saved, photos: photos.map((p) => ({ path: p.src, alt: p.alt, ai: p.ai })), logo: saved.logo ? { path: saved.logo.src, line: saved.logo.line } : undefined });
  if (typeof saved.slug !== 'string') throw new Error('slug is missing');
  // The generator writes the logo as /previews/<slug>/logo.svg|png; nothing else is served.
  if (data.logo && !new RegExp(`^/previews/${saved.slug.replace(/[^a-z0-9]/g, '')}/logo\\.(?:svg|png)$`).test(data.logo.path)) throw new Error(`logo.src must be /previews/${saved.slug}/logo.svg or .png`);
  if (data.v3 && photos.length) checkEmphasis(data.v3, photos, data.services);
  const { logo: savedLogo, ...rest } = data;
  return {
    ...rest,
    ...(savedLogo ? { logo: { src: savedLogo.path, ...(savedLogo.line ? { line: savedLogo.line } : {}) } } : {}),
    slug: saved.slug,
    photos: photos.map((p) => ({ src: p.src, width: p.width, height: p.height, ...(p.alt ? { alt: p.alt } : {}), ...(p.ai ? { ai: true } : {}) })),
  };
}
