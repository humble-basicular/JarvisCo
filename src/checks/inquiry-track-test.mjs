/* Unit test for src/scripts/inquiry-track.ts (Node strips the types). Run: node --test src/checks/inquiry-track-test.mjs */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildPayload, cleanLoc, createTracker, pagePath, postsToWorker, referrerType, submitLooksReal } from '../scripts/inquiry-track.ts';

const form = ({ action = 'https://api.web3forms.com/submit', attr = null, inert = false, valid = true, botcheck = false, website = '', captcha = null } = {}) => ({
  action, checkValidity: () => valid, getAttribute: (n) => (n === 'action' ? attr : null), matches: (s) => inert && s === '[data-inert-form]',
  querySelector(selector) {
    if (selector === 'input[name="botcheck"]') return { checked: botcheck };
    if (selector === 'input[name="website"]') return website ? { value: website } : null;
    if (selector === '.h-captcha') return captcha === null ? null : {};
    if (selector === '[name="h-captcha-response"]') return captcha === null ? null : { value: captcha };
    return null;
  },
});
function tracker(clock = { t: 1000 }) {
  const sent = [];
  const api = createTracker({
    site: 'arbcut', endpoint: 'https://jarvisweb.lt/t/e',
    context: (loc) => ({ page: '/medziu-pjovimas-kaunas/', loc, ref: 'search', mobile: true }),
    send: (endpoint, body) => sent.push({ endpoint, body: JSON.parse(body) }), now: () => clock.t,
  });
  return { api, sent, clock };
}

test('payload has exactly the anonymous fields and nothing else', () => {
  assert.deepEqual(buildPayload('arbcut', 'cta_call', { page: '/', loc: 'hero', ref: 'direct', mobile: false }),
    { site: 'arbcut', type: 'cta_call', page: '/', loc: 'hero', ref: 'direct', mobile: false });
});

test('referrer classes', () => {
  const own = 'arbcut.lt';
  assert.equal(referrerType('', own), 'direct');
  assert.equal(referrerType('not a url', own), 'direct');
  assert.equal(referrerType('https://www.arbcut.lt/x', own), 'internal');
  assert.equal(referrerType('https://www.google.lt/', own), 'search');
  assert.equal(referrerType('https://duckduckgo.com/', own), 'search');
  assert.equal(referrerType('https://l.facebook.com/l.php', own), 'social');
  assert.equal(referrerType('https://t.co/abc', own), 'social');
  assert.equal(referrerType('https://m.facebook.com/', own), 'social');
  assert.equal(referrerType('https://example.org/', own), 'other');
  assert.equal(referrerType('https://notgoogle.com/', own), 'other');
});

test('loc and path are sanitised', () => {
  assert.equal(cleanLoc('hero'), 'hero');
  assert.equal(cleanLoc('Hero CTA'), null);
  assert.equal(cleanLoc(undefined), null);
  assert.equal(cleanLoc('x'.repeat(41)), null);
  assert.equal(pagePath('/a b?x=1#h'), '/ab');
  assert.equal(pagePath('/' + 'a'.repeat(300)).length, 120);
  assert.equal(pagePath(''), '/');
});

test('a tap sends one cta_call; a double-fired event is one tap, a later tap is another', () => {
  const { api, sent, clock } = tracker();
  const link = {};
  api.tap(link, 'hero'); api.tap(link, 'hero');
  assert.equal(sent.length, 1);
  assert.deepEqual(sent[0], { endpoint: 'https://jarvisweb.lt/t/e', body: { site: 'arbcut', type: 'cta_call', page: '/medziu-pjovimas-kaunas/', loc: 'hero', ref: 'search', mobile: true } });
  api.tap({}, null);
  assert.equal(sent.length, 2, 'another button is another tap');
  clock.t += 5000; api.tap(link, 'hero');
  assert.equal(sent.length, 3);
});

test('form opens once per form; submits only when real', () => {
  const { api, sent } = tracker();
  const a = form(), b = form();
  api.open(a, 'contact-form'); api.open(a, 'contact-form'); api.open(b, 'modal');
  assert.deepEqual(sent.map((s) => [s.body.type, s.body.loc]), [['form_open', 'contact-form'], ['form_open', 'modal']]);
  sent.length = 0;
  api.submit(form({ valid: false }), 'x');
  api.submit(form({ botcheck: true }), 'x');
  api.submit(form({ website: 'spam' }), 'x');
  api.submit(form({ captcha: '' }), 'x');
  api.submit(form({ action: 'https://jarvisweb.lt/t/form' }), 'x');
  api.submit(form({ action: 'https://demo.test/p#uzklausa', attr: '#uzklausa' }), 'x');
  api.submit(form({ inert: true }), 'x');
  assert.equal(sent.length, 0);
  const good = form({ captcha: 'token' });
  api.submit(good, 'contact-form'); api.submit(good, 'contact-form');
  assert.deepEqual(sent.map((s) => s.body.type), ['form_submit']);
  api.submit(form(), 'plain');
  assert.equal(sent.length, 2, 'a form without a captcha widget counts when valid');
});

test('Worker-posted forms are recognised', () => {
  assert.ok(postsToWorker('https://jarvisweb.lt/t/form'));
  assert.ok(postsToWorker('/t/form'));
  assert.ok(!postsToWorker('https://api.web3forms.com/submit'));
  assert.ok(!submitLooksReal(form({ action: '/t/form' })));
});
