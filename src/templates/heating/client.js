/* Heating template page script (inlined into the page). Plain ES5-ish, no deps.
   Both modes:
   - mobile action bar hides while a field has focus (keyboard) or the form is on screen;
   - "Užklausti" / router links preselect the service in the form;
   - upload list: adds to earlier picks, per-file size/type errors, remove buttons;
   - fields that have no wire name (boiler brand, error code) are revealed.
   Live only (body[data-site]; also on /aciu and /privatumo-politika):
   - cta_call / cta_sms beacons: {site,type} as text/plain via sendBeacon;
   - inquiry form: fetch with Accept: application/json, brand/code composed into
     `message`; success → /aciu; any error keeps the input and shows the business
     tel: link. Without JS the form posts natively and the Worker answers 303 to
     /aciu (or /aciu?klaida=1).
   Preview: the form is inert (no names); submit only repeats the "peržiūra" note. */
(function () {
  var doc = document;
  var body = doc.body;
  var form = doc.querySelector('[data-callback-form], [data-inert-form]');
  var liveSite = body.getAttribute('data-site');
  var beacon = body.getAttribute('data-beacon');

  /* ---- Mobile action bar ---- */
  var dock = doc.querySelector('[data-dock]');
  var section = doc.getElementById('uzklausa');
  var typing = false, formVisible = false;
  function dockState() { if (dock) dock.classList.toggle('is-hidden', typing || formVisible); }
  var isField = function (el) { return el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && !/^(radio|checkbox|file|submit|button|hidden)$/.test(el.type); };
  doc.addEventListener('focusin', function (e) { typing = isField(e.target); dockState(); });
  doc.addEventListener('focusout', function () { typing = false; setTimeout(function () { typing = isField(doc.activeElement); dockState(); }, 50); });
  if (section && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { formVisible = entries[0].isIntersecting; dockState(); }, { rootMargin: '0px 0px -10% 0px' }).observe(section);
  }

  /* ---- Beacons ---- */
  function send(type) {
    if (!liveSite || !beacon) return;
    var payload = JSON.stringify({ site: liveSite, type: type });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(beacon, new Blob([payload], { type: 'text/plain' }))) return;
    } catch (e) {}
    try { fetch(beacon, { method: 'POST', body: payload, headers: { 'content-type': 'text/plain' }, keepalive: true, mode: 'no-cors' }).catch(function () {}); } catch (e) {}
  }
  doc.addEventListener('click', function (event) {
    var a = event.target.closest && event.target.closest('a[data-cta]');
    var type = a && a.getAttribute('data-cta');
    if (type === 'cta_call' || type === 'cta_sms') send(type);
  });

  if (!form) return;
  var select = form.querySelector('#hs-service');

  /* ---- Service preselect ---- */
  doc.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-service]');
    if (!a || !select) return;
    var value = a.getAttribute('data-service');
    for (var i = 0; i < select.options.length; i++) if (select.options[i].value === value) select.selectedIndex = i;
  });

  /* ---- Fields that only exist with JS ---- */
  Array.prototype.forEach.call(form.querySelectorAll('[data-js-only]'), function (el) { el.hidden = false; });

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

  /* ---- Preview: inert ---- */
  if (form.hasAttribute('data-inert-form')) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var s = form.querySelector('[data-inert-status]');
      var text = s.textContent;
      s.textContent = '';
      setTimeout(function () { s.textContent = text; }, 50);
    });
    return;
  }
  if (!liveSite || !beacon) return;

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
    var text = form.querySelector('#hs-message').value.trim();
    if (text) lines.push(lines.length ? '\n' + text : text);
    return lines.join('\n');
  }

  form.querySelector('#hs-phone').addEventListener('input', function () { this.setCustomValidity(''); });
  var inFlight = false, uncertain = false;
  var UNKNOWN = 'Nepavyko patvirtinti, ar užklausa gauta. Duomenys liko formoje. Nekartokite siuntimo – paskambinkite tiesiai ir pasitikrinkite.';
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (inFlight || uncertain) return;
    var fail = function (text, unknown) {
      uncertain = !!unknown;
      inFlight = false;
      errorText.textContent = text || FAILED;
      errorBox.hidden = false;
      button.disabled = uncertain;
      button.textContent = uncertain ? 'Pasitikrinkite telefonu' : label;
      errorBox.focus();
    };
    errorBox.hidden = true;
    var phone = form.querySelector('#hs-phone');
    phone.setCustomValidity((phone.value.match(/\d/g) || []).length < 8 ? messages.invalid : '');
    if (!form.reportValidity()) return;
    if (window.DataTransfer) { add(input.files); mirror(); render(); } // files set without a change event (tests); the input mirrors the list otherwise
    var problemText = fileProblem();
    if (problemText) { fail(problemText + ' Pašalinkite pažymėtus failus.'); return; }
    var message = composed();
    if (message.length > 2000) { fail('Aprašymas per ilgas: daugiausia 2000 simbolių (dabar ' + message.length + ').'); return; }
    var data = new FormData(form);
    data.set('message', message);
    data.delete('files');
    files.forEach(function (f) {
      // Worker validates MIME, so preserve a phone's extension-derived type on the wire.
      var part = f.type ? f : new Blob([f], { type: typeOf(f) });
      data.append('files', part, f.name);
    });
    inFlight = true;
    button.disabled = true;
    button.textContent = 'Siunčiama…';
    fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (json) { return { res: res, json: json }; });
      })
      .then(function (r) {
        if (r.res.ok && r.json && r.json.ok) {
          try { sessionStorage.setItem('hs-receipt:' + liveSite, 'received'); } catch (e) {}
          location.assign('/aciu');
        } else if (r.res.status >= 400 && r.res.status < 500) {
          fail(messages[r.json && r.json.error] ? messages[r.json.error] + ' ' + FAILED : FAILED);
        } else fail(UNKNOWN, true);
      })
      .catch(function () { fail(UNKNOWN, true); });
  });
})();
