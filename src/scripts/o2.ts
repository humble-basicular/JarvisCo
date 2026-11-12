/* Jarvis Systems homepage behaviour. No libraries.
   1. menu sheet (<dialog>), 2. scene scaling + play-on-view, 3. feature demo dialog,
   4. trades carousel, 5. call booking quiz → same-origin /t/form (callback_request → CRM feed) on
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
// Lithuanian number: +370 / 00370 / 8 prefix (or none) + 8 digits starting 3–9, spaces/dashes/brackets allowed.
const validPhone = (v: string) => /^(?:\+370|00370|8)?[3-9]\d{7}$/.test(v.replace(/[\s()-]/g, ''));
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;
const validEmail = (v: string) => v.length <= 120 && EMAIL_RE.test(v);
function setErr(form: HTMLFormElement, name: string, msg: string) {
  const input = form.querySelector<HTMLInputElement>(`[name="${name}"]`);
  const out = form.querySelector<HTMLElement>(`[data-err="${name}"]`);
  if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  if (out) out.textContent = msg;
  return !msg;
}

// ---------- 5. Booking quiz (inside a <dialog>) ----------
// Slides 0–3: one choice each, a pick auto-advances. Slides 4–7: phone, email, name, company – each required,
// validated on "Tęsti" (form submit, so Enter works too). The last slide sends.
const bookDlg = document.querySelector<HTMLDialogElement>('[data-book-dialog]');
const book = document.querySelector<HTMLFormElement>('[data-book-form]');
const steps = [...(book?.querySelectorAll<HTMLElement>('[data-q-step]') ?? [])];
const bar = bookDlg?.querySelector<HTMLElement>('[data-q-bar]');
const back = bookDlg?.querySelector<HTMLButtonElement>('[data-q-back]');
let step = 0;
const show = (i: number, focus = true) => {
  step = Math.max(0, Math.min(i, steps.length - 1));
  steps.forEach((s, j) => { s.hidden = j !== step; });
  if (back) back.hidden = step === 0;
  // Stone starts the bar half full: the visitor already "started" by clicking the CTA.
  const pct = Math.round(50 + (50 * step) / steps.length);
  bar?.setAttribute('aria-valuenow', String(pct));
  const fill = bar?.firstElementChild as HTMLElement | null | undefined;
  if (fill) fill.style.width = `${pct}%`;
  const cur = steps[step];
  if (!focus || !cur) return;
  (cur.querySelector<HTMLElement>('input:not([type=hidden])') ?? cur.querySelector<HTMLElement>('[aria-pressed=true]') ?? cur.querySelector<HTMLElement>('[data-q-pick]'))?.focus();
};
let bookOpener: HTMLElement | null = null;
document.querySelectorAll<HTMLElement>('[data-book-open]').forEach((o) => o.addEventListener('click', (e) => {
  if (!bookDlg) return; e.preventDefault();
  // An opener inside the (now closing) menu sheet is not focusable afterwards: return to the menu button.
  bookOpener = menu?.contains(o) ? menuOpener : o;
  bookDlg.showModal();
  show(step);
}));
bookDlg?.querySelector('[data-book-close]')?.addEventListener('click', () => bookDlg.close());
bookDlg?.addEventListener('click', (e) => { if (e.target === bookDlg) bookDlg.close(); });
bookDlg?.addEventListener('close', () => bookOpener?.focus());
back?.addEventListener('click', () => show(step - 1));
book?.querySelectorAll<HTMLButtonElement>('[data-q-pick]').forEach((b) => b.addEventListener('click', () => {
  const set = b.closest<HTMLElement>('[data-q-step]')!;
  set.querySelector<HTMLInputElement>('input[type=hidden]')!.value = b.dataset.qPick ?? '';
  set.querySelectorAll('[data-q-pick]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  const at = steps.indexOf(set);
  setTimeout(() => { if (step === at) show(at + 1); }, reduced ? 0 : 180);
}));
if (book) {
  const msgs = JSON.parse(book.dataset.messages ?? '{}');
  const status = book.querySelector<HTMLElement>('[data-status]')!;
  const call = book.querySelector<HTMLElement>('[data-book-call]');
  const val = (n: string) => String(new FormData(book).get(n) ?? '').trim();
  const checks: Record<string, [(v: string) => boolean, string]> = {
    phone: [validPhone, msgs.errPhone],
    email: [validEmail, msgs.errEmail],
    name: [(v) => [...v].length >= 2 && v.length <= 60, msgs.errName],
    company: [(v) => [...v].length >= 2 && v.length <= 80, msgs.errCompany],
  };
  const ok = (n: string) => setErr(book, n, checks[n][0](val(n)) ? '' : checks[n][1]);
  book.addEventListener('submit', async (e) => {
    e.preventDefault();
    const field = steps[step]?.dataset.qField;
    if (!field) return;
    if (!ok(field)) { book.querySelector<HTMLElement>(`[name="${field}"]`)?.focus(); return; }
    if (step < steps.length - 1) { show(step + 1); return; }
    // Last slide: re-check everything (a visitor can go back and clear a field), jump to the first bad one.
    const bad = Object.keys(checks).find((n) => !ok(n));
    if (bad) { show(steps.findIndex((s) => s.dataset.qField === bad)); return; }
    const answers = steps.flatMap((s) => { const h = s.querySelector<HTMLInputElement>('input[type=hidden]'); return h ? [`${h.dataset.qLabel} ${h.value || '–'}`] : []; });
    const [name, phone, email, company] = ['name', 'phone', 'email', 'company'].map(val);
    const submit = steps[step]!.querySelector<HTMLButtonElement>('button[type=submit]')!;
    if (book.dataset.bookMode !== 'live') {
      // Review build: no /t/form route on this host. Validate, then say plainly that nothing was sent.
      status.dataset.tone = ''; status.textContent = msgs.previewOk; if (call) call.hidden = false;
      // data-no-redirect: QA script keeps the dialog in place to assert the message.
      if (!book.dataset.noRedirect) location.href = `/susisieksime?${new URLSearchParams({ v: name, p: '1' })}`;
      return;
    }
    const body = new FormData();
    body.append('kind', 'callback_request');
    body.append('name', name);
    body.append('phone', phone);
    body.append('email', email);
    body.append('company', company);
    // The Worker stores standout (≤1000 chars) but not company: keep both in the note.
    body.append('standout', [msgs.context, `Įmonė/veikla: ${company}`, ...answers].join('\n').slice(0, 1000));
    body.append('website', val('website'));
    submit.disabled = true; const label = submit.textContent; submit.textContent = msgs.sending;
    status.dataset.tone = ''; status.textContent = '';
    try {
      const res = await fetch(book.action, { method: 'POST', body, credentials: 'omit' });
      if (!res.ok) throw new Error(String(res.status));
      book.querySelector('[data-book-fields]')?.setAttribute('hidden', '');
      status.textContent = msgs.ok.replace('{name}', name ? `, ${name}` : '');
      // Stone-style next step: confirmation + pre-call video + proof (no calendar).
      if (!book.dataset.noRedirect) location.href = `/susisieksime?${new URLSearchParams({ v: name })}`;
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
