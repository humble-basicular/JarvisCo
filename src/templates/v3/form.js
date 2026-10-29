/* Form validation, upload limits and receipt/failure lifecycle adapted from heating/client.js.
   Worker contract: tracking/README.md § Client sites. Each card owns its inputs; requests
   share a lock, so opening another card cannot duplicate an uncertain submission. */
(function () {
  var doc = document;
  var liveSite = doc.body.getAttribute('data-site');
  if (!liveSite) return;
  var started = Date.now();
  var sourceClasses = ['GoogleAds','organicGoogle','Bing','ChatGPT','Perplexity','Copilot','Gemini','Claude','social','utm','directunknown','otherhost'];
  function safePath(p) {
    return typeof p === 'string' && p.length <= 120 && /^\/(?!\/)[a-zA-Z0-9_~.%/\-]*$/.test(p) && !/%(?:25|2[36f]|3[fF]|5[cC]|0[0-9a-f]|1[0-9a-f]|7f)/i.test(p) ? p : '/';
  }
  function firstTouch() {
    var key = 'jw-first-touch:' + liveSite, saved;
    try { saved = JSON.parse(sessionStorage.getItem(key)); } catch (e) {}
    if (saved && sourceClasses.indexOf(saved.source) >= 0 && safePath(saved.path) === saved.path) return saved;
    var q = new URLSearchParams(location.search), host = '', source = 'directunknown';
    try { host = new URL(doc.referrer).hostname.toLowerCase(); } catch (e) {}
    var internal = host && host.replace(/^www\./, '') === location.hostname.replace(/^www\./, '');
    if (['gclid','gbraid','wbraid','gad_source'].some(function (k) { return q.has(k); })) source = 'GoogleAds';
    else if (!internal && host) {
      var matches = function (h) { return host === h || host.endsWith('.' + h); };
      if (matches('chatgpt.com') || matches('chat.openai.com')) source = 'ChatGPT';
      else if (matches('perplexity.ai')) source = 'Perplexity';
      else if (matches('copilot.microsoft.com')) source = 'Copilot';
      else if (matches('gemini.google.com')) source = 'Gemini';
      else if (matches('claude.ai')) source = 'Claude';
      else if (/^(www\.)?google\.(com|lt|co\.uk|de|fr|lv|ee|pl)$/.test(host)) source = 'organicGoogle';
      else if (matches('bing.com')) source = 'Bing';
      else if (['facebook.com','instagram.com','linkedin.com','t.co','twitter.com','x.com','tiktok.com','youtube.com'].some(matches)) source = 'social';
      else source = 'otherhost';
    }
    if (source === 'directunknown' || source === 'otherhost') {
      if (Array.from(q.keys()).some(function (k) { return /^utm_/i.test(k); })) source = 'utm';
    }
    saved = { source: source, path: safePath(location.pathname) };
    try { sessionStorage.setItem(key, JSON.stringify(saved)); } catch (e) {}
    return saved;
  }
  var attribution = ['meselektra','vensland'].indexOf(liveSite) >= 0 ? firstTouch() : null;
  var loader;
  function loadWidget() {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (!loader) loader = new Promise(function (resolve, reject) {
      var script = doc.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = function () { if (window.turnstile) resolve(window.turnstile); else reject(); };
      script.onerror = function () { loader = null; script.remove(); reject(); };
      doc.head.appendChild(script);
    });
    return loader;
  }

  var state = { inFlight: false, uncertain: false };
  var buttons = Array.from(doc.querySelectorAll('[data-callback-form] button[type=submit]'));
  try { sessionStorage.removeItem('hs-receipt:' + liveSite); } catch (e) {}
  doc.querySelectorAll('[data-callback-form]').forEach(function (form) {
  var widgetKey = attribution && form.getAttribute('data-widget-key');
  var widgetId, token = '', loading = false;
  var status, holder;
  if (widgetKey) {
    form.noValidate = true;
    status = doc.createElement('p'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    status.textContent = 'Saugumo patikra bus įkelta pradėjus pildyti formą. Jei nepavyksta, paskambinkite tiesiai.';
    holder = doc.createElement('div');
    form.insertBefore(status, form.querySelector('button[type=submit]'));
    form.insertBefore(holder, status);
    form.addEventListener('focusin', activate);
    form.addEventListener('pointerdown', activate);
  }
  function activate() {
    if (!widgetKey || widgetId !== undefined || loading) return;
    loading = true;
    status.textContent = 'Įkeliama saugumo patikra…';
    loadWidget().then(function (api) {
      loading = false;
      widgetId = api.render(holder, { sitekey: widgetKey, appearance: 'interaction-only', size: 'flexible', language: 'lt', 'response-field': false,
        callback: function (value) { token = value; status.textContent = 'Saugumo patikra atlikta. Galite siųsti užklausą.'; },
        'expired-callback': function () { token = ''; status.textContent = 'Patikra baigė galioti. Atlikite ją dar kartą.'; resetWidget(); },
        'error-callback': function () { token = ''; status.textContent = 'Patikra nepavyko. Bandykite dar kartą arba paskambinkite.'; }
      });
    }).catch(function () { loading = false; status.textContent = 'Patikros įkelti nepavyko. Palieskite formą ir bandykite dar kartą arba paskambinkite.'; });
  }
  function resetWidget() {
    token = '';
    if (widgetId !== undefined && window.turnstile) { try { window.turnstile.reset(widgetId); } catch (e) {} }
  }
  /* ---- Upload list ---- */
  var MAX_FILES = 8, MAX_FILE = 10 * 1024 * 1024, MAX_TOTAL = 25 * 1024 * 1024;
  var TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif', 'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'];
  var EXT = { heic: 'image/heic', heif: 'image/heif', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', pdf: 'application/pdf', txt: 'text/plain',
    doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
  var input = form.querySelector('input[type="file"]');
  var list = form.querySelector('[data-file-list]');
  var sum = form.querySelector('[data-file-sum]');
  var files = [];
  form.classList.add('is-js');

  function ext(f) { var m = /\.([a-z0-9]+)$/i.exec(f.name); return m ? m[1].toLowerCase() : ''; }
  /* Some phones send HEIC with an empty type: fall back to the extension. */
  function typeOf(f) { return f.type || EXT[ext(f)] || ''; }
  function mb(n) { return (n / 1048576).toFixed(n < 104858 ? 2 : 1).replace('.', ',') + ' MB'; }
  function problem(f, i) {
    if (i >= MAX_FILES) return 'Per daug failų: daugiausia 8.';
    if (TYPES.indexOf(typeOf(f)) < 0) return 'Šio tipo failų priimti negalime: ' + f.name + '.';
    if (f.size > MAX_FILE) return 'Failas per didelis (daugiausia 10 MB): ' + f.name + '.';
    return '';
  }
  function total() { var s = 0; for (var i = 0; i < files.length; i++) s += files[i].size; return s; }
  /** First blocking message, or ''. */
  function fileProblem() {
    for (var i = 0; i < files.length; i++) { var p = problem(files[i], i); if (p) return p; }
    return total() > MAX_TOTAL ? 'Failai per dideli: kartu daugiausia 25 MB.' : '';
  }
  function same(a, b) { return a.name === b.name && a.size === b.size && a.lastModified === b.lastModified; }
  function add(picked) {
    for (var i = 0; i < picked.length; i++) {
      var dup = false;
      for (var j = 0; j < files.length; j++) if (same(files[j], picked[i])) dup = true;
      if (!dup && (picked[i].size || picked[i].name)) files.push(picked[i]);
    }
  }
  /* Keep the native input in step with the list (so a plain FormData matches what is shown). */
  function mirror() {
    try { var dt = new DataTransfer(); files.forEach(function (f) { dt.items.add(f); }); input.files = dt.files; } catch (e) {}
  }
  function render() {
    if (!list) return;
    list.textContent = '';
    files.forEach(function (f, i) {
      var li = doc.createElement('li');
      var p = problem(f, i);
      li.className = 'hs-file' + (p ? ' is-bad' : '');
      var thumb = doc.createElement('span');
      thumb.className = 'hs-file__thumb';
      thumb.setAttribute('aria-hidden', 'true');
      thumb.textContent = (ext(f) || 'failas').toUpperCase().slice(0, 4);
      if (/^image\/(jpeg|png|webp|gif)$/.test(f.type) && window.URL && URL.createObjectURL) {
        var img = doc.createElement('img');
        img.alt = '';
        img.onload = function () { URL.revokeObjectURL(img.src); };
        img.onerror = function () { URL.revokeObjectURL(img.src); img.remove(); }; // no preview: keep the type label
        img.src = URL.createObjectURL(f);
        thumb.appendChild(img);
      }
      var meta = doc.createElement('span');
      meta.className = 'hs-file__meta';
      var name = doc.createElement('span');
      name.className = 'hs-file__name';
      name.textContent = f.name;
      var size = doc.createElement('span');
      size.className = 'hs-file__size';
      size.textContent = mb(f.size);
      meta.appendChild(name);
      meta.appendChild(size);
      if (p) { var err = doc.createElement('span'); err.className = 'hs-file__err'; err.textContent = p; meta.appendChild(err); }
      var rm = doc.createElement('button');
      rm.type = 'button';
      rm.className = 'hs-file__rm';
      rm.textContent = 'Pašalinti';
      rm.setAttribute('aria-label', 'Pašalinti ' + f.name);
      rm.addEventListener('click', function () {
        files.splice(i, 1); mirror(); render();
        (list.querySelector('.hs-file__rm') || input).focus();
      });
      li.appendChild(thumb); li.appendChild(meta); li.appendChild(rm);
      list.appendChild(li);
    });
    list.hidden = !files.length;
    var over = total() > MAX_TOTAL;
    sum.className = 'hs-files__sum' + (over ? ' is-bad' : '');
    sum.textContent = files.length ? files.length + ' iš 8 failų, ' + mb(total()) + ' iš 25 MB' + (over ? '. Per daug: pašalinkite dalį failų.' : '.') : '';
  }
  if (input) {
    input.addEventListener('change', function () { add(input.files); mirror(); render(); });
  }

  // A new inquiry must never inherit an earlier submission's confirmation.
  var receiptKey = 'hs-receipt:' + liveSite;
  function clearReceipt() { try { sessionStorage.removeItem(receiptKey); } catch (e) {} }

  /* ---- Submit ---- */
  var errorBox = form.querySelector('[data-form-error]');
  var errorText = form.querySelector('[data-form-error-text]');
  var button = form.querySelector('button[type="submit"]');
  var label = button.textContent;
  var messages = {
    invalid: 'Patikrinkite telefono numerį.',
    too_large: 'Failai per dideli.',
    file_type: 'Šio tipo failų priimti negalime.',
    rate_limited: 'Per daug bandymų. Pabandykite vėliau.',
  };
  var FAILED = 'Užklausos išsiųsti nepavyko. Jūsų įrašyti duomenys liko formoje. Pabandykite dar kartą.';

  /* Brand / error code have no wire field: they go into `message` as labelled lines. */
  function composed() {
    var lines = [];
    Array.prototype.forEach.call(form.querySelectorAll('[data-compose]'), function (el) {
      var v = el.value.trim();
      if (v) lines.push(el.getAttribute('data-compose') + ': ' + v);
    });
    var text = form.querySelector('[name=message]').value.trim();
    if (text) lines.push(lines.length ? '\n' + text : text);
    return lines.join('\n');
  }

  form.querySelector('[name=phone]').addEventListener('input', function () { this.setCustomValidity(''); });

  var UNKNOWN = 'Nepavyko patvirtinti, ar užklausa gauta. Duomenys liko formoje. Nekartokite siuntimo – paskambinkite tiesiai ir pasitikrinkite.';
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (state.inFlight || state.uncertain) return;
    var attemptToken = token;
    resetWidget();
    clearReceipt();
    var fail = function (text, unknown) {
      state.uncertain = !!unknown;
      state.inFlight = false;
      errorText.textContent = text || FAILED;
      errorBox.hidden = false;
      buttons.forEach(function (b) { b.disabled = state.uncertain; });
      button.textContent = state.uncertain ? 'Pasitikrinkite telefonu' : label;
      errorBox.focus();
    };
    errorBox.hidden = true;
    var phone = form.querySelector('[name=phone]');
    phone.setCustomValidity(!/^[-+()\d\s]+$/.test(phone.value.trim()) || (phone.value.match(/\d/g) || []).length < 8 || phone.value.trim().length > 20 ? messages.invalid : '');
    if (!form.reportValidity()) return;
    if (window.DataTransfer) { add(input.files); mirror(); render(); } // files set without a change event (tests); the input mirrors the list otherwise
    var problemText = fileProblem();
    if (problemText) { fail(problemText + ' Pašalinkite pažymėtus failus.'); return; }
    var message = composed();
    if (message.length > 2000) { fail('Aprašymas per ilgas: daugiausia 2000 simbolių (dabar ' + message.length + ').'); return; }
    if (attribution && !widgetKey) { fail('Saugumo patikra nesukonfigūruota. Paskambinkite tiesiai.'); return; }
    if (widgetKey && !attemptToken) { activate(); fail('Atlikite saugumo patikrą ir bandykite dar kartą arba paskambinkite tiesiai.'); return; }
    var data = new FormData(form);
    if (attribution) {
      data.set('source', attribution.source); data.set('landing_path', attribution.path);
      data.set('page', safePath(location.pathname)); data.set('elapsed_ms', String(Math.min(86400000, Math.max(0, Date.now() - started))));
      if (attemptToken) data.set('cf-turnstile-response', attemptToken);
    }
    data.set('message', message);
    data.delete('files');
    files.forEach(function (f) {
      // Worker validates MIME, so preserve a phone's extension-derived type on the wire.
      var part = f.type ? f : new Blob([f], { type: typeOf(f) });
      data.append('files', part, f.name);
    });
    state.inFlight = true;
    buttons.forEach(function (b) { b.disabled = true; });
    button.textContent = 'Siunčiama…';
    fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (json) { return { res: res, json: json }; });
      })
      .then(function (r) {
        if (r.res.ok && r.json && r.json.ok === true && typeof r.json.id === 'string' && r.json.id.length > 0) {
          // Local navigation receipt, not server-side proof or an idempotency key.
          var receipt = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
          try { sessionStorage.setItem(receiptKey, receipt); } catch (e) {}
          location.assign('/aciu/?receipt=' + encodeURIComponent(receipt));
        } else if (r.res.status >= 400 && r.res.status < 500) {
          fail(messages[r.json && r.json.error] ? messages[r.json.error] + ' ' + FAILED : FAILED);
        } else fail(UNKNOWN, true);
      })
      .catch(function () { fail(UNKNOWN, true); });
  });
  });
})();
