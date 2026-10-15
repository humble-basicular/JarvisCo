/* Live client-site script (inlined into the page). Plain ES5-ish, no deps.
   - cta_call / cta_sms beacons: {site,type} as text/plain via sendBeacon.
   - callback form: fetch with Accept: application/json; on any error show the
     business tel: link. Without JS the form posts natively and the Worker
     answers 303 to /aciu (or /aciu?klaida=1). */
(function () {
  var body = document.body;
  var site = body.getAttribute('data-site');
  var beacon = body.getAttribute('data-beacon');
  if (!site || !beacon) return;

  function send(type) {
    var payload = JSON.stringify({ site: site, type: type });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(beacon, new Blob([payload], { type: 'text/plain' }))) return;
    } catch (e) {}
    try { fetch(beacon, { method: 'POST', body: payload, headers: { 'content-type': 'text/plain' }, keepalive: true, mode: 'no-cors' }); } catch (e) {}
  }
  document.addEventListener('click', function (event) {
    var a = event.target.closest && event.target.closest('a[data-cta]');
    var type = a && a.getAttribute('data-cta');
    if (type === 'cta_call' || type === 'cta_sms') send(type);
  });

  var form = document.querySelector('[data-callback-form]');
  if (!form) return;
  var errorBox = form.querySelector('[data-form-error]');
  var errorText = form.querySelector('[data-form-error-text]');
  var thanks = document.querySelector('[data-form-thanks]');
  var button = form.querySelector('button[type="submit"]');
  var label = button.textContent;

  var messages = {
    invalid: 'Patikrinkite telefono numerį.',
    too_large: 'Failai per dideli.',
    file_type: 'Šio tipo failų priimti negalime.',
    rate_limited: 'Per daug bandymų. Pabandykite vėliau.',
  };

  var MAX_FILES = 8, MAX_FILE = 10 * 1024 * 1024, MAX_TOTAL = 25 * 1024 * 1024;
  var TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif', 'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'];
  /* Same limits as the Worker; returns a message or ''. */
  function checkFiles() {
    var input = form.querySelector('input[type="file"]');
    var files = input && input.files ? Array.prototype.slice.call(input.files).filter(function (f) { return f.size || f.name; }) : [];
    var total = 0;
    if (files.length > MAX_FILES) return 'Per daug failų: daugiausia 8.';
    for (var i = 0; i < files.length; i++) {
      if (TYPES.indexOf(files[i].type) < 0) return 'Šio tipo failų priimti negalime: ' + files[i].name + '.';
      if (files[i].size > MAX_FILE) return 'Failas per didelis (daugiausia 10 MB): ' + files[i].name + '.';
      total += files[i].size;
    }
    return total > MAX_TOTAL ? 'Failai per dideli (iš viso daugiausia 25 MB).' : '';
  }

  var inFlight = false;
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (inFlight) return;
    var fail = function (text) {
      inFlight = false;
      errorText.textContent = text || 'Nepavyko išsiųsti.';
      errorBox.hidden = false;
      button.disabled = false;
      button.textContent = label;
    };
    errorBox.hidden = true;
    var problem = checkFiles();
    if (problem) { fail(problem); return; }
    inFlight = true;
    button.disabled = true;
    button.textContent = 'Siunčiama…';
    fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (json) { return { res: res, json: json }; });
      })
      .then(function (r) {
        if (r.res.ok && r.json && r.json.ok) {
          form.hidden = true;
          thanks.hidden = false;
          thanks.scrollIntoView({ block: 'center' });
        } else {
          fail(messages[r.json && r.json.error]);
        }
      })
      .catch(function () { fail(); });
  });
})();
