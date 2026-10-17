/* Client-site inquiry tracking: call-button taps, form opens and form submits.
   Counts only. No cookies, storage, IP or visitor id; only the page path, the
   button's data-loc label, a referrer class and a mobile flag are sent.
   Config: <meta name="jw-site" content="<site code>"> (required) and optionally
   <meta name="jw-endpoint" content="https://jarvisweb.lt/t/e"> (the default).
   Server side: tracking/README.md "Inquiry tracking beacons". The same file is
   copied unchanged into client repos (ArbCut) — keep them in sync. */

export type BeaconType = 'cta_call' | 'form_open' | 'form_submit';
export type Ref = 'direct' | 'search' | 'social' | 'internal' | 'other';
export interface BeaconContext { page: string; loc: string | null; ref: Ref; mobile: boolean }
export type Payload = { site: string; type: BeaconType } & BeaconContext;

export const DEFAULT_ENDPOINT = 'https://jarvisweb.lt/t/e';
const LOC = /^[a-z0-9_-]{1,40}$/;
const SEARCH = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|yandex|baidu|brave|startpage|seznam)\./;
const SOCIAL = /(^|\.)(facebook|fb|instagram|messenger|t|twitter|x|linkedin|tiktok|youtube|reddit|pinterest)\.(com|me|co|lt)$/;
const REPEAT_MS = 1500;

const bare = (host: string) => host.toLowerCase().replace(/^www\./, '');

export function referrerType(referrer: string, ownHost: string): Ref {
  if (!referrer) return 'direct';
  let host: string;
  try { host = bare(new URL(referrer).hostname); } catch { return 'direct'; }
  if (host === bare(ownHost)) return 'internal';
  if (SEARCH.test(host)) return 'search';
  if (SOCIAL.test(host)) return 'social';
  return 'other';
}

/** data-loc label of the element or its nearest labelled ancestor; anything malformed is dropped. */
export function cleanLoc(value: string | null | undefined): string | null {
  return value && LOC.test(value) ? value : null;
}

export function pagePath(pathname: string): string {
  const path = pathname.split(/[?#]/)[0]!.replace(/\s/g, '');
  return (path.startsWith('/') ? path : `/${path}`).slice(0, 120);
}

export function buildPayload(site: string, type: BeaconType, context: BeaconContext): Payload {
  return { site, type, page: context.page, loc: context.loc, ref: context.ref, mobile: context.mobile };
}

/** A form that posts to the Worker is already counted there as a site_inquiry; don't count it twice. */
export function postsToWorker(action: string): boolean {
  return /(^|\/)t\/form(\?|#|$)/.test(action);
}

/** Minimal slice of DOM the tracker needs, so the logic can be unit-tested without a browser. */
export interface FormLike {
  action: string;
  getAttribute?(name: string): string | null;
  matches?(selector: string): boolean;
  checkValidity(): boolean;
  querySelector(selector: string): { value?: string; checked?: boolean } | null;
}
export function submitLooksReal(form: FormLike): boolean {
  if (postsToWorker(form.action)) return false;
  // Demo/inert forms (action="#...", data-inert-form) never submit anywhere.
  if (form.matches?.('[data-inert-form]') || form.getAttribute?.('action')?.startsWith('#')) return false;
  // Honeypots (Web3Forms `botcheck`, Worker `website`) filled in: a bot, not an inquiry.
  if (form.querySelector('input[name="botcheck"]')?.checked || form.querySelector('input[name="website"]')?.value) return false;
  if (!form.checkValidity()) return false;
  // hCaptcha forms: an unsolved widget means the provider will reject the post.
  if (form.querySelector('.h-captcha') && !form.querySelector('[name="h-captcha-response"]')?.value) return false;
  return true;
}

export interface Env {
  site: string;
  endpoint: string;
  context(loc: string | null): BeaconContext;
  send(endpoint: string, body: string): void;
  now(): number;
}

export function createTracker(env: Env) {
  const last = new WeakMap<object, number>();
  const opened = new WeakSet<object>();
  const emit = (type: BeaconType, loc: string | null) =>
    env.send(env.endpoint, JSON.stringify(buildPayload(env.site, type, env.context(loc))));
  // A double-fired event on the same element is one tap.
  const fresh = (key: object) => {
    const t = env.now();
    if (t - (last.get(key) ?? -Infinity) < REPEAT_MS) return false;
    last.set(key, t);
    return true;
  };
  return {
    tap(link: object, loc: string | null) { if (fresh(link)) emit('cta_call', loc); },
    open(form: object, loc: string | null) { if (!opened.has(form)) { opened.add(form); emit('form_open', loc); } },
    submit(form: FormLike & object, loc: string | null) { if (submitLooksReal(form) && fresh(form)) emit('form_submit', loc); },
  };
}

function install(): void {
  const meta = (name: string) => document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content.trim() || '';
  const site = meta('jw-site');
  if (!/^[a-z][a-z0-9-]{2,31}$/.test(site)) return;
  const labelOf = (el: Element) => cleanLoc(el.closest<HTMLElement>('[data-loc]')?.dataset.loc);
  const coarse = matchMedia('(pointer: coarse)');
  const tracker = createTracker({
    site,
    endpoint: meta('jw-endpoint') || DEFAULT_ENDPOINT,
    context: (loc) => ({
      page: pagePath(location.pathname),
      loc,
      ref: referrerType(document.referrer, location.hostname),
      mobile: coarse.matches,
    }),
    send(endpoint, body) {
      const queued = typeof navigator.sendBeacon === 'function'
        && navigator.sendBeacon(endpoint, new Blob([body], { type: 'text/plain' }));
      if (!queued) {
        fetch(endpoint, { method: 'POST', body, headers: { 'Content-Type': 'text/plain' }, keepalive: true, credentials: 'omit' })
          .catch(() => {});
      }
    },
    now: () => Date.now(),
  });

  // Delegated, passive: never blocks or alters the dialer, the link or the form post.
  document.addEventListener('click', (event) => {
    const link = (event.target as Element | null)?.closest?.('a[href^="tel:" i]');
    if (link) tracker.tap(link, labelOf(link));
  }, { capture: true, passive: true });
  document.addEventListener('focusin', (event) => {
    const field = event.target as Element | null;
    if (!field?.matches?.('input, textarea, select') || field.matches('[type="hidden"], [tabindex="-1"], [aria-hidden="true"]')) return;
    const form = field.closest('form');
    if (form) tracker.open(form, labelOf(form));
  }, { capture: true, passive: true });
  document.addEventListener('submit', (event) => {
    const form = event.target as HTMLFormElement | null;
    if (form?.tagName === 'FORM') tracker.submit(form, labelOf(form));
  }, { capture: true, passive: true });
}

if (typeof document !== 'undefined') install();
