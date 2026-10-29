import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { validateLaunchConfig } from '../src/templates/v3/build-config.mjs';
const script = readFileSync(new URL('../src/templates/v3/form.js', import.meta.url), 'utf8');
function touch({ referrer = '', search = '', path = '/', store = new Map(), site = 'vensland' } = {}) {
  vm.runInNewContext(script, {
    document: { referrer, body: { getAttribute: () => site }, querySelectorAll: () => [] },
    location: { search, pathname: path, hostname: 'vensland.lt' },
    sessionStorage: { getItem: k => store.get(k), setItem: (k,v) => store.set(k,v), removeItem: k => store.delete(k) },
    URL, URLSearchParams, window: {},
  });
  return JSON.parse(store.get('jw-first-touch:' + site) || 'null');
}
test('two-site test keys are explicit; missing production key and foreign site widget fail closed', () => {
  assert.equal(validateLaunchConfig(undefined, { code:'vensland', test:true }).publicWidget.sitekey, '1x00000000000000000000AA');
  assert.equal(validateLaunchConfig(undefined, { code:'other', test:true }).publicWidget, undefined);
  assert.throws(() => validateLaunchConfig({}, { code:'vensland' }), /real publicWidget/);
  assert.throws(() => validateLaunchConfig({ publicWidget: {} }, { code:'other', test:true }), /only supports/);
});
test('bounded source precedence and path; session first touch survives internal navigation', () => {
  assert.deepEqual(touch({referrer:'https://chatgpt.com/?secret=a', search:'?gclid=private', path:'/paslaugos/veja/'}), {source:'GoogleAds',path:'/paslaugos/veja/'});
  for (const [host, source] of [['chatgpt.com','ChatGPT'],['www.google.lt','organicGoogle'],['bing.com','Bing'],['perplexity.ai','Perplexity'],['copilot.microsoft.com','Copilot'],['gemini.google.com','Gemini'],['claude.ai','Claude'],['m.facebook.com','social'],['evil.test','otherhost']]) assert.equal(touch({referrer:'https://' + host + '/?secret=1'}).source, source);
  assert.equal(touch({search:'?utm_source=private'}).source, 'utm');
  assert.equal(touch({path:'/unsafe?private=1'}).path, '/');
  assert.equal(touch({path:'/%253Fprivate'}).path, '/');
  const store = new Map(); touch({store,referrer:'https://bing.com/',path:'/first/'});
  assert.deepEqual(touch({store,referrer:'https://vensland.lt/first/',path:'/next/'}),{source:'Bing',path:'/first/'});
  assert.equal(touch({site:'excluded'}), null);
});
