#!/usr/bin/env node
// Private, on-demand aggregate report; no scheduler, public endpoint or embedded token.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: {
  from: { type: 'string' }, to: { type: 'string' }, out: { type: 'string' },
  secrets: { type: 'string', default: `${homedir()}/Library/Application Support/JarvisWeb/proof-tracking-secrets.json` },
} });
if (!values.from || !values.to || !values.out) throw new Error('Usage: node scripts/site-summary.mjs --from <ISO with timezone> --to <ISO with timezone> --out <private report.html>');
const token = JSON.parse(readFileSync(values.secrets, 'utf8')).EVENTS_TOKEN;
if (typeof token !== 'string' || !token) throw new Error('EVENTS_TOKEN missing in private secrets file');
const reports = await Promise.all(['meselektra', 'vensland'].map(async site => {
  const u = new URL('https://www.jarvisweb.lt/t/site-summary');
  for (const [k, v] of Object.entries({ site, from: values.from, to: values.to })) u.searchParams.set(k, v);
  const res = await fetch(u, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${site}: report unavailable (HTTP ${res.status})`);
  const data = await res.json();
  if (data.site !== site || !Array.isArray(data.events) || !Array.isArray(data.sources) || !Array.isArray(data.security) || !Array.isArray(data.notifications)) throw new Error(`${site}: invalid report response`);
  return data;
}));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const table = (title, rows, keys) => `<h3>${esc(title)}</h3><table><thead><tr>${keys.map(k => `<th>${esc(k)}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.map(r => `<tr>${keys.map(k => `<td>${esc(r[k] ?? '')}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${keys.length}">No recorded data in this period</td></tr>`}</tbody></table>`;
const count = (r, type) => r.events.find(e => e.type === type)?.count ?? 0;
const now = new Date().toISOString();
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>MesElektra & VensLand — enquiry report</title><style>body{font:16px/1.55 system-ui;margin:0;background:#f3f5f2;color:#17231c}main{max-width:1050px;padding:28px;margin:auto}section{background:white;padding:24px;margin:24px 0;border-radius:16px}table{width:100%;border-collapse:collapse;text-align:left}th,td{padding:9px;border-bottom:1px solid #ddd;overflow-wrap:anywhere}small{color:#46564d}.metrics{display:flex;flex-wrap:wrap;gap:24px}.metrics b{display:block;font-size:30px}h1,h2{line-height:1.2}@media(max-width:500px){main{padding:12px}section{padding:16px}}</style><main><h1>Website enquiries</h1><p>Fresh snapshot: ${esc(now)}<br>Period: ${esc(reports[0].from)} to ${esc(reports[0].to)} (end excluded).</p><p>Private report. Test visits and labelled test enquiries are included in the raw totals. Phone taps do not establish answered calls. Stored enquiries include retries. Email “sent” means the provider accepted the send, not inbox receipt. Jobs and payments are not measured here. Worker forms intentionally do not emit submit beacons, so their attempt count is not collected.</p>${reports.map(r => `<section><h2>${esc(r.site)}</h2><div class="metrics">${[['Stored enquiries', count(r, 'site_inquiry')], ['Phone taps', count(r, 'cta_call')], ['Form opens', count(r, 'form_open')], ['Form-submit beacons', r.events.some(e => e.type === 'form_submit') ? count(r, 'form_submit') : 'Not collected']].map(([label, n]) => `<div><b>${esc(n)}</b>${esc(label)}</div>`).join('')}</div>${table('Events', r.events, ['type', 'count'])}${table('Sources — accepted enquiries since rollout only', r.sources, ['source', 'count'])}${table('Protection — recorded decisions only', r.security, ['outcome', 'reason', 'count'])}${table('Email provider — per recipient, by send time', r.notifications, ['status', 'count'])}<small>Sources are self-reported first touch. Old enquiries have no source backfill. Early malformed/origin-denied requests are outside the security counters. No quarantine: held = ${esc(r.held)}. Inbox receipt, actual jobs and revenue remain unknown.</small></section>`).join('')}</main></html>`;
const out = resolve(values.out);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html, { mode: 0o600, flag: 'wx' });
writeFileSync(`${out}.json`, JSON.stringify({ generatedAt: now, reports }, null, 2), { mode: 0o600, flag: 'wx' });
console.log(`Saved private report: ${out}`);
