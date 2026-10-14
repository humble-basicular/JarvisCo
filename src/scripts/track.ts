/* Per-lead proof-link beacons (spec §4.2).
   Flow: the Worker redirects /p/<code> to the page with ?r=<code>. Here we
   validate the code, keep it in sessionStorage for this tab, remove `r` from
   the address bar and send small beacons. No cookies, nothing without a code. */
import {
  BEACON_ENDPOINT,
  CODE_PATTERN,
  STORAGE_KEY,
  TRACKING_PREFIXES,
} from '../data/tracking.js';

type EventType = 'view' | 'scroll_proof' | 'cta_sms' | 'cta_call' | 'pdf' | 'arbcut' | 'preview_cta';

function isValidCode(value: string | null): value is string {
  return !!value && CODE_PATTERN.test(value) && value[0] in TRACKING_PREFIXES;
}

function readStored(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // storage blocked: track only this page load
  }
}

function captureCode(): string | null {
  const url = new URL(location.href);
  if (url.searchParams.has('r')) {
    const r = url.searchParams.get('r');
    url.searchParams.delete('r');
    history.replaceState(history.state, '', url.pathname + url.search + url.hash);
    if (isValidCode(r)) {
      try {
        sessionStorage.setItem(STORAGE_KEY, r);
      } catch {}
      return r;
    }
  }
  const stored = readStored();
  return isValidCode(stored) ? stored : null;
}

/** The visitor's proof code for this tab, or null (no link, invalid or blocked storage). */
export const code = captureCode();
const sent = new Set<EventType>();

export function send(type: EventType) {
  if (!code || sent.has(type)) return;
  sent.add(type);
  const body = JSON.stringify({ code, type });
  const queued =
    typeof navigator.sendBeacon === 'function' &&
    navigator.sendBeacon(BEACON_ENDPOINT, new Blob([body], { type: 'application/json' }));
  if (!queued) {
    fetch(BEACON_ENDPOINT, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      credentials: 'omit',
    }).catch(() => {});
  }
}

if (code) {
  // `view` only once the page is actually on screen (not prerendered/background).
  const sendView = () => requestAnimationFrame(() => setTimeout(() => send('view'), 0));
  if (document.visibilityState === 'visible') sendView();
  else {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      document.removeEventListener('visibilitychange', onVisible);
      sendView();
    };
    document.addEventListener('visibilitychange', onVisible);
  }

  // `scroll_proof`: the reader scrolled and the first screenshot reached mid-screen.
  const proof = document.querySelector('[data-proof-anchor]');
  if (proof) {
    const onScroll = () => {
      if (scrollY < 40 || proof.getBoundingClientRect().top > innerHeight * 0.6) return;
      removeEventListener('scroll', onScroll);
      send('scroll_proof');
    };
    addEventListener('scroll', onScroll, { passive: true });
  }

  // CTA, download and external-link interactions: <a data-track="cta_sms"> etc.
  document.addEventListener('click', (event) => {
    const el = (event.target as Element | null)?.closest<HTMLElement>('[data-track]');
    const type = el?.dataset.track as EventType | undefined;
    if (type) send(type);
  });
}
