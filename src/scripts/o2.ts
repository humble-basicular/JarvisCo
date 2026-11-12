/* Jarvis Systems homepage behaviour. No libraries.
   1. menu sheet (<dialog>), 2. scene scaling + play-on-view, 3. feature demo dialog,
   4. trades carousel, 5. call booking form → same-origin /t/form (callback_request → CRM feed) on
   jarvisweb.lt only; review builds validate and send nothing (data-book-mode="preview"). */

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- 1. Menu ----------
const menu = document.querySelector<HTMLDialogElement>('[data-menu]');
const menuOpener = document.querySelector<HTMLElement>('[data-menu-open]');
menuOpener?.addEventListener('click', () => menu?.showModal());
// Closing because a link was followed: the page moves on, leave focus alone. Otherwise always return
// focus to the opener (browsers may restore an unrelated element, Safari restores <body>).
let menuNav = false;
menu?.addEventListener('close', () => { if (menuNav) { menuNav = false; return; } menuOpener?.focus(); });
document.querySelector('[data-menu-close]')?.addEventListener('click', () => menu?.close());
menu?.querySelectorAll('[data-menu-link]').forEach((a) => a.addEventListener('click', () => { menuNav = true; menu.close(); }));
menu?.addEventListener('click', (e) => { if (e.target === menu) menu.close(); });

// ---------- 2. Scenes: 1080×1336 stage scaled to its box; loops start when first seen ----------
const fit = (el: HTMLElement) => el.style.setProperty('--s', String(el.clientWidth / 1080));
const ro = 'ResizeObserver' in window ? new ResizeObserver((es) => es.forEach((e) => fit(e.target as HTMLElement))) : null;
const watch = (el: HTMLElement) => { fit(el); ro?.observe(el); };
const scenes = document.querySelectorAll<HTMLElement>('[data-dev]');
scenes.forEach(watch);
if (!('IntersectionObserver' in window)) scenes.forEach((s) => s.classList.add('is-on'));
else {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) e.target.classList.toggle('is-on', e.isIntersecting);
  }, { threshold: 0.2 });
  scenes.forEach((s) => io.observe(s));
}

// ---------- 3. "Trumpa demonstracija": the row's own scene, larger, restarted from 0 ----------
const demoDlg = document.querySelector<HTMLDialogElement>('[data-demo-dialog]');
const demoSlot = demoDlg?.querySelector<HTMLElement>('[data-demo-slot]');
let demoOpener: HTMLElement | null = null;
document.querySelectorAll<HTMLElement>('[data-demo-open]').forEach((b) => b.addEventListener('click', () => {
  const row = document.getElementById(b.dataset.demoOpen ?? '');
  const scene = row?.querySelector<HTMLElement>('[data-dev]');
  const yt = b.dataset.demoYt;
  if (!demoDlg || !demoSlot || (!scene && !yt)) return;
  demoOpener = b;
  const name = row?.querySelector('h3')?.textContent ?? '';
  const title = demoDlg.querySelector<HTMLElement>('[data-demo-title]');
  if (title) title.textContent = name;
  demoDlg.classList.toggle('demodlg--yt', !!yt);
  if (yt) {
    // Demo video (YouTube, no-cookie) – loads only when the dialog opens.
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0&playsinline=1`;
    f.title = `Demonstracija: ${name}`;
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    demoSlot.replaceChildren(f);
    demoDlg.showModal();
  } else if (scene) {
    const copy = scene.cloneNode(true) as HTMLElement;
    copy.classList.add('is-on');
    demoSlot.replaceChildren(copy);
    demoDlg.showModal();
    watch(copy);
  }
  demoDlg.querySelector<HTMLElement>('[data-demo-close]')?.focus();
}));
demoDlg?.querySelector('[data-demo-close]')?.addEventListener('click', () => demoDlg.close());
demoDlg?.addEventListener('click', (e) => { if (e.target === demoDlg) demoDlg.close(); });
demoDlg?.addEventListener('close', () => { const c = demoSlot?.firstElementChild as HTMLElement | null; if (c && c.tagName !== 'IFRAME') ro?.unobserve(c); demoSlot?.replaceChildren(); demoOpener?.focus(); });

// ---------- 4. Trades carousel ----------
const track = document.querySelector<HTMLElement>('[data-car-track]');
document.querySelectorAll<HTMLButtonElement>('[data-car]').forEach((b) => b.addEventListener('click', () => {
  const card = track?.querySelector<HTMLElement>('li');
  track?.scrollBy({ left: Number(b.dataset.car) * ((card?.offsetWidth ?? 300) + 32), behavior: reduced ? 'auto' : 'smooth' });
}));

// ---------- helpers ----------
const PHONE_RE = /^\+?[\d\s()-]{8,20}$/;
const digits = (v: string) => v.replace(/\D/g, '');
const validPhone = (v: string) => PHONE_RE.test(v.trim()) && digits(v).length >= 8;
// Optional e-mail: empty is fine; when given it must look like a deliverable address (Worker re-validates).
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;
const validEmail = (v: string) => !v || (v.length <= 120 && EMAIL_RE.test(v));
function setErr(form: HTMLFormElement, name: string, msg: string) {
  const input = form.querySelector<HTMLInputElement>(`[name="${name}"]`);
  const out = form.querySelector<HTMLElement>(`[data-err="${name}"]`);
  if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  if (out) out.textContent = msg;
  return !msg;
}

// ---------- 5. Booking (inside a <dialog>) ----------
const bookDlg = document.querySelector<HTMLDialogElement>('[data-book-dialog]');
let bookOpener: HTMLElement | null = null;
document.querySelectorAll<HTMLElement>('[data-book-open]').forEach((o) => o.addEventListener('click', (e) => {
  if (!bookDlg) return; e.preventDefault();
  // An opener inside the (now closing) menu sheet is not focusable afterwards: return to the menu button.
  bookOpener = menu?.contains(o) ? menuOpener : o;
  bookDlg.showModal();
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
  const call = book.querySelector<HTMLElement>('[data-book-call]');
  book.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(book);
    const phone = String(fd.get('phone') ?? '').trim();
    if (!setErr(book, 'phone', validPhone(phone) ? '' : msgs.errPhone)) { book.querySelector<HTMLElement>('[name="phone"]')?.focus(); return; }
    const email = String(fd.get('email') ?? '').trim();
    if (!setErr(book, 'email', validEmail(email) ? '' : msgs.errEmail)) { book.querySelector<HTMLElement>('[name="email"]')?.focus(); return; }
    const name = String(fd.get('name') ?? '').trim();
    const time = String(fd.get('contact_time') ?? '');
    const company = String(fd.get('company') ?? '').trim();
    if (book.dataset.bookMode !== 'live') {
      // Review build: no /t/form route on this host. Validate, then say plainly that nothing was sent.
      status.dataset.tone = ''; status.textContent = msgs.previewOk; if (call) call.hidden = false;
      book.querySelector('[data-book-next]')?.removeAttribute('hidden');
      status.focus();
      return;
    }
    const body = new FormData();
    body.append('kind', 'callback_request');
    body.append('name', name);
    body.append('phone', phone);
    if (email) body.append('email', email);
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

// The form ships with submit disabled so a no-JS visitor can never native-submit; enable once listeners are attached.
document.querySelectorAll<HTMLButtonElement>('[data-book-form] button[type=submit]').forEach((b) => { b.disabled = false; });
