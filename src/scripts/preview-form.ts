/* Free-preview form (funnel spec §4, plan §4.3). Adds to the native multipart form:
   - one question per screen (steps, progress, focus on each question);
   - the proof code from the SMS link (track.ts) and, with a code, no phone
     field and the trade's service checkboxes (code prefix = trade, spec §2);
     codes are guessable, so nothing about the lead is fetched or prefilled;
   - trade and years written into `standout` ("Sritis: …; Patirtis: … m.");
   - images downsized to ≤ 2000 px JPEG in the browser where it can;
   - the spec's limits, inline + announced errors, server error codes and the
     thank-you. Exactly the spec's wire fields are posted. */
import { code } from './track';
import { FORM_LIMITS } from '../data/tracking.js';

type Messages = {
  errors: Record<string, string>;
  thanks: { preview: string; callback: string; times: Record<string, string>; sign: string };
  sending: string;
  preparing: string;
  progress: string;
  composed: { trade: string; years: string; yearsUnit: string };
};

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif',
  gif: 'image/gif', pdf: 'application/pdf', txt: 'text/plain', doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};
const SHRINKABLE = /^image\/(jpeg|png|webp|heic|heif)$/;
const KEEP_BELOW = 1.5 * 1024 * 1024; // small images within 2000 px are sent untouched (keeps PNG logos)
const MAX_DECODED_PIXELS = 50e6; // ~200 MB of RGBA: larger decodes are not drawn (phones run out of memory)
/** Trade answer → services list key (the code prefix of that trade, spec §2). */
const SERVICES_BY_TRADE: Record<string, string> = { Šildymas: 'p' };
const WIRE_FIELDS = new Set(['code', 'name', 'phone', 'services', 'services_other', 'area', 'area_other', 'photos_ok', 'standout', 'contact_time', 'website']);

/* "Tomas" → "Tomai": Lithuanian vocative for the thank-you. First word only;
   anything that is not a plain name is used as typed. */
export function vocative(name: string) {
  const word = name.trim().split(/\s+/u)[0] ?? '';
  if (!/^\p{L}{2,}$/u.test(word)) return word;
  const w = word[0].toLocaleUpperCase('lt') + word.slice(1);
  const rules: [RegExp, string][] = [[/as$/u, 'ai'], [/is$/u, 'i'], [/ys$/u, 'y'], [/us$/u, 'au'], [/ė$/u, 'e']];
  for (const [re, end] of rules) if (re.test(w)) return w.replace(re, end);
  return w;
}

/** Exactly +48 h, shown in Europe/Vilnius: "spalio 16 d. 15:07". */
export function dueLabel(now = Date.now()) {
  return new Intl.DateTimeFormat('lt-LT', { timeZone: 'Europe/Vilnius', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .format(new Date(now + 48 * 3600e3));
}

/** A valid phone per spec §4: ≤ 20 chars of digits, spaces, + - ( ), at least 8 digits. */
export function isPhone(value: string) {
  return value.length <= 20 && /^[0-9 +\-()]+$/.test(value) && (value.match(/\d/g)?.length ?? 0) >= 8;
}

/** "Sritis: Šildymas; Patirtis: 3–10 m." + free text, within the 1000-char limit. */
export function composeStandout(trade: string, years: string, free: string, words = { trade: 'Sritis', years: 'Patirtis', yearsUnit: 'm.' }) {
  const head = [trade && `${words.trade}: ${trade}`, years && `${words.years}: ${years} ${words.yearsUnit}`].filter(Boolean).join('; ');
  const head2 = head ? `${head}.` : '';
  return [head2, free].filter(Boolean).join('\n').slice(0, 1000);
}

function withType(file: File): File | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (FORM_LIMITS.types.includes(file.type)) return file;
  // Some phones send HEIC or Office files without a type: name the type by extension.
  if ((!file.type || file.type === 'application/octet-stream') && MIME_BY_EXT[ext]) {
    return new File([file], file.name, { type: MIME_BY_EXT[ext], lastModified: file.lastModified });
  }
  return null;
}

/** Downsizes one image. Throws when the browser decoded it but could not redraw it. */
async function shrink(file: File): Promise<File> {
  if (!SHRINKABLE.test(file.type) || typeof createImageBitmap !== 'function') return file;
  let bitmap: ImageBitmap | null = null;
  let canvas: HTMLCanvasElement | null = null;
  try {
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      return file; // e.g. HEIC the browser cannot decode: sent as is, the size limit still applies
    }
    if (bitmap.width * bitmap.height > MAX_DECODED_PIXELS) return file;
    const scale = Math.min(1, FORM_LIMITS.maxImageSide / Math.max(bitmap.width, bitmap.height));
    const mustConvert = /heic|heif/.test(file.type);
    if (scale === 1 && !mustConvert && file.size <= KEEP_BELOW) return file;
    canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    ctx.fillStyle = '#fff'; // transparent PNG areas become white, not black
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas!.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob) throw new Error('toBlob failed');
    if (scale === 1 && !mustConvert && blob.size >= file.size) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' });
  } finally {
    bitmap?.close();
    if (canvas) canvas.width = canvas.height = 0; // releases the backing store at once (iOS Safari)
  }
}

const mb = (bytes: number) => `${(bytes / 1048576).toFixed(1).replace('.', ',')} MB`;

document.querySelectorAll<HTMLFormElement>('form[data-preview-form]').forEach((form) => {
  form.noValidate = true;
  const messages = JSON.parse(form.dataset.messages ?? '{}') as Messages;
  const status = form.querySelector<HTMLElement>('[data-status]')!;
  const submit = form.querySelector<HTMLButtonElement>('button[value="preview_request"]')!;
  const callback = form.querySelector<HTMLButtonElement>('button[value="callback_request"]')!;
  const fileInput = form.querySelector<HTMLInputElement>('input[type="file"]')!;
  const fileList = form.querySelector<HTMLElement>('[data-file-list]')!;
  const phone = form.elements.namedItem('phone') as HTMLInputElement;
  const thanks = form.parentElement!.querySelector<HTMLElement>('[data-thanks]')!;
  const tradeInputs = [...form.querySelectorAll<HTMLInputElement>('[data-trade-input]')];
  const yearsInputs = [...form.querySelectorAll<HTMLInputElement>('[data-years-input]')];
  const tradeOther = form.querySelector<HTMLElement>('[data-trade-other]')!;
  const tradeOtherInput = tradeOther.querySelector('input')!;
  const servicesLabel = form.querySelector<HTMLElement>('[data-services-label]')!;

  // ---- Steps: one question per screen ----
  const steps = [...form.querySelectorAll<HTMLFieldSetElement>('[data-step]')];
  const nav = form.querySelector<HTMLElement>('[data-step-nav]')!;
  const back = nav.querySelector<HTMLButtonElement>('[data-back]')!;
  const next = nav.querySelector<HTMLButtonElement>('[data-next]')!;
  const progress = form.querySelector<HTMLElement>('[data-progress]')!;
  const progressText = form.querySelector<HTMLElement>('[data-progress-text]')!;
  const progressBar = form.querySelector<HTMLElement>('[data-progress-bar]')!;
  let current = 0;

  const showStep = (index: number, focus = true) => {
    current = Math.max(0, Math.min(steps.length - 1, index));
    steps.forEach((step, i) => (step.hidden = i !== current));
    back.hidden = current === 0;
    next.hidden = current === steps.length - 1;
    progressText.textContent = messages.progress.replace('{n}', String(current + 1)).replace('{total}', String(steps.length));
    progressBar.style.setProperty('--p', `${((current + 1) / steps.length) * 100}%`);
    if (!focus) return;
    if (form.getBoundingClientRect().top < 0) form.scrollIntoView({ block: 'start' });
    steps[current].querySelector<HTMLElement>('legend')!.focus({ preventScroll: true });
  };
  form.classList.add('is-stepped');
  nav.hidden = false;
  progress.hidden = false;
  back.addEventListener('click', () => showStep(current - 1));
  next.addEventListener('click', () => showStep(current + 1));
  form.querySelectorAll<HTMLAnchorElement>('[data-goto-last]').forEach((a) => a.addEventListener('click', (event) => {
    event.preventDefault();
    showStep(steps.length - 1, false);
    (code ? callback : phone).focus();
  }));
  // Enter in a one-line field moves on instead of submitting the whole form early.
  form.addEventListener('keydown', (event) => {
    const el = event.target as HTMLElement;
    if (event.key !== 'Enter' || el.tagName !== 'INPUT' || current === steps.length - 1) return;
    if ((el as HTMLInputElement).type === 'file') return;
    event.preventDefault();
    showStep(current + 1);
  });
  showStep(0, false);

  // ---- Trade → services list ----
  const selected = (inputs: HTMLInputElement[]) => inputs.find((i) => i.checked)?.value ?? '';
  const tradeValue = () => {
    const t = selected(tradeInputs);
    return t === tradeInputs.at(-1)?.value ? tradeOtherInput.value.trim() : t;
  };
  const syncTrade = () => {
    const t = selected(tradeInputs);
    tradeOther.classList.toggle('is-on', t === tradeInputs.at(-1)?.value);
    const key = SERVICES_BY_TRADE[t] ?? (code && !t ? code[0] : '');
    let hasList = false;
    form.querySelectorAll<HTMLElement>('[data-services-for]').forEach((list) => {
      const on = list.dataset.servicesFor === key;
      list.classList.toggle('is-on', on);
      hasList ||= on;
    });
    servicesLabel.firstChild!.textContent = `${hasList ? servicesLabel.dataset.list : servicesLabel.dataset.free} `;
  };
  const preset = form.dataset.trade || (code ? Object.keys(SERVICES_BY_TRADE).find((t) => SERVICES_BY_TRADE[t] === code![0]) : '');
  const presetInput = tradeInputs.find((i) => i.value === preset);
  if (presetInput) presetInput.checked = true;
  tradeInputs.forEach((i) => i.addEventListener('change', syncTrade));
  syncTrade();

  // With a code the CRM already has the number: the phone field goes away.
  if (code) {
    (form.elements.namedItem('code') as HTMLInputElement).value = code;
    phone.required = false;
    form.querySelector<HTMLElement>('[data-phone-field]')!.hidden = true;
    form.querySelector<HTMLElement>('[data-code-note]')!.hidden = false;
  }

  const showStatus = (text: string, error = true) => {
    status.className = text && error ? 'pf__status is-err' : 'pf__status';
    status.textContent = text;
  };

  /** Marks a field (or a radio/checkbox group) invalid, shows and announces the text. Returns what to focus. */
  const setError = (name: string, text: string): HTMLElement | null => {
    const el = form.querySelector<HTMLElement>(`[data-error="${name}"]`);
    const control = form.elements.namedItem(name);
    let target: HTMLElement | null = null;
    if (control instanceof RadioNodeList) {
      const inputs = [...control].filter((n): n is HTMLInputElement => n instanceof HTMLInputElement);
      inputs.forEach((i) => i.setAttribute('aria-invalid', String(Boolean(text))));
      inputs[0]?.closest('.pf__radios, .pf__chips, .pf__checks')?.toggleAttribute('data-invalid', Boolean(text));
      target = inputs.find((i) => i.checked) ?? inputs[0] ?? null;
    } else if (control instanceof HTMLElement) {
      control.setAttribute('aria-invalid', String(Boolean(text)));
      target = control;
    }
    if (el) {
      el.textContent = text;
      el.hidden = !text;
    }
    if (text) showStatus(text);
    return target ?? el;
  };
  /** Shows the step holding `el` and focuses it. */
  const reveal = (el: HTMLElement | null) => {
    if (!el) return;
    const i = steps.findIndex((s) => s.contains(el));
    if (i >= 0 && i !== current) showStep(i, false);
    el.focus();
  };

  phone.addEventListener('input', () => {
    if (phone.getAttribute('aria-invalid') === 'true' && isPhone(phone.value.trim())) setError('phone', '');
  });

  fileInput.addEventListener('change', () => {
    setError('files', '');
    const files = [...(fileInput.files ?? [])];
    fileList.replaceChildren(...files.map((file) => {
      const li = document.createElement('li');
      li.textContent = `${file.name} · ${mb(file.size)}`;
      return li;
    }));
    // Own upload = "send_other" unless the visitor already chose an answer.
    const photos = form.elements.namedItem('photos_ok') as RadioNodeList;
    if (files.length && !photos.value) (form.querySelector('#pf-photos-other') as HTMLInputElement).checked = true;
  });

  let lastSubmitter: HTMLButtonElement | null = null;
  form.addEventListener('click', (event) => {
    lastSubmitter = (event.target as Element).closest<HTMLButtonElement>('button[type="submit"]') ?? lastSubmitter;
  });

  async function prepareFiles(): Promise<File[] | null> {
    const picked = [...(fileInput.files ?? [])];
    if (picked.length > FORM_LIMITS.maxFiles) return fail(messages.errors.files);
    const typed: File[] = [];
    for (const file of picked) {
      const ok = withType(file);
      if (!ok) return fail(`${file.name}: ${messages.errors.fileType}`);
      typed.push(ok);
    }
    if (typed.some((f) => SHRINKABLE.test(f.type))) submit.textContent = messages.preparing;
    const files: File[] = [];
    for (const file of typed) {
      try {
        files.push(await shrink(file)); // one at a time: phones run out of memory otherwise
      } catch {
        return fail(`${file.name}: ${messages.errors.prepare}`);
      }
    }
    const total = files.reduce((sum, f) => sum + f.size, 0);
    if (files.some((f) => f.size > FORM_LIMITS.maxFileBytes) || total > FORM_LIMITS.maxTotalBytes) return fail(messages.errors.files);
    return files;

    function fail(text: string) {
      setError('files', text);
      reveal(fileInput);
      return null;
    }
  }

  function showThanks(kind: string, name: string, time: string) {
    const t = messages.thanks;
    const who = name ? `, ${vocative(name)}` : '';
    thanks.querySelector('[data-thanks-text]')!.textContent = kind === 'callback_request'
      ? t.callback.replace('{name}', who).replace('{time}', t.times[time] ?? t.times[''])
      : t.preview.replace('{name}', who).replace('{date}', dueLabel());
    form.hidden = true;
    thanks.hidden = false;
    thanks.focus();
  }

  let busy = false; // one request at a time: a second tap never posts twice
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;
    const submitter = ((event as SubmitEvent).submitter as HTMLButtonElement | null) ?? lastSubmitter ?? submit;
    const kind = submitter.value === 'callback_request' ? 'callback_request' : 'preview_request';
    showStatus('');
    ['files', 'photos_ok', 'contact_time', 'services_other', 'area_other', 'standout', 'name'].forEach((n) => setError(n, ''));

    const phoneValue = phone.value.trim();
    if ((!code && !phoneValue) || (phoneValue && !isPhone(phoneValue))) {
      reveal(setError('phone', kind === 'callback_request' && !phoneValue ? messages.errors.phoneCallback : messages.errors.phone));
      return;
    }
    setError('phone', '');

    busy = true;
    const label = submit.textContent;
    submit.disabled = callback.disabled = true;
    try {
      const files = await prepareFiles();
      if (!files) return;
      submit.textContent = messages.sending;

      const body = new FormData();
      for (const [key, value] of new FormData(form)) {
        if (!WIRE_FIELDS.has(key) || typeof value !== 'string' || key === 'standout') continue;
        body.append(key, value.trim());
      }
      body.append('standout', composeStandout(tradeValue(), selected(yearsInputs), String(new FormData(form).get('standout') ?? '').trim(), messages.composed));
      body.append('kind', kind);
      files.forEach((file) => body.append('files', file, file.name));

      let res: Response;
      try {
        res = await fetch(form.action, { method: 'POST', body, credentials: 'omit' });
      } catch {
        showStatus(messages.errors.failure);
        return;
      }
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; field?: string };
      if (res.ok && json.ok) {
        showThanks(kind, String(body.get('name') ?? ''), String(body.get('contact_time') ?? ''));
      } else if (res.status === 400 && json.field) {
        const field = json.field === 'area' || json.field === 'services' ? `${json.field}_other` : json.field;
        reveal(setError(field, messages.errors[field] ?? messages.errors.invalid));
        if (!messages.errors[field]) showStatus(messages.errors.invalid);
      } else if (res.status === 413 || res.status === 415) {
        setError('files', res.status === 413 ? messages.errors.tooLarge : messages.errors.fileType);
        reveal(fileInput);
      } else {
        showStatus(res.status === 429 ? messages.errors.rateLimited : messages.errors.failure);
      }
    } finally {
      busy = false;
      submit.disabled = callback.disabled = false;
      submit.textContent = label;
    }
  });
});
