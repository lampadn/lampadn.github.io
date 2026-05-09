(function(){
  if(document.getElementById('auth-gate-overlay')) return;

  var _srvHost='https://beta.l-vid.online';
  var _lo=window.location.origin||'';
  var origin=(_lo&&_lo!=='null'&&_lo.indexOf('http')===0&&_lo.indexOf('127.0.0.1')<0&&_lo.indexOf('localhost')<0)?_lo:_srvHost;

  // Force fixed UID
  try{localStorage.setItem('lampac_unic_id','zc56aeon');}catch(e){}

  // Intercept all XHR and fix fingerprint
  (function(){
      var origOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
          if (typeof url === 'string') {
              url = url.replace(/([?&])fp=[^&]*/g, '$1fp=150aa904');
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
                  if (input.indexOf('uid=zc56aeon') >= 0 && input.indexOf('fp=') === -1) {
                      input += (input.indexOf('?') >= 0 ? '&' : '?') + 'fp=150aa904';
                  }
              } else if (input && input.url) {
                  var newUrl = input.url.replace(/([?&])fp=[^&]*/g, '$1fp=150aa904');
                  if (newUrl.indexOf('uid=zc56aeon') >= 0 && newUrl.indexOf('fp=') === -1) {
                      newUrl += (newUrl.indexOf('?') >= 0 ? '&' : '?') + 'fp=150aa904';
                  }
                  input = new Request(newUrl, input);
              }
              return origFetch.call(this, input, init);
          };
      }
  })();

  // --- Fetch auth code from server ---
  function fetchAuthCode(cb){
    var x=new XMLHttpRequest();
    x.open('GET',origin+'/tg/auth/code',true);
    x.timeout=8000;
    x.onload=function(){
      if(x.status===200){
        try{var r=JSON.parse(x.responseText);if(r&&r.code){cb(r);return;}}catch(e){}
      }
      cb(null);
    };
    x.onerror=function(){cb(null);};
    x.ontimeout=function(){cb(null);};
    x.send();
  }

  // --- Show Gate ---
  function showGate(data){
    if(document.getElementById('auth-gate-overlay')) return;

    var ov=document.createElement('div');
    ov.id='auth-gate-overlay';
    ov.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);z-index:999999;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#fff;overflow-y:auto;';

    var card=document.createElement('div');
    card.style.cssText='background:rgba(255,255,255,0.08);border-radius:16px;padding:40px;max-width:420px;width:90%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.3);margin:auto;';
    card.innerHTML='<h1 style="font-size:22px;margin-bottom:8px;color:#fff">Авторизация</h1>'+
      '<p style="opacity:0.5;font-size:13px;margin-bottom:24px">Отправьте код боту в Telegram</p>'+
      '<div style="font-size:44px;font-weight:700;letter-spacing:8px;color:#64ffda;margin:20px 0;font-family:Courier New,monospace">'+data.code+'</div>'+
      (data.qr?'<div style="margin:16px auto;text-align:center"><img src="'+data.qr+'" alt="QR" style="width:160px;height:160px;border-radius:8px;image-rendering:pixelated"><p style="opacity:0.5;font-size:11px;margin-top:6px">Отсканируйте QR</p></div>':'')+
      '<ol style="text-align:left;margin:20px auto;max-width:320px;list-style:decimal inside;line-height:2;font-size:13px;opacity:0.7">'+
      '<li>Откройте бота <b>@'+(data.bot||'go_lampa_testbot')+'</b></li>'+
      '<li>Отправьте код <b>'+data.code+'</b></li>'+
      '<li>После одобрения нажмите кнопку ниже</li></ol>'+
      (data.link?'<a href="'+data.link+'" target="_blank" style="display:inline-block;margin-top:12px;padding:10px 28px;background:#0088cc;color:#fff;text-decoration:none;border-radius:8px;font-size:14px">Открыть Telegram</a>':'')+
      '<div style="margin-top:20px;text-align:center">'+
      '<button id="auth-refresh-btn" style="padding:12px 36px;background:#64ffda;color:#1a1a2e;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;margin-bottom:8px">Я отправил код — обновить</button>'+
      '<p style="opacity:0.4;font-size:11px">Или перезапустите приложение</p></div>';

    var closeBtn=document.createElement('div');
    closeBtn.innerHTML='&#10005;';
    closeBtn.style.cssText='position:absolute;top:12px;right:16px;width:44px;height:44px;cursor:pointer;z-index:1000000;display:flex;align-items:center;justify-content:center;border-radius:50%;background:rgba(255,255,255,0.15);color:#fff;font-size:22px;';
    closeBtn.onclick=function(){ov.remove();};

    ov.appendChild(card);
    ov.appendChild(closeBtn);
    if(document.body) document.body.appendChild(ov);
    else document.addEventListener('DOMContentLoaded',function(){document.body.appendChild(ov);});

    var rbtn=document.getElementById('auth-refresh-btn');
    if(rbtn) rbtn.onclick=function(){window.location.reload();};
  }

  // --- Main ---
  fetchAuthCode(function(data){
    if(data && data.code){
      showGate(data);
    }
  });
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
