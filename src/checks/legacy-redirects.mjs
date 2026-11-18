// Local Vercel acceptance: no writes, no production requests.
// vercel dev --local --listen 127.0.0.1:4338; node src/checks/legacy-redirects.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TRACKING_PREFIXES } from '../data/tracking.js';
const origin = process.argv[2] ?? 'http://127.0.0.1:4338';
assert(['localhost', '127.0.0.1'].includes(new URL(origin).hostname));
const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
const rules = config.redirects;
const receipts = [];
for (const rule of rules) {
  for (const query of ['', '?r=a2345&utm_source=review&value=a%20b', '?r=p2345&tag=one&tag=two&encoded=%26%3D']) {
    const response = await fetch(origin + rule.source + query, { redirect: 'manual' });
    assert.equal(response.status, 301, rule.source);
    const location = response.headers.get('location');
    assert.equal(location, rule.destination + query, rule.source);
    const final = await fetch(new URL(location, origin), { redirect: 'manual' });
    assert.equal(final.status, 200, location);
    receipts.push({ source: rule.source + query, status: response.status, location, finalStatus: final.status });
  }
}
for (const [prefix, path] of Object.entries(TRACKING_PREFIXES)) {
  const response = await fetch(`${origin}${path}?r=${prefix}2345`, { redirect: 'manual' });
  assert.equal(response.status, 200);
}
console.log(JSON.stringify({ checks: receipts.length, prefixDestinations: TRACKING_PREFIXES, receipts }, null, 2));
