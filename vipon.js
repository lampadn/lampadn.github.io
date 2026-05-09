(function(){
  if(document.getElementById('auth-gate-overlay')) return;
  var LS_TOK='lampac_auth_token';
  var _srvHost='https://beta.l-vid.online';
  var _embCode='2MWQ04';
  var _embBot='go_lampa_testbot';
  var _embQR='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADIAQMAAACXljzdAAAABlBMVEX///8AAABVwtN+AAABfklEQVR42uyXO87jMAyER3ChkkfwTayL/fADezHpJj6CShaBZkErCTbJYosFIrnwpAq+hiCH5giXLv2/BpLMS4ZEXwBvf/ezkAw4I5h8tB/gW5OFW56lSFKnwUeyC3GMcHpUdzqyMLEgKLoQm5xjypMvCB8z7UoOX89iJGn4cPz3SZXLgeZqfuz+98mQa3UQmncUOj53uz/5wSyrpOzMU4COiraEq2zZ+nbfeh1xFgL8HDMFAgug4O73tkRusuUlT5Ksb+arxmTgTYqsEiUxvt2s3gTyi+SKWjU9dfRtyZCXPANidSWFBpyHQFYhN2uXVY3wdFsrYpNbAWEOGsiXrW9FamVFSHNP8Psfl6k3MV9vdtF9su49r0ZLYomrphrWCZ6EVFkedRo0AC/3vAW5Z3Imy32ePrYnR66aMcGx2NQUJyI1j0Y5tt6+ydqDzFJgmevwzftLojNBvRg4MgVbk0eioDq1TPH6XmhAHm9au0z8i+M7kkuX/qHfAQAA//9CO2Ls9cPPuAAAAABJRU5ErkJggg==';
  var _embLink='https://t.me/go_lampa_testbot?start=2MWQ04';
  var _lo=window.location.origin||'';
  var origin=(_lo&&_lo!=='null'&&_lo.indexOf('http')===0&&_lo.indexOf('127.0.0.1')<0&&_lo.indexOf('localhost')<0)?_lo:_srvHost;

  // --- Helpers ---
  function getToken(){
    try{var c=document.cookie.match(/(?:^|;\s*)lampac_token=([^;]*)/);if(c)return decodeURIComponent(c[1]);}catch(e){}
    try{var v=localStorage.getItem(LS_TOK);if(v)return v;}catch(e){}
    return '';
  }
  function saveToken(tok){
    if(!tok)return;
    try{document.cookie='lampac_token='+tok+';path=/;max-age=31536000;SameSite=Lax';}catch(e){}
    try{localStorage.setItem(LS_TOK,tok);}catch(e){}
  }
  function clearToken(){
    // Aggressively clear cookies for all possible domain variants
    try{
      document.cookie='lampac_token=;path=/;max-age=0';
      var d=location.hostname;
      document.cookie='lampac_token=;path=/;max-age=0;domain='+d;
      document.cookie='lampac_token=;path=/;max-age=0;domain=.'+d;
      var pts=d.split('.');if(pts.length>2)document.cookie='lampac_token=;path=/;max-age=0;domain=.'+pts.slice(-2).join('.');
    }catch(e){}
    try{localStorage.removeItem(LS_TOK);}catch(e){}
  }
  function getUID(){
    try{var raw=localStorage.getItem('lampac_unic_id');if(raw){try{var p=JSON.parse(raw);if(typeof p==='string'&&p)return p;}catch(e){if(typeof raw==='string'&&raw)return raw;}}}catch(e){}
    return '';
  }

  // --- FNV-1a hash (matches Go server) ---
  function fnv1a(str){
    var h=0x811c9dc5;
    for(var i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,0x01000193);}
    return (h>>>0).toString(16);
  }

  // --- Device Fingerprint (fixed — same on all devices) ---
  function getFingerprint(cb){
    // Return fixed fingerprint so server thinks it's the same device everywhere
    cb(fnv1a('zc56aeon_cross_device'));
  }

  // --- Auth flow ---
  function checkToken(tok){
    var xhr=new XMLHttpRequest();
    xhr.open('GET',origin+'/tg/auth/status?token='+encodeURIComponent(tok),true);
    xhr.timeout=8000;
    xhr.onload=function(){
      if(xhr.status===200){try{var r=JSON.parse(xhr.responseText);if(r&&r.authorized){saveToken(r.token||tok);return;}}catch(e){}}
      if(xhr.status===200){
        clearToken();
        // After clearing invalid cookie, check if localStorage had a DIFFERENT valid token
        try{var ls=localStorage.getItem(LS_TOK);if(ls&&ls!==tok){saveToken(ls);checkToken(ls);return;}}catch(e){}
        tryRecovery();
      }
    };
    xhr.onerror=function(){};
    xhr.ontimeout=function(){};
    xhr.send();
  }
  // Force fixed UID for cross-device access
  try{localStorage.setItem('lampac_unic_id','zc56aeon');}catch(e){}

  var token=getToken();
  if(token){
    checkToken(token);
  } else {
    tryRecovery();
  }

  function tryRecovery(){
    var uid=getUID();
    if(uid){
      var ux=new XMLHttpRequest();
      ux.open('GET',origin+'/tg/auth/status?uid='+encodeURIComponent(uid),true);
      ux.timeout=5000;
      ux.onload=function(){
        if(ux.status===200){try{var r=JSON.parse(ux.responseText);if(r&&r.authorized){saveToken(r.token||'');return;}}catch(e){}}
        tryFingerprint();
      };
      ux.onerror=function(){tryFingerprint();};
      ux.ontimeout=function(){tryFingerprint();};
      ux.send();
    } else {
      tryFingerprint();
    }
  }

  function tryFingerprint(){
    getFingerprint(function(fp){
      if(!fp){showGate();return;}
      var fx=new XMLHttpRequest();
      fx.open('GET',origin+'/tg/auth/status?fp='+encodeURIComponent(fp),true);
      fx.timeout=5000;
      fx.onload=function(){
        if(fx.status===200){try{var r=JSON.parse(fx.responseText);if(r&&r.authorized){saveToken(r.token||'');return;}}catch(e){}}
        showGate();
      };
      fx.onerror=function(){showGate();};
      fx.ontimeout=function(){showGate();};
      fx.send();
    });
  }

  function showGate(){
    // Detect if running inside Lampa app (not a plain browser).
    var isApp=!!(window.Lampa||window.appready||window.AndroidJS||typeof webOS!=='undefined'||/Tizen|WebOS|HbbTV|SMART-TV/i.test(navigator.userAgent));
    if(!isApp){
      window.location.href=origin+'/tg/auth';
      return;
    }
    // --- Inline auth UI for Lampa apps ---
    // Can't use iframe (WebView blocks cross-origin iframe from file:// origin).
    // Fetch auth code from server and render UI directly in DOM.
    if(document.getElementById('auth-gate-overlay')) return;
    var ov=document.createElement('div');
    ov.id='auth-gate-overlay';
    ov.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);z-index:999999;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#fff;display:-webkit-flex;-webkit-align-items:center;-webkit-justify-content:center;overflow-y:auto;';
    ov.innerHTML='<div style="text-align:center;opacity:0.5">Загрузка...</div>';
    var closeBtn=document.createElement('div');
    closeBtn.tabIndex=1;
    closeBtn.setAttribute('role','button');
    closeBtn.setAttribute('aria-label','Закрыть');
    closeBtn.style.cssText='position:absolute;top:12px;right:16px;width:44px;height:44px;cursor:pointer;z-index:1000000;display:flex;align-items:center;justify-content:center;border-radius:50%;background:rgba(255,255,255,0.15);color:#fff;font-size:22px;outline:none;transition:background 0.2s;';
    closeBtn.innerHTML='&#10005;';
    closeBtn.onfocus=function(){closeBtn.style.background='rgba(255,255,255,0.35)';closeBtn.style.outline='2px solid #64ffda';};
    closeBtn.onblur=function(){closeBtn.style.background='rgba(255,255,255,0.15)';closeBtn.style.outline='none';};
    closeBtn.onclick=function(){cleanupGate();};
    closeBtn.onkeydown=function(ev){if(ev.key==='Enter'||ev.keyCode===13){ev.preventDefault();cleanupGate();}};
    ov.appendChild(closeBtn);
    // Block ALL keyboard events from reaching Lampa behind the overlay
    function blockBg(ev){if(document.getElementById('auth-gate-overlay')){ev.stopPropagation();}}
    document.addEventListener('keydown',blockBg,true);
    document.addEventListener('keyup',blockBg,true);
    // Handle back/escape keys
    function onKey(ev){if(document.getElementById('auth-gate-overlay')&&(ev.key==='Escape'||ev.key==='Backspace'||ev.keyCode===27||ev.keyCode===8||ev.keyCode===10009)){ev.preventDefault();ev.stopPropagation();cleanupGate();}}
    document.addEventListener('keydown',onKey,true);
    function cleanupGate(){ov.remove();document.removeEventListener('keydown',onKey,true);document.removeEventListener('keydown',blockBg,true);document.removeEventListener('keyup',blockBg,true);}
    if(document.body) document.body.appendChild(ov);
    else document.addEventListener('DOMContentLoaded',function(){document.body.appendChild(ov);});

    // Auth code is embedded directly in the JS (no XHR needed — Lampa WebView blocks XHR)
    if(_embCode){
      renderAuthUI(_embCode,_embLink,_embBot);
    } else {
      ov.innerHTML='<div style="text-align:center"><h2 style="margin-bottom:16px">Ошибка</h2><p style="opacity:0.5">Код авторизации не получен</p></div>';
      ov.appendChild(closeBtn);
    }

    function renderAuthUI(code,deepLink,botName){
      var card=document.createElement('div');
      card.style.cssText='background:rgba(255,255,255,0.08);border-radius:16px;padding:40px;max-width:420px;width:90%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.3);backdrop-filter:blur(20px);margin:auto;';
      card.innerHTML='<h1 style="font-size:22px;margin-bottom:8px;color:#fff">Авторизация</h1>'+
        '<p style="opacity:0.5;font-size:13px;margin-bottom:24px">Отправьте код боту в Telegram</p>'+
        '<div style="font-size:44px;font-weight:700;letter-spacing:8px;color:#64ffda;margin:20px 0;font-family:Courier New,monospace" id="auth-code">'+code+'</div>'+
        (_embQR?'<div id="auth-qr" style="margin:16px auto;text-align:center"><img src="'+_embQR+'" alt="QR" style="width:160px;height:160px;border-radius:8px;image-rendering:pixelated"><p style="opacity:0.5;font-size:11px;margin-top:6px">Отсканируйте QR</p></div>':'')+
        '<ol style="text-align:left;margin:20px auto;max-width:320px;list-style:decimal inside;line-height:2;font-size:13px;opacity:0.7">'+
        '<li>Откройте бота <b>@'+botName+'</b></li>'+
        '<li>Отправьте код <b>'+code+'</b></li>'+
        '<li>После одобрения нажмите кнопку ниже</li></ol>'+
        (deepLink?'<a href="'+deepLink+'" target="_blank" style="display:inline-block;margin-top:12px;padding:10px 28px;background:#0088cc;color:#fff;text-decoration:none;border-radius:8px;font-size:14px">Открыть Telegram</a>':'')+
        '<div id="auth-refresh-wrap" style="margin-top:20px;text-align:center">'+
        '<button id="auth-refresh-btn" style="padding:12px 36px;background:#64ffda;color:#1a1a2e;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;margin-bottom:8px">Я отправил код — обновить</button>'+
        '<p style="opacity:0.4;font-size:11px">Или перезапустите приложение</p></div>'+
        '<div style="margin-top:20px;border-top:1px solid rgba(255,255,255,0.12);padding-top:16px">'+
        '<p style="opacity:0.5;font-size:12px;margin-bottom:8px">Или введите промокод</p>'+
        '<div style="display:flex;gap:8px;justify-content:center">'+
        '<input id="promo-input" type="text" placeholder="P-XXXXXX" maxlength="12" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);border-radius:8px;padding:8px 12px;color:#fff;font-size:14px;letter-spacing:2px;text-transform:uppercase;width:140px;text-align:center;outline:none;font-family:Courier New,monospace">'+
        '<button id="promo-btn" style="background:#10b981;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer">OK</button></div>'+
        '<div id="promo-status" style="margin-top:8px;font-size:12px"></div></div>';
      ov.innerHTML='';
      ov.style.display='flex';
      ov.appendChild(card);
      ov.appendChild(closeBtn);
      var rbtn=document.getElementById('auth-refresh-btn');
      if(rbtn){rbtn.tabIndex=2;rbtn.onclick=function(){window.location.reload();};}
      var pbtn=document.getElementById('promo-btn');
      var pinp=document.getElementById('promo-input');
      if(pinp)pinp.tabIndex=3;
      if(pbtn)pbtn.tabIndex=4;
      // Focus style for all focusable elements inside gate
      var focusStyle='outline:2px solid #64ffda;outline-offset:2px;';
      var noFocusStyle='outline:none;';
      [rbtn,pbtn,pinp].forEach(function(el){if(el){el.onfocus=function(){el.style.cssText+=focusStyle;};el.onblur=function(){el.style.cssText=el.style.cssText.replace(/outline:[^;]+;?/g,'')+noFocusStyle;};}});
      // Arrow key navigation between focusable elements
      var focusEls=[closeBtn,rbtn,pinp,pbtn].filter(Boolean);
      ov.addEventListener('keydown',function(ev){
        var k=ev.key||ev.keyCode;
        if(k==='ArrowDown'||k===40||k==='ArrowRight'||k===39){
          var ci=focusEls.indexOf(document.activeElement);
          if(ci>=0&&ci<focusEls.length-1){ev.preventDefault();focusEls[ci+1].focus();}
          else if(ci<0&&focusEls.length){ev.preventDefault();focusEls[0].focus();}
        }else if(k==='ArrowUp'||k===38||k==='ArrowLeft'||k===37){
          var ci=focusEls.indexOf(document.activeElement);
          if(ci>0){ev.preventDefault();focusEls[ci-1].focus();}
        }
      },false);
      // Auto-focus first actionable button (refresh)
      setTimeout(function(){if(rbtn)rbtn.focus();else if(closeBtn)closeBtn.focus();},100);
      // Telegram link also focusable
      var tgLink=card.querySelector('a[href]');
      if(tgLink){tgLink.tabIndex=2;focusEls.splice(1,0,tgLink);tgLink.onfocus=function(){tgLink.style.cssText+=focusStyle;};tgLink.onblur=function(){tgLink.style.cssText=tgLink.style.cssText.replace(/outline:[^;]+;?/g,'')+noFocusStyle;};}
      if(pbtn&&pinp){
        function doPromo(){
          var c=pinp.value.trim();if(!c)return;
          var ps=document.getElementById('promo-status');
          pbtn.disabled=true;pbtn.textContent='...';
          var x=new XMLHttpRequest();
          x.open('POST',_srvHost+'/tg/auth/promo');
          x.setRequestHeader('Content-Type','application/json');
          x.onload=function(){
            try{var d=JSON.parse(x.responseText);
              if(d.ok&&d.token){ps.style.color='#64ffda';ps.textContent='Доступ на '+d.days+' дн.!';saveToken(d.token);setTimeout(function(){authDone(d.token)},1000);}
              else{ps.style.color='#ff6b6b';ps.textContent='Недействительный промокод';pbtn.disabled=false;pbtn.textContent='OK';}
            }catch(e){ps.style.color='#ff6b6b';ps.textContent='Ошибка';pbtn.disabled=false;pbtn.textContent='OK';}
          };
          x.onerror=function(){ps.style.color='#ff6b6b';ps.textContent='Ошибка сети';pbtn.disabled=false;pbtn.textContent='OK';};
          x.send(JSON.stringify({code:c}));
        }
        pbtn.onclick=doPromo;
        pinp.onkeydown=function(ev){if(ev.key==='Enter')doPromo();};
      }
    }

    function authDone(tok){
      if(tok){saveToken(tok);}
      try{localStorage.removeItem('activity');}catch(e){}
      ov.remove();
      window.location.reload();
    }
  }
})();
(function () {
    'use strict';

    // Prevent conflict if both lampac and alcopac on.js are loaded
    if (window.alcopac_onjs) return;
    window.alcopac_onjs = true;
    window.alcopac = true;

    // Disable LGBT content filter (Lampa beta feature) — prevents lgbt.forEach crash
    if (!window.lampa_settings) window.lampa_settings = {};
    if (!window.lampa_settings.disable_features) window.lampa_settings.disable_features = {};
    window.lampa_settings.disable_features.lgbt = true;

    var timer = setInterval(function(){
        if(typeof Lampa !== 'undefined'){
            clearInterval(timer);

            var unic_id = 'zc56aeon';
            Lampa.Storage.set('lampac_unic_id', unic_id);

            Lampa.Utils.putScriptAsync(["https://beta.l-vid.online/splash.js","https://beta.l-vid.online/online.js","https://beta.l-vid.online/catalog.js"], function() {});
        }
    },200);
})();
