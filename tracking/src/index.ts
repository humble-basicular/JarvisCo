interface Env {
  DB: D1Database;
  FILES: KVNamespace;
  EVENTS_TOKEN?: string;
}

type BeaconType = 'view' | 'scroll_proof' | 'cta_sms' | 'cta_call' | 'pdf' | 'arbcut' | 'preview_cta';
interface Event {
  id: string;
  code: string | null;
  type: BeaconType | 'click' | 'preview_request' | 'callback_request';
  submission?: Submission;
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
  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(await readBody(request, MAX_BODY)));
  } catch (cause) {
    return error(cause instanceof BodyTooLarge ? 'body_too_large' : 'invalid_json', cause instanceof BodyTooLarge ? 413 : 400);
  }
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return error('invalid_event', 400);
  const { code, type } = payload as Record<string, unknown>;
  if (!validCode(code) || typeof type !== 'string' || !TYPES.includes(type)) return error('invalid_event', 400);

  const now = Date.now();
  const window = Math.floor(now / WINDOW_MS) * WINDOW_MS;
  // D1 batch is a transaction: budget claim and gated event insert cannot race.
  const results = await env.DB.batch([
    env.DB.prepare(`INSERT INTO rate_limits(code, window_start, requests) VALUES (?, ?, 1)
      ON CONFLICT(code, window_start) DO UPDATE SET requests = min(requests + 1, ?)
    `).bind(code, window, RATE_LIMIT + 1),
    env.DB.prepare(`INSERT INTO events(code, type, ua_class)
      SELECT ?, ?, ? WHERE (SELECT requests FROM rate_limits WHERE code = ? AND window_start = ?) <= ?
    `).bind(code, type, uaClass(request), code, window, RATE_LIMIT),
  ]);
  if (results[1]!.meta.changes === 0) {
    return json({ error: 'rate_limited' }, 429, { 'Retry-After': String(Math.ceil((window + WINDOW_MS - now) / 1000)) });
  }
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}

interface StoredFile { key: string; name: string; type: string; size: number }
interface Submission {
  name: string | null;
  phone: string | null;
  services: string[];
  services_other: string | null;
  area: string[];
  area_other: string | null;
  photos_ok: string | null;
  standout: string | null;
  contact_time: string | null;
  files: StoredFile[];
}
const MB = 1024 * 1024;
// Bound the stream before parsing multipart; allow bounded multipart overhead.
const MAX_FORM_BODY = 25 * MB + 64 * 1024;
const FILE_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain',
]);

async function form(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const invalid = (field: string) => json({ error: 'invalid', field }, 400);
  if ((request.headers.get('Content-Type') ?? '').split(';')[0]!.trim().toLowerCase() !== 'multipart/form-data') return invalid('kind');
  const length = Number(request.headers.get('Content-Length'));
  if (length > MAX_FORM_BODY) return error('too_large', 413);
  let data: FormData;
  try {
    const bytes = await readBody(request, MAX_FORM_BODY);
    data = await new Response(bytes, { headers: { 'Content-Type': request.headers.get('Content-Type')! } }).formData();
  } catch (cause) {
    return cause instanceof BodyTooLarge ? error('too_large', 413) : invalid('kind');
  }
  // A populated trap is a successful no-op, before validation/storage/limiting.
  if (data.getAll('website').some(value => typeof value !== 'string' || value.trim() !== '')) return json({ ok: true });
  const text = (field: string): string | null => {
    const values = data.getAll(field);
    if (values.length > 1 || values.some(value => typeof value !== 'string')) return null;
    return typeof values[0] === 'string' ? values[0].trim() : '';
  };
  const kind = text('kind');
  if (kind !== 'preview_request' && kind !== 'callback_request') return invalid('kind');
  const code = text('code');
  if (code === null || (code !== '' && !validCode(code))) return invalid('code');
  const values: Record<string, string> = {};
  for (const [field, max] of Object.entries({ name: 80, phone: 20, services_other: 200, area_other: 200, standout: 1000 })) {
    const value = text(field);
    if (value === null || [...value].length > max) return invalid(field);
    values[field] = value;
  }
  const phone = values.phone!;
  if ((!code && !phone) || (phone && (!/^[0-9 +()\-]+$/.test(phone) || phone.replace(/\D/g, '').length < 8))) return invalid('phone');
  const lists: Record<string, string[]> = {};
  for (const field of ['services', 'area']) {
    const entries = data.getAll(field);
    if (entries.length > 12 || entries.some(value => typeof value !== 'string' || [...value.trim()].length > 60)) return invalid(field);
    lists[field] = (entries as string[]).map(value => value.trim());
  }
  const photos = text('photos_ok');
  if (photos === null || !['', 'yes', 'send_other'].includes(photos)) return invalid('photos_ok');
  const time = text('contact_time');
  if (time === null || !['', 'morning', 'day', 'evening', 'sms'].includes(time)) return invalid('contact_time');
  const uploads = data.getAll('files');
  if (uploads.some(value => typeof value === 'string')) return invalid('files');
  const files = uploads as File[];
  if (files.length > 8) return invalid('files');
  if (files.some(file => file.size > 10 * MB) || files.reduce((sum, file) => sum + file.size, 0) > 25 * MB) return error('too_large', 413);
  if (files.some(file => !FILE_TYPES.has(file.type))) return error('file_type', 415);

  // Forms share the beacon's per-code budget. Homepage forms share a single
  // anonymous bucket: never derive/store an IP, UA, cookie or phone identity.
  const now = Date.now();
  const window = Math.floor(now / WINDOW_MS) * WINDOW_MS;
  const bucket = code || 'homepage';
  const claim = await env.DB.prepare(`INSERT INTO rate_limits(code, window_start, requests) VALUES (?, ?, 1)
    ON CONFLICT(code, window_start) DO UPDATE SET requests = min(requests + 1, ?)
    RETURNING requests`).bind(bucket, window, RATE_LIMIT + 1).first<number>('requests');
  if (claim === null || claim > RATE_LIMIT) return json({ error: 'rate_limited' }, 429,
    { 'Retry-After': String(Math.ceil((window + WINDOW_MS - now) / 1000)) });

  const id = crypto.randomUUID();
  const descriptors = files.map((file, n) => ({ key: `s/${id}/${n}`, name: file.name, type: file.type, size: file.size }));
  // Publish the D1 feed entry only once all KV writes succeed. Failed writes
  // can leave unreferenced keys, which expire automatically; no file deletion.
  for (const [n, file] of files.entries()) {
    await env.FILES.put(descriptors[n]!.key, await file.arrayBuffer(), {
      expirationTtl: 365 * 24 * 60 * 60, metadata: { name: file.name, type: file.type, size: file.size },
    });
  }
  const payload: Submission = {
    name: values.name || null, phone: phone || null,
    services: lists.services!, services_other: values.services_other || null,
    area: lists.area!, area_other: values.area_other || null,
    photos_ok: photos || null, standout: values.standout || null, contact_time: time || null, files: descriptors,
  };
  await env.DB.batch([
    env.DB.prepare('INSERT INTO events(code, type, ua_class) VALUES (?, ?, ?)').bind(code || null, kind, uaClass(request)),
    env.DB.prepare(`INSERT INTO submissions(id, event_id, code, kind, at, ua_class, payload)
      SELECT ?, id, code, type, at, ua_class, ? FROM events WHERE id = last_insert_rowid()`)
      .bind(id, JSON.stringify(payload)),
  ]);
  scheduleCleanup(env, ctx);
  return json({ ok: true, id });
}

async function file(request: Request, env: Env, key: string): Promise<Response> {
  if (!env.EVENTS_TOKEN) return error('unavailable', 503);
  if (!await authorized(request, env.EVENTS_TOKEN)) return json({ error: 'unauthorized' }, 401, { 'WWW-Authenticate': 'Bearer' });
  if (!/^s\/[0-9a-f-]{36}\/[0-7]$/.test(key)) return error('not_found', 404);
  const stored = await env.FILES.getWithMetadata<{ name: string; type: string; size: number }>(key, 'arrayBuffer');
  if (stored.value === null || !stored.metadata) return error('not_found', 404);
  return new Response(stored.value, { headers: {
    'Content-Type': stored.metadata.type, 'Content-Disposition': 'attachment', 'Cache-Control': 'no-store',
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
    SELECT CAST(events.id AS TEXT) AS id, events.code, events.type, events.at, events.ua_class, submissions.payload
    FROM events LEFT JOIN submissions ON submissions.event_id = events.id
    WHERE events.at >= ? AND events.at >= ? AND events.id <= ? AND (events.at > ? OR (events.at = ? AND events.id > ?))
    ORDER BY events.at ASC, events.id ASC LIMIT ?
  `).bind(since, retentionCutoff(new Date(Date.now())), high ?? '0', afterAt, afterAt, afterId, limit + 1).all<Event & { payload: string | null }>();
  const hasMore = result.results.length > limit;
  const page = result.results.slice(0, limit).map(({ payload, ...event }) =>
    payload === null ? event : { ...event, submission: JSON.parse(payload) as Submission });
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
    const method = ['/t/e', '/t/form'].includes(url.pathname) ? 'POST' : 'GET';
    if (request.method !== method) return json({ error: 'method_not_allowed' }, 405, { Allow: method });
    try {
      const response = url.pathname === '/t/e' ? await beacon(request, env)
        : url.pathname === '/t/form' ? await form(request, env, ctx)
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
