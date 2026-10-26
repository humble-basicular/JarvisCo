/* Frozen service-catalog v1 contract. Plain text only; never rendered as HTML. */
const RESERVED = new Set(['aciu', 'privatumo-politika', 'foto', 'robots-txt', 'sitemap-xml', 'index', '404', 'perziura', 'previews', 'pradzia', 'paslaugos']);
function object(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${field} must be an object`);
  return value;
}
function text(value, field, max) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new Error(`${field} must be nonempty text of at most ${max} characters`);
  return value.trim();
}
function array(value, field, max, min = 0) {
  if (!Array.isArray(value) || value.length < min || value.length > max) throw new Error(`${field} must be a list of ${min}–${max} items`);
  return value;
}
export function validateServicePages(value, services, photos) {
  const names = services.map((s) => typeof s === 'string' ? s : s.name);
  if (new Set(names).size !== names.length) throw new Error('servicePages needs unique existing service names');
  const mapped = new Set(), slugs = new Set();
  const pages = array(value, 'v3.servicePages', 12, 1).map((raw, i) => {
    const f = `v3.servicePages[${i}]`, p = object(raw, f);
    const slug = text(p.slug, `${f}.slug`, 80);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length < 2 || RESERVED.has(slug)) throw new Error(`${f}.slug is invalid or reserved`);
    if (slugs.has(slug)) throw new Error(`${f}.slug is duplicated`);
    slugs.add(slug);
    const serviceNames = array(p.serviceNames, `${f}.serviceNames`, 12, 1).map((name) => {
      // Exact matching: do not silently normalise a misspelled catalogue mapping.
      if (typeof name !== 'string' || !names.includes(name)) throw new Error(`${f}: unknown service ${name}`);
      if (mapped.has(name)) throw new Error(`${f}: duplicate service mapping ${name}`);
      mapped.add(name);
      return name;
    });
    const out = { slug, serviceNames, heading: text(p.heading, `${f}.heading`, 140), description: text(p.description, `${f}.description`, 260), lead: text(p.lead, `${f}.lead`, 800),
      sections: array(p.sections, `${f}.sections`, 6).map((raw, j) => {
        const s = object(raw, `${f}.sections[${j}]`);
        return { heading: text(s.heading, `${f}.sections[${j}].heading`, 120), text: text(s.text, `${f}.sections[${j}].text`, 2000) };
      }) };
    for (const k of ['included', 'preparation', 'priceFactors']) if (p[k] !== undefined) out[k] = array(p[k], `${f}.${k}`, 8).map((v, j) => text(v, `${f}.${k}[${j}]`, 300));
    if (p.faq !== undefined) out.faq = array(p.faq, `${f}.faq`, 6).map((raw, j) => {
      const q = object(raw, `${f}.faq[${j}]`);
      return { q: text(q.q, `${f}.faq[${j}].q`, 160), a: text(q.a, `${f}.faq[${j}].a`, 600) };
    });
    if (p.photoIndexes !== undefined) {
      out.photoIndexes = array(p.photoIndexes, `${f}.photoIndexes`, 3).map((n) => {
        if (!Number.isInteger(n) || n < 0 || !photos[n] || photos[n].ai) throw new Error(`${f}.photoIndexes must reference existing real photos`);
        return n;
      });
      if (new Set(out.photoIndexes).size !== out.photoIndexes.length) throw new Error(`${f}.photoIndexes has duplicates`);
    }
    return out;
  });
  const missing = names.filter((name) => !mapped.has(name));
  if (missing.length) throw new Error(`servicePages missing service mappings: ${missing.join(', ')}`);
  return pages;
}

/** base is the preview home, or '' for a standalone site. */
export const serviceHref = (slug, base = '') => `${base}/paslaugos/${slug}${base ? '' : '/'}`;
export const pageForService = (pages, name) => pages?.find((p) => p.serviceNames.includes(name));
export const serviceTitle = (page, business, preview = false) => `${page.heading} – ${business}${preview ? ' – peržiūra' : ''}`;

/** Same activity and location wording used in the rendered v3 H1. */
export function activityHeading(v3, town) {
  const h = town ? (v3.h1.tail ? { ...v3.h1, tail: town.loc } : { ...v3.h1, hot: town.loc, tail: undefined }) : v3.h1;
  return [h.lead, h.hot, h.tail].filter(Boolean).join(' ');
}
export function townTitle(data, v3, town) {
  return `${data.tagline || activityHeading(v3, town)} – ${data.business}`;
}

/** Escape script terminators and HTML-significant characters before set:html. */
export function safeJsonLd(value) {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (c) => ({ '<': '\\u003c', '>': '\\u003e', '&': '\\u0026', '\u2028': '\\u2028', '\u2029': '\\u2029' })[c]);
}

/** No inferred trade category, street address, opening hours, reviews or outcomes. */
export function businessSchema(data, domain, { page, town, canonical } = {}) {
  const origin = `https://${domain}`, businessId = `${origin}/#business`;
  const areas = [...new Set([data.city, ...data.areas].filter(Boolean))];
  const business = { '@type': 'LocalBusiness', '@id': businessId, name: data.business, url: `${origin}/`, telephone: data.phone,
    areaServed: areas.map((name) => ({ '@type': 'Place', name })),
    ...(data.email ? { email: data.email } : {}),
    ...(data.logo?.src ? { logo: new URL(data.logo.src, origin).href } : {}) };
  const graph = [business];
  if (page) graph.push({ '@type': 'Service', '@id': `${canonical}#service`, name: page.heading, serviceType: page.serviceNames, description: page.description,
    url: canonical, provider: { '@id': businessId }, areaServed: business.areaServed });
  if (canonical && (page || town)) graph.push({ '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: data.business, item: `${origin}/` },
    { '@type': 'ListItem', position: 2, name: page?.heading ?? town.name, item: canonical },
  ] });
  return { '@context': 'https://schema.org', '@graph': graph };
}
