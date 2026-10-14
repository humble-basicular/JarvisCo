/* Free-preview form (funnel spec §4). Adds to the native multipart form:
   - the proof code from the SMS link (track.ts) and, with a code, the trade's
     service checkboxes and no phone field (codes are guessable, so nothing
     about the lead is fetched or prefilled);
   - images downsized to ≤ 2000 px JPEG in the browser where it can;
   - the spec's limits, inline errors, server error codes and the thank-you.
   The form is opened by the "Taip, noriu" button ([data-open-form]) or #forma. */
import { code } from './track';
import { FORM_LIMITS } from '../data/tracking.js';

type Messages = {
  errors: Record<string, string>;
  thanks: { preview: string; callback: string; times: Record<string, string>; sign: string };
  sending: string;
  preparing: string;
};

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif',
  gif: 'image/gif', pdf: 'application/pdf', txt: 'text/plain', doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};
const SHRINKABLE = /^image\/(jpeg|png|webp|heic|heif)$/;
const KEEP_BELOW = 1.5 * 1024 * 1024; // small images within 2000 px are sent untouched (keeps PNG logos)

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

/** +48 h in Europe/Vilnius, rounded up to the full hour: "spalio 16 d. 15:00". */
export function dueLabel(now = Date.now()) {
  const due = new Date(Math.ceil((now + 48 * 3600e3) / 3600e3) * 3600e3);
  return new Intl.DateTimeFormat('lt-LT', { timeZone: 'Europe/Vilnius', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(due);
}

/** A valid phone per spec §4: ≤ 20 chars of digits, spaces, + - ( ), at least 8 digits. */
export function isPhone(value: string) {
  return value.length <= 20 && /^[0-9 +\-()]+$/.test(value) && (value.match(/\d/g)?.length ?? 0) >= 8;
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

async function shrink(file: File): Promise<File> {
  if (!SHRINKABLE.test(file.type) || typeof createImageBitmap !== 'function') return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file); // fails for HEIC where the browser cannot decode it: sent as is
  } catch {
    return file;
  }
  const max = FORM_LIMITS.maxImageSide;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const mustConvert = /heic|heif/.test(file.type);
  if (scale === 1 && !mustConvert && file.size <= KEEP_BELOW) {
    bitmap.close();
    return file;
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.fillStyle = '#fff'; // transparent PNG areas become white, not black
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  if (!blob || (scale === 1 && !mustConvert && blob.size >= file.size)) return file;
  return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' });
}

const mb = (bytes: number) => `${(bytes / 1048576).toFixed(1).replace('.', ',')} MB`;

document.querySelectorAll<HTMLFormElement>('form[data-preview-form]').forEach((form) => {
  form.noValidate = true;
  const messages = JSON.parse(form.dataset.messages ?? '{}') as Messages;
  const status = form.querySelector<HTMLElement>('[data-status]')!;
  const submit = form.querySelector<HTMLButtonElement>('button[value="preview_request"]')!;
  const fileInput = form.querySelector<HTMLInputElement>('input[type="file"]')!;
  const fileList = form.querySelector<HTMLElement>('[data-file-list]')!;
  const phone = form.elements.namedItem('phone') as HTMLInputElement;
  const thanks = form.parentElement!.querySelector<HTMLElement>('[data-thanks]')!;

  // With a code: the CRM already has the number, so the phone field goes away,
  // and the trade's service checkboxes come in (code prefix = trade, spec §2).
  if (code) {
    (form.elements.namedItem('code') as HTMLInputElement).value = code;
    phone.required = false;
    form.querySelector<HTMLElement>('[data-phone-field]')!.hidden = true;
    const list = form.querySelector<HTMLElement>(`[data-services-for="${code[0]}"]`);
    if (list) {
      list.hidden = false;
      const label = form.querySelector<HTMLElement>('[data-services-label]')!;
      label.firstChild!.textContent = `${label.dataset.other} `;
      const other = form.elements.namedItem('services_other') as HTMLInputElement;
      other.placeholder = other.dataset.otherHint ?? '';
    }
  }

  const setError = (name: string, text: string) => {
    const el = form.querySelector<HTMLElement>(`[data-error="${name}"]`);
    const input = form.elements.namedItem(name) as HTMLInputElement | null;
    input?.setAttribute('aria-invalid', String(Boolean(text)));
    if (el) {
      el.textContent = text;
      el.hidden = !text;
    }
    return input;
  };

  phone.addEventListener('input', () => {
    if (phone.getAttribute('aria-invalid') === 'true' && isPhone(phone.value.trim())) setError('phone', '');
  });

  fileInput.addEventListener('change', () => {
    setError('files', '');
    fileList.replaceChildren(...[...(fileInput.files ?? [])].map((file) => {
      const li = document.createElement('li');
      li.textContent = `${file.name} · ${mb(file.size)}`;
      return li;
    }));
  });

  let lastSubmitter: HTMLButtonElement | null = null;
  form.addEventListener('click', (event) => {
    lastSubmitter = (event.target as Element).closest<HTMLButtonElement>('button[type="submit"]') ?? lastSubmitter;
  });

  const showStatus = (text: string) => {
    status.className = text ? 'pf__status is-err' : 'pf__status';
    status.textContent = text;
  };

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
    for (const file of typed) files.push(await shrink(file)); // one at a time: phones run out of memory otherwise
    const total = files.reduce((sum, f) => sum + f.size, 0);
    if (files.some((f) => f.size > FORM_LIMITS.maxFileBytes) || total > FORM_LIMITS.maxTotalBytes) return fail(messages.errors.files);
    return files;

    function fail(text: string) {
      setError('files', text);
      fileInput.focus();
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

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitter = (event as SubmitEvent).submitter as HTMLButtonElement | null ?? lastSubmitter ?? submit;
    const kind = submitter.value === 'callback_request' ? 'callback_request' : 'preview_request';
    showStatus('');
    setError('files', '');

    const phoneValue = phone.value.trim();
    const phoneNeeded = !code;
    if ((phoneNeeded && !phoneValue) || (phoneValue && !isPhone(phoneValue))) {
      setError('phone', kind === 'callback_request' && !phoneValue ? messages.errors.phoneCallback : messages.errors.phone);
      phone.focus();
      return;
    }
    setError('phone', '');

    const label = submit.textContent;
    submit.disabled = true;
    try {
      const files = await prepareFiles();
      if (!files) return;
      submit.textContent = messages.sending;

      const body = new FormData();
      for (const [key, value] of new FormData(form)) {
        if (key === 'files' || key === 'kind' || typeof value !== 'string') continue;
        body.append(key, value.trim());
      }
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
        const input = setError(field, messages.errors[field] ?? messages.errors.invalid);
        showStatus(messages.errors.invalid);
        input?.focus();
      } else if (res.status === 413 || res.status === 415) {
        setError('files', res.status === 413 ? messages.errors.tooLarge : messages.errors.fileType);
        fileInput.focus();
      } else {
        showStatus(res.status === 429 ? messages.errors.rateLimited : messages.errors.failure);
      }
    } finally {
      submit.disabled = false;
      submit.textContent = label;
    }
  });
});

/* Gate: with JS the form stays folded until "Taip, noriu" is tapped (that tap is
   the `preview_cta` beacon, sent by track.ts from data-track). #forma opens it
   directly, e.g. from the homepage button. Without JS it is always open. */
const gate = document.querySelector<HTMLElement>('[data-form-gate]');
if (gate) {
  const open = (scroll: boolean) => {
    if (gate.classList.contains('is-open')) return;
    gate.classList.add('is-open');
    if (scroll) requestAnimationFrame(() => gate.scrollIntoView({ block: 'start' }));
  };
  document.querySelectorAll('[data-open-form]').forEach((el) => el.addEventListener('click', () => open(true)));
  if (location.hash === `#${gate.id}`) open(true);
  addEventListener('hashchange', () => location.hash === `#${gate.id}` && open(true));
}
