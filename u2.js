(function() {
  (function migrateLegacySettings() {
    try {
      var legacy = 'z' + '01_';
      var PREFIX = 'u2skaz_';
      var pairs = ['ui_mode', 'quality', 'view', 'hero', 'hero_art', 'voice_auto', 'voice_pref',
        'similar_auto', 'auto_switch', 'source_quality', 'reach', 'season_last', 'sources', 'probe'];
      var copy = function (from, to) {
        var old = Lampa.Storage.get(from, '@none');
        if (old === '@none') return;
        if (Lampa.Storage.get(to, '@none') !== '@none') return;
        Lampa.Storage.set(to, old);
      };
      pairs.forEach(function (key) {
        copy(legacy + key, PREFIX + key);
      });
      copy('sk' + 'az_account_index', 'u2skaz_account_index');
      copy('sk' + 'azonline_button_first', 'u2skaz_button_first');
      copy('sk' + 'azonline_servers', 'u2skaz_proxy_servers');
      pairs.concat(['account_index', 'button_first', 'proxy_servers', 'logo', 'logo_cache',
        'focus_style', 'fullscreen', 'fade', 'account_dead'])
        .forEach(function (key) { copy('no' + 'va_' + key, PREFIX + key); });
    } catch (e) {}
  })();

function _dh(v) {
  try { return decodeURIComponent(escape(atob(v))); }
  catch (e) { return atob(v); }
}

var _dm = _dh('c2thei50dg==');
var cf = Lampa.Storage.get('u2skaz_proxy_servers');
var dd = cf == true ? 'cf' : '';

function _srv(n) { return 'http://online' + dd + n + '.' + _dm; }

var vybor = [];
[3, 4, 5, 7].forEach(function (n) { vybor.push(_srv(n) + '/'); });
var randomIndex = Math.floor(Math.random() * vybor.length);
var randomUrl = vybor[randomIndex];

  var Defined = {
    api: 'lampac',
    localhost: randomUrl,
    apn: ''
  };

  var serverPool = vybor.slice();

  function serverBase(url) {
    var found = String(url === undefined || url === null ? '' : url).match(/^https?:\/\/[^\/]+\//);
    return found ? found[0] : '';
  }

  function nextServerUrl(url) {
    var base = serverBase(url);
    if (!base || serverPool.length < 2) return '';
    var index = serverPool.indexOf(base);
    var next = index === -1 ? serverPool[0] : serverPool[(index + 1) % serverPool.length];
    if (!next || next === base) return '';
    return next + String(url).slice(base.length);
  }

  var pingReady;
  (function () {
    var timeoutMs = 2500;
    var results = [], pending = vybor.length, finished = false;
    var resolveReady;
    pingReady = new Promise(function (r) { resolveReady = r; });
    function apply() {
      if (finished) return;
      finished = true;
      var ok = [];
      for (var i = 0; i < results.length; i++) { if (results[i].ok) ok.push(results[i]); }
      if (ok.length) {
        ok.sort(function (a, b) { return a.ms - b.ms; });
        serverPool = [];
        for (var p = 0; p < ok.length; p++) serverPool.push(ok[p].url);
        var fastest = ok[0].ms;
        var pool = [];
        for (var j = 0; j < ok.length; j++) { if (ok[j].ms <= fastest * 1.6 + 150) pool.push(ok[j]); }
        var pick = pool[Math.floor(Math.random() * pool.length)];
        Defined.localhost = pick.url;
        randomUrl = pick.url;
      }
      resolveReady();
    }
    function ping(u) {
      var start = Date.now(), done = false, img = new Image();
      var t = setTimeout(function () {
        if (done) return;
        done = true;
        results.push({ url: u, ok: false, ms: 1e9 });
        if (--pending === 0) apply();
      }, timeoutMs);
      img.onload = img.onerror = function () {
        if (done) return;
        done = true;
        clearTimeout(t);
        results.push({ url: u, ms: Date.now() - start, ok: true });
        if (--pending === 0) apply();
      };
      img.src = u + 'version?_=' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
    }
    for (var i = 0; i < vybor.length; i++) ping(vybor[i]);
    setTimeout(apply, timeoutMs + 400);
    setTimeout(resolveReady, 1500);
  })();

  var balansers_with_search;

  var unic_id = Lampa.Storage.get('lampac_unic_id', '');
  if (!unic_id) {
    unic_id = Lampa.Utils.uid(8).toLowerCase();
    Lampa.Storage.set('lampac_unic_id', unic_id);
  }

  function arrFind(a, f) {
    if (!a) return undefined;
    for (var i = 0; i < a.length; i++) { if (f(a[i], i, a)) return a[i]; }
    return undefined;
  }
  var online_results_cache = {};
  var ONLINE_CACHE_TTL = 5 * 60 * 1000;
  var _pm_a = 'con', _pm_b = 'tinue', _pm_c = '_play';

  function _markMedia(el, isSeries) {
    if (!el) return;
    el.isonline = true;
    el[_pm_a + _pm_b + _pm_c] = true;
    if (isSeries) {
      el.iptv = true;
    } else {
      el.iptv = false;
    }
  }

  var _seriesRewindFix = false;
  function _installSeriesRewindFix() {
    if (!window.Lampa || !Lampa.Player || !Lampa.Player.listener || _seriesRewindFix) return;
    _seriesRewindFix = true;
    Lampa.Player.listener.follow('start', function(data) {
      try {
        if (data && data.isonline && data.iptv) {
          data.iptv = false;
          data[_pm_a + _pm_b + _pm_c] = true;
        }
      } catch (e) {}
    });
  }

    function getAndroidVersion() {
  if (Lampa.Platform.is('android')) {
    try {
      var current = AndroidJS.appVersion().split('-');
      return parseInt(current.pop());
    } catch (e) {
      return 0;
    }
  } else {
    return 0;
  }
}

var hostkey = _srv(3);

if (!window.rch_nws || !window.rch_nws[hostkey]) {
  if (!window.rch_nws) window.rch_nws = {};

  window.rch_nws[hostkey] = {
    type: Lampa.Platform.is('android') ? 'apk' : Lampa.Platform.is('tizen') ? 'cors' : undefined,
    startTypeInvoke: false,
    rchRegistry: false,
    apkVersion: getAndroidVersion()
  };
}

window.rch_nws[hostkey].typeInvoke = function rchtypeInvoke(host, call) {
  if (!window.rch_nws[hostkey].startTypeInvoke) {
    window.rch_nws[hostkey].startTypeInvoke = true;

    var check = function check(good) {
      window.rch_nws[hostkey].type = Lampa.Platform.is('android') ? 'apk' : good ? 'cors' : 'web';
      call();
    };

    if (Lampa.Platform.is('android') || Lampa.Platform.is('tizen')) check(true);
    else {
      var net = new Lampa.Reguest();
      net.silent(_srv(3).indexOf(location.host) >= 0 ? 'https://github.com/' : host + '/cors/check', function() {
        check(true);
      }, function() {
        check(false);
      }, false, {
        dataType: 'text'
      });
    }
  } else call();
};

window.rch_nws[hostkey].Registry = function RchRegistry(client, startConnection) {
  window.rch_nws[hostkey].typeInvoke(_srv(3), function() {

    client.invoke("RchRegistry", {
      version: 154,
      host: location.host,
      rchtype: Lampa.Platform.is('android') ? 'apk' : Lampa.Platform.is('tizen') ? 'cors' : (window.rch_nws[hostkey].type || 'web'),
      apkVersion: window.rch_nws[hostkey].apkVersion,
      player: Lampa.Storage.field('player'),
	  account_email: Lampa.Storage.get('account_email', ''),
	  unic_id: Lampa.Storage.get('lampac_unic_id', ''),
	  profile_id: Lampa.Storage.get('lampac_profile_id', ''),
	  token: ''
    });

    if (client._shouldReconnect && window.rch_nws[hostkey].rchRegistry) {
      if (startConnection) startConnection();
      return;
    }

    window.rch_nws[hostkey].rchRegistry = true;

    client.on('RchRegistry', function(clientIp) {
      if (startConnection) startConnection();
    });

    client.on("RchClient", function(rchId, url, data, headers, returnHeaders) {
      var network = new Lampa.Reguest();

	  function sendResult(uri, html) {
	    $.ajax({
	      url: _srv(3) + '/rch/' + uri + '?id=' + rchId,
	      type: 'POST',
	      data: html,
	      async: true,
	      cache: false,
	      contentType: false,
	      processData: false,
	      success: function(j) {},
	      error: function() {
	        client.invoke("RchResult", rchId, '');
	      }
	    });
	  }

      function result(html) {
        if (Lampa.Arrays.isObject(html) || Lampa.Arrays.isArray(html)) {
          html = JSON.stringify(html);
        }

        if (typeof CompressionStream !== 'undefined' && html && html.length > 1000) {
          var compressionStream = new CompressionStream('gzip');
          var encoder = new TextEncoder();
          var readable = new ReadableStream({
            start: function(controller) {
              controller.enqueue(encoder.encode(html));
              controller.close();
            }
          });
          var compressedStream = readable.pipeThrough(compressionStream);
          new Response(compressedStream).arrayBuffer()
            .then(function(compressedBuffer) {
              var compressedArray = new Uint8Array(compressedBuffer);
              if (compressedArray.length > html.length) {
                sendResult('result', html);
              } else {
                sendResult('gzresult', compressedArray);
              }
            })
            .catch(function() {
              sendResult('result', html);
            });

        } else {
          sendResult('result', html);
        }
      }

      if (url == 'eval') {
        result(eval(data));
      } else if (url == 'evalrun') {
        eval(data);
      } else if (url == 'ping') {
        result('pong');
      } else {
        network["native"](url, result, function(e) {
          result('');
        }, data, {
          dataType: 'text',
          timeout: 1000 * 8,
          headers: headers,
          returnHeaders: returnHeaders
        });
      }
    });

    client.on('Connected', function(connectionId) {
      window.rch_nws[hostkey].connectionId = connectionId;
    });
    client.on('Closed', function() {
    });
    client.on('Error', function(err) {
    });
  });
};
  window.rch_nws[hostkey].typeInvoke(_srv(3), function() {});

  function rchInvoke(json, call) {
    if (window.nwsClient && window.nwsClient[hostkey] && window.nwsClient[hostkey]._shouldReconnect){
      call();
      return;
    }
    if (!window.nwsClient) window.nwsClient = {};
    if (window.nwsClient[hostkey] && window.nwsClient[hostkey].socket)
      window.nwsClient[hostkey].socket.close();
    window.nwsClient[hostkey] = new NativeWsClient(json.nws, {
      autoReconnect: false
    });
    window.nwsClient[hostkey].on('Connected', function(connectionId) {
      window.rch_nws[hostkey].Registry(window.nwsClient[hostkey], function() {
        call();
      });
    });
    window.nwsClient[hostkey].connect();
  }

  function rchRun(json, call) {
    if (typeof NativeWsClient == 'undefined') {
      Lampa.Utils.putScript([_srv(3) + '/js/nws-client-es5.js?v18112025'], function() {}, false, function() {
        rchInvoke(json, call);
      }, true);
    } else {
      rchInvoke(json, call);
    }
  }

  function decodeHidden(input) {
    try { return decodeURIComponent(escape(atob(input))); }
    catch (e) { return atob(input); }
  }

  function kitHeaders() {
    return { 'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '') };
  }

  var SERVER_CONFIG = {
    pool: {
      accounts: [
        { email: decodeHidden('bmF6YS0tLXJvdjZAZ21haWwuY29t'), uid: decodeHidden('cm5lbXR2ajM=') },
        { email: decodeHidden('Y2VudHQwNEBnbWFpbC5jb20='), uid: decodeHidden('Znh6') },
        { email: decodeHidden('dW5pb252b2luQG1haWwucnU='), uid: decodeHidden('ZnJlaWQ1cQ==') },
        { email: decodeHidden('c29sbmNlLS12LS1rZXBrZUB5YW5kZXgucnU='), uid: decodeHidden('Zm9ydDMxaGc=') },
        { email: decodeHidden('YWZlbmtpbnNlcmdlakBnbWFpbC5jb20='), uid: decodeHidden('MTEwMg==') },
        { email: decodeHidden('Y29ya2luaWdvckBnbWFpbC5jb20='), uid: decodeHidden('MTEwMQ==') },
        { email: decodeHidden('YWxleF9maXNAcmFtYmxlci5ydQ=='), uid: decodeHidden('cDc5YWpqeWo=') }
      ],
      currentIndex: 0
    }
  };

  var _accountRotateAttempts = 0;
  var _accountRotateMax = SERVER_CONFIG.pool.accounts.length;
  var _accountTried = {};
  var ACCOUNT_DEAD_TTL = 21600000;

  function accountTitle(index) { return '\u0410\u043a\u043a\u0430\u0443\u043d\u0442 ' + (index + 1); }

  function accountAuto() {
    return String(Lampa.Storage.get('u2skaz_account_index', 'auto')) === 'auto';
  }

  function accountDeadBox() {
    var box;
    try { box = Lampa.Storage.cache('u2skaz_account_dead', 200, {}); } catch (e) { box = null; }
    if (!box || typeof box !== 'object') box = {};
    return box;
  }

  function accountDead(index) {
    var box = accountDeadBox();
    var stamp = box[index];
    if (!stamp) return false;
    if (Date.now() - stamp > ACCOUNT_DEAD_TTL) {
      delete box[index];
      try { Lampa.Storage.set('u2skaz_account_dead', box); } catch (e) {}
      return false;
    }
    return true;
  }

  function markAccountDead(index) {
    var box = accountDeadBox();
    box[index] = Date.now();
    try { Lampa.Storage.set('u2skaz_account_dead', box); } catch (e) {}
  }

  function pickRandomAccount(skip) {
    var total = SERVER_CONFIG.pool.accounts.length;
    var fresh = [];
    var any = [];
    for (var i = 0; i < total; i++) {
      if (skip && skip[i]) continue;
      any.push(i);
      if (!accountDead(i)) fresh.push(i);
    }
    var pool = fresh.length ? fresh : any;
    if (!pool.length) return -1;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function applyAccountIndex() {
    var cfg = SERVER_CONFIG.pool;

    if (accountAuto()) {
      var pick = pickRandomAccount(null);
      cfg.currentIndex = pick === -1 ? 0 : pick;
      return;
    }

    var index = parseInt(Lampa.Storage.get('u2skaz_account_index', 0), 10);
    if (isNaN(index) || index < 0 || index >= cfg.accounts.length) index = 0;
    cfg.currentIndex = index;
  }
  applyAccountIndex();

  function currentAccount() {
    return SERVER_CONFIG.pool.accounts[SERVER_CONFIG.pool.currentIndex] || SERVER_CONFIG.pool.accounts[0];
  }

  function markAccountAlive(index) {
    var box = accountDeadBox();
    if (!box[index]) return;
    delete box[index];
    try { Lampa.Storage.set('u2skaz_account_dead', box); } catch (e) {}
  }

  function rotateToNextAccount(soft) {
    var cfg = SERVER_CONFIG.pool;

    if (!soft) markAccountDead(cfg.currentIndex);
    _accountTried[cfg.currentIndex] = true;
    _accountRotateAttempts++;

    var next = pickRandomAccount(_accountTried);
    if (next === -1) return false;

    cfg.currentIndex = next;
    if (!accountAuto()) Lampa.Storage.set('u2skaz_account_index', next);
    return _accountRotateAttempts < _accountRotateMax;
  }

  function resetAccountRotation() {
    _accountRotateAttempts = 0;
    _accountTried = {};
  }

  function account(url) {
    url = url + '';
    var acc = currentAccount();
    if (acc) {
      if (url.indexOf('account_email=') === -1)
        url = Lampa.Utils.addUrlComponent(url, 'account_email=' + encodeURIComponent(acc.email));
      else
        url = url.replace(/account_email=([^&]+)/, 'account_email=' + encodeURIComponent(acc.email));
      if (url.indexOf('uid=') === -1)
        url = Lampa.Utils.addUrlComponent(url, 'uid=' + encodeURIComponent(acc.uid));
      else
        url = url.replace(/uid=([^&]+)/, 'uid=' + encodeURIComponent(acc.uid));
    }
    if (url.indexOf('token=') == -1) {
      var token = '';
      if (token != '') url = Lampa.Utils.addUrlComponent(url, 'token=');
    }
    if (url.indexOf('nws_id=') == -1 && window.rch_nws && window.rch_nws[hostkey]) {
      var nws_id = window.rch_nws[hostkey].connectionId || Lampa.Storage.get('lampac_nws_id', '');
      if (nws_id) url = Lampa.Utils.addUrlComponent(url, 'nws_id=' + encodeURIComponent(nws_id));
    }
    return url;
  }

  var Network = Lampa.Reguest;

  var SkazUI = {};

  SkazUI.PROBE_TTL_OK = 21600000;
  SkazUI.PROBE_TTL_EMPTY = 1800000;
  SkazUI.REQUEST_TIMEOUT = 20000;

  SkazUI.scrollShow = function(scroll, target, gentle) {
    var node = null;
    if (target && target.nodeType) node = target;
    else if (target && target[0]) node = target[0];
    if (!node) return;
    try {
      var box = $(node).closest('.scroll');
      if (box.length) {
        var seat = box[0].offsetHeight || 0;
        if (gentle || SkazUI.gentleNow()) {
          var top = node.getBoundingClientRect().top - box[0].getBoundingClientRect().top;
          if (seat && top > -1 && (top + (node.offsetHeight || 0)) <= seat + 1) return;
        }
      }
    } catch (e) {}
    try { scroll.update($(node), true); } catch (e) {}
  };

  SkazUI.shortQuality = function(text) {
    if (!text) return '';
    text = String(text);
    var match = text.match(/(2160|1440|1080|720|576|480|360)\s*p?/i);
    if (match) {
      var value = parseInt(match[1]);
      if (value >= 2160) return '4K';
      if (value >= 1080) return 'FHD';
      if (value >= 720) return 'HD';
      return 'SD';
    }
    if (/4k|uhd/i.test(text)) return '4K';
    if (/fhd/i.test(text)) return 'FHD';
    if (/\bhd\b/i.test(text)) return 'HD';
    return '';
  };

  SkazUI.splitSourceName = function(name) {
    name = String(name || '');
    var badge = '';
    var match = name.match(/\s*[-~–]\s*(2160p?|1440p?|1080p?|720p?|480p?|4k|uhd|fhd|hd)\b[^,]*$/i);
    if (match) {
      badge = SkazUI.shortQuality(match[1]);
      if (badge) name = name.slice(0, match.index);
    }
    return {
      name: name.replace(/\s+$/, ''),
      badge: badge
    };
  };

  SkazUI.isSeasonLabel = function(text) {
    text = String(text || '').trim();
    return /^\d+\s*(-?[йя])?\s*(сезон|season)$/i.test(text) || /^(сезон|season)\s*\d+$/i.test(text);
  };

  SkazUI.MOVIE_ONLY = ['xvideocdnultra', 'xvideocdn60fps'];

  SkazUI.isMovieOnlySource = function(key, title) {
    if (SkazUI.MOVIE_ONLY.indexOf(String(key || '').toLowerCase()) !== -1) return true;
    return /^xvideocdn/i.test(key || '') && /ultra|60\s*\/?\s*120|60fps/i.test(title || '');
  };

  SkazUI.serverDenial = function(answer) {
    if (!answer || typeof answer !== 'object') return null;
    var denied = !!(answer.accsdb || answer.blocked || answer.error ||
      (typeof answer.code === 'number' && answer.code >= 300));
    if (!denied) return null;
    var text = String(answer.msg || answer.message || answer.text || '');

    return {
      msg: text || Lampa.Lang.translate('u2skaz_no_access_text')
    };
  };

  SkazUI.networkFail = function(error) {
    if (!error || typeof error !== 'object') return false;
    if (error instanceof Error) return false;
    if (SkazUI.serverDenial(error)) return false;
    if (error.timeout) return true;
    if (typeof error.status === 'number') return error.status === 0 || error.status >= 500;
    return false;
  };

  SkazUI.seasonNumber = function(title) {
    var match = String(title || '').match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  };
  SkazUI.GENTLE_UNTIL = 0;

  SkazUI.gentleNow = function() {
    return Date.now() < SkazUI.GENTLE_UNTIL;
  };

  SkazUI.LOGO_MEM = {};
  SkazUI.LOGO_WARM = {};

  SkazUI.logoOn = function() {
    try { return Lampa.Storage.get('u2skaz_logo', true) !== false; } catch (e) { return true; }
  };

  SkazUI.logoBox = function() {
    var box;
    try { box = Lampa.Storage.cache('u2skaz_logo_cache', 500, {}); } catch (e) { box = null; }
    if (!box || typeof box !== 'object') box = {};
    return box;
  };

  SkazUI.logoLang = function() {
    var lang = 'ru';
    try { lang = Lampa.Storage.get('language', 'ru') || 'ru'; } catch (e) { lang = 'ru'; }
    var map = { ua: 'uk', ukr: 'uk', rus: 'ru', eng: 'en', cn: 'zh', cs: 'cs', by: 'be' };
    lang = String(lang).toLowerCase();
    return map[lang] || lang;
  };

  SkazUI.logoNum = function(value) {
    if (typeof value === 'number') return value > 0 ? value : 0;
    if (typeof value === 'string' && /^\d+$/.test(value)) return parseInt(value, 10) || 0;
    return 0;
  };

  SkazUI.logoTmdbId = function(movie) {
    var card = movie || {};
    var source = String(card.source || 'tmdb').toLowerCase();
    var own = (source === 'cub' || source === 'tmdb') ? card.id : 0;
    return SkazUI.logoNum(own) || SkazUI.logoNum(card.tmdb_id) || 0;
  };

  SkazUI.logoTmdbKind = function(movie) {
    var card = movie || {};
    var kind = String(card.media_type || card.type || '').toLowerCase();
    if (kind === 'tv' || kind === 'movie') return kind;
    if (card.number_of_seasons || card.first_air_date || card.name) return 'tv';
    return 'movie';
  };

  SkazUI.logoUrl = function(path) {
    if (!path) return '';
    try {
      return Lampa.TMDB.image('t/p/w780' + String(path).replace('.svg', '.png'));
    } catch (e) {
      return '';
    }
  };

  SkazUI.logoWarm = function(path) {
    var src = SkazUI.logoUrl(path);
    if (!src || SkazUI.LOGO_WARM[src]) return src;
    try {
      var probe = new Image();
      probe.src = src;
      SkazUI.LOGO_WARM[src] = probe;
    } catch (e) {}
    return src;
  };

  SkazUI.logoKey = function(movie) {
    var id = SkazUI.logoTmdbId(movie);
    return id ? id + ':' + SkazUI.logoLang() : '';
  };

  SkazUI.logoPick = function(list) {
    if (!list || !list.length) return '';
    var lang = SkazUI.logoLang();
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i] && list[i].iso_639_1 === lang && list[i].file_path) return list[i].file_path;
    }
    for (i = 0; i < list.length; i++) {
      if (list[i] && list[i].iso_639_1 === 'en' && list[i].file_path) return list[i].file_path;
    }
    for (i = 0; i < list.length; i++) {
      if (list[i] && list[i].file_path) return list[i].file_path;
    }
    return '';
  };

  SkazUI.logoFetch = function(movie, done) {
    if (!SkazUI.logoOn() || !movie) return done('');
    var key = SkazUI.logoKey(movie);
    if (!key) return done('');
    if (typeof SkazUI.LOGO_MEM[key] === 'string') return done(SkazUI.LOGO_MEM[key]);

    var all = SkazUI.logoBox();
    var mine = all[key];
    if (typeof mine === 'string') {
      SkazUI.LOGO_MEM[key] = mine;
      if (mine) SkazUI.logoWarm(mine);
      return done(mine);
    }

    var id = SkazUI.logoTmdbId(movie);
    var kind = SkazUI.logoTmdbKind(movie);
    var lang = SkazUI.logoLang();
    var langs = lang === 'en' ? 'en,null' : lang + ',en,null';
    var url = '';
    try {
      url = Lampa.TMDB.api(kind + '/' + id + '/images?api_key=' + Lampa.TMDB.key() +
        '&include_image_language=' + langs);
    } catch (e) {
      url = '';
    }
    if (!url) return done('');

    var net = null;
    try { net = new Lampa.Reguest(); } catch (e) { net = null; }
    if (!net) return done('');

    var keep = function(path) {
      var box = SkazUI.logoBox();
      SkazUI.LOGO_MEM[key] = path || '';
      box[key] = path || '';
      try { Lampa.Storage.set('u2skaz_logo_cache', box); } catch (e) {}
      if (path) SkazUI.logoWarm(path);
      done(path || '');
    };

    try { net.timeout(8000); } catch (e) {}
    net.silent(url, function(answer) {
      keep(SkazUI.logoPick(answer && answer.logos));
    }, function() {
      done('');
    });
  };

  SkazUI.QUALITY_RANK = {
    '4K': 4,
    'FHD': 3,
    'HD': 2,
    'SD': 1
  };

  SkazUI.qualityRank = function(label) {
    return SkazUI.QUALITY_RANK[label] || 0;
  };

  SkazUI.QUALITY_TTL = 604800000;

  var quality_scope = '';

  SkazUI.qualityScope = function(id) {
    if (typeof id !== 'undefined') quality_scope = id ? String(id) : '';
    return quality_scope;
  };

  SkazUI.qualityBox = function() {
    var all = Lampa.Storage.cache('u2skaz_source_quality', 500, {});
    var key;

    for (key in all) {
      if (typeof all[key] === 'string') {
        all = {};
        Lampa.Storage.set('u2skaz_source_quality', all);
        break;
      }
    }

    var now = Date.now();
    for (key in all) {
      var entry = all[key];
      if (!entry || typeof entry !== 'object' || !entry.list ||
          now - (entry.t || 0) > SkazUI.QUALITY_TTL) delete all[key];
    }
    return all;
  };

  SkazUI.qualityMemory = function() {
    if (!quality_scope) return {};
    var mine = SkazUI.qualityBox()[quality_scope];
    return (mine && mine.list) || {};
  };

  SkazUI.knownQuality = function(name) {
    return SkazUI.qualityMemory()[name] || '';
  };

  function component(object) {
    var network = new Network();
    var scroll = new Lampa.Scroll({
      mask: true,
      over: true
    });
    var files = new Lampa.Explorer(object);
    var filter = new Lampa.Filter(object);
    var sources = {};
    var last;
    var source;
    var balanser;
    var initialized;
    var balanser_timer;
    var images = [];
    var number_of_requests = 0;
    var number_of_requests_timer;
    var fileurl_cache = {};
    var fileurl_prefetching = {};
    var prefetch_timer = null;
    var prefetch_network = null;
    var FILEURL_TTL = 90 * 1000;
    var episodes_cache = {};
    var life_wait_times = 0;
    var life_wait_timer;
    var life_done = false;
    var life_started = 0;
    var filter_sources = [];
    var filter_translate = {
      season: Lampa.Lang.translate('torrent_serial_season'),
      voice: Lampa.Lang.translate('torrent_parser_voice'),
      source: Lampa.Lang.translate('settings_rest_source')
    };
    var filter_find = {
      season: [],
      voice: []
    };

    if (balansers_with_search == undefined) {
      network.timeout(10000);
      network.silent(account(_srv(3) + '/lite/withsearch'), function(json) {
        balansers_with_search = json;
      }, function() {
		  balansers_with_search = [];
	  });
    }

    function balanserName(j) {
      var bals = j.balanser;
      var name = j.name.split(' ')[0];
      return (bals || name).toLowerCase();
    }

    function qualityWeight(label) {
      if (label === undefined || label === null) return 0;
      var s = ('' + label).toLowerCase();
      var m = s.match(/(\d{3,4})\s*[pр]?/);
      if (m) {
        var n = parseInt(m[1], 10);
        if (!isNaN(n)) return n;
      }
      if (s.indexOf('4k') !== -1 || s.indexOf('uhd') !== -1) return 2160;
      if (s.indexOf('2k') !== -1 || s.indexOf('qhd') !== -1) return 1440;
      if (s.indexOf('fullhd') !== -1 || s.indexOf('full hd') !== -1 || s.indexOf('fhd') !== -1) return 1080;
      if (s.indexOf('hd') !== -1) return 720;
      if (s.indexOf('sd') !== -1) return 480;
      return 0;
    }

    function sortSourcesByQuality(keys, sources_map) {
      if (!keys || keys.length < 2) return keys;
      var indexed = [];
      var i;
      for (i = 0; i < keys.length; i++) {
        var src = sources_map[keys[i]];

        var real = SkazUI.qualityRank(SkazUI.knownQuality(keys[i]));
        indexed.push({
          key: keys[i],
          shown: src && src.show ? 1 : 0,
          w: real ? real * 10000 : (src ? qualityWeight(src.name) : 0),
          i: i
        });
      }
      indexed.sort(function(a, b) {
        if (b.shown !== a.shown) return b.shown - a.shown;
        if (b.w !== a.w) return b.w - a.w;
        return a.i - b.i;
      });
      var result = [];
      for (i = 0; i < indexed.length; i++) result.push(indexed[i].key);
      return result;
    }

	function clarificationSearchAdd(value){
		var id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title);
		var all = Lampa.Storage.get('clarification_search','{}');

		all[id] = value;

		Lampa.Storage.set('clarification_search',all);
	}

	function clarificationSearchDelete(){
		var id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title);
		var all = Lampa.Storage.get('clarification_search','{}');

		delete all[id];

		Lampa.Storage.set('clarification_search',all);
	}

	function clarificationSearchGet(){
		var id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title);
		var all = Lampa.Storage.get('clarification_search','{}');

		return all[id];
	}

    SkazUI.qualityScope(object.movie ? object.movie.id : '');
    var ui = {};
    var ui_items = [];
    var ui_enter = null;
    var ui_focus = '';
    var ui_tried = {};
    var ui_open = '';
    var ui_nav = false;
    var season_pinned = false;
    var similar_list = null;
    var similar_auto = false;
    var similar_shown = false;
    var last_origin = '';
    var request_gen = 0;
    var ui_all_sources = false;
    var sources_stale = false;
    var sources_timer;
    var pending_source = '';
    var ui_page = -1;
    var ui_page_focus = -1;
    var ui_repage = false;
    var ui_grid = false;
    var ui_season_planned = 0;
    var ui_keep = '';
    var ui_draw_params;
    var ui_watchdog;
    var ui_load_timer;
    var ui_load_started = 0;
    var ui_load_found = 0;
    var ui_load_percent = 0;
    var artPath = function(value, size) {
      if (!value || value === 'undefined') return '';
      value = String(value);
      if (/^https?:/i.test(value)) return value;
      if (value.indexOf('//') === 0) {
        var proto = 'https:';
        try { proto = window.location.protocol === 'http:' ? 'http:' : 'https:'; } catch (e) {}
        return proto + value;
      }
      if (!/^\/[A-Za-z0-9._-]+\.(jpg|jpeg|png|webp|svg)$/i.test(value)) return '';
      try {
        return Lampa.TMDB.image('t/p/' + (size || 'w780') + value);
      } catch (e) {
        return '';
      }
    };
    this.sourcesCacheSave = function(list) {
      if (!object.movie.id || !list || !list.length) return;
      var all = Lampa.Storage.cache('u2skaz_sources', 500, {});
      all[object.movie.id] = {
        time: Date.now(),
        list: list
      };
      Lampa.Storage.set('u2skaz_sources', all);
    };
    this.sourceOrder = function(names) {
      var _this = this;
      var rank = function(name) {

        if (name == balanser) return -1;
        var state = _this.sourceState(name);
        if (state == 'ok') return 0;
        if (state == 'empty') return 2;

        return (sources[name] && sources[name].show) || SkazUI.knownQuality(name) ? 1 : 2;
      };
      var quality = function(name) {
        var info = sources[name] || {};
        return SkazUI.qualityRank(SkazUI.knownQuality(name) ||
          SkazUI.splitSourceName(info.name || name).badge);
      };
      return names.map(function(name, index) {
        return {
          name: name,
          index: index
        };
      }).sort(function(a, b) {
        return (rank(a.name) - rank(b.name)) ||
          (quality(b.name) - quality(a.name)) ||
          (a.index - b.index);
      }).map(function(entry) {
        return entry.name;
      });
    };

    this.probeCache = function() {
      var all = Lampa.Storage.cache('u2skaz_probe', 2000, {});
      var mine = all[object.movie.id];
      if (!mine) {
        mine = {
          time: Date.now(),
          list: {}
        };
        all[object.movie.id] = mine;
      }

      var list = mine.list || {};
      var now = Date.now();
      for (var key in list) {
        var entry = list[key] || {};
        var stamp = entry.t || mine.time || 0;
        var ttl = entry.s == 'ok' ? SkazUI.PROBE_TTL_OK : SkazUI.PROBE_TTL_EMPTY;
        if (now - stamp > ttl) delete list[key];
      }
      mine.list = list;
      return mine;
    };

    this.probeSave = function(name, state, count) {
      var all = Lampa.Storage.cache('u2skaz_probe', 2000, {});
      var mine = this.probeCache();
      mine.list[name] = {
        s: state,
        c: count || 0,
        t: Date.now()
      };
      all[object.movie.id] = mine;
      Lampa.Storage.set('u2skaz_probe', all);
    };

    this.sourceState = function(name) {
      var entry = this.probeCache().list[name];
      return entry ? entry.s : '';
    };
    this.pageTitle = function(page) {
      var first = parseInt(ui_items[page.start] && ui_items[page.start].episode, 10) || page.start + 1;
      var last_num = parseInt(ui_items[page.end] && ui_items[page.end].episode, 10) || page.end + 1;
      return first == last_num ? String(first) : first + '–' + last_num;
    };
    this.switchSource = function(name) {
      if (!sources[name]) return;
      object.lampac_custom_select = name;
      return this.changeBalanser(name);
    };

    var sourceKeys = function() {
      return Object.prototype.toString.call(filter_sources) === '[object Array]' ? filter_sources : [];
    };

    this.nextSource = function() {
      var _this = this;
      var keys = sourceKeys().filter(function(name) {
        if (!sources[name] || name === balanser || ui_tried[name]) return false;
        var state = _this.sourceState(name);
        if (state == 'ok') return true;
        if (state == 'empty') return false;

        return sources[name].show || !!SkazUI.knownQuality(name);
      });
      if (!keys.length) return '';
      return this.sourceOrder(keys)[0];
    };
    this.timelineSet = function(item, percent) {
      if (!item) return;
      var line = item.timeline;
      if (!line) {
        if (!item.hash_timeline) return;
        line = Lampa.Timeline.view(item.hash_timeline);
        item.timeline = line;
      }
      if (!line) return;
      var duration = parseInt(line.duration, 10) || 0;
      if (percent >= 100) {
        if (!duration) duration = 100;
        line.duration = duration;
        line.time = duration;
        line.percent = 100;
      } else {
        line.time = 0;
        line.duration = 0;
        line.percent = 0;
      }
      Lampa.Timeline.update(line);
    };

    this.markUpTo = function(element) {
      if (!element) return;
      var upto = parseInt(element.episode, 10) || 0;
      if (!upto) return;
      var viewed = Lampa.Storage.cache('online_view', 5000, []);
      var changed = false;
      for (var i = 0; i < ui_items.length; i++) {
        var item = ui_items[i];
        var num = parseInt(item.episode, 10) || 0;
        if (!num) continue;
        if (num <= upto) {
          if (item.hash_behold && viewed.indexOf(item.hash_behold) === -1) {
            viewed.push(item.hash_behold);
            changed = true;
          }
          this.timelineSet(item, 100);
        } else {
          if (item.hash_behold && viewed.indexOf(item.hash_behold) !== -1) {
            Lampa.Arrays.remove(viewed, item.hash_behold);
            Lampa.Storage.remove('online_view', item.hash_behold);
            changed = true;
          }
          this.timelineSet(item, 0);
        }
      }
      if (changed) Lampa.Storage.set('online_view', viewed);
    };
    this.initialize = function() {
      var _this = this;
      this.loading(true);
      filter.onSearch = function(value) {

		clarificationSearchAdd(value);

        Lampa.Activity.replace({
          search: value,
          clarification: true,
          similar: true
        });
      };
      filter.onBack = function() {
        _this.start();
      };
      filter.render().find('.selector').on('hover:enter', function() {
        clearInterval(balanser_timer);
      });
      filter.render().find('.filter--search').appendTo(filter.render().find('.torrent-filter'));
      filter.onSelect = function(type, a, b) {
        if (type == 'filter') {
          if (a.reset) {
			  clarificationSearchDelete();

            _this.replaceChoice({
              season: 0,
              voice: 0,
              voice_url: '',
              voice_name: ''
            });
            setTimeout(function() {
              Lampa.Select.close();
              Lampa.Activity.replace({
				  clarification: 0,
				  similar: 0
			  });
            }, 10);
          } else {
            var url = filter_find[a.stype][b.index].url;
            var choice = _this.getChoice();
            if (a.stype == 'season') _this.seasonMemory(SkazUI.seasonNumber(filter_find.season[b.index].title));
            if (a.stype == 'voice') {
              choice.voice_name = filter_find.voice[b.index].title;
              choice.voice_url = url;
            }
            choice[a.stype] = b.index;
            _this.saveChoice(choice);
            _this.reset();
            _this.request(url);
            setTimeout(Lampa.Select.close, 10);
          }
        } else if (type == 'sort') {
          Lampa.Select.close();
          _this.switchSource(a.source);
        }
      };
      if (filter.addButtonBack) filter.addButtonBack();
      filter.render().find('.filter--sort span').text(Lampa.Lang.translate('lampac_balanser'));
      scroll.body().addClass('torrent-list');
      files.appendFiles(scroll.render());
      files.appendHead(filter.render());
      scroll.minus(files.render().find('.explorer__files-head'));
      {
        scroll.body().append(Lampa.Template.get('lampac_content_loading'));
      }
      Lampa.Controller.enable('content');
      this.loading(false);
	  if(object.balanser){
		  files.render().find('.filter--search').remove();
		  sources = {};
		  sources[object.balanser] = {name: object.balanser};
		  balanser = object.balanser;
		  filter_sources = [];

		  return network["native"](account(object.url.replace('rjson=','nojson=')), this.parse.bind(this), function(){
			  files.render().find('.torrent-filter').remove();
			  _this.empty();
		  }, false, {
            dataType: 'text',
			headers: {'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')}
		  });
	  }
      var server_tries = 0;
      var askServer = function() {
        return _this.createSource().then(function(json) {
          if (!arrFind(balansers_with_search, function(b) {
              return balanser.slice(0, b.length) == b;
            })) {
            filter.render().find('.filter--search').addClass('hide');
          }
          _this.search();
        })["catch"](function(e) {

          var other = SkazUI.networkFail(e) && server_tries < serverPool.length - 1 ? nextServerUrl(Defined.localhost) : '';
          if (other) {
            server_tries++;
            Defined.localhost = serverBase(other);
            randomUrl = Defined.localhost;
            return askServer();
          }
          _this.noConnectToServer(e);
        });
      };
      pingReady.then(function() {
        return _this.externalids();
      }).then(askServer);
    };
    this.rch = function(json, noreset) {
      var _this2 = this;
	  rchRun(json, function() {
        if (!noreset) _this2.find();
        else noreset();
	  });
    };
    this.externalids = function() {
      return new Promise(function(resolve, reject) {
        if (!object.movie.imdb_id || !object.movie.kinopoisk_id) {
          var query = [];
          query.push('id=' + encodeURIComponent(object.movie.id));
          query.push('serial=' + (object.movie.name ? 1 : 0));
          if (object.movie.imdb_id) query.push('imdb_id=' + (object.movie.imdb_id || ''));
          if (object.movie.kinopoisk_id) query.push('kinopoisk_id=' + (object.movie.kinopoisk_id || ''));
          var url = Defined.localhost + 'externalids?' + query.join('&');
          network.timeout(10000);
          network.silent(account(url), function(json) {
            for (var name in json) {
              object.movie[name] = json[name];
            }
            resolve();
          }, function() {
            resolve();
          }, false, {
			headers: {'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')}
		  });
        } else resolve();
      });
    };
    this.updateBalanser = function(balanser_name) {
      var last_select_balanser = Lampa.Storage.cache('online_last_balanser', 3000, {});
      last_select_balanser[object.movie.id] = balanser_name;
      Lampa.Storage.set('online_last_balanser', last_select_balanser);
    };
    this.changeBalanser = function(balanser_name) {
      this.updateBalanser(balanser_name);
      Lampa.Storage.set('online_balanser', balanser_name);
      var to = this.getChoice(balanser_name);
      var from = this.getChoice();
      if (from.voice_name) to.voice_name = from.voice_name;
      this.saveChoice(to, balanser_name);
      Lampa.Activity.replace();
    };
    this.requestParams = function(url) {
      var query = [];
      var card_source = object.movie.source || 'tmdb';
      query.push('id=' + encodeURIComponent(object.movie.id));
      if (object.movie.imdb_id) query.push('imdb_id=' + (object.movie.imdb_id || ''));
      if (object.movie.kinopoisk_id) query.push('kinopoisk_id=' + (object.movie.kinopoisk_id || ''));
	  if (object.movie.tmdb_id) query.push('tmdb_id=' + (object.movie.tmdb_id || ''));
      query.push('title=' + encodeURIComponent(object.clarification ? object.search : object.movie.title || object.movie.name));
      query.push('original_title=' + encodeURIComponent(object.movie.original_title || object.movie.original_name));
      query.push('serial=' + (object.movie.name ? 1 : 0));
      query.push('original_language=' + (object.movie.original_language || ''));
      query.push('year=' + ((object.movie.release_date || object.movie.first_air_date || '0000') + '').slice(0, 4));
      query.push('source=' + card_source);
      query.push('clarification=' + (object.clarification ? 1 : 0));
      query.push('similar=' + (object.similar ? true : false));
      query.push('rchtype=' + (((window.rch_nws && window.rch_nws[hostkey]) ? window.rch_nws[hostkey].type : (window.rch && window.rch[hostkey]) ? window.rch[hostkey].type : '') || ''));
      if (Lampa.Storage.get('account_email', '')) query.push('cub_id=' + Lampa.Utils.hash(Lampa.Storage.get('account_email', '')));
      return url + (url.indexOf('?') >= 0 ? '&' : '?') + query.join('&');
    };
    this.getLastChoiceBalanser = function() {
      var last_select_balanser = Lampa.Storage.cache('online_last_balanser', 3000, {});
      if (last_select_balanser[object.movie.id]) {
        return last_select_balanser[object.movie.id];
      } else {
        return Lampa.Storage.get('online_balanser', filter_sources.length ? filter_sources[0] : '');
      }
    };

    var acceptSource = function(key, title) {
      if (!object.movie.name) return true;
      return !SkazUI.isMovieOnlySource(key, title);
    };

    var shownSource = function(name) {
      var info = sources[name];
      return !!(info && info.show);
    };

    var firstShownSource = function() {
      var keys = Object.prototype.toString.call(filter_sources) === '[object Array]' ? filter_sources : [];
      for (var i = 0; i < keys.length; i++) {
        if (shownSource(keys[i])) return keys[i];
      }
      return keys[0] || '';
    };

    var startBalanser = function() {
      var pinned_map = Lampa.Storage.cache('online_last_balanser', 3000, {});
      var pinned = object.lampac_custom_select || pinned_map[object.movie.id] || '';
      if (pinned && sources[pinned]) return pinned;

      var global = Lampa.Storage.get('online_balanser', '');
      if (global && shownSource(global)) return global;

      var shown = firstShownSource();
      if (shown) return shown;
      if (global && sources[global]) return global;
      return filter_sources[0] || '';
    };

    this.startSource = function(json) {

      var _self_src = this && this.sourcesCacheSave ? this : null;
      return new Promise(function(resolve, reject) {
        json.forEach(function(j) {
          var name = balanserName(j);
          if (!acceptSource(name, j.name)) return;
          sources[name] = {
            url: j.url,
            name: j.name,
            show: typeof j.show == 'undefined' ? true : j.show
          };
        });
        filter_sources = sortSourcesByQuality(Lampa.Arrays.getKeys(sources), sources);
        if (_self_src) _self_src.sourcesCacheSave(filter_sources.map(function(key) {
          return {
            key: key,
            url: sources[key].url,
            name: sources[key].name,
            show: sources[key].show
          };
        }));
        if (filter_sources.length) {
          balanser = startBalanser();
          if (!sources[balanser]) balanser = filter_sources[0];
          source = sources[balanser].url;
          Lampa.Storage.set('active_balanser', balanser);
          if (_self_src) _self_src.sourcesLive();
          resolve(json);
        } else {
          reject();
        }
      });
    };
    this.lifeSource = function() {
      var _this3 = this;
      return new Promise(function(resolve, reject) {
        var url = _this3.requestParams(Defined.localhost + 'lifeevents?memkey=' + (_this3.memkey || ''));
        var red = false;
        var gou = function gou(json, any) {
          if (json.accsdb || SkazUI.serverDenial(json)) {
            if (rotateToNextAccount()) {
              url = _this3.requestParams(Defined.localhost + 'lifeevents?memkey=' + (_this3.memkey || ''));
              life_wait_timer = setTimeout(fin, 300);
              return;
            }
            return reject(json);
          }
          var last_balanser = _this3.getLastChoiceBalanser();
          if (!red) {
            var _filter = json.online.filter(function(c) {
              return any ? c.show : c.show && c.name.toLowerCase() == last_balanser;
            });
            if (_filter.length) {
              red = true;
              resolve(json.online.filter(function(c) {
                return c.show;
              }));
            } else if (any) {
              reject();
            }
          }
        };
        var lifeStep = function() {
          return life_wait_times < 4 ? 550 : 1000;
        };
        var lifeOver = function() {
          return life_wait_times > 15 || Date.now() - life_started > 26000;
        };
        var lifeFinish = function() {
          life_done = true;
          clearTimeout(life_wait_timer);
          life_wait_timer = null;
          filter.render().find('.lampac-balanser-loader').remove();
        };
        var fin = function fin(call) {
          if (!life_started) life_started = Date.now();
          network.timeout(3000);
          network.silent(account(url), function(json) {
            life_wait_times++;

            json.online.forEach(function(j) {
              var name = balanserName(j);
              if (!acceptSource(name, j.name)) return;
              sources[name] = {
                url: j.url,
                name: j.name,
                show: typeof j.show == 'undefined' ? true : j.show
              };
            });
            filter_sources = sortSourcesByQuality(Lampa.Arrays.getKeys(sources), sources);
            filter.set('sort', filter_sources.map(function(e) {
              return {
                title: sources[e].name,
                source: e,
                selected: e == balanser,
                ghost: !sources[e].show
              };
            }));
            filter.chosen('sort', [sources[balanser] ? sources[balanser].name : balanser]);
            gou(json);
            var lastb = _this3.getLastChoiceBalanser();
            if (lifeOver() || json.ready) {
              gou(json, true);
              lifeFinish();
            } else if (!red && sources[lastb] && sources[lastb].show) {
              gou(json, true);
              life_wait_timer = setTimeout(fin, lifeStep());
            } else {
              life_wait_timer = setTimeout(fin, lifeStep());
            }
          }, function() {
            life_wait_times++;
            if (lifeOver()) {
              life_done = true;
              reject();
            } else {
              life_wait_timer = setTimeout(fin, lifeStep());
            }
          }, false, {
			headers: {'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')}
		  });
        };
        fin();
      });
    };
    this.createSource = function() {
      var _this4 = this;
      resetAccountRotation();
      if (accountAuto()) applyAccountIndex();
      return new Promise(function(resolve, reject) {
        function tryWithAccount() {
          var url = _this4.requestParams(Defined.localhost + 'lite/events?life=true');
          network.timeout(15000);
          network.silent(account(url), function(json) {
            if (json.accsdb || SkazUI.serverDenial(json)) {
              if (rotateToNextAccount()) {
                tryWithAccount();
              } else {
                reject(json);
              }
              return;
            }
            markAccountAlive(SERVER_CONFIG.pool.currentIndex);
            resetAccountRotation();
            if (json.life) {
              _this4.memkey = json.memkey;
              if (json.title) {
                if (object.movie.name) object.movie.name = json.title;
                if (object.movie.title) object.movie.title = json.title;
              }
              filter.render().find('.filter--sort').append('<span class="lampac-balanser-loader" style="width: 1.2em; height: 1.2em; margin-top: 0; background: url(./img/loader.svg) no-repeat 50% 50%; background-size: contain; margin-left: 0.5em"></span>');
              _this4.lifeSource().then(function(json_life) {
                return _this4.startSource(json_life);
              }).then(resolve)["catch"](reject);
            } else {
              life_done = true;
              _this4.startSource(json).then(resolve)["catch"](reject);
            }
          }, function(err) {
            if (rotateToNextAccount(true)) {
              tryWithAccount();
            } else {
              reject(err);
            }
          }, false, {
            headers: {'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')}
          });
        }
        tryWithAccount();
      });
    };

    this.create = function() {
      return this.render();
    };

    this.search = function() {
      this.filter({
        source: filter_sources
      }, this.getChoice());
      this.find();
    };
    this.find = function() {
      this.request(this.requestParams(source));
    };
    this.request = function(url) {
      var _this = this;

      var origin = String(url).match(/^(https?:\/\/[^\/]+)\//);
      if (origin) last_origin = origin[1] + '/';
      var cached = online_results_cache[url];
      if (cached && (Date.now() - cached.time) < ONLINE_CACHE_TTL) {

        ++request_gen;
        return this.parse(cached.text);
      }
      number_of_requests++;
      if (number_of_requests < 10) {

        var gen = ++request_gen;
        var done = function(str) {
          if (gen !== request_gen) return;
          if (typeof str === 'string' && str.indexOf('videos__') !== -1) {
            online_results_cache[url] = { time: Date.now(), text: str };
          }
          _this.parse(str);
        };

        var send = function(target, retry_left) {
          var target_origin = serverBase(target);
          if (target_origin) last_origin = target_origin;
          network.timeout(SkazUI.REQUEST_TIMEOUT);
          network["native"](account(target), done, function(er) {
            if (gen !== request_gen) return;
            var other = retry_left > 0 && SkazUI.networkFail(er) ? nextServerUrl(target) : '';
            if (other) return send(other, retry_left - 1);
            _this.doesNotAnswer(er);
          }, false, {
            dataType: 'text',
            headers: {'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')}
          });
        };
        send(url, 1);
        clearTimeout(number_of_requests_timer);
        number_of_requests_timer = setTimeout(function() {
          number_of_requests = 0;
        }, 4000);
      } else this.empty();
    };
    this.parseJsonDate = function(str, name) {
      try {
        var html = $('<div>' + str + '</div>');
        var elems = [];
        html.find(name).each(function() {
          var item = $(this);
          var data = JSON.parse(item.attr('data-json'));
          var season = item.attr('s');
          var episode = item.attr('e');
          var text = item.text();
          if (!object.movie.name) {
            if (text.match(/\d+p/i)) {
              if (!data.quality) {
                data.quality = {};
                data.quality[text] = data.url;
              }
              text = object.movie.title;
            }
            if (text == 'По умолчанию') {
              text = object.movie.title;
            }
          }
          if (episode) data.episode = parseInt(episode);
          if (season) data.season = parseInt(season);
          if (text) data.text = text;
          data.active = item.hasClass('active');
          elems.push(data);
        });
        return elems;
      } catch (e) {
        return [];
      }
    };
    this.getFileUrl = function(file, call, waiting_rch) {
	  var _this = this;

      if(Lampa.Storage.field('player') !== 'inner' && file.stream && Lampa.Platform.is('apple')){
		  var newfile = Lampa.Arrays.clone(file);
		  newfile.method = 'play';
		  newfile.url = file.stream;
		  call(newfile, {});
	  }
      else if (file.method == 'play') call(file, {});
      else {
        var pc = file.url ? fileurl_cache[file.url] : null;
        if (pc && (Date.now() - pc.time) < FILEURL_TTL) { call(pc.json, pc.json); return; }
        Lampa.Loading.start(function() {
          Lampa.Loading.stop();
          Lampa.Controller.toggle('content');
          network.clear();
        });
        network.timeout(SkazUI.REQUEST_TIMEOUT);
        network["native"](account(file.url), function(json) {
			if(json.rch){
				if(waiting_rch) {
					waiting_rch = false;
					Lampa.Loading.stop();
					call(false, {});
				}
				else {
					_this.rch(json,function(){
						Lampa.Loading.stop();

						_this.getFileUrl(file, call, true);
					});
				}
			}
			else{
				Lampa.Loading.stop();
				if (file.url && json && !json.rch) fileurl_cache[file.url] = { time: Date.now(), json: json };
				call(json, json);
			}
        }, function() {
          Lampa.Loading.stop();
          call(false, {});
        }, false, {
			headers: {'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')}
            });
      }
    };
    this.prefetchFileUrl = function(file) {
      if (prefetch_timer) { clearTimeout(prefetch_timer); prefetch_timer = null; }

      if (balanser == 'alloha') return;
      if (!file || !file.url || file.method == 'play') return;
      if (Lampa.Platform.is('apple') && file.stream) return;
      var url = file.url;
      var c = fileurl_cache[url];
      if (c && (Date.now() - c.time) < FILEURL_TTL) return;
      if (fileurl_prefetching[url]) return;
      prefetch_timer = setTimeout(function() {
        prefetch_timer = null;
        if (fileurl_prefetching[url]) return;
        var c2 = fileurl_cache[url];
        if (c2 && (Date.now() - c2.time) < FILEURL_TTL) return;
        fileurl_prefetching[url] = true;
        if (!prefetch_network) prefetch_network = new Network();
        prefetch_network.silent(account(url), function(json) {
          delete fileurl_prefetching[url];
          if (json && !json.rch) fileurl_cache[url] = { time: Date.now(), json: json };
        }, function() {
          delete fileurl_prefetching[url];
        }, false, {
          headers: {'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')}
        });
      }, 350);
    };
    this.toPlayElement = function(file) {
      var play = {
        title: file.title,
        url: file.url,
        quality: file.qualitys,
        timeline: file.timeline,
        subtitles: file.subtitles,
		segments: file.segments,
        callback: file.mark,
		season: file.season,
		episode: file.episode,
		voice_name: file.voice_name,
		thumbnail: file.thumbnail
      };
      return play;
    };
    this.orUrlReserve = function(data) {
      if (data.url && typeof data.url == 'string' && data.url.indexOf(" or ") !== -1) {
        var urls = data.url.split(" or ");
        data.url = urls[0];
        data.url_reserve = urls[1];
      }
    };
    this.setDefaultQuality = function(data) {
      if (Lampa.Arrays.getKeys(data.quality).length) {
        for (var q in data.quality) {
          if (parseInt(q) == Lampa.Storage.field('video_quality_default')) {
            data.url = data.quality[q];
            this.orUrlReserve(data);
          }
          if (data.quality[q].indexOf(" or ") !== -1)
            data.quality[q] = data.quality[q].split(" or ")[0];
        }

        var want = parseInt(Lampa.Storage.get('u2skaz_quality', 'auto'), 10);
        if (want) {
          var best = 0;
          var best_url = '';
          for (var key in data.quality) {
            var value = parseInt(key, 10) || 0;
            if (!value || value > want || value <= best) continue;
            best = value;
            best_url = data.quality[key];
          }
          if (best_url) {
            data.url = best_url;
            this.orUrlReserve(data);
          }
        }
      }
    };
    this.display = function(videos) {
      var _this5 = this;
      this.draw(videos, {
        onEnter: function onEnter(item, html) {
          _this5.getFileUrl(item, function(json, json_call) {
            if (json && json.url) {
              var playlist = [];
              var first = _this5.toPlayElement(item);
              first.url = json.url;
              first.headers = json_call.headers || json.headers;
              first.quality = json_call.quality || item.qualitys;
			  first.segments = json_call.segments || item.segments;
              first.hls_manifest_timeout = json_call.hls_manifest_timeout || json.hls_manifest_timeout;
              first.subtitles = json.subtitles;
			  first.subtitles_call = json_call.subtitles_call || json.subtitles_call;
              _this5.orUrlReserve(first);
              _this5.setDefaultQuality(first);
              if (item.season) {
                videos.forEach(function(elem) {
                  if (elem == item) { playlist.push(first); return; }
                  var cell = _this5.toPlayElement(elem);
                  {
                    if (elem.method == 'call') {
                      if (Lampa.Storage.field('player') !== 'inner') {
                        cell.url = elem.stream;
						delete cell.quality;
                      } else {
                        cell.url = function(call) {
                          _this5.getFileUrl(elem, function(stream, stream_json) {
                            if (stream.url) {
                              cell.url = stream.url;
                              cell.quality = stream_json.quality || elem.qualitys;
							  cell.segments = stream_json.segments || elem.segments;
                              cell.subtitles = stream.subtitles;
                              _this5.orUrlReserve(cell);
                              _this5.setDefaultQuality(cell);
                              elem.mark();
                            } else {
                              cell.url = '';
                              Lampa.Noty.show(Lampa.Lang.translate('lampac_nolink'));
                            }
                            call();
                          }, function() {
                            cell.url = '';
                            call();
                          });
                        };
                      }
                    } else {
                      cell.url = elem.url;
                    }
                  }
                  _this5.orUrlReserve(cell);
                  _this5.setDefaultQuality(cell);
                  _markMedia(cell, true);
                  playlist.push(cell);
                });
              } else {
                playlist.push(first);
              }
              if (first.url) {
                var element = first;
				_markMedia(element, !!item.season);
                if (playlist.length > 1) {

                  var extlist = playlist.slice();
                  var _fi = extlist.indexOf(first);
                  if (_fi !== -1) {
                    var firstClone = {};
                    for (var _k in first) { if (first.hasOwnProperty(_k) && _k !== 'playlist') firstClone[_k] = first[_k]; }
                    extlist[_fi] = firstClone;
                  }
                  first.playlist = extlist;
                }
                _installSeriesRewindFix();
                Lampa.Player.playlist(playlist);
                Lampa.Player.play(element);
				if(element.subtitles_call) _this5.loadSubtitles(element.subtitles_call)
                item.mark();
                _this5.updateBalanser(balanser);
                Lampa.Storage.set('online_balanser', balanser);
              } else {
                Lampa.Noty.show(Lampa.Lang.translate('lampac_nolink'));
              }
            } else Lampa.Noty.show(Lampa.Lang.translate('lampac_nolink'));
          }, true);
        },
        onContextMenu: function onContextMenu(item, html, data, call) {
          _this5.getFileUrl(item, function(stream) {
            call({
              file: stream.url,
              quality: item.qualitys
            });
          }, true);
        }
      });
      this.filter({
        season: filter_find.season.map(function(s) {
          return s.title;
        }),
        voice: filter_find.voice.map(function(b) {
          return b.title;
        })
      }, this.getChoice());
    };
	this.loadSubtitles = function(link){
		network.silent(account(link), function(subs){
			Lampa.Player.subtitles(subs)
		}, function() {},false, {
			headers: {'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')}
		  })
	}
    this.parse = function(str) {
      var json = Lampa.Arrays.decodeJson(str, {});
      if (Lampa.Arrays.isObject(str) && str.rch) json = str;
      if (json.rch) return this.rch(json);
      try {
        var items = this.parseJsonDate(str, '.videos__item');
        var buttons = this.parseJsonDate(str, '.videos__button');

        var season_buttons = buttons.filter(function(b) {
          return SkazUI.isSeasonLabel(b.text);
        });
        if (season_buttons.length > 1) {
          filter_find.season = season_buttons.map(function(b) {
            return {
              title: b.text,
              url: b.url
            };
          });
          var active_season = arrFind(season_buttons, function(b) {
            return b.active;
          });
          if (active_season) {
            this.replaceChoice({
              season: season_buttons.indexOf(active_season)
            });
          }
          buttons = buttons.filter(function(b) {
            return !SkazUI.isSeasonLabel(b.text);
          });
          if (!season_pinned) {

            season_pinned = true;
            var wanted_season = this.seasonIndexByMemory();
            if (wanted_season >= 0 && season_buttons[wanted_season] && !season_buttons[wanted_season].active) {
              this.replaceChoice({
                season: wanted_season
              });
              return this.request(season_buttons[wanted_season].url);
            }
          }
        }
        if (items.length == 1 && items[0].method == 'link' && !items[0].similar) {

          if (filter_find.season.length < 2) {
            filter_find.season = items.map(function(s) {
              return {
                title: s.text,
                url: s.url
              };
            });
            this.replaceChoice({
              season: 0
            });
          }
          this.request(items[0].url);
        } else {
          this.activity.loader(false);
          var videos = items.filter(function(v) {
            return v.method == 'play' || v.method == 'call';
          });
          var similar = items.filter(function(v) {
            return v.similar;
          });
          if (videos.length) {
            if (buttons.length) {
              filter_find.voice = buttons.map(function(b) {
                return {
                  title: b.text,
                  url: b.url
                };
              });
              var select_voice_url = this.getChoice(balanser).voice_url;
              var select_voice_name = this.getChoice(balanser).voice_name;
              var find_voice_url = arrFind(buttons, function(v) {
                return v.url == select_voice_url;
              });
              var find_voice_name = arrFind(buttons, function(v) {
                return v.text == select_voice_name;
              });
              var find_voice_active = arrFind(buttons, function(v) {
                return v.active;
              });

              var pref_kind = Lampa.Storage.get('u2skaz_voice_pref', '');
              var find_voice_pref = false;

              if (find_voice_url && !find_voice_url.active) {

                this.replaceChoice({
                  voice: buttons.indexOf(find_voice_url),
                  voice_name: find_voice_url.text
                });
                this.request(find_voice_url.url);
              } else if (find_voice_name && !find_voice_name.active) {

                this.replaceChoice({
                  voice: buttons.indexOf(find_voice_name),
                  voice_name: find_voice_name.text
                });
                this.request(find_voice_name.url);
              } else if (find_voice_pref && !find_voice_pref.active) {
                this.replaceChoice({
                  voice: buttons.indexOf(find_voice_pref),
                  voice_name: find_voice_pref.text
                });
                this.request(find_voice_pref.url);
              } else {
                if (find_voice_active) {
                  this.replaceChoice({
                    voice: buttons.indexOf(find_voice_active),
                    voice_name: find_voice_active.text
                  });
                }
                this.display(videos);
              }
            } else {
              this.replaceChoice({
                voice: 0,
                voice_url: '',
                voice_name: ''
              });
              this.display(videos);
            }
          } else if (items.length) {
            if (similar.length) {
              this.similars(similar);
              this.activity.loader(false);
            } else {
              filter_find.season = items.map(function(s) {
                return {
                  title: s.text,
                  url: s.url
                };
              });
              var select_season = this.getChoice(balanser).season;
              if (!season_pinned) {

                season_pinned = true;
                var remembered = this.seasonIndexByMemory();
                if (remembered >= 0 && remembered !== select_season) {
                  select_season = remembered;
                  this.replaceChoice({
                    season: remembered
                  });
                }
              }
              var season = filter_find.season[select_season];
              if (!season) season = filter_find.season[0];

              this.request(season.url);
            }
          } else {
            this.doesNotAnswer(json);
          }
        }
      } catch (e) {

        this.doesNotAnswer(e);
      }
    };
    this.similars = function(json) {
      var _this6 = this;
      scroll.clear();
      json.forEach(function(elem) {
        elem.title = elem.text;
        elem.info = '';
        var info = [];
        var year = ((elem.start_date || elem.year || object.movie.release_date || object.movie.first_air_date || '') + '').slice(0, 4);
        if (year) info.push(year);
        if (elem.details) info.push(elem.details);
        var name = elem.title || elem.text;
        elem.title = name;
        elem.time = elem.time || '';
        elem.info = info.join('<span class="online-prestige-split">●</span>');
        var item = Lampa.Template.get('lampac_prestige_folder', elem);
		if (elem.img) {
		  var image = $('<img style="height: 7em; width: 7em; border-radius: 0.3em;"/>');
		  item.find('.online-prestige__folder').empty().append(image);

		  if (elem.img !== undefined) {
		    if (elem.img.charAt(0) === '/')
		      elem.img = (last_origin || Defined.localhost) + elem.img.substring(1);
		    if (elem.img.indexOf('/proxyimg') !== -1)
		      elem.img = account(elem.img);
		  }

		  Lampa.Utils.imgLoad(image, elem.img);
		}
        item.on('hover:enter', function() {
          _this6.reset();
          _this6.request(elem.url);
        }).on('hover:focus', function(e) {
          last = e.target;
          SkazUI.scrollShow(scroll, e.target);
        });
        scroll.append(item);
      });
	  this.filter({
        season: filter_find.season.map(function(s) {
          return s.title;
        }),
        voice: filter_find.voice.map(function(b) {
          return b.title;
        })
      }, this.getChoice());
      Lampa.Controller.enable('content');
    };

    this.seasonMemory = function(number) {
      var all = Lampa.Storage.cache('u2skaz_season_last', 3000, {});
      if (number === undefined) return all[object.movie.id];
      if (!number) return;
      all[object.movie.id] = number;
      Lampa.Storage.set('u2skaz_season_last', all);
    };

    this.seasonIndexByMemory = function() {
      var wanted = this.seasonMemory();
      if (!wanted) return -1;
      var list = filter_find.season || [];
      for (var i = 0; i < list.length; i++) {
        if (SkazUI.seasonNumber(list[i].title) == wanted) return i;
      }
      return -1;
    };

    this.getChoice = function(for_balanser) {
      var data = Lampa.Storage.cache('online_choice_' + (for_balanser || balanser), 3000, {});
      var save = data[object.movie.id] || {};
      Lampa.Arrays.extend(save, {
        season: 0,
        voice: 0,
        voice_name: '',
        voice_id: 0,
        episodes_view: {},
        movie_view: ''
      });
      return save;
    };
    this.saveChoice = function(choice, for_balanser) {
      var data = Lampa.Storage.cache('online_choice_' + (for_balanser || balanser), 3000, {});
      data[object.movie.id] = choice;
      Lampa.Storage.set('online_choice_' + (for_balanser || balanser), data);
      this.updateBalanser(for_balanser || balanser);
    };
    this.replaceChoice = function(choice, for_balanser) {
      var to = this.getChoice(for_balanser);
      Lampa.Arrays.extend(to, choice, true);
      this.saveChoice(to, for_balanser);
    };
    this.clearImages = function() {
      images.forEach(function(img) {
        img.onerror = function() {};
        img.onload = function() {};
        img.src = '';
      });
      images = [];
    };

    this.reset = function() {
      last = false;
      ui_keep = '';
      clearInterval(balanser_timer);
      network.clear();
      this.clearImages();
      scroll.render().find('.empty').remove();
      scroll.clear();
      scroll.reset();
      scroll.body().append(Lampa.Template.get('lampac_content_loading'));
    };

    this.loading = function(status) {
      if (status) this.activity.loader(true);
      else {
        this.activity.loader(false);
        this.activity.toggle();
      }
    };

    this.filter = function(filter_items, choice) {
      var _this7 = this;
      var select = [];
      var add = function add(type, title) {
        var need = _this7.getChoice();
        var items = filter_items[type];
        var subitems = [];
        var value = need[type];
        items.forEach(function(name, i) {
          subitems.push({
            title: name,
            selected: value == i,
            index: i
          });
        });
        select.push({
          title: title,
          subtitle: items[value],
          items: subitems,
          stype: type
        });
      };
      filter_items.source = filter_sources;
      select.push({
        title: Lampa.Lang.translate('torrent_parser_reset'),
        reset: true
      });
      this.saveChoice(choice);
      if (filter_items.voice && filter_items.voice.length) add('voice', Lampa.Lang.translate('torrent_parser_voice'));
      if (filter_items.season && filter_items.season.length) add('season', Lampa.Lang.translate('torrent_serial_season'));
      filter.set('filter', select);
      filter.set('sort', filter_sources.map(function(e) {
        return {
          title: sources[e].name,
          source: e,
          selected: e == balanser,
          ghost: !sources[e].show
        };
      }));
      this.selected(filter_items);
    };

    this.selected = function(filter_items) {
      var need = this.getChoice(),
        select = [];
      for (var i in need) {
        if (filter_items[i] && filter_items[i].length) {
          if (i == 'voice') {
            select.push(filter_translate[i] + ': ' + filter_items[i][need[i]]);
          } else if (i !== 'source') {
            if (filter_items.season.length >= 1) {
              select.push(filter_translate.season + ': ' + filter_items[i][need[i]]);
            }
          }
        }
      }
      filter.chosen('filter', select);
      filter.chosen('sort', [sources[balanser] ? sources[balanser].name : balanser]);
    };

    this.seasonPlannedFallback = function(season) {
      var movie = object.movie;
      if (!movie) return 0;
      var want = parseInt(season, 10);
      var list = movie.seasons;
      var i;
      if (want && list && list.length) {
        for (i = 0; i < list.length; i++) {
          if (!list[i]) continue;
          if (parseInt(list[i].season_number, 10) === want) {
            return parseInt(list[i].episode_count, 10) || 0;
          }
        }
      }
      if (parseInt(movie.number_of_seasons, 10) === 1) {
        return parseInt(movie.number_of_episodes, 10) || 0;
      }
      return 0;
    };

    this.getEpisodes = function(season, call) {
      var episodes = [];
	  var tmdb_id = object.movie.id;
	  if (['cub', 'tmdb'].indexOf(object.movie.source || 'tmdb') == -1)
        tmdb_id = object.movie.tmdb_id;
      if (typeof tmdb_id == 'number' && object.movie.name) {
		  var ckey = tmdb_id + ':' + season;
		  if (episodes_cache[ckey]) { call(episodes_cache[ckey]); return; }
		  Lampa.Api.sources.tmdb.get('tv/' + tmdb_id + '/season/' + season, {}, function(data){
			  episodes = data.episodes || [];
			  episodes_cache[ckey] = episodes;
			  call(episodes);
		  }, function(){
			  call(episodes);
		  })
      } else call(episodes);
    };
    this.watched = function(set) {
      var file_id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title);
      var watched = Lampa.Storage.cache('online_watched_last', 5000, {});
      if (set) {
        if (!watched[file_id]) watched[file_id] = {};
        Lampa.Arrays.extend(watched[file_id], set, true);
        Lampa.Storage.set('online_watched_last', watched);
        this.updateWatched();
      } else {
        return watched[file_id];
      }
    };
    this.updateWatched = function() {
      var watched = this.watched();
      var body = scroll.body().find('.online-prestige-watched .online-prestige-watched__body').empty();
      if (watched) {
        var line = [];
        if (watched.balanser_name) line.push(watched.balanser_name);
        if (watched.voice_name) line.push(watched.voice_name);
        if (watched.season) line.push(Lampa.Lang.translate('torrent_serial_season') + ' ' + watched.season);
        if (watched.episode) line.push(Lampa.Lang.translate('torrent_serial_episode') + ' ' + watched.episode);
        line.forEach(function(n) {
          body.append('<span>' + n + '</span>');
        });
      } else body.append('<span>' + Lampa.Lang.translate('lampac_no_watch_history') + '</span>');
    };

    this.draw = function(items) {
      var _this8 = this;
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      if (!items.length) return this.empty();
      scroll.clear();
      if(!object.balanser)scroll.append(Lampa.Template.get('lampac_prestige_watched', {}));
      this.updateWatched();
      this.getEpisodes(items[0].season, function(episodes) {
        var viewed = Lampa.Storage.cache('online_view', 5000, []);
        var serial = object.movie.name ? true : false;
        var choice = _this8.getChoice();
        var fully = window.innerWidth > 480;
        var scroll_to_element = false;
        var scroll_to_mark = false;
        items.forEach(function(element, index) {
          var episode = serial && episodes.length && !params.similars ? arrFind(episodes, function(e) {
            return e.episode_number == element.episode;
          }) : false;
          var episode_num = element.episode || index + 1;
          var episode_last = choice.episodes_view[element.season];
          var voice_name = choice.voice_name || (filter_find.voice[0] ? filter_find.voice[0].title : false) || element.voice_name || (serial ? 'Неизвестно' : element.text) || 'Неизвестно';
          if (element.quality) {
            element.qualitys = element.quality;
            element.quality = Lampa.Arrays.getKeys(element.quality)[0];
          }
          Lampa.Arrays.extend(element, {
            voice_name: voice_name,
            info: voice_name.length > 60 ? voice_name.substr(0, 60) + '...' : voice_name,
            quality: '',
            time: Lampa.Utils.secondsToTime((episode ? episode.runtime : object.movie.runtime) * 60, true)
          });
          var hash_timeline = Lampa.Utils.hash(element.season ? [element.season, element.season > 10 ? ':' : '', element.episode, object.movie.original_title].join('') : object.movie.original_title);
          var hash_behold = Lampa.Utils.hash(element.season ? [element.season, element.season > 10 ? ':' : '', element.episode, object.movie.original_title, element.voice_name].join('') : object.movie.original_title + element.voice_name);
          var data = {
            hash_timeline: hash_timeline,
            hash_behold: hash_behold
          };
          var info = [];
          if (element.season) {
            element.translate_episode_end = _this8.getLastEpisode(items);
            element.translate_voice = element.voice_name;
          }
          if (element.text && !episode) element.title = element.text;
          element.timeline = Lampa.Timeline.view(hash_timeline);
          if (episode) {
            element.title = episode.name;
            if (element.info.length < 30 && episode.vote_average) info.push(Lampa.Template.get('lampac_prestige_rate', {
              rate: parseFloat(episode.vote_average + '').toFixed(1)
            }, true));
            if (episode.air_date && fully) info.push(Lampa.Utils.parseTime(episode.air_date).full);
          } else if (object.movie.release_date && fully) {
            info.push(Lampa.Utils.parseTime(object.movie.release_date).full);
          }
          if (!serial && object.movie.tagline && element.info.length < 30) info.push(object.movie.tagline);
          if (element.info) info.push(element.info);
          if (info.length) element.info = info.map(function(i) {
            return '<span>' + i + '</span>';
          }).join('<span class="online-prestige-split">●</span>');
          var html = Lampa.Template.get('lampac_prestige_full', element);
          var loader = html.find('.online-prestige__loader');
          var image = html.find('.online-prestige__img');
		  if(object.balanser) image.hide();
          if (!serial) {
            if (choice.movie_view == hash_behold) scroll_to_element = html;
          } else if (typeof episode_last !== 'undefined' && episode_last == episode_num) {
            scroll_to_element = html;
          }
          if (serial && !episode) {
            image.append('<div class="online-prestige__episode-number">' + ('0' + (element.episode || index + 1)).slice(-2) + '</div>');
            loader.remove();
          }
		  else if (!artPath(episode ? episode.still_path : object.movie.backdrop_path, 'w300')) loader.remove();
          else {
            var img = html.find('img')[0];
            img.onerror = function() {
              img.src = './img/img_broken.svg';
            };
            img.onload = function() {
              image.addClass('online-prestige__img--loaded');
              loader.remove();
              if (serial) image.append('<div class="online-prestige__episode-number">' + ('0' + (element.episode || index + 1)).slice(-2) + '</div>');
            };
            img.src = artPath(episode ? episode.still_path : object.movie.backdrop_path, 'w300');
            images.push(img);
			element.thumbnail = img.src
          }
          html.find('.online-prestige__timeline').append(Lampa.Timeline.render(element.timeline));
          if (viewed.indexOf(hash_behold) !== -1) {
            scroll_to_mark = html;
            html.find('.online-prestige__img').append('<div class="online-prestige__viewed">' + Lampa.Template.get('icon_viewed', {}, true) + '</div>');
          }
          element.mark = function() {
            viewed = Lampa.Storage.cache('online_view', 5000, []);
            if (viewed.indexOf(hash_behold) == -1) {
              viewed.push(hash_behold);
              Lampa.Storage.set('online_view', viewed);
              if (html.find('.online-prestige__viewed').length == 0) {
                html.find('.online-prestige__img').append('<div class="online-prestige__viewed">' + Lampa.Template.get('icon_viewed', {}, true) + '</div>');
              }
            }
            choice = _this8.getChoice();
            if (!serial) {
              choice.movie_view = hash_behold;
            } else {
              choice.episodes_view[element.season] = episode_num;
            }
            _this8.saveChoice(choice);
            var voice_name_text = choice.voice_name || element.voice_name || element.title;
            if (voice_name_text.length > 30) voice_name_text = voice_name_text.slice(0, 30) + '...';
            _this8.watched({
              balanser: balanser,
              balanser_name: Lampa.Utils.capitalizeFirstLetter(sources[balanser] ? sources[balanser].name.split(' ')[0] : balanser),
              voice_id: choice.voice_id,
              voice_name: voice_name_text,
              episode: element.episode,
              season: element.season
            });
          };
          element.unmark = function() {
            viewed = Lampa.Storage.cache('online_view', 5000, []);
            if (viewed.indexOf(hash_behold) !== -1) {
              Lampa.Arrays.remove(viewed, hash_behold);
              Lampa.Storage.set('online_view', viewed);
              Lampa.Storage.remove('online_view', hash_behold);
              html.find('.online-prestige__viewed').remove();
            }
          };
          element.timeclear = function() {
            element.timeline.percent = 0;
            element.timeline.time = 0;
            element.timeline.duration = 0;
            Lampa.Timeline.update(element.timeline);
          };
          html.on('hover:enter', function() {
            if (object.movie.id) Lampa.Favorite.add('history', object.movie, 100);
            if (params.onEnter) params.onEnter(element, html, data);
          }).on('hover:focus', function(e) {
            last = e.target;
            if (params.onFocus) params.onFocus(element, html, data);
            _this8.prefetchFileUrl(element);
            SkazUI.scrollShow(scroll, e.target);
          });
          if (params.onRender) params.onRender(element, html, data);
          _this8.contextMenu({
            html: html,
            element: element,
            onFile: function onFile(call) {
              if (params.onContextMenu) params.onContextMenu(element, html, data, call);
            },
            onClearAllMark: function onClearAllMark() {
              items.forEach(function(elem) {
                elem.unmark();
              });
            },
            onClearAllTime: function onClearAllTime() {
              items.forEach(function(elem) {
                elem.timeclear();
              });
            }
          });
          scroll.append(html);
        });
        if (serial && episodes.length > items.length && !params.similars) {
          var left = episodes.slice(items.length);
          left.forEach(function(episode) {
            var info = [];
            if (episode.vote_average) info.push(Lampa.Template.get('lampac_prestige_rate', {
              rate: parseFloat(episode.vote_average + '').toFixed(1)
            }, true));
            if (episode.air_date) info.push(Lampa.Utils.parseTime(episode.air_date).full);
            var air = new Date((episode.air_date + '').replace(/-/g, '/'));
            var now = Date.now();
            var day = Math.round((air.getTime() - now) / (24 * 60 * 60 * 1000));
            var txt = Lampa.Lang.translate('full_episode_days_left') + ': ' + day;
            var html = Lampa.Template.get('lampac_prestige_full', {
              time: Lampa.Utils.secondsToTime((episode ? episode.runtime : object.movie.runtime) * 60, true),
              info: info.length ? info.map(function(i) {
                return '<span>' + i + '</span>';
              }).join('<span class="online-prestige-split">●</span>') : '',
              title: episode.name,
              quality: day > 0 ? txt : ''
            });
            var loader = html.find('.online-prestige__loader');
            var image = html.find('.online-prestige__img');
            var season = items[0] ? items[0].season : 1;
            html.find('.online-prestige__timeline').append(Lampa.Timeline.render(Lampa.Timeline.view(Lampa.Utils.hash([season, episode.episode_number, object.movie.original_title].join('')))));
            var img = html.find('img')[0];
            var still = artPath(episode.still_path, 'w300');
            if (still) {
              img.onerror = function() {
                img.src = './img/img_broken.svg';
              };
              img.onload = function() {
                image.addClass('online-prestige__img--loaded');
                loader.remove();
                image.append('<div class="online-prestige__episode-number">' + ('0' + episode.episode_number).slice(-2) + '</div>');
              };
              img.src = still;
              images.push(img);
            } else {
              loader.remove();
              image.append('<div class="online-prestige__episode-number">' + ('0' + episode.episode_number).slice(-2) + '</div>');
            }
            html.on('hover:focus', function(e) {
              last = e.target;
              SkazUI.scrollShow(scroll, e.target);
            });
            html.css('opacity', '0.5');
            scroll.append(html);
          });
        }
        if (scroll_to_element) {
          last = scroll_to_element[0];
        } else if (scroll_to_mark) {
          last = scroll_to_mark[0];
        }
        Lampa.Controller.enable('content');

        if (object.lampac_continue_episode) {
          var target_ep = object.lampac_continue_episode;
          delete object.lampac_continue_episode;

          var target_item = arrFind(items, function(el) {
            return el.episode == target_ep;
          });

          if (target_item) {
            setTimeout(function() {
              var target_html = scroll.body().find('.online-prestige--full').eq(items.indexOf(target_item));
              if (target_html.length) {
                last = target_html[0];
                SkazUI.scrollShow(scroll, target_html);
                target_html.trigger('hover:enter');
              }
            }, 300);
          }
        }
      });
    };

    this.contextMenu = function(params) {
      var _self = this;
      params.html.on('hover:long', function() {
        function show(extra) {
          var enabled = Lampa.Controller.enabled().name;
          var menu = [];
          if (Lampa.Platform.is('webos')) {
            menu.push({
              title: Lampa.Lang.translate('player_lauch') + ' - Webos',
              player: 'webos'
            });
          }
          if (Lampa.Platform.is('android')) {
            menu.push({
              title: Lampa.Lang.translate('player_lauch') + ' - Android',
              player: 'android'
            });
          }
          menu.push({
            title: Lampa.Lang.translate('player_lauch') + ' - Lampa',
            player: 'lampa'
          });
          menu.push({
            title: Lampa.Lang.translate('lampac_video'),
            separator: true
          });
          menu.push({
            title: Lampa.Lang.translate('torrent_parser_label_title'),
            mark: true
          });
          menu.push({
            title: Lampa.Lang.translate('torrent_parser_label_cancel_title'),
            unmark: true
          });
          if (params.element && params.element.episode) {
            menu.push({
              title: Lampa.Lang.translate('u2skaz_mark_before'),
              markbefore: true
            });
          }
          menu.push({
            title: Lampa.Lang.translate('time_reset'),
            timeclear: true
          });
          if (extra) {
            menu.push({
              title: Lampa.Lang.translate('copy_link'),
              copylink: true
            });
          }
          if (window.lampac_online_context_menu)
            window.lampac_online_context_menu.push(menu, extra, params);
          menu.push({
            title: Lampa.Lang.translate('more'),
            separator: true
          });
          if (Lampa.Account.logged() && params.element && typeof params.element.season !== 'undefined' && params.element.translate_voice) {
            menu.push({
              title: Lampa.Lang.translate('lampac_voice_subscribe'),
              subscribe: true
            });
          }
          menu.push({
            title: Lampa.Lang.translate('lampac_clear_all_marks'),
            clearallmark: true
          });
          menu.push({
            title: Lampa.Lang.translate('lampac_clear_all_timecodes'),
            timeclearall: true
          });
          Lampa.Select.show({
            title: Lampa.Lang.translate('title_action'),
            items: menu,
            onBack: function onBack() {
              Lampa.Controller.toggle(enabled);
            },
            onSelect: function onSelect(a) {
              if (a.mark) {
                if (params.element.markSeen) params.element.markSeen();
                else params.element.mark();
              }
              if (a.unmark) params.element.unmark();
              if (a.markbefore) _self.markUpTo(params.element);
              if (a.timeclear) params.element.timeclear();
                  if (a.clearallmark) params.onClearAllMark();
              if (a.timeclearall) params.onClearAllTime();
              if (window.lampac_online_context_menu)
                window.lampac_online_context_menu.onSelect(a, params);
              Lampa.Controller.toggle(enabled);
              if (a.player) {
                Lampa.Player.runas(a.player);
                params.html.trigger('hover:enter');
              }
              if (a.copylink) {
                if (extra.quality) {
                  var qual = [];
                  for (var i in extra.quality) {
                    qual.push({
                      title: i,
                      file: extra.quality[i]
                    });
                  }
                  Lampa.Select.show({
                    title: Lampa.Lang.translate('settings_server_links'),
                    items: qual,
                    onBack: function onBack() {
                      Lampa.Controller.toggle(enabled);
                    },
                    onSelect: function onSelect(b) {
                      Lampa.Utils.copyTextToClipboard(b.file, function() {
                        Lampa.Noty.show(Lampa.Lang.translate('copy_secuses'));
                      }, function() {
                        Lampa.Noty.show(Lampa.Lang.translate('copy_error'));
                      });
                    }
                  });
                } else {
                  Lampa.Utils.copyTextToClipboard(extra.file, function() {
                    Lampa.Noty.show(Lampa.Lang.translate('copy_secuses'));
                  }, function() {
                    Lampa.Noty.show(Lampa.Lang.translate('copy_error'));
                  });
                }
              }
              if (a.subscribe) {
                Lampa.Account.subscribeToTranslation({
                  card: object.movie,
                  season: params.element.season,
                  episode: params.element.translate_episode_end,
                  voice: params.element.translate_voice
                }, function() {
                  Lampa.Noty.show(Lampa.Lang.translate('lampac_voice_success'));
                }, function() {
                  Lampa.Noty.show(Lampa.Lang.translate('lampac_voice_error'));
                });
              }
            }
          });
        }
        params.onFile(show);
      }).on('hover:focus', function() {
        if (Lampa.Helper) Lampa.Helper.show('online_file', Lampa.Lang.translate('helper_online_file'), params.html);
      });
    };
    this.empty = function() {
      var html = Lampa.Template.get('lampac_does_not_answer', {});
      html.find('.online-empty__buttons').remove();
      html.find('.online-empty__title').text(Lampa.Lang.translate('empty_title_two'));
      html.find('.online-empty__time').text(Lampa.Lang.translate('empty_text'));
      scroll.clear();
      scroll.append(html);
      this.loading(false);
    };
    this.noConnectToServer = function(er) {
      var html = Lampa.Template.get('lampac_does_not_answer', {});
      html.find('.online-empty__buttons').remove();
      html.find('.online-empty__title').text(Lampa.Lang.translate('title_error'));
      html.find('.online-empty__time').html(er && er.accsdb ? er.msg : Lampa.Lang.translate('lampac_does_not_answer_text').replace('{balanser}', sources[balanser] ? sources[balanser].name : balanser));
      scroll.clear();
      scroll.append(html);
      this.loading(false);
    };
    this.doesNotAnswer = function(er) {
      var _this9 = this;
      this.reset();

      if (filter_sources && filter_sources.length) {
        filter.set('sort', filter_sources.map(function(e) {
          return {
            title: sources[e] ? sources[e].name : e,
            source: e,
            selected: e == balanser,
            ghost: sources[e] ? !sources[e].show : false
          };
        }));
      }
      var html = Lampa.Template.get('lampac_does_not_answer', {
        balanser: balanser
      });
      if(er && er.accsdb) html.find('.online-empty__title').html(er.msg);

      var tic = er && er.accsdb ? 10 : 5;
      html.find('.cancel').on('hover:enter', function() {
        clearInterval(balanser_timer);
      });
      html.find('.change').on('hover:enter', function() {
        clearInterval(balanser_timer);
        filter.render().find('.filter--sort').trigger('hover:enter');
      });
      scroll.clear();
      scroll.append(html);
      this.loading(false);
      balanser_timer = setInterval(function() {
        tic--;
        html.find('.timeout').text(tic);
        if (tic == 0) {
          clearInterval(balanser_timer);
          var keys = Lampa.Arrays.getKeys(sources);
          var indx = keys.indexOf(balanser);
          var next = keys[indx + 1];
          if (!next) next = keys[0];
          balanser = next;
          if (Lampa.Activity.active().activity == _this9.activity) _this9.changeBalanser(balanser);
        }
      }, 1000);
    };
    this.getLastEpisode = function(items) {
      var last_episode = 0;
      items.forEach(function(e) {
        if (typeof e.episode !== 'undefined') last_episode = Math.max(last_episode, parseInt(e.episode));
      });
      return last_episode;
    };

    this.start = function() {
      var _this = this;
      if (Lampa.Activity.active().activity !== this.activity) return;
      SkazUI.qualityScope(object.movie ? object.movie.id : '');
      if (!initialized) {
        initialized = true;
        this.initialize();
      }
      Lampa.Background.immediately(Lampa.Utils.cardImgBackgroundBlur(object.movie));
      Lampa.Controller.add('content', {
        toggle: function toggle() {
          Lampa.Controller.collectionSet(scroll.render(), files.render());
          var target = last;
          Lampa.Controller.collectionFocus(target || false, scroll.render());
        },
        gone: function gone() {
          clearTimeout(balanser_timer);
        },
        up: function up() {
          if (Navigator.canmove('up')) {
            Navigator.move('up');
            return;
          }

          Lampa.Controller.toggle('head');
        },
        down: function down() {

          Navigator.move('down');
        },
        right: function right() {
          if (Navigator.canmove('right')) Navigator.move('right');
          else filter.show(Lampa.Lang.translate('title_filter'), 'filter');
        },
        left: function left() {
          if (Navigator.canmove('left')) Navigator.move('left');
          else Lampa.Controller.toggle('menu');
        },
        back: this.back.bind(this)
      });
      Lampa.Controller.toggle('content');
    };
    this.render = function() {
      return files.render();
    };
    this.back = function() {
      Lampa.Activity.backward();
    };


    this.pause = function() {};
    this.stop = function() {};
    this.destroy = function() {
      network.clear();
      if (prefetch_timer) { clearTimeout(prefetch_timer); prefetch_timer = null; }
      if (prefetch_network) { try { prefetch_network.clear(); } catch (e) {} prefetch_network = null; }
      fileurl_cache = {};
      fileurl_prefetching = {};
      episodes_cache = {};
      this.clearImages();
      files.destroy();
      scroll.destroy();
      clearInterval(balanser_timer);
      clearInterval(ui_load_timer);
      clearTimeout(ui_watchdog);
      clearTimeout(life_wait_timer);
    };
  }

  function addSourceSearch(spiderName, spiderUri) {
    var network = new Lampa.Reguest();

    var source = {
      title: spiderName,
      search: function(params, oncomplite) {
        function searchComplite(links) {
          var keys = Lampa.Arrays.getKeys(links);

          if (keys.length) {
            var status = new Lampa.Status(keys.length);

            status.onComplite = function(result) {
              var rows = [];

              keys.forEach(function(name) {
                var line = result[name];

                if (line && line.data && line.type == 'similar') {
                  var cards = line.data.map(function(item) {
                    item.title = Lampa.Utils.capitalizeFirstLetter(item.title);
                    item.release_date = item.year || '0000';
                    item.balanser = spiderUri;
                    if (item.img !== undefined) {
                      if (item.img.charAt(0) === '/')
                        item.img = Defined.localhost + item.img.substring(1);
                      if (item.img.indexOf('/proxyimg') !== -1)
                        item.img = account(item.img);
                    }

                    return item;
                  })

                  rows.push({
                    title: name,
                    results: cards
                  })
                }
              })

              oncomplite(rows);
            }

            keys.forEach(function(name) {
              network.silent(account(links[name]), function(data) {
                status.append(name, data);
              }, function() {
                status.error();
              }, false, {
			headers: {'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')}
		  })
            })
          } else {
            oncomplite([]);
          }
        }

        network.silent(account(Defined.localhost + 'lite/' + spiderUri + '?title=' + params.query), function(json) {
          if (json.rch) {
            rchRun(json, function() {
              network.silent(account(Defined.localhost + 'lite/' + spiderUri + '?title=' + params.query), function(links) {
                searchComplite(links);
              }, function() {
                oncomplite([]);
              }, false, {
			headers: {'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')}
     });
            });
          } else {
            searchComplite(json);
          }
        }, function() {
          oncomplite([]);
        }, false, {
			headers: {'X-Kit-AesGcm': Lampa.Storage.get('aesgcmkey', '')}
		  });
      },
      onCancel: function() {
        network.clear()
      },
      params: {
        lazy: true,
        align_left: true,
        card_events: {
          onMenu: function() {}
        }
      },
      onMore: function(params, close) {
        close();
      },
      onSelect: function(params, close) {
        close();

        Lampa.Activity.push({
          url: params.element.url,
          title: Lampa.Lang.translate('title_online') + ' - ' + params.element.title,
          component: 'u2skaz_video',
          movie: params.element,
          page: 1,
          search: params.element.title,
          clarification: true,
          balanser: params.element.balanser,
          noinfo: true
        });
      }
    }

    Lampa.Search.addSource(source)
  }

  function startPlugin() {
    window.u2skaz_online_plugin = true;
		Lampa.SettingsApi.addComponent({
        component: 'u2skaz_online',
        icon: "<svg height=\"36\" viewBox=\"0 0 36 36\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M18 1c.9 6.2 2.2 10.4 4.1 12.7C24 16 28 17.3 34 18c-6 .7-10 2-11.9 4.3C20.2 24.6 18.9 28.8 18 35c-.9-6.2-2.2-10.4-4.1-12.7C12 20 8 18.7 2 18c6-.7 10-2 11.9-4.3C15.8 11.4 17.1 7.2 18 1z\" fill=\"white\"/><circle cx=\"18\" cy=\"18\" r=\"3.6\" fill=\"white\"/></svg>",
        name: 'Skaz Online'
      });
	  		var currentAcc = currentAccount();
				var uniqs = (currentAcc ? currentAcc.uid : unic_id).slice(-3).toUpperCase();
				Lampa.SettingsApi.addParam({
				component: 'u2skaz_online',
				param: {
					name: 'only_title',
					type: 'title',
					default: true
				},
				field: {
					name: 'Код устройства '+uniqs + ' (' + accountTitle(SERVER_CONFIG.pool.currentIndex) + ')'
				}
			});
Lampa.SettingsApi.addParam({
    component: 'u2skaz_online',
    param: {
        name: 'u2skaz_button_first',
        type: 'trigger',
        default: false
    },
    field: {
        name: 'Кнопка Онлайн первой',
        description: 'Показывать кнопку онлайн перед остальными'
    }
});

	  Lampa.SettingsApi.addParam({
				component: 'u2skaz_online',
				param: {
					name: 'only_title',
					type: 'title',
					default: true
				},
				field: {
					name: 'Онлайн'
				}
			});

	  Lampa.SettingsApi.addParam({
        component: 'u2skaz_online',
        param: {
          name: 'u2skaz_proxy_servers',
          type: 'trigger',
            default: false,
        },
        field: {
          name: 'Проксировать серверы',
		  description: 'Позволяет проксировать онлайн через серверы CloudFlare'
        },
        onChange: function (value) {
			Lampa.Noty.show('Необходимо перезайти в лампу');
		}
	  });

	  Lampa.SettingsApi.addParam({
        component: 'u2skaz_online',
        param: {
          name: 'u2skaz_account_index',
          type: 'select',
          values: (function() {
            var v = { auto: 'Случайный' };
            SERVER_CONFIG.pool.accounts.forEach(function(a, i) { v[String(i)] = accountTitle(i); });
            return v;
          })(),
          default: 'auto'
        },
        field: {
          name: 'Аккаунт',
          description: 'Случайный выбор или конкретный аккаунт'
        },
        onChange: function(value) {
          Lampa.Storage.set('u2skaz_account_index', String(value) === 'auto' ? 'auto' : (parseInt(value, 10) || 0));
          resetAccountRotation();
          applyAccountIndex();
          Lampa.Noty.show('Аккаунт переключен. Перезайдите в онлайн.');
        }
	  });

    var manifst = {
      type: 'video',
      version: '',
      name: 'Skaz',
      description: 'Смотреть онлайн',
      component: 'u2skaz_video',
      onContextMenu: function onContextMenu(object) {
        return {
          name: Lampa.Lang.translate('lampac_watch'),
          description: ''
        };
      },
      onContextLauch: function onContextLauch(object) {
        resetTemplates();
        Lampa.Component.add('u2skaz_video', component);

		var id = Lampa.Utils.hash(object.number_of_seasons ? object.original_name : object.original_title);
		var all = Lampa.Storage.get('clarification_search','{}');

		var isSeries = object.number_of_seasons || object.name;
		var continueEnabled = Lampa.Storage.field('lampac_continue_play') === true;
		var file_id = Lampa.Utils.hash(object.number_of_seasons ? object.original_name : object.original_title);
		var watched = Lampa.Storage.cache('online_watched_last', 5000, {});
		var watchedData = watched[file_id];

		if (isSeries && continueEnabled && watchedData && watchedData.season && watchedData.episode) {
		  var line = [];
		  if (watchedData.balanser_name) line.push(watchedData.balanser_name);
		  if (watchedData.voice_name) line.push(watchedData.voice_name);
		  line.push(Lampa.Lang.translate('torrent_serial_season') + ' ' + watchedData.season);
		  line.push(Lampa.Lang.translate('torrent_serial_episode') + ' ' + watchedData.episode);

		  Lampa.Select.show({
		    title: Lampa.Lang.translate('lampac_continue_watch'),
		    items: [
		      { title: '▶ ' + Lampa.Lang.translate('lampac_continue_yes') + ' (' + line.join(' · ') + ')', continue_yes: true },
		      { title: Lampa.Lang.translate('lampac_continue_no'), continue_no: true }
		    ],
		    onBack: function() {
		      Lampa.Controller.toggle('content');
		    },
		    onSelect: function(sel) {
		      Lampa.Select.close();

		      if (sel.continue_yes && watchedData.balanser) {
		        var last_select_balanser = Lampa.Storage.cache('online_last_balanser', 3000, {});
		        last_select_balanser[object.id] = watchedData.balanser;
		        Lampa.Storage.set('online_last_balanser', last_select_balanser);

		        var choiceData = Lampa.Storage.cache('online_choice_' + watchedData.balanser, 3000, {});
		        if (!choiceData[object.id]) choiceData[object.id] = {};
		        var seasonIdx = (parseInt(watchedData.season) || 1) - 1;
		        if (seasonIdx < 0) seasonIdx = 0;
		        choiceData[object.id].season = seasonIdx;
		        if (watchedData.voice_name) choiceData[object.id].voice_name = watchedData.voice_name;
		        Lampa.Storage.set('online_choice_' + watchedData.balanser, choiceData);

		        Lampa.Activity.push({
		          url: '',
		          title: Lampa.Lang.translate('title_online'),
		          component: 'u2skaz_video',
		          search: all[id] ? all[id] : object.title,
		          search_one: object.title,
		          search_two: object.original_title,
		          movie: object,
		          page: 1,
		          clarification: all[id] ? true : false,
		          lampac_continue_episode: parseInt(watchedData.episode) || 1
		        });
		      } else {
		        Lampa.Activity.push({
		          url: '',
		          title: Lampa.Lang.translate('title_online'),
		          component: 'u2skaz_video',
		          search: all[id] ? all[id] : object.title,
		          search_one: object.title,
		          search_two: object.original_title,
		          movie: object,
		          page: 1,
		          clarification: all[id] ? true : false
		        });
		      }
		    }
		  });
		} else {
        Lampa.Activity.push({
          url: '',
          title: Lampa.Lang.translate('title_online'),
          component: 'u2skaz_video',
          search: all[id] ? all[id] : object.title,
          search_one: object.title,
          search_two: object.original_title,
          movie: object,
          page: 1,
		  clarification: all[id] ? true : false
        });
		}
      }
    };
    Lampa.Manifest.plugins = manifst;
    Lampa.Lang.add({
      lampac_continue_watch: {
        ru: 'Продолжить просмотр?',
        en: 'Continue watching?',
        uk: 'Продовжити перегляд?',
        zh: '继续观看？'
      },
      lampac_continue_yes: {
        ru: 'Продолжить',
        en: 'Continue',
        uk: 'Продовжити',
        zh: '继续'
      },
      lampac_continue_no: {
        ru: 'Выбрать серию',
        en: 'Choose episode',
        uk: 'Обрати серію',
        zh: '选择剧集'
      },
      lampac_continue_enable: {
        ru: 'Предлагать продолжение',
        en: 'Suggest continue watching',
        uk: 'Пропонувати продовження',
        zh: '建议继续观看'
      },
      lampac_continue_enable_descr: {
        ru: 'Показывать диалог продолжения при входе в сериал',
        en: 'Show continue dialog when entering a series',
        uk: 'Показувати діалог продовження при вході в серіал',
        zh: '进入剧集时显示继续对话框'
      },
      lampac_watch: {
        ru: 'Смотреть онлайн',
        en: 'Watch online',
        uk: 'Дивитися онлайн',
        zh: '在线观看'
      },
      lampac_video: {
        ru: 'Видео',
        en: 'Video',
        uk: 'Відео',
        zh: '视频'
      },
      lampac_no_watch_history: {
        ru: 'Нет истории просмотра',
        en: 'No browsing history',
        uk: 'Немає історії перегляду',
        zh: '没有浏览历史'
      },
      lampac_nolink: {
        ru: 'Не удалось извлечь ссылку',
        uk: 'Неможливо отримати посилання',
        en: 'Failed to fetch link',
        zh: '获取链接失败'
      },
      lampac_balanser: {
        ru: 'Источник',
        uk: 'Джерело',
        en: 'Source',
        zh: '来源'
      },
      helper_online_file: {
        ru: 'Удерживайте клавишу "ОК" для вызова контекстного меню',
        uk: 'Утримуйте клавішу "ОК" для виклику контекстного меню',
        en: 'Hold the "OK" key to bring up the context menu',
        zh: '按住“确定”键调出上下文菜单'
      },
      title_online: {
        ru: 'Онлайн',
        uk: 'Онлайн',
        en: 'Online',
        zh: '在线的'
      },
      lampac_voice_subscribe: {
        ru: 'Подписаться на перевод',
        uk: 'Підписатися на переклад',
        en: 'Subscribe to translation',
        zh: '订阅翻译'
      },
      lampac_voice_success: {
        ru: 'Вы успешно подписались',
        uk: 'Ви успішно підписалися',
        en: 'You have successfully subscribed',
        zh: '您已成功订阅'
      },
      lampac_voice_error: {
        ru: 'Возникла ошибка',
        uk: 'Виникла помилка',
        en: 'An error has occurred',
        zh: '发生了错误'
      },
      lampac_clear_all_marks: {
        ru: 'Очистить все метки',
        uk: 'Очистити всі мітки',
        en: 'Clear all labels',
        zh: '清除所有标签'
      },
      lampac_clear_all_timecodes: {
        ru: 'Очистить все тайм-коды',
        uk: 'Очистити всі тайм-коди',
        en: 'Clear all timecodes',
        zh: '清除所有时间代码'
      },
      lampac_change_balanser: {
        ru: 'Изменить балансер',
        uk: 'Змінити балансер',
        en: 'Change balancer',
        zh: '更改平衡器'
      },
      lampac_balanser_dont_work: {
        ru: 'Поиск не дал результатов',
        uk: 'Пошук не дав результатів',
        en: 'Search  did not return any results',
        zh: '搜索 未返回任何结果'
      },
      lampac_balanser_timeout: {
        ru: 'Источник будет переключен автоматически через <span class="timeout">10</span> секунд.',
        uk: 'Джерело буде автоматично переключено через <span class="timeout">10</span> секунд.',
        en: 'The source will be switched automatically after <span class="timeout">10</span> seconds.',
        zh: '平衡器将在<span class="timeout">10</span>秒内自动切换。'
      },

      u2skaz_voice_dub: {
        ru: 'Дубляж',
        uk: 'Дубляж',
        en: 'Dubbing',
        zh: '配音'
      },
      u2skaz_voice_mvo: {
        ru: 'Многоголосый',
        uk: 'Багатоголосий',
        en: 'Multi-voice',
        zh: '多人配音'
      },
      u2skaz_voice_dvo: {
        ru: 'Двухголосый',
        uk: 'Двоголосий',
        en: 'Two-voice',
        zh: '双人配音'
      },
      u2skaz_voice_avo: {
        ru: 'Авторский',
        uk: 'Авторський',
        en: 'Single-voice',
        zh: '单人配音'
      },
      u2skaz_voice_orig: {
        ru: 'Оригинал',
        uk: 'Оригінал',
        en: 'Original',
        zh: '原声'
      },
      u2skaz_voice_sub: {
        ru: 'Субтитры',
        uk: 'Субтитри',
        en: 'Subtitles',
        zh: '字幕'
      },
      u2skaz_voice_other: {
        ru: 'Прочие',
        uk: 'Інші',
        en: 'Other',
        zh: '其他'
      },
      u2skaz_quality_name: {
        ru: 'Качество по умолчанию',
        uk: 'Якість за замовчуванням',
        en: 'Default quality',
        zh: '默认画质'
      },
      u2skaz_quality_descr: {
        ru: 'Запускать в этом качестве, если оно есть — иначе в ближайшем ниже',
        uk: 'Запускати в цій якості, якщо вона є — інакше в найближчій нижче',
        en: 'Play at this quality when available, otherwise the closest lower one',
        zh: '有该画质时使用，否则用最接近的较低画质'
      },
      u2skaz_quality_auto: {
        ru: 'Как решит источник',
        uk: 'Як вирішить джерело',
        en: 'Let the source decide',
        zh: '由来源决定'
      },
      u2skaz_mark_before: {
        ru: 'Отметить всё до этой',
        uk: 'Позначити все до цієї',
        en: 'Mark everything up to this',
        zh: '标记此集之前全部'
      },
      u2skaz_no_access_text: {
        ru: 'Сервер отказал в доступе',
        uk: 'Сервер відмовив у доступі',
        en: 'The server denied access',
        zh: '服务器拒绝访问'
      },
      u2skaz_settings: {
        ru: 'Онлайн',
        uk: 'Онлайн',
        en: 'Online',
        zh: '在线'
      },
      u2skaz_logo_name: {
        ru: 'Логотип вместо названия',
        uk: 'Логотип замість назви',
        en: 'Logo instead of title',
        zh: '用标识代替标题'
      },
      u2skaz_logo_descr: {
        ru: 'Показывать логотип фильма в шапке, если он есть',
        uk: 'Показувати логотип фільму в шапці, якщо він є',
        en: 'Show the movie logo in the header when available',
        zh: '如果有，在头部显示影片标识'
      },
      lampac_does_not_answer_text: {
        ru: 'Поиск на ({balanser}) не дал результатов',
        uk: 'Пошук на ({balanser}) не дав результатів',
        en: 'Search on ({balanser}) did not return any results',
        zh: '搜索 ({balanser}) 未返回任何结果'
      }
    });
    Lampa.Template.add('lampac_css', "\n        <style>\n        @charset 'UTF-8';.online-prestige{position:relative;-webkit-border-radius:.3em;border-radius:.3em;background-color:rgba(0,0,0,0.3);display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex}.online-prestige__body{padding:1.2em;line-height:1.3;-webkit-box-flex:1;-webkit-flex-grow:1;-moz-box-flex:1;-ms-flex-positive:1;flex-grow:1;position:relative}@media screen and (max-width:480px){.online-prestige__body{padding:.8em 1.2em}}.online-prestige__img{position:relative;width:13em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0;min-height:8.2em}.online-prestige__img>img{position:absolute;top:0;left:0;width:100%;height:100%;-o-object-fit:cover;object-fit:cover;-webkit-border-radius:.3em;border-radius:.3em;opacity:0;-webkit-transition:opacity .3s;-o-transition:opacity .3s;-moz-transition:opacity .3s;transition:opacity .3s}.online-prestige__img--loaded>img{opacity:1}@media screen and (max-width:480px){.online-prestige__img{width:7em;min-height:6em}}.online-prestige__folder{padding:1em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}.online-prestige__folder>svg{width:4.4em !important;height:4.4em !important}.online-prestige__viewed{position:absolute;top:1em;left:1em;background:rgba(0,0,0,0.45);-webkit-border-radius:100%;border-radius:100%;padding:.25em;font-size:.76em}.online-prestige__viewed>svg{width:1.5em !important;height:1.5em !important}.online-prestige__episode-number{position:absolute;top:0;left:0;right:0;bottom:0;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;-moz-box-pack:center;-ms-flex-pack:center;justify-content:center;font-size:2em}.online-prestige__loader{position:absolute;top:50%;left:50%;width:2em;height:2em;margin-left:-1em;margin-top:-1em;background:url(./img/loader.svg) no-repeat center center;-webkit-background-size:contain;-o-background-size:contain;background-size:contain}.online-prestige__head,.online-prestige__footer{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-pack:justify;-webkit-justify-content:space-between;-moz-box-pack:justify;-ms-flex-pack:justify;justify-content:space-between;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}.online-prestige__timeline{margin:.8em 0}.online-prestige__timeline>.time-line{display:block !important}.online-prestige__title{font-size:1.7em;overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:1;line-clamp:1;-webkit-box-orient:vertical}@media screen and (max-width:480px){.online-prestige__title{font-size:1.4em}}.online-prestige__time{padding-left:2em}.online-prestige__info{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}.online-prestige__info>*{overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:1;line-clamp:1;-webkit-box-orient:vertical}.online-prestige__quality{padding-left:1em;white-space:nowrap}.online-prestige__scan-file{position:absolute;bottom:0;left:0;right:0}.online-prestige__scan-file .broadcast__scan{margin:0}.online-prestige .online-prestige-split{font-size:.8em;margin:0 1em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}.online-prestige.focus::after{content:'';position:absolute;top:-0.6em;left:-0.6em;right:-0.6em;bottom:-0.6em;-webkit-border-radius:.7em;border-radius:.7em;border:solid .3em #fff;z-index:-1;pointer-events:none}.online-prestige+.online-prestige{margin-top:1.5em}.online-prestige--folder .online-prestige__footer{margin-top:.8em}.online-prestige-watched{padding:1em}.online-prestige-watched__icon>svg{width:1.5em;height:1.5em}.online-prestige-watched__body{padding-left:1em;padding-top:.1em;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-flex-wrap:wrap;-ms-flex-wrap:wrap;flex-wrap:wrap}.online-prestige-watched__body>span+span::before{content:' ● ';vertical-align:top;display:inline-block;margin:0 .5em}.online-prestige-rate{display:-webkit-inline-box;display:-webkit-inline-flex;display:-moz-inline-box;display:-ms-inline-flexbox;display:inline-flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}.online-prestige-rate>svg{width:1.3em !important;height:1.3em !important}.online-prestige-rate>span{font-weight:600;font-size:1.1em;padding-left:.7em}.online-empty{line-height:1.4}.online-empty__title{font-size:1.8em;margin-bottom:.3em}.online-empty__time{font-size:1.2em;font-weight:300;margin-bottom:1.6em}.online-empty__buttons{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex}.online-empty__buttons>*+*{margin-left:1em}.online-empty__button{background:rgba(0,0,0,0.3);font-size:1.2em;padding:.5em 1.2em;-webkit-border-radius:.2em;border-radius:.2em;margin-bottom:2.4em}.online-empty__button.focus{background:#fff;color:black}.online-empty__templates .online-empty-template:nth-child(2){opacity:.5}.online-empty__templates .online-empty-template:nth-child(3){opacity:.2}.online-empty-template{background-color:rgba(255,255,255,0.3);padding:1em;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-border-radius:.3em;border-radius:.3em}.online-empty-template>*{background:rgba(0,0,0,0.3);-webkit-border-radius:.3em;border-radius:.3em}.online-empty-template__ico{width:4em;height:4em;margin-right:2.4em}.online-empty-template__body{height:1.7em;width:70%}.online-empty-template+.online-empty-template{margin-top:1em}\n        </style>\n    ");

    Lampa.SettingsApi.addParam({
      component: 'u2skaz_online',
      param: {
        name: 'only_title',
        type: 'title',
        "default": true
      },
      field: {
        name: Lampa.Lang.translate('u2skaz_settings')
      }
    });

    Lampa.SettingsApi.addParam({
      component: 'u2skaz_online',
      param: {
        name: 'u2skaz_quality',
        type: 'select',
        values: {
          'auto': Lampa.Lang.translate('u2skaz_quality_auto'),
          '2160': '4K',
          '1080': '1080p',
          '720': '720p',
          '480': '480p'
        },
        "default": 'auto'
      },
      field: {
        name: Lampa.Lang.translate('u2skaz_quality_name'),
        description: Lampa.Lang.translate('u2skaz_quality_descr')
      }
    });
    Lampa.SettingsApi.addParam({
      component: 'u2skaz_online',
      param: {
        name: 'u2skaz_logo',
        type: 'trigger',
        "default": true
      },
      field: {
        name: Lampa.Lang.translate('u2skaz_logo_name'),
        description: Lampa.Lang.translate('u2skaz_logo_descr')
      }
    });

    Lampa.SettingsApi.addParam({
      component: 'u2skaz_online',
      param: {
        name: 'lampac_continue_play',
        type: 'trigger',
        "default": true
      },
      field: {
        name: Lampa.Lang.translate('lampac_continue_enable'),
        description: Lampa.Lang.translate('lampac_continue_enable_descr')
      }
    });

    Lampa.Template.add('lampac_css', "\n        <style>\n        @charset 'UTF-8';.online-prestige{position:relative;-webkit-border-radius:.3em;border-radius:.3em;background-color:rgba(0,0,0,0.3);display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex}.online-prestige__body{padding:1.2em;line-height:1.3;-webkit-box-flex:1;-webkit-flex-grow:1;-moz-box-flex:1;-ms-flex-positive:1;flex-grow:1;position:relative}@media screen and (max-width:480px){.online-prestige__body{padding:.8em 1.2em}}.online-prestige__img{position:relative;width:13em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0;min-height:8.2em}.online-prestige__img>img{position:absolute;top:0;left:0;width:100%;height:100%;-o-object-fit:cover;object-fit:cover;-webkit-border-radius:.3em;border-radius:.3em;opacity:0;-webkit-transition:opacity .3s;-o-transition:opacity .3s;-moz-transition:opacity .3s;transition:opacity .3s}.online-prestige__img--loaded>img{opacity:1}@media screen and (max-width:480px){.online-prestige__img{width:7em;min-height:6em}}.online-prestige__folder{padding:1em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}.online-prestige__folder>svg{width:4.4em !important;height:4.4em !important}.online-prestige__viewed{position:absolute;top:1em;left:1em;background:rgba(0,0,0,0.45);-webkit-border-radius:100%;border-radius:100%;padding:.25em;font-size:.76em}.online-prestige__viewed>svg{width:1.5em !important;height:1.5em !important}.online-prestige__episode-number{position:absolute;top:0;left:0;right:0;bottom:0;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;-moz-box-pack:center;-ms-flex-pack:center;justify-content:center;font-size:2em}.online-prestige__loader{position:absolute;top:50%;left:50%;width:2em;height:2em;margin-left:-1em;margin-top:-1em;background:url(./img/loader.svg) no-repeat center center;-webkit-background-size:contain;-o-background-size:contain;background-size:contain}.online-prestige__head,.online-prestige__footer{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-pack:justify;-webkit-justify-content:space-between;-moz-box-pack:justify;-ms-flex-pack:justify;justify-content:space-between;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}.online-prestige__timeline{margin:.8em 0}.online-prestige__timeline>.time-line{display:block !important}.online-prestige__title{font-size:1.7em;overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:1;line-clamp:1;-webkit-box-orient:vertical}@media screen and (max-width:480px){.online-prestige__title{font-size:1.4em}}.online-prestige__time{padding-left:2em}.online-prestige__info{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}.online-prestige__info>*{overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:1;line-clamp:1;-webkit-box-orient:vertical}.online-prestige__quality{padding-left:1em;white-space:nowrap}.online-prestige__scan-file{position:absolute;bottom:0;left:0;right:0}.online-prestige__scan-file .broadcast__scan{margin:0}.online-prestige .online-prestige-split{font-size:.8em;margin:0 1em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}.online-prestige.focus::after{content:'';position:absolute;top:-0.6em;left:-0.6em;right:-0.6em;bottom:-0.6em;-webkit-border-radius:.7em;border-radius:.7em;border:solid .3em #fff;z-index:-1;pointer-events:none}.online-prestige+.online-prestige{margin-top:1.5em}.online-prestige--folder .online-prestige__footer{margin-top:.8em}.online-prestige-watched{padding:1em}.online-prestige-watched__icon>svg{width:1.5em;height:1.5em}.online-prestige-watched__body{padding-left:1em;padding-top:.1em;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-flex-wrap:wrap;-ms-flex-wrap:wrap;flex-wrap:wrap}.online-prestige-watched__body>span+span::before{content:' ● ';vertical-align:top;display:inline-block;margin:0 .5em}.online-prestige-rate{display:-webkit-inline-box;display:-webkit-inline-flex;display:-moz-inline-box;display:-ms-inline-flexbox;display:inline-flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}.online-prestige-rate>svg{width:1.3em !important;height:1.3em !important}.online-prestige-rate>span{font-weight:600;font-size:1.1em;padding-left:.7em}.online-empty{line-height:1.4}.online-empty__title{font-size:1.8em;margin-bottom:.3em}.online-empty__time{font-size:1.2em;font-weight:300;margin-bottom:1.6em}.online-empty__buttons{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex}.online-empty__buttons>*+*{margin-left:1em}.online-empty__button{background:rgba(0,0,0,0.3);font-size:1.2em;padding:.5em 1.2em;-webkit-border-radius:.2em;border-radius:.2em;margin-bottom:2.4em}.online-empty__button.focus{background:#fff;color:black}.online-empty__templates .online-empty-template:nth-child(2){opacity:.5}.online-empty__templates .online-empty-template:nth-child(3){opacity:.2}.online-empty-template{background-color:rgba(255,255,255,0.3);padding:1em;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-border-radius:.3em;border-radius:.3em}.online-empty-template>*{background:rgba(0,0,0,0.3);-webkit-border-radius:.3em;border-radius:.3em}.online-empty-template__ico{width:4em;height:4em;margin-right:2.4em}.online-empty-template__body{height:1.7em;width:70%}.online-empty-template+.online-empty-template{margin-top:1em}\n        </style>\n    ");

    $('body').append(Lampa.Template.get('lampac_css', {}, true));

    function resetTemplates() {
      Lampa.Template.add('lampac_prestige_full', "<div class=\"online-prestige online-prestige--full selector\">\n            <div class=\"online-prestige__img\">\n                <img alt=\"\">\n                <div class=\"online-prestige__loader\"></div>\n            </div>\n            <div class=\"online-prestige__body\">\n                <div class=\"online-prestige__head\">\n                    <div class=\"online-prestige__title\">{title}</div>\n                    <div class=\"online-prestige__time\">{time}</div>\n                </div>\n\n                <div class=\"online-prestige__timeline\"></div>\n\n                <div class=\"online-prestige__footer\">\n                    <div class=\"online-prestige__info\">{info}</div>\n                    <div class=\"online-prestige__quality\">{quality}</div>\n                </div>\n            </div>\n        </div>");
      Lampa.Template.add('lampac_content_loading', "<div class=\"online-empty\">\n            <div class=\"broadcast__scan\"><div></div></div>\n\t\t\t\n            <div class=\"online-empty__templates\">\n                <div class=\"online-empty-template selector\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n                <div class=\"online-empty-template\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n                <div class=\"online-empty-template\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n            </div>\n        </div>");
      Lampa.Template.add('lampac_does_not_answer', "<div class=\"online-empty\">\n            <div class=\"online-empty__title\">\n                #{lampac_balanser_dont_work}\n            </div>\n            <div class=\"online-empty__time\">\n                #{lampac_balanser_timeout}\n            </div>\n            <div class=\"online-empty__buttons\">\n                <div class=\"online-empty__button selector cancel\">#{cancel}</div>\n                <div class=\"online-empty__button selector change\">#{lampac_change_balanser}</div>\n            </div>\n            <div class=\"online-empty__templates\">\n                <div class=\"online-empty-template\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n                <div class=\"online-empty-template\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n                <div class=\"online-empty-template\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n            </div>\n        </div>");
      Lampa.Template.add('lampac_prestige_rate', "<div class=\"online-prestige-rate\">\n            <svg width=\"17\" height=\"16\" viewBox=\"0 0 17 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                <path d=\"M8.39409 0.192139L10.99 5.30994L16.7882 6.20387L12.5475 10.4277L13.5819 15.9311L8.39409 13.2425L3.20626 15.9311L4.24065 10.4277L0 6.20387L5.79819 5.30994L8.39409 0.192139Z\" fill=\"#fff\"></path>\n            </svg>\n            <span>{rate}</span>\n        </div>");
      Lampa.Template.add('lampac_prestige_folder', "<div class=\"online-prestige online-prestige--folder selector\">\n            <div class=\"online-prestige__folder\">\n                <svg viewBox=\"0 0 128 112\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <rect y=\"20\" width=\"128\" height=\"92\" rx=\"13\" fill=\"white\"></rect>\n                    <path d=\"M29.9963 8H98.0037C96.0446 3.3021 91.4079 0 86 0H42C36.5921 0 31.9555 3.3021 29.9963 8Z\" fill=\"white\" fill-opacity=\"0.23\"></path>\n                    <rect x=\"11\" y=\"8\" width=\"106\" height=\"76\" rx=\"13\" fill=\"white\" fill-opacity=\"0.51\"></rect>\n                </svg>\n            </div>\n            <div class=\"online-prestige__body\">\n                <div class=\"online-prestige__head\">\n                    <div class=\"online-prestige__title\">{title}</div>\n                    <div class=\"online-prestige__time\">{time}</div>\n                </div>\n\n                <div class=\"online-prestige__footer\">\n                    <div class=\"online-prestige__info\">{info}</div>\n                </div>\n            </div>\n        </div>");
      Lampa.Template.add('lampac_prestige_watched', "<div class=\"online-prestige online-prestige-watched selector\">\n            <div class=\"online-prestige-watched__icon\">\n                <svg width=\"21\" height=\"21\" viewBox=\"0 0 21 21\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <circle cx=\"10.5\" cy=\"10.5\" r=\"9\" stroke=\"currentColor\" stroke-width=\"3\"/>\n                    <path d=\"M14.8477 10.5628L8.20312 14.399L8.20313 6.72656L14.8477 10.5628Z\" fill=\"currentColor\"/>\n                </svg>\n            </div>\n            <div class=\"online-prestige-watched__body\">\n                \n            </div>\n        </div>");
    }
    var button = "<div class=\"full-start__button selector view--online u2skaz--button\" data-subtitle=\"".concat(manifst.name, " ").concat(manifst.version, "\">\n <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\"><rect x=\"2\" y=\"4\" width=\"20\" height=\"16\" rx=\"4\" stroke=\"currentColor\" stroke-width=\"2\"></rect><path d=\"M10 9l5 3-5 3V9z\" fill=\"currentColor\"></path></svg>\n\n        <span>#{title_online}</span>\n    </div>");
    Lampa.Component.add('u2skaz_video', component);
    resetTemplates();

    function addButton(e) {
    if (e.render.find('.u2skaz--button').length) return;
    var btn = $(Lampa.Lang.translate(button));
    btn.on('hover:enter', function() {
        resetTemplates();
        Lampa.Component.add('u2skaz_video', component);

        var id = Lampa.Utils.hash(e.movie.number_of_seasons ? e.movie.original_name : e.movie.original_title);
        var all = Lampa.Storage.get('clarification_search','{}');

        var isSeries = e.movie.number_of_seasons || e.movie.name;
        var continueEnabled = Lampa.Storage.field('lampac_continue_play') === true;
        var file_id = Lampa.Utils.hash(e.movie.number_of_seasons ? e.movie.original_name : e.movie.original_title);
        var watched = Lampa.Storage.cache('online_watched_last', 5000, {});
        var watchedData = watched[file_id];

        if (isSeries && continueEnabled && watchedData && watchedData.season && watchedData.episode) {
          var line = [];
          if (watchedData.balanser_name) line.push(watchedData.balanser_name);
          if (watchedData.voice_name) line.push(watchedData.voice_name);
          line.push(Lampa.Lang.translate('torrent_serial_season') + ' ' + watchedData.season);
          line.push(Lampa.Lang.translate('torrent_serial_episode') + ' ' + watchedData.episode);

          Lampa.Select.show({
            title: Lampa.Lang.translate('lampac_continue_watch'),
            items: [
              { title: '▶ ' + Lampa.Lang.translate('lampac_continue_yes') + ' (' + line.join(' · ') + ')', continue_yes: true },
              { title: Lampa.Lang.translate('lampac_continue_no'), continue_no: true }
            ],
            onBack: function() {
              Lampa.Controller.toggle('content');
            },
            onSelect: function(sel) {
              Lampa.Select.close();

              if (sel.continue_yes && watchedData.balanser) {
                var last_select_balanser = Lampa.Storage.cache('online_last_balanser', 3000, {});
                last_select_balanser[e.movie.id] = watchedData.balanser;
                Lampa.Storage.set('online_last_balanser', last_select_balanser);

                var choiceData = Lampa.Storage.cache('online_choice_' + watchedData.balanser, 3000, {});
                if (!choiceData[e.movie.id]) choiceData[e.movie.id] = {};
                var seasonIdx = (parseInt(watchedData.season) || 1) - 1;
                if (seasonIdx < 0) seasonIdx = 0;
                choiceData[e.movie.id].season = seasonIdx;
                if (watchedData.voice_name) choiceData[e.movie.id].voice_name = watchedData.voice_name;
                Lampa.Storage.set('online_choice_' + watchedData.balanser, choiceData);

                Lampa.Activity.push({
                  url: '',
                  title: Lampa.Lang.translate('title_online'),
                  component: 'u2skaz_video',
                  search: all[id] ? all[id] : e.movie.title,
                  search_one: e.movie.title,
                  search_two: e.movie.original_title,
                  movie: e.movie,
                  page: 1,
                  clarification: all[id] ? true : false,
                  lampac_continue_episode: parseInt(watchedData.episode) || 1
                });
              } else {
                Lampa.Activity.push({
                  url: '',
                  title: Lampa.Lang.translate('title_online'),
                  component: 'u2skaz_video',
                  search: all[id] ? all[id] : e.movie.title,
                  search_one: e.movie.title,
                  search_two: e.movie.original_title,
                  movie: e.movie,
                  page: 1,
                  clarification: all[id] ? true : false
                });
              }
            }
          });
        } else {
        Lampa.Activity.push({
            url: '',
            title: Lampa.Lang.translate('title_online'),
            component: 'u2skaz_video',
            search: all[id] ? all[id] : e.movie.title,
            search_one: e.movie.title,
            search_two: e.movie.original_title,
            movie: e.movie,
            page: 1,
            clarification: all[id] ? true : false
        });
        }
    });

    if (Lampa.Storage.field('u2skaz_button_first')) {
        var activity = Lampa.Activity.active().activity.render();
        var buttons_container = activity.find('.full-start-new__buttons');

        if (buttons_container.length) {

            buttons_container.prepend(btn);
        } else if (activity.find('.full-start__button').length) {

            activity.find('.full-start__button').first().before(btn);
        } else {
            e.render.before(btn);
        }
    } else {
        e.render.after(btn);
    }
}
    Lampa.Listener.follow('full', function(e) {
      if (e.type == 'complite') {
        try {
          var early = e.data && e.data.movie;
          if (early && SkazUI.logoOn()) {
            SkazUI.logoFetch(early, function(path) {
              if (path) SkazUI.logoWarm(path);
            });
          }
        } catch (err) {}
        addButton({
          render: e.object.activity.render().find('.view--torrent'),
          movie: e.data.movie
        });
      }
    });
    try {
      if (Lampa.Activity.active().component == 'full') {
        addButton({
          render: Lampa.Activity.active().activity.render().find('.view--torrent'),
          movie: Lampa.Activity.active().card
        });
      }
    } catch (e) {}
    if (Lampa.Manifest.app_digital >= 177) {
      var balansers_sync = ["filmix", 'filmixtv', "fxapi", "rezka", "rhsprem", "lumex", "videodb", "collaps", "collaps-dash", "hdvb", "zetflix", "kodik", "ashdi", "kinoukr", "kinotochka", "remux", "iframevideo", "cdnmovies", "anilibria", "animedia", "animego", "animevost", "animebesst", "redheadsound", "alloha", "animelib", "moonanime", "kinopub", "vibix", "vdbmovies", "fancdn", "cdnvideohub", "vokino", "rc/filmix", "rc/fxapi", "rc/rhs", "vcdn", "videocdn", "mirage", "hydraflix","videasy","vidsrc","movpi","vidlink","twoembed","autoembed","smashystream","autoembed","rgshows", "pidtor", "videoseed", "iptvonline", "veoveo"];
      balansers_sync.forEach(function(name) {
        Lampa.Storage.sync('online_choice_' + name, 'object_object');
      });
      Lampa.Storage.sync('online_watched_last', 'object_object');
      Lampa.Storage.sync('online_last_balanser', 'object_object');
      Lampa.Storage.sync('u2skaz_season_last', 'object_object');
      Lampa.Storage.sync('lampac_continue_play', 'bool');
    }
  }
  if (!window.u2skaz_online_plugin) startPlugin();

})();
