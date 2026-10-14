import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import worker, { retentionCutoff } from '../dist/worker.mjs';

const TOKEN = 'local-test-only-token';
const SINCE = '2025-01-01T00:00:00.000Z';
const productionScript = await readFile(new URL('../dist/worker.mjs', import.meta.url), 'utf8');
// Deterministically drain waitUntil tasks for SQL assertions; redirect latency has
// a separate direct-handler test that does not drain background tasks.
const script = productionScript.replace('index_default as default', 'test_default as default') + `
const test_default = {
  async fetch(request, env, ctx) {
    const pending = [];
    const response = await index_default.fetch(request, env, {
      waitUntil(task) { pending.push(task); ctx.waitUntil(task); }
    });
    await Promise.all(pending);
    return response;
  }
};
`;
const migration = (await Promise.all(['0001_events.sql', '0002_submissions.sql', '0003_form_budgets.sql'].map(name => readFile(new URL(`../migrations/${name}`, import.meta.url), 'utf8')))).join('\n');
const fixedNow = Date.now();
let mf;
let db;

async function createRuntime({ schema = true, token = TOKEN } = {}) {
  const runtime = new Miniflare(convertV4MiniflareOptions({
    modules: true,
    // Freeze the fixed-window limiter's clock so tests cannot race a minute boundary.
    script: `Date.now = () => ${fixedNow};\n${script}`,
    compatibilityDate: '2026-10-01',
    d1Databases: { DB: 'local-test-database' },
    kvNamespaces: { FILES: 'local-test-files' },
    bindings: token === null ? {} : { EVENTS_TOKEN: token },
  }));
  const database = await runtime.getD1Database('DB');
  if (schema) {
    // D1 exec is line-oriented; execute complete migration statements in a batch.
    const statements = migration.split(';').map((sql) => sql.trim()).filter(Boolean);
    await database.batch(statements.map((sql) => database.prepare(sql)));
  }
  return { runtime, database };
}

beforeEach(async () => {
  ({ runtime: mf, database: db } = await createRuntime());
});
afterEach(async () => { await mf?.dispose(); });

async function request(path, init = {}, host = 'jarvisweb.lt') {
  if (init.body instanceof FormData) {
    const encoded = new Request(`https://${host}${path}`, init);
    init = { ...init, headers: Object.fromEntries(encoded.headers), body: new Uint8Array(await encoded.arrayBuffer()) };
  }
  const response = await mf.dispatchFetch(`https://${host}${path}`, { redirect: 'manual', ...init });
  return response;
}
function post(code = 'a2345', type = 'view', contentType = 'application/json', extras = {}) {
  return request('/t/e', {
    method: 'POST', headers: { 'Content-Type': contentType, ...extras }, body: JSON.stringify({ code, type }),
  });
}
async function pull(params = {}, auth = `Bearer ${TOKEN}`) {
  const query = new URLSearchParams({ since: SINCE, ...params });
  return request(`/t/events?${query}`, { headers: auth === null ? {} : { Authorization: auth } });
}
async function seed(at, count = 1, code = 'a2345') {
  const query = db.prepare('INSERT INTO events(code,type,at,ua_class) VALUES (?, ?, ?, ?)');
  await db.batch(Array.from({ length: count }, () => query.bind(code, 'view', at, 'human')));
}

// Execute all endpoint tests in a real workerd isolate, using its actual D1 SQL engine.
test('apex and www valid links redirect uncached and record human clicks', async () => {
  for (const host of ['jarvisweb.lt', 'www.jarvisweb.lt']) {
    const response = await request('/p/a2345?ignored=x', { headers: { 'User-Agent': 'Mozilla/5.0 Android' } }, host);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('Location'), '/rezultatai?r=a2345');
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
  }
  const rows = (await db.prepare('SELECT * FROM events ORDER BY id').all()).results;
  assert.equal(rows.length, 2);
  for (const row of rows) {
    assert.equal(row.code, 'a2345');
    assert.equal(row.type, 'click');
    assert.equal(row.ua_class, 'human');
    assert.match(row.at, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);
    assert.deepEqual(Object.keys(row).sort(), ['at', 'code', 'id', 'type', 'ua_class']);
  }
});

test('invalid alphabet/length/case/encoded path and unknown prefix go home without writes', async () => {
  for (const code of ['', 'a234', 'a23456', 'a23o5', 'a2315', 'a23l5', 'a23i5', 'A2345', 'b2345', 'a2345/', '%612345', 'a2345%2Fbad']) {
    const response = await request(`/p/${code}`);
    assert.equal(response.status, 302, code);
    assert.equal(response.headers.get('Location'), '/', code);
  }
  assert.equal(await db.prepare('SELECT count(*) AS n FROM events').first('n'), 0);
});

test('all specified scanners and generic bot patterns are classified, never storing UA/IP', async () => {
  const bots = ['facebookexternalhit/1.1', 'WhatsApp/2.0', 'TelegramBot', 'Slackbot-LinkExpanding', 'Twitterbot/1.0',
    'SkypeUriPreview', 'Googlebot', 'bingbot', 'Google-PageRenderer', 'customBoT', 'customCrawler', 'spider', 'PREVIEW'];
  for (const ua of bots) {
    assert.equal((await request('/p/a2345', { headers: { 'User-Agent': ua, 'CF-Connecting-IP': '192.0.2.1' } })).status, 302);
  }
  await post('a2345', 'view', 'application/json', { 'User-Agent': 'WhatsApp/2.0' });
  const rows = (await db.prepare('SELECT * FROM events').all()).results;
  assert.equal(rows.length, bots.length + 1);
  assert.ok(rows.every((row) => row.ua_class === 'bot'));
  const columns = (await db.prepare('PRAGMA table_info(events)').all()).results.map((row) => row.name);
  assert.deepEqual(columns, ['id', 'code', 'type', 'at', 'ua_class']);
});

test('all seven types work with sendBeacon JSON Blob and plain-text string bodies', async () => {
  const types = ['view', 'scroll_proof', 'cta_sms', 'cta_call', 'pdf', 'arbcut', 'preview_cta'];
  for (const type of types) {
    const response = await post('a2345', type, 'text/plain;charset=UTF-8');
    assert.equal(response.status, 204);
    assert.equal(await response.text(), '');
  }
  assert.equal((await post('a2345', 'view', 'application/json;charset=utf-8')).status, 204);
  assert.equal((await request('/t/e', { method: 'POST', body: new Blob([JSON.stringify({ code: 'a2345', type: 'pdf' })], { type: 'application/json' }) })).status, 204);
  // No content type (byte-array body), also compatible with native beacon transports.
  assert.equal((await request('/t/e', { method: 'POST', body: new TextEncoder().encode('{"code":"a2345","type":"view"}') })).status, 204);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM events').first('n'), 10);
});

test('invalid event JSON/code/type and oversized bodies have no event or rate-limit writes', async () => {
  for (const value of [null, [], 'text', 1, {}, { code: 'b2345', type: 'view' }, { code: 'a23o5', type: 'view' },
    { code: 'a2345', type: 'click' }, { code: 'a2345', type: 'VIEW' }, { code: 'a2345', type: 'not-real' }, { code: 12345, type: 'view' }]) {
    const response = await request('/t/e', { method: 'POST', body: JSON.stringify(value) });
    assert.equal(response.status, 400, JSON.stringify(value));
  }
  assert.equal((await request('/t/e', { method: 'POST', body: '{bad' })).status, 400);
  assert.equal((await post('a2345', 'view', 'application/x-www-form-urlencoded')).status, 415);
  assert.equal((await request('/t/e', { method: 'POST', body: ' '.repeat(1025) })).status, 413);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM events').first('n'), 0);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM rate_limits').first('n'), 0);
});

test('shared per-code fixed window is atomic across 80 simultaneous calls and two isolates', async () => {
  // Two Worker isolates in one Miniflare use the same D1 identity.
  await mf.dispose();
  mf = new Miniflare(convertV4MiniflareOptions({ workers: ['first', 'second', 'next-minute'].map((name) => ({
    name, modules: true, script: `Date.now = () => ${fixedNow + (name === 'next-minute' ? 60_000 : 0)};\n${script}`,
    compatibilityDate: '2026-10-01', d1Databases: { DB: 'shared-database' }, bindings: { EVENTS_TOKEN: TOKEN },
  })) }));
  db = await mf.getD1Database('DB', 'first');
  await db.batch(migration.split(';').map((s) => s.trim()).filter(Boolean).map((s) => db.prepare(s)));
  const first = await mf.getWorker('first');
  const second = await mf.getWorker('second');
  const results = await Promise.all(Array.from({ length: 80 }, (_, index) => (index % 2 ? first : second).fetch('https://jarvisweb.lt/t/e', {
    method: 'POST', body: JSON.stringify({ code: 'a2345', type: 'view' }),
  })));
  assert.equal(results.filter((r) => r.status === 204).length, 60);
  assert.equal(results.filter((r) => r.status === 429).length, 20);
  for (const response of results.filter((r) => r.status === 429)) {
    assert.ok(Number(response.headers.get('Retry-After')) >= 1);
    assert.ok(Number(response.headers.get('Retry-After')) <= 60);
  }
  assert.equal(await db.prepare('SELECT count(*) AS n FROM events').first('n'), 60);
  assert.equal((await first.fetch('https://jarvisweb.lt/t/e', { method: 'POST', body: '{"code":"a2346","type":"view"}' })).status, 204);
  const nextMinute = await mf.getWorker('next-minute');
  assert.equal((await nextMinute.fetch('https://jarvisweb.lt/t/e', { method: 'POST', body: '{"code":"a2345","type":"view"}' })).status, 204);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM rate_limits WHERE code = ?').bind('a2345').first('n'), 2);
});

test('pull auth denies absent/wrong/malformed tokens without leaking secrets', async () => {
  for (const token of [null, '', 'Bearer wrong', `bearer ${TOKEN}`, TOKEN, `Bearer ${TOKEN}extra`]) {
    const response = await pull({}, token);
    assert.equal(response.status, 401, String(token));
    assert.equal(response.headers.get('WWW-Authenticate'), 'Bearer');
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal((await response.text()).includes(TOKEN), false);
  }
  assert.equal((await pull()).status, 200);
});

test('missing secret fails closed even with valid database', async () => {
  const { runtime } = await createRuntime({ token: null });
  try {
    const response = await runtime.dispatchFetch(`https://jarvisweb.lt/t/events?since=${SINCE}`);
    assert.equal(response.status, 503);
  } finally { await runtime.dispose(); }
});

test('pull validates since, limit and cursor; ISO offsets normalize consistently', async () => {
  assert.equal((await request('/t/events', { headers: { Authorization: `Bearer ${TOKEN}` } })).status, 400);
  for (const since of ['bad', '2026-10-11', '2026-10-11T13:00:00', '2026-02-30T00:00:00Z', '2026-13-01T00:00:00Z']) {
    assert.equal((await pull({ since })).status, 400, since);
  }
  for (const limit of ['0', '-1', '501', '1.5', '1e2', '01', '', '5000']) {
    assert.equal((await pull({ limit })).status, 400, limit);
  }
  for (const cursor of ['', 'bad', '*', 'a'.repeat(513), Buffer.from('{}').toString('base64url')]) {
    assert.equal((await pull({ cursor })).status, 400, cursor);
  }
  assert.equal((await pull({ since: '2026-10-11T16:00:00+03:00', limit: '1' })).status, 200);
});

test('500+ equal timestamps page without gaps/duplicates; boundary replay is safely deduplicated', async () => {
  const at = new Date(fixedNow - 60_000).toISOString();
  await seed(at, 503);
  const params = { since: at, limit: '500' };
  const first = await (await pull(params)).json();
  assert.equal(first.events.length, 500);
  assert.equal(first.has_more, true);
  assert.ok(first.next_cursor);
  const repeated = await (await pull(params)).json();
  assert.deepEqual(repeated, first);
  const second = await (await pull({ ...params, cursor: first.next_cursor })).json();
  assert.equal(second.events.length, 3);
  assert.equal(second.has_more, false);
  assert.equal(second.next_cursor, null);
  const ids = [...first.events, ...second.events].map((e) => e.id);
  assert.equal(new Set(ids).size, 503);
  assert.ok(ids.every((id, index) => id === String(index + 1)));
  assert.ok(first.events.every((e) => e.at === at));
  assert.equal((await pull({ ...params, since: SINCE, cursor: first.next_cursor })).status, 400);
  const boundary = await (await pull({ since: at })).json();
  assert.equal(boundary.events[0].id, '1');
});

test('IDs above JavaScript safe-integer range stay exact through paged pull', async () => {
  const at = new Date(fixedNow - 60_000).toISOString();
  for (const id of ['9007199254740993', '9007199254740994']) {
    await db.prepare('INSERT INTO events(id,code,type,at,ua_class) VALUES (?, ?, ?, ?, ?)')
      .bind(id, 'a2345', 'view', at, 'human').run();
  }
  const first = await (await pull({ since: at, limit: '1' })).json();
  assert.equal(first.events[0].id, '9007199254740993');
  const second = await (await pull({ since: at, limit: '1', cursor: first.next_cursor })).json();
  assert.equal(second.events[0].id, '9007199254740994');
  assert.equal(second.has_more, false);
});

test('snapshot cursor excludes concurrent arrivals; next inclusive poll recovers same-time new IDs', async () => {
  const at = new Date(fixedNow - 30_000).toISOString();
  await seed(at, 3);
  const first = await (await pull({ since: at, limit: '2' })).json();
  await seed(at, 1); // New ID at the same time as prior events.
  const second = await (await pull({ since: at, limit: '2', cursor: first.next_cursor })).json();
  assert.deepEqual(second.events.map((e) => e.id), ['3']);
  assert.equal(second.has_more, false);
  const next = await (await pull({ since: at })).json();
  assert.deepEqual(next.events.map((e) => e.id), ['1', '2', '3', '4']);
});

test('events are oldest first by timestamp then numeric ID, even inserted out of order', async () => {
  const newer = new Date(fixedNow - 1000).toISOString();
  const older = new Date(fixedNow - 2000).toISOString();
  await seed(newer);
  await seed(older, 11);
  const response = await (await pull({ since: older, limit: '20' })).json();
  assert.deepEqual(response.events.map((e) => e.id), [...Array.from({ length: 11 }, (_, i) => String(i + 2)), '1']);
  assert.deepEqual(Object.keys(response.events[0]).sort(), ['at', 'code', 'id', 'type', 'ua_class']);
});

test('request-time cleanup removes expired events and buckets, keeping unexpired data', async () => {
  const old = new Date(fixedNow);
  old.setUTCFullYear(old.getUTCFullYear() - 2);
  await seed(old.toISOString());
  await seed(new Date(fixedNow - 1000).toISOString());
  await db.prepare('INSERT INTO rate_limits(code,window_start,requests) VALUES (?, ?, ?)').bind('a2345', fixedNow - 120_000, 1).run();
  const response = await (await pull()).json();
  assert.equal(response.events.length, 1);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM events').first('n'), 1);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM rate_limits').first('n'), 0);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM maintenance').first('n'), 1);
});

test('pull excludes expired events even when cleanup lease is held by another isolate', async () => {
  await db.prepare("INSERT INTO maintenance(key,next_at) VALUES ('retention', ?)").bind(fixedNow + 3_600_000).run();
  const old = new Date(fixedNow);
  old.setUTCFullYear(old.getUTCFullYear() - 2);
  await seed(old.toISOString());
  await seed(new Date(fixedNow - 1000).toISOString());
  assert.equal((await (await pull()).json()).events.length, 1);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM events').first('n'), 2);
  assert.equal(retentionCutoff(new Date('2024-02-29T12:34:56.789Z')), '2023-02-28T12:34:56.789Z');
  assert.equal(retentionCutoff(new Date('2026-10-11T12:34:56.789Z')), '2025-10-11T12:34:56.789Z');
});

test('twelve-month boundary is inclusive; data one millisecond older is deleted', async () => {
  const cutoff = retentionCutoff(new Date(fixedNow));
  await seed(new Date(new Date(cutoff).getTime() - 1).toISOString());
  await seed(cutoff);
  await seed(new Date(new Date(cutoff).getTime() + 1).toISOString());
  const result = await (await pull()).json();
  assert.deepEqual(result.events.map((e) => e.id), ['2', '3']);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM events').first('n'), 2);
});

test('D1 failure still redirects valid links; beacon and authenticated pull fail safely', async () => {
  const { runtime } = await createRuntime({ schema: false });
  try {
    const redirect = await runtime.dispatchFetch('https://jarvisweb.lt/p/a2345', { redirect: 'manual' });
    assert.equal(redirect.status, 302);
    assert.equal(redirect.headers.get('Location'), '/rezultatai?r=a2345');
    const beacon = await runtime.dispatchFetch('https://jarvisweb.lt/t/e', { method: 'POST', body: '{"code":"a2345","type":"view"}' });
    assert.equal(beacon.status, 503);
    const pull = await runtime.dispatchFetch(`https://jarvisweb.lt/t/events?since=${SINCE}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
    assert.equal(pull.status, 503);
  } finally { await runtime.dispose(); }
});

test('slow or synchronously broken storage cannot block the public redirect', async () => {
  for (const database of [
    { prepare() { throw new Error('offline'); } },
    { prepare() { return { bind() { return { run() { return new Promise(() => {}); } }; } }; } },
  ]) {
    const ctx = { waitUntil() {} };
    const response = await Promise.race([
      worker.fetch(new Request('https://jarvisweb.lt/p/a2345'), { DB: database }, ctx),
      new Promise((_, reject) => { const timer = setTimeout(() => reject(new Error('redirect blocked')), 1000); timer.unref(); }),
    ]);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('Location'), '/rezultatai?r=a2345');
  }
});

test('methods/unknown routes fail clearly; D1 enforces event constraints and transaction rollback', async () => {
  for (const [path, method, expected, allow] of [['/p/a2345', 'POST', 405, 'GET'], ['/t/e', 'GET', 405, 'POST'], ['/t/events', 'POST', 405, 'GET'], ['/t/form', 'GET', 405, 'POST'], ['/t/files/missing', 'POST', 405, 'GET'], ['/t/other', 'GET', 404, null]]) {
    const response = await request(path, { method });
    assert.equal(response.status, expected);
    assert.equal(response.headers.get('Allow'), allow);
  }
  await assert.rejects(db.prepare("INSERT INTO events(code,type,ua_class) VALUES ('a23o5','view','human')").run(), /CHECK/);
  await assert.rejects(db.prepare("INSERT INTO events(code,type,ua_class) VALUES ('a2345','made_up','human')").run(), /CHECK/);
  await assert.rejects(db.batch([
    db.prepare("INSERT INTO rate_limits(code,window_start,requests) VALUES ('a2345',0,1)"),
    db.prepare("INSERT INTO events(code,type,ua_class) VALUES ('a2345','view','invalid')"),
  ]), /CHECK/);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM rate_limits').first('n'), 0);
});

function formBody(fields = { kind: 'preview_request', code: 'p2345' }, files = []) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    for (const entry of Array.isArray(value) ? value : [value]) data.append(key, entry);
  }
  for (const file of files) data.append('files', new Blob([file.body ?? 'contents'], { type: file.type ?? 'image/png' }), file.name ?? 'photo.png');
  return data;
}
function submit(fields, files) {
  return request('/t/form', { method: 'POST', body: formBody(fields, files), headers: { 'User-Agent': 'Mozilla/5.0', 'CF-Connecting-IP': '192.0.2.1', Cookie: 'private=secret' } });
}

test('new p prefix redirects both hosts while a stays unchanged', async () => {
  for (const host of ['jarvisweb.lt', 'www.jarvisweb.lt']) {
    const response = await request('/p/p2345', {}, host);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('Location'), '/noriu?r=p2345');
  }
  assert.equal((await post('p2345', 'preview_cta')).status, 204);
  assert.deepEqual((await (await pull()).json()).events.map(e => e.type), ['click', 'click', 'preview_cta']);
});

test('multipart happy path trims answers, stores two files with metadata and exposes exact submission shape', async () => {
  const response = await submit({
    kind: ' preview_request ', code: ' p2345 ', name: ' Tomas ', services: [' Katilai ', ' Siurbliai '],
    services_other: ' ', area: [' Kaunas '], area_other: ' rajonas ', photos_ok: 'yes',
    standout: ' 15 metų ', contact_time: 'evening', unknown: 'ignored',
  }, [{ name: 'logo.png', type: 'image/png', body: 'PNG bytes' }, { name: 'info.pdf', type: 'application/pdf', body: 'PDF bytes' }]);
  assert.equal(response.status, 200);
  const receipt = await response.json();
  assert.equal(receipt.ok, true);
  assert.equal(response.headers.get('X-Submission-Stored'), null);
  const row = await db.prepare('SELECT * FROM submissions').first();
  assert.equal(row.id, receipt.id);
  assert.equal(row.kind, 'preview_request');
  assert.deepEqual(Object.keys(row).sort(), ['at', 'code', 'event_id', 'id', 'kind', 'payload', 'ua_class']);
  const feed = await (await pull()).json();
  const entry = feed.events[0];
  assert.equal(entry.id, String(row.event_id));
  assert.equal(entry.code, 'p2345');
  assert.equal(entry.type, 'preview_request');
  assert.equal(entry.ua_class, 'human');
  assert.deepEqual(entry.submission, {
    name: 'Tomas', phone: null, services: ['Katilai', 'Siurbliai'], services_other: null,
    area: ['Kaunas'], area_other: 'rajonas', photos_ok: 'yes', standout: '15 metų', contact_time: 'evening',
    files: [{ key: `s/${receipt.id}/0`, name: 'logo.png', type: 'image/png', size: 9 },
      { key: `s/${receipt.id}/1`, name: 'info.pdf', type: 'application/pdf', size: 9 }],
  });
  const kv = await mf.getKVNamespace('FILES');
  for (const descriptor of entry.submission.files) {
    const stored = await kv.getWithMetadata(descriptor.key, 'text');
    assert.deepEqual(stored.metadata, { name: descriptor.name, type: descriptor.type, size: descriptor.size });
    assert.equal(stored.value, descriptor.type === 'image/png' ? 'PNG bytes' : 'PDF bytes');
  }
  const keys = await kv.list();
  for (const key of keys.keys) assert.ok(Math.abs(key.expiration - (Math.floor(Date.now() / 1000) + 366 * 86400)) < 60);
});

test('homepage callback requires phone; empty fields become null and lists remain empty', async () => {
  const response = await submit({ kind: 'callback_request', phone: ' +370 (612) 34567 ' });
  assert.equal(response.status, 200);
  const entry = (await (await pull()).json()).events[0];
  assert.equal(entry.code, null);
  assert.equal(entry.type, 'callback_request');
  assert.deepEqual(entry.submission, { name: null, phone: '+370 (612) 34567', services: [], services_other: null,
    area: [], area_other: null, photos_ok: null, standout: null, contact_time: null, files: [] });
  assert.equal((await submit({ kind: 'callback_request', code: 'a2345' })).status, 200);
});

const invalidForms = [
  ['kind', {}], ['kind', { kind: 'other' }], ['code', { code: 'b2345' }], ['code', { code: 'p23o5' }],
  ['phone', { code: '' }], ['phone', { phone: '1234567' }], ['phone', { phone: '12345678x' }],
  ['phone', { phone: '1'.repeat(21) }], ['name', { name: 'x'.repeat(81) }],
  ['services', { services: ['x'.repeat(61)] }], ['services', { services: Array.from({ length: 13 }, (_, n) => String(n)) }],
  ['services_other', { services_other: 'x'.repeat(201) }],
  ['area', { area: ['x'.repeat(61)] }], ['area', { area: Array.from({ length: 13 }, (_, n) => String(n)) }],
  ['area_other', { area_other: 'x'.repeat(201) }], ['photos_ok', { photos_ok: 'no' }],
  ['standout', { standout: 'x'.repeat(1001) }], ['contact_time', { contact_time: 'night' }],
  ...['kind', 'code', 'name', 'phone', 'services_other', 'area_other', 'photos_ok', 'standout', 'contact_time'].map(field => [field, { [field]: ['x', 'y'] }]),
  ['files', { files: 'not a file' }],
];
for (const [field, patch] of invalidForms) {
  test(`form validation rejects ${field}: ${JSON.stringify(patch).slice(0, 90)}`, async () => {
    const fields = field === 'kind' && Object.keys(patch).length === 0 ? patch : { kind: 'preview_request', code: 'p2345', ...patch };
    const response = await submit(fields);
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: 'invalid', field });
    assert.equal(await db.prepare('SELECT count(*) AS n FROM submissions').first('n'), 0);
    assert.equal(await db.prepare('SELECT count(*) AS n FROM events').first('n'), 0);
    assert.equal(await db.prepare('SELECT count(*) AS n FROM rate_limits').first('n'), 0);
  });
}

test('File values in known text/list fields are rejected, unknown files are ignored', async () => {
  for (const field of ['kind', 'code', 'name', 'phone', 'services', 'services_other', 'area', 'area_other', 'photos_ok', 'standout', 'contact_time']) {
    const data = formBody();
    data.set(field, new Blob(['x']), 'unexpected.txt');
    const response = await request('/t/form', { method: 'POST', body: data });
    assert.deepEqual(await response.json(), { error: 'invalid', field });
  }
  const data = formBody();
  data.append('unknown', new Blob(['x']), 'unknown.txt');
  assert.equal((await request('/t/form', { method: 'POST', body: data })).status, 200);
});

test('honeypot is a 200 no-op, including invalid form fields, with no cleanup or storage', async () => {
  const response = await submit({ website: ' https://spam.test ', kind: 'invalid' });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  for (const table of ['submissions', 'events', 'rate_limits', 'maintenance']) {
    assert.equal(await db.prepare(`SELECT count(*) AS n FROM ${table}`).first('n'), 0);
  }
  assert.equal((await (await mf.getKVNamespace('FILES')).list()).keys.length, 0);
});

test('form rejects missing multipart boundary and wrong content type', async () => {
  for (const headers of [{}, { 'Content-Type': 'application/json' }, { 'Content-Type': 'multipart/form-data' }]) {
    const response = await request('/t/form', { method: 'POST', body: 'invalid', headers });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: 'invalid', field: 'kind' });
  }
});

test('form enforces eight-file maximum, per-file and total byte limits, and bounded raw stream', async () => {
  assert.deepEqual(await (await submit(undefined, Array.from({ length: 9 }, () => ({ type: 'text/plain' })))).json(), { error: 'invalid', field: 'files' });
  for (const files of [[{ body: new Uint8Array(10 * 1024 * 1024 + 1), type: 'text/plain' }],
    Array.from({ length: 3 }, () => ({ body: new Uint8Array(9 * 1024 * 1024), type: 'text/plain' }))]) {
    const response = await submit(undefined, files);
    assert.equal(response.status, 413);
    assert.deepEqual(await response.json(), { error: 'too_large' });
  }
  const response = await request('/t/form', { method: 'POST', headers: { 'Content-Type': 'multipart/form-data; boundary=x' }, body: new Uint8Array(25 * 1024 * 1024 + 65537) });
  assert.equal(response.status, 413);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM submissions').first('n'), 0);
});

test('form permits every specified MIME type and rejects unsupported/spoofed extensions', async () => {
  const types = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif', 'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'];
  for (const [n, type] of types.entries()) assert.equal((await submit({ kind: 'preview_request', code: `p234${'56789abcdefgh'[n]}` }, [{ type }])).status, 200, type);
  for (const type of ['application/octet-stream', 'text/html', 'image/svg+xml', '']) {
    const response = await submit(undefined, [{ type, name: 'looks-safe.png' }]);
    assert.equal(response.status, 415);
    assert.deepEqual(await response.json(), { error: 'file_type' });
  }
});

test('forms have separate per-code and anonymous minute budgets', async () => {
  for (let n = 0; n < 60; n++) assert.equal((await post('p2345')).status, 204);
  for (let n = 0; n < 5; n++) assert.equal((await submit()).status, 200);
  const denied = await submit();
  assert.equal(denied.status, 429);
  assert.ok(Number(denied.headers.get('Retry-After')) > 0);
  for (let n = 0; n < 10; n++) assert.equal((await submit({ kind: 'callback_request', phone: '12345678' })).status, 200);
  assert.equal((await submit({ kind: 'preview_request', phone: '87654321' })).status, 429);
});

test('mixed feed shares IDs, stable equal-time paging and snapshot exclusion for new submissions', async () => {
  await seed(new Date(fixedNow - 1000).toISOString());
  await submit();
  await submit({ kind: 'callback_request', phone: '12345678' });
  const at = new Date(fixedNow - 500).toISOString();
  await db.prepare('UPDATE events SET at = ?').bind(at).run();
  const params = { since: at, limit: '2' };
  const first = await (await pull(params)).json();
  assert.deepEqual(first.events.map(e => e.id), ['1', '2']);
  assert.equal(first.events[0].submission, undefined);
  assert.ok(first.events[1].submission);
  assert.deepEqual(await (await pull(params)).json(), first);
  await submit();
  await db.prepare('UPDATE events SET at = ? WHERE id = 4').bind(at).run();
  const second = await (await pull({ ...params, cursor: first.next_cursor })).json();
  assert.deepEqual(second.events.map(e => e.id), ['3']);
  assert.equal(second.events[0].code, null);
  assert.equal(second.has_more, false);
  assert.deepEqual((await (await pull({ since: at })).json()).events.map(e => e.id), ['1', '2', '3', '4']);
});

test('file fetch uses same auth, bytes, stored content type, attachment and no-store; unknown is 404', async () => {
  const receipt = await (await submit(undefined, [{ type: 'text/plain', name: 'notes.txt', body: 'hello' }])).json();
  const path = `/t/files/s/${receipt.id}/0`;
  for (const auth of [null, 'Bearer wrong', `bearer ${TOKEN}`, `Bearer ${TOKEN}extra`]) {
    assert.equal((await request(path, { headers: auth ? { Authorization: auth } : {} })).status, 401);
  }
  const response = await request(path, { headers: { Authorization: `Bearer ${TOKEN}` } });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'hello');
  assert.equal(response.headers.get('Content-Type'), 'text/plain');
  assert.equal(response.headers.get('Content-Disposition'), 'attachment');
  assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal((await request(`/t/files/s/${receipt.id}/1`, { headers: { Authorization: `Bearer ${TOKEN}` } })).status, 404);
  assert.equal((await request('/t/files/missing', { headers: { Authorization: `Bearer ${TOKEN}` } })).status, 404);
  const { runtime } = await createRuntime({ token: null });
  try { assert.equal((await runtime.dispatchFetch(`https://jarvisweb.lt${path}`)).status, 503); }
  finally { await runtime.dispose(); }
});

test('submission retention excludes old records before lease cleanup and deletes rows after lease expiry', async () => {
  await db.prepare("INSERT INTO maintenance(key,next_at) VALUES ('retention', ?)").bind(fixedNow + 3_600_000).run();
  await submit();
  await submit();
  const cutoff = retentionCutoff(new Date(fixedNow));
  const expired = new Date(new Date(cutoff).getTime() - 1).toISOString();
  await db.prepare('UPDATE events SET at = CASE WHEN id = 1 THEN ? ELSE ? END').bind(expired, cutoff).run();
  await db.prepare('UPDATE submissions SET at = (SELECT at FROM events WHERE id = event_id)').run();
  assert.deepEqual((await (await pull()).json()).events.map(e => e.id), ['2']);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM submissions').first('n'), 2);
  // A fresh isolate attempts cleanup; expired lease allows it to delete children first.
  const { runtime, database } = await createRuntime();
  try {
    await database.prepare("INSERT INTO events(code,type,at,ua_class) VALUES ('p2345','preview_request',?,'human')").bind(expired).run();
    await database.prepare("INSERT INTO submissions(id,event_id,code,kind,at,ua_class,payload) VALUES ('old',1,'p2345','preview_request',?,'human','{}')").bind(expired).run();
    const response = await runtime.dispatchFetch(`https://jarvisweb.lt/t/events?since=${SINCE}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
    assert.equal(response.status, 200);
    assert.equal(await database.prepare('SELECT count(*) AS n FROM submissions').first('n'), 0);
    assert.equal(await database.prepare('SELECT count(*) AS n FROM events').first('n'), 0);
  } finally { await runtime.dispose(); }
});

test('concurrent forms consume one atomic budget and publish paired payloads without cross-linking', async () => {
  const responses = await Promise.all(Array.from({ length: 20 }, (_, n) => submit({ kind: 'preview_request', code: 'p2345', name: `Person ${n}` })));
  assert.equal(responses.filter(r => r.status === 200).length, 5);
  assert.equal(responses.filter(r => r.status === 429).length, 15);
  const accepted = await Promise.all(responses.map(async (r, n) => ({ n, status: r.status, body: await r.json() })));
  const rows = (await db.prepare('SELECT * FROM submissions').all()).results;
  assert.equal(rows.length, 5);
  for (const result of accepted.filter(result => result.status === 200)) {
    assert.equal(JSON.parse(rows.find(row => row.id === result.body.id).payload).name, `Person ${result.n}`);
  }
  assert.equal((await (await pull()).json()).events.length, 5);
});

test('failed KV write never publishes and failed D1 publish removes only newly written keys', async () => {
  for (const failure of ['kv', 'd1']) {
    const written = [];
    const deleted = [];
    let calls = 0;
    const response = await worker.fetch(new Request('https://jarvisweb.lt/t/form', {
      method: 'POST', body: formBody(undefined, [{ type: 'image/png' }, { type: 'text/plain' }]),
    }), {
      DB: {
        prepare() { return { bind() { return {}; } }; },
        async batch() {
          if (++calls === 1) return [{ results: [{ requests: 1 }] }, { results: [{ submissions: 1 }] }];
          throw new Error('publish failed');
        },
      },
      FILES: {
        async put(key, stream) {
          assert.ok(stream instanceof ReadableStream);
          if (failure === 'kv' && written.length === 1) throw new Error('KV failed');
          written.push(key);
        },
        async delete(key) { deleted.push(key); },
      },
    }, { waitUntil() {} });
    assert.equal(response.status, 503);
    assert.deepEqual(deleted, written);
    assert.equal(calls, failure === 'kv' ? 1 : 2);
  }
});

test('migration preserves existing rows and deleted AUTOINCREMENT high-water IDs', async () => {
  const { runtime, database } = await createRuntime({ schema: false });
  try {
    const first = await readFile(new URL('../migrations/0001_events.sql', import.meta.url), 'utf8');
    const second = await readFile(new URL('../migrations/0002_submissions.sql', import.meta.url), 'utf8');
    for (const statement of first.split(';').map(s => s.trim()).filter(Boolean)) await database.prepare(statement).run();
    await database.prepare("INSERT INTO events(id,code,type,ua_class) VALUES (42,'a2345','view','human')").run();
    // Model already-expired IDs without discarding any test rows.
    await database.prepare("UPDATE sqlite_sequence SET seq = 100 WHERE name = 'events'").run();
    for (const statement of second.split(';').map(s => s.trim()).filter(Boolean)) await database.prepare(statement).run();
    assert.equal((await database.prepare('SELECT * FROM events WHERE id = 42').first()).code, 'a2345');
    await database.prepare("INSERT INTO events(code,type,ua_class) VALUES ('p2345','preview_cta','human')").run();
    assert.equal(await database.prepare('SELECT max(id) AS id FROM events').first('id'), 101);
    await assert.rejects(database.prepare("INSERT INTO events(code,type,ua_class) VALUES (NULL,'view','human')").run(), /CHECK/);
  } finally { await runtime.dispose(); }
});


test('filenames are bounded by code points and stripped of controls and slashes', async () => {
  const names = ['x'.repeat(1100), '😀š'.repeat(70), '/\u0001\u007f'];
  const expected = ['x'.repeat(100), '😀š'.repeat(50), 'file'];
  const response = await submit(undefined, names.map(name => ({ name, type: 'text/plain' })));
  assert.equal(response.status, 200);
  const files = (await (await pull()).json()).events[0].submission.files;
  assert.deepEqual(files.map(file => file.name), expected);
  const kv = await mf.getKVNamespace('FILES');
  for (const file of files) assert.equal((await kv.getWithMetadata(file.key)).metadata.name, file.name);
});

test('no-files browser FormData ignores empty strings and zero-byte nameless inputs', async () => {
  const data = formBody();
  data.append('files', new Blob([]), '');
  data.append('files', '');
  assert.equal((await request('/t/form', { method: 'POST', body: data })).status, 200);
  assert.deepEqual((await (await pull()).json()).events[0].submission.files, []);
});

test('lists trim, remove blanks and deduplicate', async () => {
  assert.equal((await submit({ kind: 'preview_request', code: 'p2345', services: [' ', ' Heat ', 'Heat'], area: ['', ' Kaunas ', 'Kaunas'] })).status, 200);
  const payload = (await (await pull()).json()).events[0].submission;
  assert.deepEqual(payload.services, ['Heat']);
  assert.deepEqual(payload.area, ['Kaunas']);
});


test('24 MiB multipart happy path stores streams intact', async () => {
  const response = await submit(undefined, Array.from({ length: 3 }, (_, n) => ({
    name: `large-${n}.txt`, type: 'text/plain', body: new Uint8Array(8 * 1024 * 1024).fill(65 + n),
  })));
  assert.equal(response.status, 200);
  const files = (await (await pull()).json()).events[0].submission.files;
  assert.equal(files.reduce((sum, file) => sum + file.size, 0), 24 * 1024 * 1024);
  const kv = await mf.getKVNamespace('FILES');
  for (const [n, file] of files.entries()) {
    const bytes = new Uint8Array(await kv.get(file.key, 'arrayBuffer'));
    assert.equal(bytes.length, file.size);
    assert.equal(bytes[0], 65 + n);
    assert.equal(bytes.at(-1), 65 + n);
  }
});

test('chunked multipart without Content-Length cannot bypass raw body cap', async () => {
  let chunks = 0;
  let touchedStorage = false;
  const response = await worker.fetch(new Request('https://jarvisweb.lt/t/form', {
    method: 'POST', duplex: 'half', headers: { 'Content-Type': 'multipart/form-data; boundary=x' },
    body: new ReadableStream({ pull(controller) {
      if (chunks++ < 27) controller.enqueue(new Uint8Array(1024 * 1024));
      else controller.close();
    } }),
  }), { DB: { prepare() { touchedStorage = true; throw new Error('unexpected'); } } }, { waitUntil() {} });
  assert.equal(response.status, 413);
  assert.equal(touchedStorage, false);
});

test('global daily submission cap is atomic across different codes', async () => {
  const day = Math.floor(fixedNow / 86400000) * 86400000;
  await db.prepare('INSERT INTO form_daily_budgets VALUES (?,49,0)').bind(day).run();
  const responses = await Promise.all(Array.from({ length: 10 }, (_, n) =>
    submit({ kind: 'preview_request', code: `p234${'56789abcde'[n]}` })));
  assert.equal(responses.filter(r => r.status === 200).length, 1);
  assert.equal(responses.filter(r => r.status === 429).length, 9);
  assert.equal(await db.prepare('SELECT submissions FROM form_daily_budgets WHERE day_start = ?').bind(day).first('submissions'), 50);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM submissions').first('n'), 1);
});

test('global daily file cap includes exact boundary, rejects excess and resets next UTC day', async () => {
  const day = Math.floor(fixedNow / 86400000) * 86400000;
  const cap = 300 * 1024 * 1024;
  await db.prepare('INSERT INTO form_daily_budgets VALUES (?,1,?)').bind(day, cap - 1).run();
  assert.equal((await submit(undefined, [{ type: 'text/plain', body: 'x' }])).status, 200);
  assert.equal((await submit(undefined, [{ type: 'text/plain', body: 'x' }])).status, 429);
  assert.equal((await (await mf.getKVNamespace('FILES')).list()).keys.length, 1);
  // Simulate the stored budget from the previous UTC day; today's budget is new.
  await db.prepare('UPDATE form_daily_budgets SET day_start = ?').bind(day - 86400000).run();
  assert.equal((await submit(undefined, [{ type: 'text/plain', body: 'x' }])).status, 200);
  assert.equal(await db.prepare('SELECT file_bytes FROM form_daily_budgets WHERE day_start = ?').bind(day).first('file_bytes'), 1);
});
