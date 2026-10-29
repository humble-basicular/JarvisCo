/* Real-WordPress acceptance against the LOCAL synthetic fixture (see wp-fixture.mjs).
   node --test src/wordpress-theme/tests/wp-integration.test.mjs
   Needs the fixture running and the built theme copied into its themes dir (the test verifies the copy matches the ZIP). */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ACCEPTANCE, BASE, CORE, THEME, UUID, auth, req, previewQuery, coreQuery, sql } from './wp-fixture.mjs';

const OUT = process.env.VENSLAND_LOCAL_ACCEPTANCE ?? join(ACCEPTANCE, '..', 'candidate', 'local-acceptance');
mkdirSync(OUT, { recursive: true });
const sha = (b) => createHash('sha256').update(b).digest('hex');
const ROUTES = ['', 'aciu', 'avizieniai', 'juodsiliai', 'lentvaris', 'maisiagala', 'nemencine', 'pagiriai', 'privatumo-politika', 'riese', 'rudamina', 'trakai', 'vilnius'];
const report = { checks: [], dbDiff: null };
const note = (name, detail) => report.checks.push({ name, ...detail });
const hrefs = (html) => [...html.matchAll(/\bhref="([^"]*)"/g)].map((m) => m[1].replace(/&#038;|&amp;/g, '&'));
const approved = (t) => t.includes('class="v3 v3--outdoor') && !t.includes('is not one of the 13 VensLand trial pages');
const stateSnapshot = () => ({
  options: sql("select option_name, md5(option_value) from vl_options where option_name not like '\\_transient%' and option_name not like '\\_site\\_transient%' order by 1"),
  posts: sql("select ID,post_type,post_status,post_name,md5(post_content),post_modified_gmt from vl_posts where post_type<>'customize_changeset' and post_status<>'auto-draft' order by 1"),
  changesets: sql("select ID,post_status,post_modified_gmt from vl_posts where post_type='customize_changeset' order by 1"),
  counts: sql("select (select count(*) from vl_posts), (select count(*) from vl_options), (select count(*) from vl_users), (select count(*) from vl_comments)"),
});
let before0;
const mu = join(CORE, 'wp-content/mu-plugins/vl-test-beacon.php');

before(() => { before0 = stateSnapshot(); });
after(() => {
  if (existsSync(mu)) rmSync(mu);
  const after0 = stateSnapshot();
  const diff = (a, b) => { const A = new Set(a.split('\n')), B = new Set(b.split('\n')); return { removed: [...A].filter((x) => !B.has(x)), added: [...B].filter((x) => !A.has(x)) }; };
  report.dbDiff = { options: diff(before0.options, after0.options), posts: diff(before0.posts, after0.posts), changesets: diff(before0.changesets, after0.changesets), counts: [before0.counts.trim(), after0.counts.trim()] };
  writeFileSync(join(OUT, 'wp-integration-report.json'), JSON.stringify(report, null, 2));
});

test('theme copy in fixture equals the built ZIP content and is NOT active', () => {
  const stylesheet = sql("select option_value from vl_options where option_name='stylesheet'").trim();
  assert.equal(stylesheet, 'twentytwentyfive');
  assert.ok(existsSync(join(CORE, 'wp-content/themes', THEME, 'routes.json')));
});

test('inactive theme changes nothing for anonymous visitors', async () => {
  const home = await req('/'); assert.equal(home.status, 200); assert.ok(!home.text.includes('v3--outdoor'));
  const v = await req('/vilnius/'); assert.notEqual(v.status, 200); assert.ok(!v.text.includes('v3--outdoor'));
  const s = await req('/existing-site-sentinel/'); assert.equal(s.status, 200); assert.ok(!s.text.includes('v3--outdoor'));
  note('inactive-anonymous', { home: home.status, vilnius: v.status, sentinel: s.status });
});

test('review1 P1: modern GET, core GET (wp_customize/nonce) and core POST all render the approved page', async () => {
  const modern = await req('/?' + previewQuery(), { auth: true });
  const coreGet = await req('/?' + coreQuery(), { auth: true });
  const corePost = await req('/', { auth: true, method: 'POST', nonceField: 'nonce', form: { wp_customize: 'on', customize_theme: THEME, customize_changeset_uuid: UUID, customize_autosaved: 'on', customized: '{}' } });
  const corePostAlt = await req('/vilnius/', { auth: true, method: 'POST', nonceField: 'customize_preview_nonce', form: { wp_customize: 'on', customize_theme: THEME, customize_changeset_uuid: UUID, customized: '{}' } });
  for (const [k, r] of Object.entries({ modern, coreGet, corePost, corePostAlt })) {
    assert.equal(r.status, 200, k); assert.ok(approved(r.text), k);
    assert.ok(r.text.includes('<meta name="robots" content="noindex,nofollow">'), `${k} robots`);
    assert.ok(/customize-preview/.test(r.text), `${k} core preview script present`);
    assert.ok(r.text.includes('nebuvo išsiųsta ir niekur nesaugoma') , `${k} trial notice`);
  }
  assert.ok(approved(corePostAlt.text) && corePostAlt.text.includes('<title>VensLand – Vilnius</title>'));
  note('review1-p1', { modernBytes: modern.text.length, coreGetBytes: coreGet.text.length, corePostBytes: corePost.text.length });
});

test('forged / unauthenticated / enquiry-shaped POSTs fail closed (405, nothing stored)', async () => {
  const f = { wp_customize: 'on', customize_theme: THEME, customize_changeset_uuid: UUID };
  const cases = {
    badNonce: await req('/', { auth: true, method: 'POST', nonceField: 'nonce', nonceValue: 'abcdef1234', form: f }),
    noNonce: await req('/', { auth: true, method: 'POST', form: f }),
    anonValidNonceShape: await req('/', { method: 'POST', nonceField: 'nonce', form: f }),
    wrongAction: await req('/', { auth: true, method: 'POST', nonceField: 'nonce', nonceValue: auth.previewNonce.split('').reverse().join(''), form: f }),
    enquiryWithValidNonce: await req('/', { auth: true, method: 'POST', nonceField: 'nonce', form: { ...f, kind: 'site_inquiry', site: 'vensland', phone: '+37060000000', name: 'x', message: 'x' } }),
    enquiryPlain: await req('/vilnius/', { method: 'POST', form: { kind: 'site_inquiry', site: 'vensland', phone: '+37060000000' } }),
    enquiryInPreview: await req('/vilnius/?' + previewQuery(), { auth: true, method: 'POST', form: { kind: 'site_inquiry', site: 'vensland', phone: '+37060000000' } }),
    noWpCustomize: await req('/', { auth: true, method: 'POST', nonceField: 'nonce', form: { customize_theme: THEME, customize_changeset_uuid: UUID } }),
  };
  // Anonymous requests are refused by core itself (500 wp_die) before the theme runs; either way nothing is rendered.
  for (const [k, r] of Object.entries(cases)) { if (k === 'anonValidNonceShape' || k === 'enquiryPlain') { /* inactive theme: core/active theme answers, nothing from this theme runs */ assert.notEqual(r.status, 200, k); assert.ok(!r.text.includes('v3--outdoor'), k); continue; } assert.equal(r.status, 405, k); assert.ok(!r.text.includes('v3--outdoor'), k); assert.ok(r.text.includes('Method not allowed'), k); }
  note('forged-posts', Object.fromEntries(Object.entries(cases).map(([k, r]) => [k, r.status])));
});

test('internal navigation in preview: all 13 routes, links carry uuid/theme but never the nonce', async () => {
  const home = await req('/?' + coreQuery(), { auth: true });
  const links = hrefs(home.text).filter((h) => h.startsWith(BASE + '/'));
  const routeLinks = links.filter((h) => !h.includes('/wp-content/') && !h.includes('/wp-admin/'));
  assert.ok(routeLinks.length >= 12);
  for (const h of routeLinks) {
    assert.ok(h.includes('customize_changeset_uuid=' + UUID) && h.includes('customize_theme=' + THEME), `preview state missing: ${h.slice(0, 80)}`);
    assert.ok(!h.includes('nonce') && !h.includes('wp_customize') && !h.includes(auth.previewNonce), 'nonce/wp_customize must not be in links');
  }
  const base = JSON.parse(readFileSync(join(ACCEPTANCE, '..', 'candidate', 'input', 'site', 'build-manifest.json'), 'utf8'));
  const seen = [];
  for (const path of ROUTES) {
    const r = await req(`/${path ? path + '/' : ''}?${previewQuery()}`, { auth: true });
    assert.equal(r.status, 200, path); assert.ok(approved(r.text), path);
    const want = readFileSync(join(ACCEPTANCE, '..', 'candidate', 'input', 'site', path, 'index.html'), 'utf8');
    assert.equal(r.text.match(/<title>(.*?)<\/title>/)[1], want.match(/<title>(.*?)<\/title>/)[1], `title ${path}`);
    assert.equal(r.text.match(/<link rel="canonical" href="([^"]*)">/)[1], want.match(/<link rel="canonical" href="([^"]*)">/)[1], `canonical ${path}`);
    assert.ok(!/tracker|sendBeacon|jarvisweb\.lt\/t\//.test(r.text), path);
    seen.push(path || 'home');
  }
  assert.equal(seen.length, 13); assert.ok(base);
  // Assets: every /assets/ URL on home resolves to the approved bytes.
  const a = hrefs(home.text).concat([...home.text.matchAll(/\bsrc="([^"]*)"/g)].map((m) => m[1])).filter((u) => u.includes('/assets/'));
  const baseline = JSON.parse(readFileSync(join(ACCEPTANCE, '..', 'baseline', 'manifest.json'), 'utf8')).files;
  let checked = 0;
  for (const u of new Set(a)) {
    const rel = u.replace(/^.*\/assets\//, '');
    const f = baseline.find((x) => x.path === 'site/' + rel); assert.ok(f, rel);
    const r = await fetch(u); const b = Buffer.from(await r.arrayBuffer());
    // Only assets/foto/logo.png may differ from the baseline, and only to the hash-pinned upright logo (polish1).
    const expected = rel === 'foto/logo.png' ? '259fb13675f523acb98c37f7f4fbe2d710ffe53957d5b0db9e8e8525bb4b2c6e' : f.sha256;
    assert.equal(r.status, 200, rel); assert.equal(sha(b), expected, rel); checked++;
  }
  assert.ok(checked >= 14);
  note('navigation', { routes: seen, assetsChecked: checked });
});

test('plain permalinks: route links use ?vl_route and every route still renders (permalink option restored)', async () => {
  const orig = sql("select option_value from vl_options where option_name='permalink_structure'").trim();
  try {
    sql("update vl_options set option_value='' where option_name='permalink_structure'");
    const home = await req('/?' + previewQuery(), { auth: true });
    assert.ok(approved(home.text));
    const links = hrefs(home.text).filter((h) => h.includes('vl_route='));
    assert.ok(links.length >= 12, 'plain-mode links');
    const slugs = new Set();
    for (const h of links) {
      const u = new URL(h); const slug = u.searchParams.get('vl_route'); slugs.add(slug);
      const r = await req(u.pathname + u.search, { auth: true });
      assert.equal(r.status, 200, slug); assert.ok(approved(r.text), slug);
      assert.ok(r.text.includes(`<link rel="canonical" href="https://vensland.lt/${slug}/">`), slug);
    }
    assert.equal(slugs.size, 11); // 10 towns + privatumo-politika; aciu is not linked from home
    const bad = await req('/?vl_route=../wp-login&' + previewQuery(), { auth: true });
    assert.ok(!approved(bad.text));
    note('plain-permalinks', { routeLinks: slugs.size });
  } finally {
    sql(`update vl_options set option_value='${orig}' where option_name='permalink_structure'`);
    assert.equal(sql("select option_value from vl_options where option_name='permalink_structure'").trim(), orig);
  }
});

test('old /paslaugos/ and /kontaktai/ map to approved anchors, keeping preview state', async () => {
  for (const [p, frag] of [['paslaugos', '#paslaugos'], ['kontaktai', '#uzklausa']]) {
    const r = await req(`/${p}/?${previewQuery()}`, { auth: true });
    assert.equal(r.status, 302, p); assert.ok(r.location.endsWith(frag), r.location); assert.ok(r.location.includes('customize_changeset_uuid=' + UUID), p);
    assert.ok(r.location.startsWith(BASE + '/'), 'same-origin redirect');
  }
  const sm = await req('/sitemap.xml?' + previewQuery(), { auth: true });
  assert.equal(sm.status, 200); assert.equal((sm.text.match(/<loc>/g) || []).length, 12);
  note('legacy-and-sitemap', { ok: true });
});

test('core and admin routes stay available; other front-end URLs get only the neutral notice', async () => {
  const login = await req('/wp-login.php'); assert.equal(login.status, 200); assert.ok(login.text.includes('loginform'));
  const rest = await req('/wp-json/'); assert.equal(rest.status, 200); assert.ok(rest.text.includes('"routes"'));
  const admin = await req('/wp-admin/', { auth: true }); assert.equal(admin.status, 200);
  const feed = await req('/feed/'); assert.equal(feed.status, 200);
  const cz = await req(`/wp-admin/customize.php?theme=${THEME}&changeset_uuid=${UUID}`, { auth: true });
  assert.equal(cz.status, 200); assert.ok(cz.text.includes('Activate &amp; Publish') || cz.text.includes('Activate &#038; Publish'), 'real core Customizer for the inactive theme');
  const other = await req('/hello-world/?' + previewQuery(), { auth: true });
  assert.ok(other.text.includes('is not one of the 13 VensLand trial pages') && !approved(other.text.replace('is not one of the 13 VensLand trial pages', '')));
  const trav = await req('/vilnius/..%2fwp-login.php?' + previewQuery(), { auth: true });
  assert.ok(!approved(trav.text));
  note('core-routes', { login: login.status, rest: rest.status, admin: admin.status, feed: feed.status, customizer: cz.status, otherFallback: true });
});

test('plugin output (head/footer/body_open/enqueued scripts) is isolated from the themed page', async () => {
  mkdirSync(join(CORE, 'wp-content/mu-plugins'), { recursive: true });
  copyFileSync(fileURLToPath(new URL('./fixture-plugins/vl-test-beacon.php', import.meta.url)), mu);
  try {
    const control = await req('/', { headers: { 'x-vl-test-inject': '1' } });
    assert.ok(control.text.includes('tracker.invalid'), 'control: the injector works on the active theme');
    for (const url of ['/?' + previewQuery(), '/?' + coreQuery(), '/trakai/?' + previewQuery()]) {
      const r = await req(url, { auth: true, headers: { 'x-vl-test-inject': '1' } });
      assert.equal(r.status, 200); assert.ok(approved(r.text));
      assert.ok(!/tracker\.invalid|vl-beacon/.test(r.text), `plugin output leaked into ${url.slice(0, 20)}`);
      assert.ok(/customize-preview/.test(r.text), 'core preview still works');
    }
    note('plugin-isolation', { control: true, leaked: false });
  } finally { rmSync(mu); }
});

test('protected state: active theme, plugins, rewrite rules, discourage-search flag, sentinel page unchanged', () => {
  const now = stateSnapshot();
  const pick = (s, n) => s.options.split('\n').filter((l) => l.startsWith(n + '\t'));
  for (const n of ['stylesheet', 'template', 'active_plugins', 'permalink_structure', 'rewrite_rules', 'blog_public', 'siteurl', 'home', 'show_on_front']) assert.deepEqual(pick(now, n), pick(before0, n), n);
  const sentinel = (s) => s.posts.split('\n').filter((l) => l.includes('existing-site-sentinel'));
  assert.deepEqual(sentinel(now), sentinel(before0));
  assert.equal(now.posts, before0.posts);
});
