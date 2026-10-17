/* Everything the heating page derives from SiteData + mode, computed once.
   `mode="preview"`: call links jump to the form and nothing dials; `mode="live"`:
   tel:/sms: links carry cta beacons (client.js). */
import { aboutFacts, faqList, headline, initials, isMobile, lead, proofItems, routes, serviceList, t, toE164 } from './content';
import type { LiveSite, Mode, SiteData } from './types';

/** Gallery tiles on a 6-column grid (wide screens): rows of three, and when
 *  the count does not divide by three the last two or four photos go in
 *  pairs, so no row is left with a gap (4 → 2×2, 5 → 3+2, 7 → 3+2+2). */
export function gallerySpans(n: number): ('third' | 'half')[] {
  const rest = n % 3;
  return Array.from({ length: n }, (_, i) => ((rest === 2 && i >= n - 2) || (rest === 1 && i >= n - 4) ? 'half' : 'third'));
}

export function view(data: SiteData, mode: Mode, site?: LiveSite) {
  const live = mode === 'live' && site ? site : undefined;
  const e164 = toE164(data.phone);
  const [hero, ...works] = data.photos;
  const areas = data.areas.length ? data.areas : [data.city];
  const h1 = headline(data);
  return {
    live,
    telHref: live && e164 ? `tel:${e164}` : '#uzklausa',
    callCta: live ? 'cta_call' : undefined,
    smsHref: live && isMobile(e164) ? `sms:${e164}` : undefined,
    hero,
    works,
    spans: gallerySpans(works.length),
    services: serviceList(data),
    router: routes(data),
    proof: proofItems(data),
    facts: aboutFacts(data),
    faq: faqList(data),
    areas,
    mark: initials(data.business),
    logo: data.logo,
    h1,
    /** Long generated headlines step the display size down instead of stacking single words. */
    h1Length: h1.length > 52 ? 'long' : h1.length > 36 ? 'mid' : 'short',
    lead: lead(data),
    nav: [
      { href: '#paslaugos', label: t.navServices },
      ...(works.length ? [{ href: '#darbai', label: data.demo ? t.galleryDemoLabel : t.navWorks }] : []),
      { href: '#vietoves', label: t.navAreas },
      { href: '#kontaktai', label: t.navContact },
    ],
    pad: (n: number) => String(n).padStart(2, '0'),
    /** Preview inputs carry no name, so nothing could leave the page even if it were submitted. */
    n: (name: string) => (live ? name : undefined),
  };
}
export type View = ReturnType<typeof view>;

/** Demo photos are AI illustrations: one visible statement near them instead of a caption on every image. */
export const DEMO_PHOTO_NOTE = 'Šiame pavyzdyje – DI sukurtos iliustracijos, ne atlikti darbai. Tikroje svetainėje būna meistro darbų nuotraukos.';
export const DEMO_HERO_TAG = 'DI iliustracija';
