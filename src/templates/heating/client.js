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

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    errorBox.hidden = true;
    button.disabled = true;
    button.textContent = 'Siunčiama…';
    var fail = function (text) {
      errorText.textContent = text || 'Nepavyko išsiųsti.';
      errorBox.hidden = false;
      button.disabled = false;
      button.textContent = label;
    };
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
