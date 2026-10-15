// Rows stored before offer-v2 §2.4 have no email/preview_via: read them as null on the two funnel kinds.
function withEmailFields(type: Event['type'], submission: Submission | SiteSubmission): Submission | SiteSubmission {
  if (type !== 'preview_request' && type !== 'callback_request') return submission;
  const stored = submission as Submission;
  return { ...stored, email: stored.email ?? null, preview_via: stored.preview_via ?? null };
}

interface Env {
  DB: D1Database;
  FILES: KVNamespace;
  EVENTS_TOKEN?: string;
  SITES?: string;
}

type BeaconType = 'view' | 'scroll_proof' | 'cta_sms' | 'cta_call' | 'pdf' | 'arbcut' | 'preview_cta';
interface Event {
  id: string;
  code: string | null;
  site: string | null;
  type: BeaconType | 'click' | 'preview_request' | 'callback_request' | 'site_inquiry' | 'job_request';
  submission?: Submission | SiteSubmission;
  at: string;
  ua_class: 'bot' | 'human';
}
interface Cursor {
  v: 1;
  since: string;
  at: string;
  id: string;
  high: string;
}

const PREFIXES: Readonly<Record<string, string>> = { a: '/rezultatai', p: '/noriu' };
const CODE = /^[23456789abcdefghjkmnpqrstuvwxyz]{5}$/;
const TYPES: readonly string[] = ['view', 'scroll_proof', 'cta_sms', 'cta_call', 'pdf', 'arbcut', 'preview_cta'];
const BOT = /facebookexternalhit|whatsapp|telegrambot|slackbot|twitterbot|skypeuripreview|googlebot|bingbot|google-pagerenderer|bot|crawler|spider|preview/i;
const MAX_BODY = 1024;
const WINDOW_MS = 60_000;
const RATE_LIMIT = 60;
const CLEANUP_INTERVAL_MS = 3_600_000;
let nextCleanupAttempt = 0;

interface SiteConfig { kind: 'client' | 'leadgen'; origins: string[] }
const SITE = /^[a-z][a-z0-9-]{2,31}$/;
let sitesSource: string | undefined;
let sitesCache: Readonly<Record<string, SiteConfig>> | null = null;
function sites(env: Env): Readonly<Record<string, SiteConfig>> | null {
  if (env.SITES === sitesSource) return sitesCache;
  sitesSource = env.SITES;
  sitesCache = null;
  try {
    const parsed: unknown = JSON.parse(env.SITES ?? '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const config: Record<string, SiteConfig> = Object.create(null);
    for (const [code, value] of Object.entries(parsed)) {
      if (!SITE.test(code) || !value || typeof value !== 'object' || Array.isArray(value)) return null;
      const { kind, origins } = value as SiteConfig;
      if (!['client', 'leadgen'].includes(kind) || !Array.isArray(origins) || !origins.length
        || origins.some(origin => typeof origin !== 'string' || !['http:', 'https:'].includes(new URL(origin).protocol)
          || new URL(origin).origin !== origin)) return null;
      config[code] = { kind, origins };
    }
    sitesCache = config;
  } catch { /* Fail closed, with no config/request logging. */ }
  return sitesCache;
}
function allowedOrigin(request: Request, config: SiteConfig): boolean {
  return config.origins.includes(request.headers.get('Origin') ?? '');
}
function cors(response: Response, origin: string): Response {
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Vary', 'Origin');
  return response;
}
function firstPartyOrigin(request: Request): boolean {
  const origin = request.headers.get('Origin');
  return origin === null || origin === new URL(request.url).origin
    || origin === 'https://jarvisweb.lt' || origin === 'https://www.jarvisweb.lt';
}

// Check the union before reading a body; the parsed site still needs its own check.
function rejectForeignOrigin(request: Request, env: Env): Response | null {
  if (firstPartyOrigin(request)) return null;
  const config = sites(env);
  if (!config) return error('unavailable', 503);
  const origin = request.headers.get('Origin')!;
  return Object.values(config).some(site => site.origins.includes(origin)) ? null : error('origin', 403);
}

function validCode(code: unknown): code is string {
  return typeof code === 'string' && CODE.test(code) && PREFIXES[code[0]!] !== undefined;
}

export function uaClass(request: Request): Event['ua_class'] {
  return BOT.test(request.headers.get('User-Agent') ?? '') ? 'bot' : 'human';
}

function json(data: unknown, status = 200, headers: HeadersInit = {}): Response {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

function error(message: string, status: number): Response {
  return json({ error: message }, status);
}

function redirect(location: string): Response {
  return new Response(null, { status: 302, headers: { Location: location, 'Cache-Control': 'no-store' } });
}

// Subtract calendar months, clamping leap days/month ends, keeping UTC time.
export function retentionCutoff(now: Date): string {
  const cutoff = new Date(now);
  const day = cutoff.getUTCDate();
  cutoff.setUTCDate(1);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1);
  const lastDay = new Date(Date.UTC(cutoff.getUTCFullYear(), cutoff.getUTCMonth() + 1, 0)).getUTCDate();
  cutoff.setUTCDate(Math.min(day, lastDay));
  return cutoff.toISOString();
}

async function cleanup(db: D1Database, now: Date): Promise<void> {
  const ms = now.getTime();
  const lease = await db.prepare(`
    INSERT INTO maintenance(key, next_at) VALUES ('retention', ?)
    ON CONFLICT(key) DO UPDATE SET next_at = excluded.next_at
    WHERE maintenance.next_at <= ? RETURNING next_at
  `).bind(ms + CLEANUP_INTERVAL_MS, ms).first();
  if (!lease) return;
  await db.batch([
    db.prepare('DELETE FROM submissions WHERE at < ?').bind(retentionCutoff(now)),
    db.prepare('DELETE FROM events WHERE at < ?').bind(retentionCutoff(now)),
    db.prepare('DELETE FROM form_daily_budgets WHERE day_start < ?').bind(Math.floor(ms / 86_400_000) * 86_400_000),
    db.prepare('DELETE FROM site_daily_budgets WHERE day_start < ?').bind(Math.floor(ms / 86_400_000) * 86_400_000),
    db.prepare('DELETE FROM rate_limits WHERE window_start < ?').bind(Math.floor(ms / WINDOW_MS) * WINDOW_MS),
  ]);
}

function scheduleCleanup(env: Env, ctx: ExecutionContext): void {
  const now = Date.now();
  if (now < nextCleanupAttempt) return;
  nextCleanupAttempt = now + CLEANUP_INTERVAL_MS;
  // Deliberately swallow storage exceptions: no request, secret or UA logging.
  ctx.waitUntil(cleanup(env.DB, new Date(now)).catch(() => {}));
}

async function click(request: Request, env: Env, ctx: ExecutionContext, code: string): Promise<Response> {
  // Return immediately even if D1 is slow/unavailable. waitUntil finishes the write.
  ctx.waitUntil(env.DB.prepare('INSERT INTO events(code, type, ua_class) VALUES (?, ?, ?)')
    .bind(code, 'click', uaClass(request)).run().catch(() => {}));
  return redirect(`${PREFIXES[code[0]!]!}?r=${code}`);
}

class BodyTooLarge extends Error {}
async function readBody(request: Request, max: number): Promise<Uint8Array> {
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) {
        await reader.cancel();
        throw new BodyTooLarge();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}

async function beacon(request: Request, env: Env): Promise<Response> {
  const mediaType = (request.headers.get('Content-Type') ?? '').split(';')[0]!.trim().toLowerCase();
  if (!['', 'application/json', 'text/plain'].includes(mediaType)) return error('unsupported_media_type', 415);
  const denied = rejectForeignOrigin(request, env);
  if (denied) return denied;
  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(await readBody(request, MAX_BODY)));
  } catch (cause) {
    return error(cause instanceof BodyTooLarge ? 'body_too_large' : 'invalid_json', cause instanceof BodyTooLarge ? 413 : 400);
  }
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return error('invalid_event', 400);
  const { code, site, type } = payload as Record<string, unknown>;
  let siteCode: string | null = null;
  if ('site' in payload) {
    if (typeof site !== 'string' || !SITE.test(site)) return error('invalid_event', 400);
    const config = sites(env);
    if (!config) return error('unavailable', 503);
    if (!config[site]) return error('invalid_event', 400);
    if (!allowedOrigin(request, config[site]!)) return error('origin', 403);
    if ('code' in payload || typeof type !== 'string' || !['cta_call', 'cta_sms'].includes(type)) {
      return cors(error('invalid_event', 400), request.headers.get('Origin')!);
    }
    siteCode = site;
  } else if (!firstPartyOrigin(request)) return error('origin', 403);
  if (!siteCode && (!validCode(code) || typeof type !== 'string' || !TYPES.includes(type))) return error('invalid_event', 400);

  try {
    const bucket = siteCode ? `site-beacon:${siteCode}` : code;
    const now = Date.now();
    const window = Math.floor(now / WINDOW_MS) * WINDOW_MS;
    // D1 batch is a transaction: budget claim and gated event insert cannot race.
    const results = await env.DB.batch([
      env.DB.prepare(`INSERT INTO rate_limits(code, window_start, requests) VALUES (?, ?, 1)
        ON CONFLICT(code, window_start) DO UPDATE SET requests = min(requests + 1, ?)
      `).bind(bucket, window, RATE_LIMIT + 1),
      env.DB.prepare(`INSERT INTO events(code, site, type, ua_class)
        SELECT ?, ?, ?, ? WHERE (SELECT requests FROM rate_limits WHERE code = ? AND window_start = ?) <= ?
      `).bind(siteCode ? null : code, siteCode, type, uaClass(request), bucket, window, RATE_LIMIT),
    ]);
    if (results[1]!.meta.changes === 0) {
      const response = json({ error: 'rate_limited' }, 429, { 'Retry-After': String(Math.ceil((window + WINDOW_MS - now) / 1000)) });
      return siteCode ? cors(response, request.headers.get('Origin')!) : response;
    }
    const response = new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
    return siteCode ? cors(response, request.headers.get('Origin')!) : response;
  } catch {
    const response = error('unavailable', 503);
    return siteCode ? cors(response, request.headers.get('Origin')!) : response;
  }
}

interface StoredFile { key: string; name: string; type: string; size: number }
interface Submission {
  name: string | null;
  phone: string | null;
  email: string | null;
  preview_via: 'sms' | 'email' | null;
  services: string[];
  services_other: string | null;
  area: string[];
  area_other: string | null;
  photos_ok: string | null;
  standout: string | null;
  contact_time: string | null;
  files: StoredFile[];
}
interface SiteSubmission {
  name: string | null; phone: string | null; message: string | null;
  service: string | null; location: string | null; brand: string | null;
  contact_time: string | null; consent: boolean; files: StoredFile[];
}
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MB = 1024 * 1024;
// Bound the stream before parsing multipart; allow bounded multipart overhead.
const MAX_FORM_BODY = 25 * MB + 64 * 1024;
const FILE_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain',
]);

async function form(request: Request, env: Env, ctx: ExecutionContext, mode: { isSite?: boolean }): Promise<Response> {
  const invalid = (field: string) => json({ error: 'invalid', field }, 400);
  if ((request.headers.get('Content-Type') ?? '').split(';')[0]!.trim().toLowerCase() !== 'multipart/form-data') return invalid('kind');
  const denied = rejectForeignOrigin(request, env);
  if (denied) return denied;
  const length = Number(request.headers.get('Content-Length'));
  if (length > MAX_FORM_BODY) return error('too_large', 413);
  let data: FormData;
  try {
    let size = 0;
    const stream = request.body?.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        size += chunk.byteLength;
        if (size > MAX_FORM_BODY) throw new BodyTooLarge();
        controller.enqueue(chunk);
      },
    }));
    data = await new Response(stream, { headers: { 'Content-Type': request.headers.get('Content-Type')! } }).formData();
  } catch (cause) {
    return cause instanceof BodyTooLarge ? error('too_large', 413) : invalid('kind');
  }

  const text = (field: string): string | null => {
    const values = data.getAll(field);
    if (values.length > 1 || values.some(value => typeof value !== 'string')) return null;
    return typeof values[0] === 'string' ? values[0].trim() : '';
  };
  const kind = text('kind');
  const isSite = kind === 'site_inquiry' || kind === 'job_request';
  mode.isSite = isSite ? true : (kind === 'preview_request' || kind === 'callback_request' ? false : undefined);
  let site: string | null = null;
  if (isSite) {
    const config = sites(env);
    if (!config) return error('unavailable', 503);
    site = text('site');
    if (!site || !SITE.test(site) || !config[site] || config[site]!.kind !== (kind === 'site_inquiry' ? 'client' : 'leadgen')) return invalid('site');
    if (!allowedOrigin(request, config[site]!)) return error('origin', 403);
  } else if (!firstPartyOrigin(request)) return error('origin', 403);
  if (data.getAll('website').some(value => typeof value !== 'string' || value.trim() !== '')) return json({ ok: true });
  if (!isSite && kind !== 'preview_request' && kind !== 'callback_request') return invalid('kind');
  const code = isSite ? '' : text('code');
  if (code === null || (code !== '' && !validCode(code))) return invalid('code');
  const values: Record<string, string> = {};
  for (const [field, max] of Object.entries(isSite ? { name: 80, phone: 20, message: 2000, service: 120, location: 120, ...(kind === 'job_request' ? { brand: 60 } : {}) } : { name: 80, phone: 20, services_other: 200, area_other: 200, standout: 1000 })) {
    const value = text(field);
    if (value === null || [...value].length > max) return invalid(field);
    values[field] = value;
  }
  const phone = values.phone!;
  // Optional on the two funnel kinds (spec offer-v2 §2.4); stored lower-case.
  const rawEmail = isSite ? '' : text('email');
  if (rawEmail === null) return invalid('email');
  const email = rawEmail.toLowerCase();
  if (email.length > 254 || (email && !EMAIL.test(email))) return invalid('email');
  const via = isSite ? '' : text('preview_via');
  if (via === null || !['', 'sms', 'email'].includes(via)) return invalid('preview_via');
  if (via === 'email' && !email) return invalid('email');
  // A homepage preview with only an email is reachable; every other no-code case still needs a phone.
  const emailOnly = kind === 'preview_request' && !code && !phone && !!email && via === 'email';
  if ((!code && !phone && !emailOnly) || (phone && (!/^[0-9 +()\-]+$/.test(phone) || phone.replace(/\D/g, '').length < 8))) return invalid('phone');
  const lists: Record<string, string[]> = {};
  for (const field of isSite ? [] : ['services', 'area']) {
    const entries = data.getAll(field);
    if (entries.length > 12 || entries.some(value => typeof value !== 'string' || [...value.trim()].length > 60)) return invalid(field);
    lists[field] = [...new Set((entries as string[]).map(value => value.trim()).filter(Boolean))];
  }
  const photos = isSite ? '' : text('photos_ok');
  const consent = kind === 'job_request' ? text('consent') : '';
  if (kind === 'job_request' && consent !== 'yes') return invalid('consent');
  if (photos === null || !['', 'yes', 'send_other'].includes(photos)) return invalid('photos_ok');
  const time = text('contact_time');
  if (time === null || !['', 'morning', 'day', 'evening', 'sms'].includes(time)) return invalid('contact_time');
  const uploads = data.getAll('files').filter(value => value !== ''
    && !(typeof value !== 'string' && value.size === 0 && value.name === ''));
  if (uploads.some(value => typeof value === 'string')) return invalid('files');
  const files = uploads as File[];
  if (files.length > 8) return invalid('files');
  if (files.some(file => file.size > 10 * MB) || files.reduce((sum, file) => sum + file.size, 0) > 25 * MB) return error('too_large', 413);
  if (files.some(file => !FILE_TYPES.has(file.type))) return error('file_type', 415);

  // Site budgets and legacy funnel budgets are independent. All applicable claims
  // run in one D1 transaction so concurrent isolates cannot overspend the cap.
  const now = Date.now();
  const window = Math.floor(now / WINDOW_MS) * WINDOW_MS;
  const day = Math.floor(now / 86_400_000) * 86_400_000;
  const bucket = site ? `site-form:${site}` : `form:${code || 'homepage'}`;
  const limit = site || code ? 5 : 10;
  const fileBytes = files.reduce((sum, file) => sum + file.size, 0);
  const claims = await env.DB.batch(site ? [
    env.DB.prepare(`INSERT INTO rate_limits(code, window_start, requests) VALUES (?, ?, 1)
      ON CONFLICT(code, window_start) DO UPDATE SET requests = min(requests + 1, 6)
      RETURNING requests`).bind(bucket, window),
    env.DB.prepare(`INSERT INTO site_daily_budgets(site, day_start, submissions, file_writes)
      SELECT ?, ?, 1, ? WHERE (SELECT requests FROM rate_limits WHERE code = ? AND window_start = ?) <= 5
        AND COALESCE((SELECT submissions FROM site_daily_budgets WHERE site = ? AND day_start = ?), 0) < 30
        AND COALESCE((SELECT submissions FROM site_daily_budgets WHERE site = '*' AND day_start = ?), 0) < 100
        AND COALESCE((SELECT file_writes FROM site_daily_budgets WHERE site = '*' AND day_start = ?), 0) + ? <= 300
      ON CONFLICT(site, day_start) DO UPDATE SET submissions = submissions + 1, file_writes = file_writes + excluded.file_writes
      RETURNING submissions`).bind(site, day, files.length, bucket, window, site, day, day, day, files.length),
    // changes() refers to the immediately preceding gated site claim in this transaction.
    env.DB.prepare(`INSERT INTO site_daily_budgets(site, day_start, submissions, file_writes)
      SELECT '*', ?, 1, ? WHERE changes() > 0
      ON CONFLICT(site, day_start) DO UPDATE SET submissions = submissions + 1, file_writes = file_writes + excluded.file_writes`).bind(day, files.length),
  ] : [
    env.DB.prepare(`INSERT INTO rate_limits(code, window_start, requests) VALUES (?, ?, 1)
      ON CONFLICT(code, window_start) DO UPDATE SET requests = min(requests + 1, ?)
      RETURNING requests`).bind(bucket, window, limit + 1),
    env.DB.prepare(`INSERT INTO form_daily_budgets(day_start, submissions, file_bytes)
      SELECT ?, 1, ? WHERE (SELECT requests FROM rate_limits WHERE code = ? AND window_start = ?) <= ?
      ON CONFLICT(day_start) DO UPDATE SET submissions = submissions + 1, file_bytes = file_bytes + excluded.file_bytes
      WHERE submissions < 50 AND file_bytes + excluded.file_bytes <= ?
      RETURNING submissions`).bind(day, fileBytes, bucket, window, limit, 300 * MB),
  ]);
  if (claims[1]!.results.length === 0) {
    const minuteDenied = (claims[0]!.results[0] as { requests: number }).requests > limit;
    return json({ error: 'rate_limited' }, 429, {
      'Retry-After': String(Math.ceil(((minuteDenied ? window + WINDOW_MS : day + 86_400_000) - now) / 1000)),
    });
  }

  const id = crypto.randomUUID();
  const descriptors = files.map((file, n) => ({ key: `s/${id}/${n}`,
    name: [...file.name.replace(/[\p{Cc}/]/gu, '')].slice(0, 100).join('') || 'file',
    type: file.type, size: file.size }));
  const written: string[] = [];
  try {
    for (const [n, file] of files.entries()) {
      const { key, name, type, size } = descriptors[n]!;
      await env.FILES.put(key, file.stream(), {
        expirationTtl: 366 * 24 * 60 * 60, metadata: { name, type, size },
      });
      written.push(key);
    }
    const payload: Submission | SiteSubmission = isSite ? {
      name: values.name || null, phone: phone || null, message: values.message || null,
      service: values.service || null, location: values.location || null, brand: values.brand || null,
      contact_time: time || null, consent: consent === 'yes', files: descriptors,
    } : {
      name: values.name || null, phone: phone || null,
      email: email || null, preview_via: (via || null) as Submission['preview_via'],
      services: lists.services!, services_other: values.services_other || null,
      area: lists.area!, area_other: values.area_other || null,
      photos_ok: photos || null, standout: values.standout || null, contact_time: time || null, files: descriptors,
    };
    await env.DB.batch([
      env.DB.prepare('INSERT INTO events(code, site, type, ua_class) VALUES (?, ?, ?, ?)').bind(code || null, site, kind, uaClass(request)),
      env.DB.prepare(`INSERT INTO submissions(id, event_id, code, site, kind, at, ua_class, payload)
        SELECT ?, id, code, site, type, at, ua_class, ? FROM events WHERE id = last_insert_rowid()`)
        .bind(id, JSON.stringify(payload)),
    ]);
  } catch (cause) {
    // Only keys written by this failed submission; never delete existing files.
    await Promise.allSettled(written.map(key => env.FILES.delete(key)));
    throw cause;
  }
  scheduleCleanup(env, ctx);
  return json({ ok: true, id });
}

async function siteForm(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  let response: Response;
  const mode: { isSite?: boolean } = {};
  try { response = await form(request, env, ctx, mode); }
  catch { response = error('unavailable', 503); }
  const origin = request.headers.get('Origin');
  const config = sites(env);
  if (mode.isSite !== false && origin && config && Object.values(config).some(site => site.origins.includes(origin))
    && (mode.isSite === true || origin !== new URL(request.url).origin)) {
    if (!(request.headers.get('Accept') ?? '').includes('application/json')) {
      response = new Response(null, { status: 303, headers: {
        Location: `${origin}/aciu${response.ok ? '' : '?klaida=1'}`, 'Cache-Control': 'no-store',
        ...(response.headers.has('Retry-After') ? { 'Retry-After': response.headers.get('Retry-After')! } : {}),
      } });
    }
    return cors(response, origin);
  }
  return response;
}

async function file(request: Request, env: Env, key: string): Promise<Response> {
  if (!env.EVENTS_TOKEN) return error('unavailable', 503);
  if (!await authorized(request, env.EVENTS_TOKEN)) return json({ error: 'unauthorized' }, 401, { 'WWW-Authenticate': 'Bearer' });
  if (!/^s\/[0-9a-f-]{36}\/[0-7]$/.test(key)) return error('not_found', 404);
  const stored = await env.FILES.getWithMetadata<{ name: string; type: string; size: number }>(key, 'stream');
  if (stored.value === null || !stored.metadata) return error('not_found', 404);
  return new Response(stored.value, { headers: {
    'Content-Type': stored.metadata.type, 'Content-Disposition': 'attachment', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  } });
}

function normalizeISO(value: string | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return null;
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return null;
  // Date.parse rolls invalid dates (e.g. February 30); reject those explicitly.
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  const days = new Date(Date.UTC(year!, month!, 0)).getUTCDate();
  if (month! < 1 || month! > 12 || day! < 1 || day! > days) return null;
  return parsed.toISOString();
}

function encodeCursor(cursor: Cursor): string {
  return btoa(JSON.stringify(cursor)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeCursor(encoded: string, since: string): Cursor | null {
  if (encoded.length > 512 || !/^[A-Za-z0-9_-]+$/.test(encoded)) return null;
  try {
    const cursor = JSON.parse(atob(encoded.replace(/-/g, '+').replace(/_/g, '/'))) as Partial<Cursor>;
    if (cursor.v !== 1 || cursor.since !== since || typeof cursor.at !== 'string'
      || normalizeISO(cursor.at) !== cursor.at || cursor.at < since
      || typeof cursor.id !== 'string' || !/^[1-9]\d{0,18}$/.test(cursor.id)
      || typeof cursor.high !== 'string' || !/^[1-9]\d{0,18}$/.test(cursor.high)
      || BigInt(cursor.high) > 9223372036854775807n || BigInt(cursor.id) > BigInt(cursor.high)) return null;
    return cursor as Cursor;
  } catch {
    return null;
  }
}

async function authorized(request: Request, secret: string): Promise<boolean> {
  const header = request.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) return false;
  // Compare fixed-size digests without leaking the configured token length.
  const encode = new TextEncoder();
  const digests = await Promise.all([
    crypto.subtle.digest('SHA-256', encode.encode(header.slice(7))),
    crypto.subtle.digest('SHA-256', encode.encode(secret)),
  ]);
  const left = new Uint8Array(digests[0]!);
  const right = new Uint8Array(digests[1]!);
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left[i]! ^ right[i]!;
  return difference === 0;
}

async function events(request: Request, env: Env, url: URL): Promise<Response> {
  if (!env.EVENTS_TOKEN) return error('unavailable', 503);
  if (!await authorized(request, env.EVENTS_TOKEN)) return json({ error: 'unauthorized' }, 401, { 'WWW-Authenticate': 'Bearer' });
  const since = normalizeISO(url.searchParams.get('since'));
  const limitText = url.searchParams.get('limit') ?? '500';
  if (!since || !/^[1-9]\d{0,2}$/.test(limitText) || Number(limitText) > 500) return error('invalid_query', 400);
  const limit = Number(limitText);
  const encoded = url.searchParams.get('cursor');
  const cursor = encoded === null ? null : decodeCursor(encoded, since);
  if (encoded !== null && !cursor) return error('invalid_cursor', 400);
  const high = cursor?.high ?? await env.DB.prepare('SELECT CAST(COALESCE(MAX(id), 0) AS TEXT) AS id FROM events').first<string>('id');
  const afterAt = cursor?.at ?? since;
  const afterId = cursor?.id ?? '0';
  const result = await env.DB.prepare(`
    SELECT CAST(events.id AS TEXT) AS id, events.code, events.site, events.type, events.at, events.ua_class, submissions.payload
    FROM events LEFT JOIN submissions ON submissions.event_id = events.id
    WHERE events.at >= ? AND events.at >= ? AND events.id <= ? AND (events.at > ? OR (events.at = ? AND events.id > ?))
    ORDER BY events.at ASC, events.id ASC LIMIT ?
  `).bind(since, retentionCutoff(new Date(Date.now())), high ?? '0', afterAt, afterAt, afterId, limit + 1).all<Event & { payload: string | null }>();
  const hasMore = result.results.length > limit;
  const page = result.results.slice(0, limit).map(({ payload, ...event }) =>
    payload === null ? event : { ...event, submission: withEmailFields(event.type, JSON.parse(payload) as Submission) });
  const last = page.at(-1);
  return json({
    events: page,
    next_cursor: hasMore && last ? encodeCursor({ v: 1, since, at: last.at, id: last.id, high: high! }) : null,
    has_more: hasMore,
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/p/')) {
      if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, 405, { Allow: 'GET' });
      const code = url.pathname.slice(3);
      if (!validCode(code)) return redirect('/');
      try {
        const response = await click(request, env, ctx, code);
        scheduleCleanup(env, ctx);
        return response;
      } catch {
        return redirect(`${PREFIXES[code[0]!]!}?r=${code}`);
      }
    }
    if (!['/t/e', '/t/form', '/t/events'].includes(url.pathname) && !url.pathname.startsWith('/t/files/')) return error('not_found', 404);
    if (request.method === 'OPTIONS' && ['/t/e', '/t/form'].includes(url.pathname)) {
      const config = sites(env);
      if (!config) return error('unavailable', 503);
      const origin = request.headers.get('Origin');
      if (!origin || !Object.values(config).some(site => site.origins.includes(origin))) return error('origin', 403);
      if (request.headers.get('Access-Control-Request-Method') !== 'POST') return error('method_not_allowed', 405);
      const headers = (request.headers.get('Access-Control-Request-Headers') ?? '').split(',').map(h => h.trim().toLowerCase()).filter(Boolean);
      if (headers.some(h => !['accept', 'content-type'].includes(h))) return error('invalid', 400);
      return cors(new Response(null, { status: 204, headers: {
        'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Accept, Content-Type', 'Cache-Control': 'no-store',
      } }), origin);
    }
    const method = ['/t/e', '/t/form'].includes(url.pathname) ? 'POST' : 'GET';
    if (request.method !== method) return json({ error: 'method_not_allowed' }, 405, { Allow: method });
    try {
      const response = url.pathname === '/t/e' ? await beacon(request, env)
        : url.pathname === '/t/form' ? await siteForm(request, env, ctx)
        : url.pathname.startsWith('/t/files/') ? await file(request, env, url.pathname.slice(9))
        : await events(request, env, url);
      // Invalid events/unauthenticated requests do not trigger database work.
      if (response.ok && url.pathname !== '/t/form') scheduleCleanup(env, ctx);
      return response;
    } catch {
      return error('unavailable', 503);
    }
  },
} satisfies ExportedHandler<Env>;
