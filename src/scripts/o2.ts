/* Jarvis Systems homepage behaviour (ported from the verified Offer2 candidate). No libraries.
   1. menu sheet (<dialog>), 2. reveal-on-scroll, 3. phone stage scaling + trades carousel,
   4. live demo form → jarvisweb-sistema public enquiry (tenant "jarvisweb"),
   5. call booking form → same-origin /t/form (callback_request → CRM feed) on jarvisweb.lt only;
      review builds validate and send nothing (data-book-mode="preview"). */

// ---------- 1. Menu ----------
const menu = document.querySelector<HTMLDialogElement>('[data-menu]');
const menuOpener = document.querySelector<HTMLElement>('[data-menu-open]');
menuOpener?.addEventListener('click', () => menu?.showModal());
// Safari does not focus a button on click, so the browser would restore focus to <body>: put it back explicitly.
let menuNav = false; // closing because a link was followed: the page moves on, leave focus alone
menu?.addEventListener('close', () => { if (menuNav) { menuNav = false; return; } if (!document.activeElement || document.activeElement === document.body || menu.contains(document.activeElement)) menuOpener?.focus(); });
document.querySelector('[data-menu-close]')?.addEventListener('click', () => menu?.close());
menu?.querySelectorAll('[data-menu-link]').forEach((a) => a.addEventListener('click', () => { menuNav = true; menu.close(); }));
menu?.addEventListener('click', (e) => { if (e.target === menu) menu.close(); });

// ---------- 2. Reveal ----------
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealables = document.querySelectorAll<HTMLElement>('[data-in]');
if (reduced || !('IntersectionObserver' in window)) {
  revealables.forEach((el) => el.classList.add('is-in'));
} else {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
  revealables.forEach((el) => io.observe(el));
}

// ---------- 3. Device scaling + trades carousel ----------
// Each phone stage is a 1080×1336 canvas (glass mapping in src/data/o2-device.js); scale it to its box.
const devs = document.querySelectorAll<HTMLElement>('[data-dev]');
const fit = (el: HTMLElement) => el.style.setProperty('--s', String(el.clientWidth / 1080));
devs.forEach(fit);
if ('ResizeObserver' in window) { const ro = new ResizeObserver((es) => es.forEach((e) => fit(e.target as HTMLElement))); devs.forEach((d) => ro.observe(d)); }
const track = document.querySelector<HTMLElement>('[data-car-track]');
document.querySelectorAll<HTMLButtonElement>('[data-car]').forEach((b) => b.addEventListener('click', () => {
  const card = track?.querySelector<HTMLElement>('li');
  track?.scrollBy({ left: Number(b.dataset.car) * ((card?.offsetWidth ?? 300) + 24), behavior: reduced ? 'auto' : 'smooth' });
}));

// ---------- helpers ----------
const PHONE_RE = /^\+?[\d\s()-]{8,20}$/;
const digits = (v: string) => v.replace(/\D/g, '');
const validPhone = (v: string) => PHONE_RE.test(v.trim()) && digits(v).length >= 8;
function setErr(form: HTMLFormElement, name: string, msg: string) {
  const input = form.querySelector<HTMLInputElement>(`[name="${name}"]`);
  const out = form.querySelector<HTMLElement>(`[data-err="${name}"]`);
  if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  if (out) out.textContent = msg;
  return !msg;
}

// ---------- 4. Live demo ----------
const demo = document.querySelector<HTMLFormElement>('[data-demo-form]');
if (demo) {
  const msgs = JSON.parse(demo.dataset.messages ?? '{}');
  const api = demo.dataset.api!;
  const tenant = demo.dataset.tenant!;
  const status = demo.querySelector<HTMLElement>('[data-status]')!;
  const submit = demo.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const result = document.querySelector<HTMLElement>('[data-demo-result]');
  const bubble = result?.querySelector<HTMLElement>('[data-demo-bubble]');
  const simLabel = result?.querySelector<HTMLElement>('[data-demo-sim]');
  /* Backend mode is only trusted from a successful, well-formed health reply. A failed or odd reply
     leaves 'unknown', and then the page claims neither a real nor a simulated SMS. */
  let mode: 'simulator' | 'live' | 'unknown' = 'unknown';
  const classify = (h: unknown): typeof mode => {
    const t = (h as { ok?: unknown; telephony?: unknown } | null);
    if (!t || t.ok !== true || typeof t.telephony !== 'string' || !t.telephony) return 'unknown';
    return t.telephony === 'simulator' ? 'simulator' : 'live';
  };
  const checkHealth = () => {
    // A health request that hangs must not block the form: give up after 4 s and stay 'unknown'.
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 4000);
    return fetch(`${api}/api/health`, { credentials: 'omit', signal: ctl.signal })
    .then((r) => (r.ok ? r.json() : null)).then(classify).catch(() => 'unknown' as typeof mode)
    .then((m) => { clearTimeout(timer); mode = m; demo.querySelector<HTMLElement>('[data-sim-badge]')?.toggleAttribute('hidden', m !== 'simulator'); return m; });
  };
  const preview = demo.dataset.build === 'preview';
  // Review builds never contact the demo backend: no health request, no enquiry POST.
  let health: Promise<typeof mode> = preview ? Promise.resolve('unknown') : checkHealth();

  demo.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(demo);
    const phone = String(fd.get('phone') ?? '').trim();
    const service = String(fd.get('service') ?? '').trim();
    const ok = [setErr(demo, 'phone', validPhone(phone) ? '' : msgs.errors.phone), setErr(demo, 'consent', fd.get('consent') ? '' : msgs.errors.consent)].every(Boolean);
    if (!ok) { demo.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(); return; }
    submit.disabled = true; const label = submit.textContent; submit.textContent = msgs.sending;
    status.textContent = ''; status.dataset.tone = '';
    if (preview) {
      // Local simulation only: nothing leaves the browser and nothing is stored.
      const req = (service || 'svetaines forma').normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 30);
      status.dataset.tone = ''; status.textContent = msgs.ok.previewSim;
      if (bubble) bubble.textContent = msgs.demoAck.replace('{req}', req);
      if (simLabel) simLabel.hidden = false;
      result?.classList.add('is-done');
      demo.reset();
      return;
    }
    try {
      await health;
      if (mode === 'unknown') await (health = checkHealth());
      const res = await fetch(`${api}/api/public/enquiry/${tenant}`, {
        method: 'POST', credentials: 'omit', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: String(fd.get('name') ?? '').trim(), phone, service, website: String(fd.get('website') ?? '') }),
      });
      if (res.status === 429) throw new Error('limit');
      if (res.status === 422) { setErr(demo, 'phone', msgs.errors.phone); throw new Error('silent'); }
      if (!res.ok) throw new Error('other');
      const body = await res.json();
      const req = (service || 'svetaines forma').normalize('NFD').replace(/[̀-ͯ]/g, '').slice(0, 30);
      if (mode === 'simulator') {
        status.textContent = msgs.ok.sim;
        if (bubble) bubble.textContent = msgs.demoAck.replace('{req}', req);
        if (simLabel) simLabel.hidden = false;
        result?.classList.add('is-done');
      } else if (mode === 'unknown') {
        status.textContent = msgs.ok.unknown;
      } else {
        status.textContent = (body.acknowledged ? msgs.ok.live : msgs.ok.liveNoAck).replace('{phone}', phone);
        if (body.acknowledged && bubble) { bubble.textContent = msgs.demoAck.replace('{req}', req); result?.classList.add('is-done'); }
      }
      demo.reset();
    } catch (err) {
      const kind = (err as Error).message;
      if (kind !== 'silent') {
        status.dataset.tone = 'err';
        status.textContent = kind === 'limit' ? msgs.errors.limit : kind === 'other' ? msgs.errors.other : msgs.errors.network;
      }
    } finally {
      submit.disabled = false; submit.textContent = label;
    }
  });
}

// ---------- 5. Booking (inside a <dialog>) ----------
const bookDlg = document.querySelector<HTMLDialogElement>('[data-book-dialog]');
let bookOpener: HTMLElement | null = null;
document.querySelectorAll<HTMLElement>('[data-book-open]').forEach((o) => o.addEventListener('click', (e) => {
  if (!bookDlg) return; e.preventDefault(); bookOpener = o; bookDlg.showModal();
  bookDlg.querySelector<HTMLElement>('input[name="name"]')?.focus();
}));
bookDlg?.querySelector('[data-book-close]')?.addEventListener('click', () => bookDlg.close());
bookDlg?.addEventListener('click', (e) => { if (e.target === bookDlg) bookDlg.close(); });
bookDlg?.addEventListener('close', () => bookOpener?.focus());
const book = document.querySelector<HTMLFormElement>('[data-book-form]');
if (book) {
  const msgs = JSON.parse(book.dataset.messages ?? '{}');
  const status = book.querySelector<HTMLElement>('[data-status]')!;
  const submit = book.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  book.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(book);
    const phone = String(fd.get('phone') ?? '').trim();
    if (!setErr(book, 'phone', validPhone(phone) ? '' : msgs.errPhone)) { book.querySelector<HTMLElement>('[name="phone"]')?.focus(); return; }
    const name = String(fd.get('name') ?? '').trim();
    const time = String(fd.get('contact_time') ?? '');
    const company = String(fd.get('company') ?? '').trim();
    if (book.dataset.bookMode !== 'live') {
      // Review build: no /t/form route on this host. Validate, say plainly nothing was sent.
      status.dataset.tone = ''; status.textContent = msgs.previewOk; status.focus();
      return;
    }
    const body = new FormData();
    body.append('kind', 'callback_request');
    body.append('name', name);
    body.append('phone', phone);
    body.append('contact_time', time);
    body.append('standout', [msgs.context, company && `Įmonė/veikla: ${company}`].filter(Boolean).join('\n'));
    body.append('website', String(fd.get('website') ?? ''));
    submit.disabled = true; const label = submit.textContent; submit.textContent = msgs.sending;
    status.dataset.tone = ''; status.textContent = '';
    try {
      const res = await fetch(book.action, { method: 'POST', body, credentials: 'omit' });
      if (!res.ok) throw new Error(String(res.status));
      book.querySelector('[data-book-fields]')?.setAttribute('hidden', '');
      status.textContent = msgs.ok.replace('{name}', name ? `, ${name}` : '').replace('{time}', msgs.timesSpoken[time] ?? msgs.timesSpoken['']);
      status.focus();
    } catch {
      status.dataset.tone = 'err';
      status.textContent = msgs.err;
    } finally {
      submit.disabled = false; submit.textContent = label;
    }
  });
}

// Forms ship with submit disabled so a no-JS visitor can never native-submit; enable once listeners are attached.
document.querySelectorAll<HTMLButtonElement>('[data-demo-form] button[type=submit], [data-book-form] button[type=submit]').forEach((b) => { b.disabled = false; });
document.querySelectorAll<HTMLElement>('[data-nojs]').forEach((n) => { n.hidden = true; });
