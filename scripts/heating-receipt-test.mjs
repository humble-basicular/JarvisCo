// Execute the actual thank-you script: local receipts must match once, never confirm a later inquiry.
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('../src/templates/heating/site/pages/aciu.astro', import.meta.url), 'utf8')
  .match(/<script is:inline>([\s\S]*?)<\/script>/)[1];
for (const [label, query, receipt, expected] of [
  ['old session receipt on direct visit', '', 'received', 'neutral'],
  ['legacy receipt cannot confirm', '?receipt=received', 'received', 'neutral'],
  ['missing navigation receipt', '', 'nonce', 'neutral'],
  ['different submission', '?receipt=other', 'nonce', 'neutral'],
  ['current submission', '?receipt=nonce', 'nonce', 'ok'],
  ['error takes precedence', '?receipt=nonce&klaida=1', 'nonce', 'error'],
  ['consumed receipt cannot replay', '?receipt=nonce', null, 'neutral'],
]) {
  const states = Object.fromEntries(['neutral', 'ok', 'error'].map(k => [k, { hidden: k !== 'neutral' }]));
  const storage = new Map(receipt ? [['hs-receipt:demo', receipt]] : []);
  runInNewContext(source, {
    location: { search: query }, URLSearchParams,
    document: {
      body: { getAttribute: () => 'demo' },
      querySelector: selector => states[selector.match(/aciu-(\w+)/)[1]],
    },
    sessionStorage: { getItem: key => storage.get(key) ?? null, removeItem: key => storage.delete(key) },
  });
  assert.deepEqual(Object.keys(states).filter(k => !states[k].hidden), [expected], label);
  assert.equal(storage.has('hs-receipt:demo'), false, `${label}: receipt consumed`);
  console.log(`PASS ${label}`);
}
