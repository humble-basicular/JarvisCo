/* Evaluate in the T3 preview on a generated --test client site. No browser
   launcher or filesystem cleanup. All submission/beacon traffic stays local.
   Uses isolated same-origin frames so navigation receipts are testable. */
(async () => {
  if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(location.origin)) throw new Error('Local stub only');
  const results = [];
  const ok = (condition, label) => { results.push({ label, pass: !!condition }); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const stub = async path => (await fetch('/__stub/' + path)).json();
  let frame, w, d, form;
  async function go(path = '/', noScript = false) {
    if (frame) frame.remove();
    frame = document.createElement('iframe');
    if (noScript) frame.setAttribute('sandbox', 'allow-same-origin allow-forms');
    frame.style.cssText = 'position:fixed;inset:0;width:390px;height:844px;background:white;z-index:100';
    await new Promise(resolve => { frame.onload = resolve; frame.src = path; document.body.append(frame); });
    w = frame.contentWindow; d = w.document; form = d.querySelector('[data-callback-form]');
    await w.document.fonts.ready;
    if (form && new URL(form.action).origin !== location.origin) throw new Error('Non-local form action');
    const endpoint = d.body.dataset.beacon;
    if (endpoint && new URL(endpoint).origin !== location.origin) throw new Error('Non-local beacon');
    d.addEventListener('click', e => { if (e.target.closest('a[href^="tel:"], a[href^="sms:"], a[href^="mailto:"]')) e.preventDefault(); }, true);
  }
  const fill = (id, value) => { const e = d.getElementById('hs-' + id); e.value = value; e.dispatchEvent(new w.Event('input', { bubbles: true })); };
  const file = (name, type, bytes) => new w.File([new Uint8Array(bytes)], name, { type });
  const pick = files => { const input = d.getElementById('hs-files'); const dt = new w.DataTransfer(); files.forEach(f => dt.items.add(f)); input.files = dt.files; input.dispatchEvent(new w.Event('change', { bubbles: true })); };
  const rows = () => [...d.querySelectorAll('.hs-file')];
  const clearFiles = () => { while (d.querySelector('.hs-file__rm')) d.querySelector('.hs-file__rm').click(); };
  const error = () => !d.querySelector('[data-form-error]').hidden;
  const submit = () => form.requestSubmit();
  const count = () => stub('count');
  try {
    await go();
    const names = [...form.elements].map(e => e.name).filter(Boolean);
    const wire = ['kind', 'site', 'website', 'service', 'location', 'name', 'phone', 'message', 'contact_time', 'files'];
    ok(names.every(n => wire.includes(n)) && wire.every(n => names.includes(n)), 'exact wire fields');
    const upload = d.getElementById('hs-files');
    ok(upload.multiple && !upload.hasAttribute('capture') && upload.accept.includes('image/heic'), 'optional multiple camera/library upload, HEIC accepted');
    d.querySelector('.hs-svc__ask').click();
    ok(d.getElementById('hs-service').value === d.querySelector('.hs-svc__ask').dataset.service, 'service preselection');
    pick([file('katilas.jpg', 'image/jpeg', 2000), file('lentele.heic', '', 3000)]);
    pick([file('ekranas.png', 'image/png', 1000)]);
    ok(rows().length === 3 && rows().every(r => !r.classList.contains('is-bad')), 'additive upload, HEIC without MIME');
    d.querySelectorAll('.hs-file__rm')[1].click();
    ok(rows().length === 2 && upload.files.length === 2, 'individual removal and native file mirror');
    pick([file('large.jpg', 'image/jpeg', 11 * 1024 * 1024), file('bad.exe', 'application/x-msdownload', 10)]);
    ok(rows().filter(r => r.classList.contains('is-bad')).length === 2, 'oversize and disallowed type identified');
    fill('phone', '060000000'); let before = await count(); submit(); await wait(80);
    ok(error() && await count() === before, 'invalid uploads never posted');
    clearFiles(); pick(Array.from({ length: 9 }, (_, i) => file(`n${i}.jpg`, 'image/jpeg', 10)));
    ok(rows().filter(r => r.classList.contains('is-bad')).length === 1, 'ninth file blocked');
    clearFiles(); pick([0, 1, 2].map(i => file(`total${i}.pdf`, 'application/pdf', 9 * 1024 * 1024)));
    ok(d.querySelector('[data-file-sum]').classList.contains('is-bad'), '25 MiB total limit');
    clearFiles(); fill('message', 'x'.repeat(2000)); fill('brand', 'Model'); before = await count(); submit(); await wait(80);
    ok(error() && await count() === before && d.getElementById('hs-message').value.length === 2000, 'composed message length rejected without truncation');
    await go(); fill('phone', '1       '); before = await count(); submit(); await wait(80);
    ok(await count() === before && !d.getElementById('hs-phone').checkValidity(), 'minimum phone digit count enforced');

    await stub('status/400'); await go(); fill('phone', '060000000'); fill('message', 'Sintetinis testas'); pick([file('keep.txt', 'text/plain', 30)]);
    submit(); await wait(150);
    ok(error() && !form.querySelector('button[type=submit]').disabled && rows().length === 1 && d.getElementById('hs-message').value === 'Sintetinis testas', 'explicit rejection preserves input/files and allows retry');
    ok(d.activeElement === d.querySelector('[data-form-error]') && d.querySelector('[data-form-error] a').getAttribute('href').startsWith('tel:'), 'error focused, direct phone available');
    await stub('status/429'); submit(); await wait(150);
    ok(d.querySelector('[data-form-error-text]').textContent.includes('Per daug bandymų'), 'rate limit explained');
    await stub('status/500'); submit(); await wait(150);
    ok(error() && form.querySelector('button[type=submit]').disabled && d.querySelector('[data-form-error-text]').textContent.includes('ar užklausa gauta'), '500 outcome uncertain, no blind retry');
    before = await count(); submit(); await wait(80); ok(await count() === before, 'uncertain outcome blocks repeat POST');

    await go(); fill('phone', '060000000'); w.fetch = () => Promise.reject(new TypeError('synthetic offline')); submit(); await wait(80);
    ok(error() && form.querySelector('button[type=submit]').disabled && d.getElementById('hs-phone').value === '060000000', 'offline outcome preserves input and asks to verify by phone');
    await go(); fill('phone', '060000000'); w.fetch = () => Promise.resolve(new w.Response('<html>bad gateway</html>', { status: 200 })); submit(); await wait(80);
    ok(error() && form.querySelector('button[type=submit]').disabled, 'non-JSON success is uncertain, never success UI');

    await stub('status/200'); await go();
    const beaconBefore = (await stub('beacons')).length;
    d.querySelector('a[data-cta="cta_call"]').click(); d.querySelector('a[data-cta="cta_sms"]').click(); await wait(150);
    const beacons = (await stub('beacons')).slice(beaconBefore).map(JSON.parse);
    ok(beacons.some(b => b.type === 'cta_call') && beacons.some(b => b.type === 'cta_sms') && beacons.every(b => b.site === 'demo-silumos' && Object.keys(b).length === 2), 'call/SMS beacons only contain site and type; dial prevented');

    fill('phone', '060000000'); fill('name', 'Testas'); fill('location', 'Kaunas'); fill('message', 'Neveikia katilas'); fill('brand', 'Vaillant ecoTEC'); fill('code', 'F28');
    d.getElementById('hs-service').selectedIndex = 1; d.getElementById('hs-time-evening').checked = true;
    pick([file('katilas.jpg', 'image/jpeg', 2000), file('lentele.heic', '', 3000)]);
    before = await count(); submit(); submit(); await wait(500);
    ok(await count() === before + 1, 'double submit sends once');
    const last = Object.groupBy(await stub('last'), ([k]) => k); const value = k => last[k]?.[0][1];
    ok(value('kind') === 'site_inquiry' && value('site') === 'demo-silumos' && value('phone') === '060000000' && value('location') === 'Kaunas' && value('contact_time') === 'evening' && value('website') === '', 'multipart values, honeypot and site routing');
    ok(value('message')?.replace(/\r\n/g, '\n') === 'Katilo markė ir modelis: Vaillant ecoTEC\nKlaidos kodas: F28\n\nNeveikia katilas' && !last.brand && !last.code, 'brand/code composed into existing message contract');
    ok(last.files?.map(([, f]) => f.name).join() === 'katilas.jpg,lentele.heic' && last.files[1][1].type === 'image/heic', 'repeated file parts reach local stub with normalized HEIC MIME');
    ok(w.location.pathname.replace(/\/$/, '') === '/aciu' && !w.document.querySelector('[data-aciu-ok]').hidden, 'durable fake receipt navigates to thanks');
    w.sessionStorage.clear(); await go('/aciu');
    ok(!d.querySelector('[data-aciu-neutral]').hidden && d.querySelector('[data-aciu-ok]').hidden, 'direct thanks visit without receipt remains neutral');
    await go('/aciu?klaida=1');
    ok(!d.querySelector('[data-aciu-error]').hidden, 'native error redirect shows failure');
    await go(); d.getElementById('hs-phone').focus(); await wait(100);
    ok(d.querySelector('[data-dock]').classList.contains('is-hidden'), 'mobile dock hides while typing');
    ok(d.documentElement.scrollWidth <= 390, 'form reflows within 390px');
    for (const status of [200, 400]) {
      await stub('status/' + status); await go('/', true);
      ok(d.getElementById('hs-files').getBoundingClientRect().width > 50 && !form.classList.contains('is-js'), `no-JS ${status}: native file control visible`);
      fill('phone', '060000000'); before = await count(); submit(); await wait(350);
      ok(await count() === before + 1 && w.location.pathname.replace(/\/$/, '') === '/aciu', `no-JS ${status}: native POST and redirect`);
      ok(!w.document.querySelector('[data-aciu-neutral]').hidden && w.document.querySelector('[data-aciu-ok]').hidden && w.document.querySelector('[data-aciu-error]').hidden, `no-JS ${status}: neutral receipt status and phone fallback`);
    }
  } finally {
    if (frame) frame.remove();
    await stub('status/200');
  }
  return { checks: results, passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length };
})()
