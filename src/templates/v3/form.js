/* Form validation, upload limits and receipt/failure lifecycle adapted from heating/client.js.
   Worker contract: tracking/README.md § Client sites. Each card owns its inputs; requests
   share a lock, so opening another card cannot duplicate an uncertain submission. */
(function () {
  var doc = document;
  var liveSite = doc.body.getAttribute('data-site');
  if (!liveSite) return;
  var state = { inFlight: false, uncertain: false };
  var buttons = Array.from(doc.querySelectorAll('[data-callback-form] button[type=submit]'));
  try { sessionStorage.removeItem('hs-receipt:' + liveSite); } catch (e) {}
  doc.querySelectorAll('[data-callback-form]').forEach(function (form) {
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
    var data = new FormData(form);
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
          location.assign('/aciu?receipt=' + encodeURIComponent(receipt));
        } else if (r.res.status >= 400 && r.res.status < 500) {
          fail(messages[r.json && r.json.error] ? messages[r.json.error] + ' ' + FAILED : FAILED);
        } else fail(UNKNOWN, true);
      })
      .catch(function () { fail(UNKNOWN, true); });
  });
  });
})();
