interface Env {
  DB: D1Database;
  EVENTS_TOKEN?: string;
}

type BeaconType = 'view' | 'scroll_proof' | 'cta_sms' | 'cta_call' | 'pdf' | 'arbcut';
interface Event {
  id: string;
  code: string;
  type: BeaconType | 'click';
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

const PREFIXES: Readonly<Record<string, string>> = { a: '/arboristams' };
const CODE = /^[23456789abcdefghjkmnpqrstuvwxyz]{5}$/;
const TYPES: readonly string[] = ['view', 'scroll_proof', 'cta_sms', 'cta_call', 'pdf', 'arbcut'];
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
async function readBeacon(request: Request): Promise<unknown> {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY) {
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
  return JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes));
}

async function beacon(request: Request, env: Env): Promise<Response> {
  const mediaType = (request.headers.get('Content-Type') ?? '').split(';')[0]!.trim().toLowerCase();
  if (!['', 'application/json', 'text/plain'].includes(mediaType)) return error('unsupported_media_type', 415);
  let payload: unknown;
  try {
    payload = await readBeacon(request);
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
    SELECT CAST(id AS TEXT) AS id, code, type, at, ua_class FROM events
    WHERE at >= ? AND at >= ? AND id <= ? AND (at > ? OR (at = ? AND id > ?))
    ORDER BY events.at ASC, events.id ASC LIMIT ?
  `).bind(since, retentionCutoff(new Date(Date.now())), high ?? '0', afterAt, afterAt, afterId, limit + 1).all<Event>();
  const hasMore = result.results.length > limit;
  const page = result.results.slice(0, limit);
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
    if (url.pathname !== '/t/e' && url.pathname !== '/t/events') return error('not_found', 404);
    const method = url.pathname === '/t/e' ? 'POST' : 'GET';
    if (request.method !== method) return json({ error: 'method_not_allowed' }, 405, { Allow: method });
    try {
      const response = url.pathname === '/t/e' ? await beacon(request, env) : await events(request, env, url);
      // Invalid events/unauthenticated requests do not trigger database work.
      if (response.ok) scheduleCleanup(env, ctx);
      return response;
    } catch {
      return error('unavailable', 503);
    }
  },
} satisfies ExportedHandler<Env>;
