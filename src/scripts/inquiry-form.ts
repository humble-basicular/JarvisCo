/* Inquiry form: accessible client validation + Web3Forms submit.
   Without JS the form posts natively to Web3Forms (with native required/type
   checks). With JS we validate phone AND e-mail (kept from the pre-rebuild
   form, commit fc660a7), show inline errors, then submit with fetch. */
import { validateEmail } from './email_validation.js';

// A working Lithuanian number: +370 / 370 / 8 followed by 8 digits.
function isValidLtPhone(value: string) {
  return /^(\+370|370|8)\d{8}$/.test(value.replace(/[\s\-()]/g, ''));
}

type FieldName = 'name' | 'phone' | 'email';

const checks: Record<FieldName, (value: string) => boolean> = {
  name: (v) => v.trim().length > 0,
  phone: isValidLtPhone,
  email: (v) => validateEmail(v).valid,
};

document.querySelectorAll<HTMLFormElement>('form[data-inquiry-form]').forEach((form) => {
  form.noValidate = true; // JS takes over from native bubbles
  const status = form.querySelector<HTMLElement>('[data-status]')!;
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const messages = JSON.parse(form.dataset.messages ?? '{}') as Record<string, string>;

  const setError = (name: FieldName, show: boolean) => {
    const input = form.elements.namedItem(name) as HTMLInputElement;
    const error = form.querySelector<HTMLElement>(`[data-error="${name}"]`)!;
    input.setAttribute('aria-invalid', String(show));
    error.textContent = show ? messages[name] : '';
    error.hidden = !show;
    return input;
  };

  // Clear an error as soon as the value becomes valid.
  form.addEventListener('input', (event) => {
    const input = event.target as HTMLInputElement;
    const name = input.name as FieldName;
    if (name in checks && input.getAttribute('aria-invalid') === 'true' && checks[name](input.value)) {
      setError(name, false);
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    if (data.get('botcheck')) return; // honeypot

    let firstInvalid: HTMLInputElement | null = null;
    for (const name of Object.keys(checks) as FieldName[]) {
      const ok = checks[name](String(data.get(name) ?? ''));
      const input = setError(name, !ok);
      if (!ok && !firstInvalid) firstInvalid = input;
    }
    if (firstInvalid) {
      status.className = 'form__status is-err';
      status.textContent = messages.summary;
      firstInvalid.focus();
      return;
    }

    button.disabled = true;
    const label = button.textContent;
    button.textContent = messages.sending;
    status.className = 'form__status';
    status.textContent = '';
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: data,
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      form.reset();
      status.className = 'form__status is-ok';
      status.textContent = messages.success;
    } catch {
      status.className = 'form__status is-err';
      status.textContent = messages.failure;
    } finally {
      button.disabled = false;
      button.textContent = label;
    }
  });
});
