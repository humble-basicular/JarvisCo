import type { InquiryContext } from './security';
import { EmailMessage } from 'cloudflare:email';

export interface AlertConfig {
  FORM_EMAIL?: SendEmail;
  FORM_ALERT_TO?: string;
  // Trusted private JSON: site code -> verified recipient mailboxes.
  FORM_SITE_RECIPIENTS?: string;
  // Trusted operator configuration: proof code -> exact, verified Paslaugos URL.
  FORM_PROOF_LINKS?: string;
  // Trusted private JSON array of site codes whose alerts carry uploaded photos.
  FORM_ATTACHMENT_SITES?: string;
}
interface Alert {
  kind: string; code: string | null; site: string | null; at: string;
  context?: InquiryContext;
  notificationDB?: D1Database;
  payload: { files: { key: string; name: string; type: string; size: number }[] } & object;
  uploads?: File[];
}
const FROM = 'forms@jarvisweb.lt';
const SUBJECT = 'JarvisWeb: nauja formos užklausa';
const PHOTO_SUBJECT = 'JarvisWeb: nuotraukos prie užklausos';
// Images only: an alert must not deliver submitted documents to a mailbox.
const ATTACHMENT_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'image/heif': 'heif', 'image/gif': 'gif',
};
// Sized for the 128 MB isolate, not the 25 MiB send_email limit: the upload, its
// base64 and one assembled message are all in memory at once.
const ATTACHMENT_BYTES = 8 * 1024 * 1024;

async function sha256(bytes: BufferSource): Promise<string> {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
    .map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function alertFingerprint(alert: Omit<Alert, 'at'>, files: File[]): Promise<string> {
  // Canonical validated payload; exclude random KV keys and multipart boundaries.
  // Keep file order/name/type/size AND content so different uploads never collapse.
  const descriptors = [];
  for (const [n, file] of files.entries()) {
    const { name, type, size } = alert.payload.files[n]!;
    descriptors.push({ name, type, size, sha256: await sha256(await file.arrayBuffer()) });
  }
  return sha256(new TextEncoder().encode(JSON.stringify({
    v: 1, kind: alert.kind, code: alert.code, site: alert.site,
    payload: { ...alert.payload, files: descriptors },
  })));
}

// ASCII mailbox only, no display names, lists, comments, whitespace or controls.
function recipient(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 254 && value.length > 0
    && /^[A-Za-z0-9_+%-]+(?:\.[A-Za-z0-9_+%-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/.test(value);
}

function recipients(config: AlertConfig, alert: Alert): { targets: string[]; routingWarning: boolean } {
  const owner = recipient(config.FORM_ALERT_TO) ? [config.FORM_ALERT_TO] : [];
  const invalidRoute = { targets: owner, routingWarning: true };
  // Funnel notifications must never inherit a client's routing configuration.
  if (alert.kind === 'site_inquiry' && alert.site && config.FORM_SITE_RECIPIENTS !== undefined) {
    try {
      const routes: unknown = JSON.parse(config.FORM_SITE_RECIPIENTS);
      if (!routes || typeof routes !== 'object' || Array.isArray(routes)) return invalidRoute;
      if (Object.hasOwn(routes, alert.site)) {
        const list: unknown = (routes as Record<string, unknown>)[alert.site];
        if (!Array.isArray(list) || !list.length || list.length > 10 || !list.every(recipient)) return invalidRoute;
        const seen = new Set<string>();
        const targets = list.filter(to => {
          const key = to.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        return { targets, routingWarning: false };
      }
    } catch { return invalidRoute; } // Only the validated owner may receive a routing warning.
  }
  // Existing unmapped sites and jarvisweb.lt keep the live single-owner behavior.
  return { targets: owner, routingWarning: false };
}

// JSON string literals make every untrusted field visibly quoted on ONE line.
// Escape C0/C1, Unicode line separators, bidi/format controls and HTML metacharacters.
function quoted(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  return JSON.stringify(String(value)).replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}<>&]/gu,
    char => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

function proofLink(config: string | undefined, code: string | null): string | null {
  if (!code || !config) return null;
  try {
    const links: unknown = JSON.parse(config);
    if (!links || typeof links !== 'object' || Array.isArray(links) || !Object.hasOwn(links, code)) return null;
    const raw = (links as Record<string, unknown>)[code];
    if (typeof raw !== 'string' || raw.length > 2048 || /[\s\p{Cc}\p{Cf}<>"\\]/u.test(raw)) return null;
    const url = new URL(raw);
    return url.protocol === 'https:' && ['paslaugos.lt', 'www.paslaugos.lt'].includes(url.hostname)
      && !url.username && !url.password && !url.port ? url.href : null;
  } catch { return null; }
}

function attachmentsEnabled(config: AlertConfig, alert: Alert): boolean {
  if (alert.kind !== 'site_inquiry' || !alert.site || !config.FORM_ATTACHMENT_SITES) return false;
  try {
    const sites: unknown = JSON.parse(config.FORM_ATTACHMENT_SITES);
    return Array.isArray(sites) && sites.includes(alert.site);
  } catch { return false; }
}

// Decided from validated type and size alone, so the text alert can state it without reading bytes.
function attachablePhotos(alert: Alert): File[] {
  let bytes = 0;
  return (alert.uploads ?? []).filter(file => {
    if (!ATTACHMENT_TYPES[file.type] || bytes + file.size > ATTACHMENT_BYTES) return false;
    bytes += file.size;
    return true;
  });
}

function bytesBase64(bytes: Uint8Array): string {
  const native = (bytes as Uint8Array & { toBase64?: () => string }).toBase64;
  if (native) return native.call(bytes);
  let out = '';
  // A multiple of three, so no padding appears before the final chunk.
  for (let at = 0; at < bytes.length; at += 24576) out += btoa(String.fromCharCode(...bytes.subarray(at, at + 24576)));
  return out;
}

function wrapped(encoded: string): string {
  const lines: string[] = [];
  for (let at = 0; at < encoded.length; at += 76) lines.push(encoded.slice(at, at + 76));
  return lines.join('\r\n');
}

// File names and types come from the validated type map and the position, so no
// submitted value enters a MIME header.
async function attachmentParts(photos: File[]): Promise<string[]> {
  const parts: string[] = [];
  for (const file of photos) {
    const name = `nuotrauka-${parts.length + 1}.${ATTACHMENT_TYPES[file.type]}`;
    parts.push([
      `Content-Type: ${file.type}; name="${name}"`, `Content-Disposition: attachment; filename="${name}"`,
      'Content-Transfer-Encoding: base64', '', wrapped(bytesBase64(new Uint8Array(await file.arrayBuffer()))),
    ].join('\r\n'));
  }
  return parts;
}

function body(alert: Alert, config: AlertConfig, routingWarning: boolean, photoLine?: string): string {
  const p = alert.payload as Record<string, unknown>;
  const site = alert.kind === 'site_inquiry';
  const list = (key: string, other: string) => [...(p[key] as string[]), ...(p[other] ? [p[other]] : [])].map(quoted).join(', ') || '—';
  const time: Record<string, string> = { morning: 'Ryte', day: 'Dieną', evening: 'Vakare', sms: 'SMS' };
  const kinds: Record<string, string> = {
    preview_request: 'Svetainės peržiūros užklausa', callback_request: 'Prašymas susisiekti', site_inquiry: 'Svetainės užklausa',
  };
  const at = new Intl.DateTimeFormat('lt-LT', { timeZone: 'Europe/Vilnius',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).format(new Date(alert.at));
  const link = proofLink(config.FORM_PROOF_LINKS, alert.code);
  return [
    ...(routingWarning ? ['Maršrutizavimo konfigūracija neteisinga — klientui nepranešta'] : []),
    `Formos rūšis: ${kinds[alert.kind]}`,
    `Išsaugota: ${at} (Europe/Vilnius)`,
    `Svetainė: ${quoted(alert.site)}`,
    `Vardas: ${quoted(p.name)}`, `Telefonas: ${quoted(p.phone)}`, `El. paštas: ${quoted(p.email)}`,
    `Paslaugos: ${site ? quoted(p.service) : list('services', 'services_other')}`,
    ...(alert.context ? [`Šaltinis: ${quoted(alert.context.source)}`, `Puslapis: ${quoted(alert.context.page)}`, `Pirmas puslapis: ${quoted(alert.context.landing_path)}`] : []),
    `Vietovė: ${site ? quoted(p.location) : list('area', 'area_other')}`,
    `Susisiekimo laikas: ${p.contact_time ? quoted(time[String(p.contact_time)] ?? p.contact_time) : '—'}`,
    `Išskirtinumas / žinutė: ${quoted(site ? p.message : p.standout)}`,
    `Peržiūros kanalas: ${quoted(p.preview_via)}`, `Nuotraukos: ${quoted(p.photos_ok)}`,
    `Įrodymo kodas: ${quoted(alert.code)}`, `Paslaugos nuoroda: ${link ?? '— (nepriskirta)'}`,
    `Failų skaičius: ${alert.payload.files.length}`,
    ...(photoLine ? [photoLine] : []),
    'Pateikti duomenys rodomi kabutėse; valdymo simboliai užkoduoti.',
  ].join('\r\n');
}

function base64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function scheduleFormAlert(config: AlertConfig, ctx: ExecutionContext, alert: Alert): void {
  // Everything including configuration, message construction and synchronous send
  // failures stays outside the storage transaction and successful HTTP outcome.
  try {
    if (!['preview_request', 'callback_request', 'site_inquiry'].includes(alert.kind) || !config.FORM_EMAIL) return;
    const { targets, routingWarning } = recipients(config, alert);
    const binding = config.FORM_EMAIL;
    const enabled = attachmentsEnabled(config, alert);
    const photos = enabled ? attachablePhotos(alert) : [];
    const anyImage = enabled && (alert.uploads ?? []).some(file => ATTACHMENT_TYPES[file.type]);
    const photoLine = photos.length
      ? `Nuotraukos siunčiamos atskiru laišku: ${photos.length} iš ${alert.payload.files.length}. Negavus paskambinkite klientui.`
      : anyImage ? 'Nuotraukos per didelės laiškui; jos išsaugotos sistemoje, paskambinkite klientui.' : undefined;
    const headers = (to: string, subject: string) => [`From: ${FROM}`, `To: ${to}`, `Date: ${new Date(alert.at).toUTCString()}`, `Subject: =?UTF-8?B?${base64(subject)}?=`, 'MIME-Version: 1.0'];
    const encoded = (text: string) => base64(text).match(/.{1,76}/g)!.join('\r\n');
    // One private message per mailbox. A failed/slow destination cannot suppress
    // another, and neither changes the existing durable fingerprint claim.
    for (const to of targets) ctx.waitUntil(Promise.resolve().then(async () => {
      const raw = [...headers(to, SUBJECT), 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '',
        encoded(body(alert, config, routingWarning, photoLine)), ''].join('\r\n');
      const track = async (status: string) => {
        if (alert.notificationDB && alert.site) await alert.notificationDB.prepare('INSERT INTO inquiry_notifications(site, status) VALUES (?, ?)').bind(alert.site, status).run().catch(() => {});
      };
      await track('attempt');
      try { await binding.send(new EmailMessage(FROM, to, raw)); await track('sent'); }
      catch { await track('failure'); }
    }).catch(() => {}));
    // Photos travel separately, so nothing about them can affect the enquiry alert above.
    // One mailbox at a time keeps a single full message in memory; a failure or a stuck
    // send only costs the remaining photo emails, which the text alert already allows for.
    if (photos.length) ctx.waitUntil(Promise.resolve().then(async () => {
      const parts = await attachmentParts(photos);
      const p = alert.payload as Record<string, unknown>;
      const note = `Nuotraukos prie užklausos.\r\nTelefonas: ${quoted(p.phone)}\r\nVardas: ${quoted(p.name)}\r\nVietovė: ${quoted(p.location)}`;
      for (const to of targets) {
        const boundary = `jw-${crypto.randomUUID()}`;
        const raw = [...headers(to, PHOTO_SUBJECT), `Content-Type: multipart/mixed; boundary="${boundary}"`, '',
          `--${boundary}`, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', encoded(note),
          ...parts.flatMap(part => [`--${boundary}`, part]), `--${boundary}--`, ''].join('\r\n');
        try { await binding.send(new EmailMessage(FROM, to, raw)); } catch { /* Next mailbox still gets its photos. */ }
      }
    }).catch(() => {}));
  } catch { /* Notification failures must never undo storage or change the receipt. */ }
}
