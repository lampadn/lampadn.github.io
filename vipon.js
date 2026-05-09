(function(){
  if(document.getElementById('auth-gate-overlay')) return;

  var _srvHost='https://beta.l-vid.online';
  var _lo=window.location.origin||'';
  var origin=(_lo&&_lo!=='null'&&_lo.indexOf('http')===0&&_lo.indexOf('127.0.0.1')<0&&_lo.indexOf('localhost')<0)?_lo:_srvHost;

  // Force fixed UID
  try{localStorage.setItem('lampac_unic_id','zc56aeon');}catch(e){}

  // Intercept all XHR and fix fingerprint + nws_id
  (function(){
      var origOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
          if (typeof url === 'string') {
              url = url.replace(/([?&])fp=[^&]*/g, '$1fp=150aa904');
              url = url.replace(/([?&])nws_id=[^&]*/g, '$1nws_id=4rd1wpvxc0veq3ci62k6vso2z1vcpwwi');
              if (url.indexOf('uid=zc56aeon') >= 0 && url.indexOf('fp=') === -1) {
                  url += (url.indexOf('?') >= 0 ? '&' : '?') + 'fp=150aa904';
              }
          }
          return origOpen.call(this, method, url, async, user, password);
      };
      // Also intercept fetch()
      if (window.fetch) {
          var origFetch = window.fetch;
          window.fetch = function(input, init) {
              if (typeof input === 'string') {
                  input = input.replace(/([?&])fp=[^&]*/g, '$1fp=150aa904');
                  input = input.replace(/([?&])nws_id=[^&]*/g, '$1nws_id=4rd1wpvxc0veq3ci62k6vso2z1vcpwwi');
                  if (input.indexOf('uid=zc56aeon') >= 0 && input.indexOf('fp=') === -1) {
                      input += (input.indexOf('?') >= 0 ? '&' : '?') + 'fp=150aa904';
                  }
              } else if (input && input.url) {
                  var newUrl = input.url.replace(/([?&])fp=[^&]*/g, '$1fp=150aa904');
                  newUrl = newUrl.replace(/([?&])nws_id=[^&]*/g, '$1nws_id=4rd1wpvxc0veq3ci62k6vso2z1vcpwwi');
                  if (newUrl.indexOf('uid=zc56aeon') >= 0 && newUrl.indexOf('fp=') === -1) {
                      newUrl += (newUrl.indexOf('?') >= 0 ? '&' : '?') + 'fp=150aa904';
                  }
                  input = new Request(newUrl, input);
              }
              return origFetch.call(this, input, init);
          };
      }
  })();

  // No gate - just let the plugin load
})();

// --- Load Lampa plugin ---
(function(){
    'use strict';

    if (window.alcopac_onjs) return;
    window.alcopac_onjs = true;
    window.alcopac = true;

    if (!window.lampa_settings) window.lampa_settings = {};
    if (!window.lampa_settings.disable_features) window.lampa_settings.disable_features = {};
    window.lampa_settings.disable_features.lgbt = true;

    try{localStorage.setItem('lampac_unic_id','zc56aeon');}catch(e){}

    // Intercept all XHR requests and fix fingerprint to Windows value
    (function(){
        var origOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
            if (typeof url === 'string') {
                // Replace fp parameter with fixed Windows fingerprint
                url = url.replace(/([?&])fp=[^&]*/g, '$1fp=150aa904');
                // If no fp exists but url has uid=zc56aeon, add fp
                if (url.indexOf('uid=zc56aeon') >= 0 && url.indexOf('fp=') === -1) {
                    url += (url.indexOf('?') >= 0 ? '&' : '?') + 'fp=150aa904';
                }
            }
            return origOpen.call(this, method, url, async, user, password);
        };
    })();

    var timer = setInterval(function(){
        if(typeof Lampa !== 'undefined'){
            clearInterval(timer);
            Lampa.Storage.set('lampac_unic_id', 'zc56aeon');
            Lampa.Utils.putScriptAsync(["https://beta.l-vid.online/online.js","https://beta.l-vid.online/catalog.js"], function() {});
        }
    },200);
})();
