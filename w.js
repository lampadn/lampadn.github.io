/**
 * Lampa plugin: Wily Online (wily.to)
 * Кнопка "Wily" на карточке фильма/сериала → нативный экран выбора
 * озвучки/сезона/серии → просмотр через HLS (VK Video CDN) с субтитрами
 * и переключением качества. Требуется аккаунт Wily.
 */
(function () {
  'use strict';

  var MODE = 'view';
  var API = 'https://wily-aaa.com';
  var PLUGIN_NAME = 'Wily Online';
  var COMPONENT = 'wily';
  var BTN_CLASS = 'wily-view-btn';

  /* ================= API CORE ================= */

  function sget(k, d) { try { return Lampa.Storage.get('wily_' + k, d); } catch (e) { return d; } }
  function sset(k, v) { try { Lampa.Storage.set('wily_' + k, v); } catch (e) {} }

  function hwid() {
    var h = sget('hwid', null);
    if (!h) {
      h = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16);
      });
      sset('hwid', h);
    }
    return h;
  }

  function proxyBase() {
    return (sget('proxy', 'https://little-brook-acdb.lisiyvirus.workers.dev') || '').trim().replace(/\/+$/, '');
  }

  // pereadresaciya ssylok CDN cherez proxy (privazka tokenov rabotaet tolko
  // kogda resolve i video idut cherez odnu tochku)
  function prox(u) {
    return u; // video kachaetsya s CDN napryamuyu (privazka tokena = IP brauzera)
  }

  function rawFetch(url, options) {
    options = options || {};
    options.headers = Object.assign({ 'Accept': 'application/json' }, options.headers || {});
    if (options.body && !options.headers['Content-Type']) options.headers['Content-Type'] = 'application/json';
    return fetch(url, options).then(function (r) {
      return r.text().then(function (t) {
        var j = null;
        try { j = t ? JSON.parse(t) : null; } catch (e) {}
        return { status: r.status, ok: r.ok, json: j, text: t };
      });
    });
  }

  var refreshing = null;

  function apiCall(path, method, body, auth) {
    var url = proxyBase() + path;
    var headers = {};
    if (auth && sget('access_token', null)) {
      headers['Authorization'] = 'Bearer ' + sget('access_token', null);
      headers['X-Device-Id'] = hwid();
      headers['X-Device-Platform'] = 'web';
      headers['X-App-Version'] = '1.0.0';
    }
    return rawFetch(url, { method: method || 'GET', headers: headers, body: body ? JSON.stringify(body) : undefined })
      .catch(function () {
        return { status: 0, ok: false, json: { message: 'нет связи с прокси ' + proxyBase() + ' — https-Lampa требует https-прокси (см. README)' } };
      })
      .then(function (r) {
        if (r.status === 401 && auth && sget('refresh_token', null)) {
          return refreshTokens().then(function (ok) {
            if (ok) {
              headers['Authorization'] = 'Bearer ' + sget('access_token', null);
              return rawFetch(url, { method: method || 'GET', headers: headers, body: body ? JSON.stringify(body) : undefined });
            }
            return r;
          });
        }
        return r;
      });
  }

  function refreshTokens() {
    if (refreshing) return refreshing;
    refreshing = rawFetch(proxyBase() + '/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: sget('refresh_token', null) })
    }).then(function (r) {
      refreshing = null;
      if (r.ok && r.json && r.json.access_token) {
        sset('access_token', r.json.access_token);
        sset('refresh_token', r.json.refresh_token);
        return true;
      }
      sset('refresh_token', null);
      return false;
    }).catch(function () { refreshing = null; return false; });
    return refreshing;
  }

  function errMsg(r) {
    try {
      if (r.json && r.json.message) return r.json.message;
      if (r.json && r.json.error && r.json.error.message) return r.json.error.message;
    } catch (e) {}
    return 'ошибка ' + r.status;
  }

  function apiSearch(q) {
    return apiCall('/v1/catalog/search?q=' + encodeURIComponent(q), 'GET', null, true).then(function (r) {
      return r.ok && r.json && r.json.data ? r.json.data : [];
    });
  }

  function apiTitle(id) {
    return apiCall('/v1/catalog/title/' + id, 'GET', null, true).then(function (r) {
      return r.ok && r.json && r.json.data ? r.json.data : null;
    });
  }

  function apiResolve(body) {
    return apiCall('/v1/play/resolve', 'POST', body, true).then(function (r) {
      if (r.ok && r.json && r.json.playback) return { ok: true, data: r.json };
      return { ok: false, limit: r.json && r.json.error === 'stream_limit' ? r.json : null, error: errMsg(r) };
    });
  }

  /* ================= AUTH ================= */

  function toast(t) { try { Lampa.Noty.show(t); } catch (e) { console.log('wily:', t); } }

  function mbtn(name, fn) { return { name: name, onClick: fn, onSelect: fn }; }

  function inputModal(title_, value, onOk) {
    var html = $('<div style="padding:15px"><input type="text" class="wily-input selector" style="width:100%;padding:12px;background:#1d1f2d;color:#fff;border:1px solid #333;border-radius:8px;font-size:16px;box-sizing:border-box" value=""></div>');
    var $input = html.find('input').val(value || '');
    var submit = function () { var v = $input.val(); Lampa.Modal.close(); onOk(v); };
    html.find('input').on('keydown', function (e) {
      if (e.key === 'Enter' || e.keyCode === 13) { e.preventDefault(); submit(); }
    });
    Lampa.Modal.open({
      title: title_, html: html,
      onBack: function () { Lampa.Modal.close(); },
      buttons: [mbtn('OK', submit), mbtn('Отмена', function () { Lampa.Modal.close(); })]
    });
    try { $input.focus(); } catch (e) {}
  }

  function ensureAuth(cb) {
    if (sget('access_token', null)) return cb(true);
    if (!window.Lampa || !Lampa.Modal || !Lampa.Modal.open) { toast('Wily: модалки недоступны'); return cb(false); }
    inputModal('Wily — email аккаунта', sget('email', ''), function (email) {
      email = (email || '').trim();
      if (!email) return;
      sset('email', email);
      apiCall('/v1/auth/request-code', 'POST', { email: email }).then(function (r) {
        if (!r.ok) { toast('Wily: ' + errMsg(r)); return; }
        inputModal('Wily — код из письма', '', function (code) {
          code = (code || '').trim();
          if (!code) return;
          apiCall('/v1/auth/verify-code', 'POST', {
            email: email, code: code,
            device: { platform: 'web', name: 'Lampa', hardware_id: hwid() }
          }).then(function (r2) {
            if (r2.ok && r2.json && r2.json.access_token) {
              sset('access_token', r2.json.access_token);
              sset('refresh_token', r2.json.refresh_token);
              toast('Wily: вход выполнен');
              cb(true);
            } else toast('Wily: ' + errMsg(r2));
          });
        });
      });
    });
  }

  /* ================= MATCHING ================= */

  function findWilyTitle(movie) {
    var norm = function (s) { return (s || '').toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]/gi, ''); };
    var movieNames = [];
    [movie.original_name, movie.original_title, movie.name, movie.title].forEach(function (n) {
      n = norm(n);
      if (n && movieNames.indexOf(n) === -1) movieNames.push(n);
    });
    var year = String(movie.release_year || movie.year || (movie.first_air_date || '').substring(0, 4) || (movie.release_date || '').substring(0, 4) || '');
    var queries = [];
    [movie.original_title || movie.original_name, movie.name || movie.title].forEach(function (q) {
      if (q && queries.indexOf(q) === -1) queries.push(q);
    });
    if (!queries.length) queries.push(movie.title || movie.name || '');
    var best = null, bestScore = 0;
    var tryQuery = function (q) {
      return apiSearch(q).then(function (list) {
        (list || []).forEach(function (it) {
          var score = 0;
          [it.original_name, it.name].forEach(function (wn) {
            wn = norm(wn);
            if (!wn) return;
            movieNames.forEach(function (mn) {
              if (!mn) return;
              if (wn === mn) score = Math.max(score, 6);
              else if (wn.length > 3 && mn.length > 3 && (wn.indexOf(mn) !== -1 || mn.indexOf(wn) !== -1)) score = Math.max(score, 4);
            });
          });
          if (year && String(it.year || '') === year) score += 2;
          if (score > bestScore) { bestScore = score; best = it; }
        });
        return null;
      });
    };
    var chain = Promise.resolve();
    queries.forEach(function (q) {
      chain = chain.then(function () { return tryQuery(q); });
    });
    return chain.then(function () {
      console.log('[Wily] match for', movie.name || movie.title, '->', best && (best.name + ' (' + best.year + ')'), 'score', bestScore);
      return bestScore >= 6 ? best : null;
    });
  }

  /* ================= UI: card button ================= */

  function loadComponent(movie, mode) {
    Lampa.Activity.push({
      url: '',
      title: 'Wily — ' + (movie.name || movie.original_name || ''),
      component: mode === 'download' ? COMPONENT + '_dl' : COMPONENT,
      search: movie.title,
      search_one: movie.title,
      search_two: movie.original_title,
      movie: movie,
      page: 1
    });
  }

  /* ================= COMPONENT ================= */

  var core = {
    view: {
      template: 'wily_item',
      component: COMPONENT
    },
    download: {
      template: 'wily_item_dl',
      component: COMPONENT + '_dl'
    }
  };

  function makeComponent(mode) {
    return function (object) {
      var scroll = new Lampa.Scroll({ mask: true, over: true });
      var html = $('<div class="wily-screen"></div>');
      var content = $('<div class="wily-content"></div>').css({ padding: '1.5em 2em' });
      var movie = object.movie || {};
      var wily = null;           // matched wily title data
      var avail = [];            // translations
      var translation = null;
      var season = null;
      var seasons = [];
      var episodes = [];

      this.create = function () {
        var _this = this;
        scroll.render().addClass('scroll--full').css({ background: 'transparent' });
        html.append(content);
        scroll.append(html);
        this.activity.loader(true);
        ensureAuth(function (ok) {
          if (!ok) { _this.empty('Требуется вход в аккаунт Wily'); _this.activity.loader(false); return; }
          findWilyTitle(movie).then(function (match) {
            if (!match) { _this.empty('Не найдено в Wily: ' + (movie.name || movie.title)); _this.activity.loader(false); return; }
            apiTitle(match.id).then(function (t) {
              _this.activity.loader(false);
              if (!t) { _this.empty('Wily: ошибка загрузки'); return; }
              wily = t;
              avail = (t.availabilities || []).filter(function (a) {
                return t.kind === 'series' ? Object.keys(a.seasons || {}).length : (a.qualities || []).length;
              });
              if (!avail.length) { _this.empty('Wily: нет доступных озвучек'); return; }
              translation = avail[0];
              build(_this);
            });
          });
        });
        return this.render();
      };

      this.empty = function (txt) {
        content.empty();
        content.append('<div style="padding:2em;opacity:.7">' + txt + '</div>');
        try { (self || object).activity.toggle(); } catch (e) {}
      };

      function build(self) {
        content.empty();
        content.append('<div style="opacity:.55;margin-bottom:1em">Wily · ' + (wily.year || '') + ' · ' + (translation ? translation.name : '') + '</div>');

        // переводы
        if (avail.length > 1 || true) {
          content.append(sectionTitle('ПЕРЕВОД'));
          var $row = row();
          avail.forEach(function (a) {
            var $b = selBtn(a.name + (a.translation_id === translation.translation_id ? ' ✓' : ''));
            if (a.translation_id === translation.translation_id) $b.css({ background: 'rgba(255,255,255,.14)' });
            $b.on('hover:enter', function () {
              if (a.translation_id === translation.translation_id) return;
              translation = a; build(_this);
            });
            $row.append($b);
          });
          content.append($row);
        }

        if (wily.kind === 'series') {
          seasons = Object.keys(translation.seasons || {}).map(Number).sort(function (a, b) { return a - b; });
          if (!seasons.length) { content.append('<div style="opacity:.6;padding:1em 0">Нет доступных сезонов</div>'); return; }
          if (season === null || seasons.indexOf(season) === -1) season = seasons[0];
          content.append(sectionTitle('СЕЗОН'));
          var $srow = row();
          seasons.forEach(function (s) {
            var $b = selBtn('Сезон ' + s + (s === season ? ' ✓' : ''));
            if (s === season) $b.css({ background: 'rgba(255,255,255,.14)' });
            $b.on('hover:enter', function () {
              if (s === season) return;
              season = s; build(_this);
            });
            $srow.append($b);
          });
          content.append($srow);

          content.append(sectionTitle('СЕРИИ'));
          var sdata = (wily.seasons || []).filter(function (x) { return Number(x.number) === Number(season); })[0];
          var availEps = (translation.seasons || {})[season] || [];
          episodes = (sdata && sdata.episodes ? sdata.episodes : []).filter(function (e) { return availEps.indexOf(Number(e.number)) !== -1; });
          if (!episodes.length) episodes = sdata && sdata.episodes ? sdata.episodes : [];
          episodes.forEach(function (ep) {
            content.append(episodeItem(ep));
          });
          try { (self || object).activity.toggle(); } catch (e) {}
        } else {
          content.append(sectionTitle('ФИЛЬМ'));
          var item = Lampa.Template.get(core[mode].template, {
            title: wily.name || 'Смотреть',
            quality: (translation.qualities || []).join('/') + 'p',
            info: ''
          });
          item.on('hover:enter', function () {
            act(null, null, wily.name);
          });
          content.append(item);
          try { (self || object).activity.toggle(); } catch (e) {}
        }
      }

      function episodeItem(ep) {
        var num = Number(ep.number);
        var label = 'S' + pad(season) + 'E' + pad(num);
        var hash = Lampa.Utils.hash([season, num, movie.original_title || movie.name].join(''));
        var view = Lampa.Timeline.view(hash);
        var eq = translation.episode_qualities && translation.episode_qualities[season + ':' + num];
        var qline = ((eq || translation.qualities || []).slice(0, 3).join('/') || '?') + 'p' + (ep.runtime_min ? ' · ' + ep.runtime_min + ' мин' : '') + (ep.air_status && ep.air_status !== 'aired' ? ' · ' + ep.air_status : '');
        var item = Lampa.Template.get(core[mode].template, {
          title: 'Серия ' + num + (ep.name ? ' — ' + ep.name : ''),
          quality: qline,
          info: ''
        });
        try {
          item.append(Lampa.Timeline.render(view));
          if (Lampa.Timeline.details) item.find('.online__quality, .wily__quality').append(Lampa.Timeline.details(view, ' / '));
        } catch (e) {}
        item.on('hover:enter', function () {
          act(season, num, label);
        });
        return item;
      }

      function resolveBody(season_, episode_) {
        var b = {
          titleId: wily.id,
          tokenMovie: wily.token_movie,
          kind: 'movie',
          translationId: translation.translation_id,
          quality: sget('quality', '2160'),
          resume: mode === 'view',
          deviceCaps: { av1: true, hevc: true, h264: true, maxRes: 4320, codecMaxRes: { h264: 2160, hevc: 4320, av1: 4320 } }
        };
        if (season_) { b.season = season_; b.episode = episode_; }
        return b;
      }

      function pickAudio(pb) {
        var a = pb.audios.filter(function (x) { return x.default; })[0] || pb.audios[0];
        return a;
      }

      function toPlayObject(pb, title_) {
        var a = pickAudio(pb);
        var qualityMap = {};
        Object.keys(a.qualities).forEach(function (q) { qualityMap[q] = prox(a.qualities[q].main); });
        var subs = (pb.subtitles || []).map(function (s) { return { label: s.label, url: prox(s.url) }; });
        return {
          title: title_,
          url: qualityMap[sget('quality', '2160')] || a.qualities[Object.keys(a.qualities).sort(function (x, y) { return y - x; })[0]].main,
          quality: qualityMap,
          subtitles: subs
        };
      }

      var acting = false;
      function act(season_, episode_, label) {
        if (acting) return;
        acting = true;
        toast('Wily: получаем ссылку…');
        apiResolve(resolveBody(season_, episode_)).then(function (res) {
          if (!res.ok) {
            if (res.limit && res.limit.streams && res.limit.streams.length) {
              var s0 = res.limit.streams[0];
              var b = resolveBody(season_, episode_);
              b.force = true;
              b.terminateSessionId = s0.sessionId;
              apiResolve(b).then(function (r2) {
                if (r2.ok) onStream(r2.data, season_, episode_, label);
                else toast('Wily: ' + (r2.error || 'лимит потоков'));
              });
              return;
            }
            toast('Wily: ' + (res.error || 'нет ссылки'));
            return;
          }
          onStream(res.data, season_, episode_, label);
        }).then(function () { acting = false; }, function () { acting = false; });
      }

      function onStream(data, season_, episode_, label) {
        if (mode === 'download') {
          downloadEpisode(data, label);
          return;
        }
        var first = toPlayObject(data.playback, (movie.name || wily.name) + (label ? ' — ' + label : ''));
        var hash = Lampa.Utils.hash([season_, episode_, movie.original_title || movie.name].join(''));
        try { first.timeline = Lampa.Timeline.view(hash); } catch (e) {}
        Lampa.Player.play(first);
        // плейлист: остальные серии сезона (ленивые ссылки)
        if (season_ && episodes.length > 1) {
          var playlist = episodes.map(function (ep) {
            var lbl = 'S' + pad(season_) + 'E' + pad(ep.number);
            if (ep.number === episode_) return first;
            return {
              title: (movie.name || wily.name) + ' — ' + lbl,
              url: function (call) {
                apiResolve(resolveBody(season_, ep.number)).then(function (res) {
                  if (res.ok) {
                    var po = toPlayObject(res.data.playback, (movie.name || wily.name) + ' — ' + lbl);
                    var h = Lampa.Utils.hash([season_, ep.number, movie.original_title || movie.name].join(''));
                    try { po.timeline = Lampa.Timeline.view(h); } catch (e) {}
                    first = po; // eslint-disable-line
                    call(po);
                  } else { call(''); }
                });
              },
              timeline: (function () { try { return Lampa.Timeline.view(Lampa.Utils.hash([season_, ep.number, movie.original_title || movie.name].join(''))); } catch (e) { return undefined; } })()
            };
          });
          Lampa.Player.playlist(playlist);
        } else {
          Lampa.Player.playlist([first]);
        }
        if (object.movie && object.movie.id) {
          try { Lampa.Favorite.add('history', object.movie, 100); } catch (e) {}
        }
      }

      /* ---- download mode ---- */
      function downloadEpisode(data, label) {
        var a = pickAudio(data.playback);
        var q = sget('quality', '2160');
        var qu = a.qualities[q] || a.qualities[Object.keys(a.qualities).sort(function (x, y) { return y - x; })[0]];
        if (!qu || !qu.main) { toast('Wily: нет ссылки'); return; }
        var m3u8Url = prox(qu.main);
        fetch(m3u8Url).then(function (r) { return r.text(); }).then(function (m3u8) {
          var media = m3u8.split('\n').filter(function (l) { return l.trim() && l.trim().indexOf('#') !== 0; })[0];
          var base = m3u8Url.split('/').slice(0, -1).join('/');
          var mediaUrl = /^https?:/.test(media) ? media : base + '/' + media;
          return fetch(mediaUrl).then(function (r) { return r.text(); }).then(function (playlist) {
            var lines = playlist.split('\n').map(function (l) { return l.trim(); });
            var init = null, segs = [];
            for (var i = 0; i < lines.length; i++) {
              var m = lines[i].match(/#EXT-X-MAP:URI="([^"]+)"/);
              if (m) init = /^https?:/.test(m[1]) ? m[1] : base + '/' + m[1];
              if (lines[i] && lines[i].indexOf('#') !== 0) segs.push(/^https?:/.test(lines[i]) ? lines[i] : base + '/' + lines[i]);
            }
            if (!segs.length) { toast('Wily: сегменты не найдены'); return; }
            var name = (movie.name || wily.name) + (label ? ' ' + label : '') + ' [' + q + 'p Wily].mp4';
            runDownload(init, segs, name);
          });
        }).catch(function (e) { toast('Wily: ошибка ' + e.message); });
      }

      function runDownload(initUrl, segs, filename) {
        var results = [];
        var total = segs.length + (initUrl ? 1 : 0);
        var done = 0, failed = false;
        var htmlDl = $('<div style="padding:15px"><div class="wily-dl-status">Подготовка…</div><div style="height:8px;background:#333;border-radius:4px;margin-top:10px"><div class="wily-dl-fill" style="height:100%;width:0;background:#34c759;border-radius:4px"></div></div></div>');
        Lampa.Modal.open({ title: 'Wily — скачивание', html: htmlDl, buttons: [mbtn('Скрыть', function () { Lampa.Modal.close(); })] });
        var $status = htmlDl.find('.wily-dl-status'), $fill = htmlDl.find('.wily-dl-fill');
        function update() {
          var pct = Math.round(done / total * 100);
          $fill.css('width', pct + '%');
          $status.text('Скачано ' + done + ' из ' + total + ' (' + pct + '%)');
        }
        function finish() {
          if (failed) return;
          $status.text('Собираем файл…');
          var parts = [];
          var okFlag = true;
          for (var i = 0; i < total; i++) {
            if (!results[i]) { okFlag = false; break; }
            parts.push(results[i]);
          }
          if (!okFlag) { $status.text('Ошибка: части не скачаны'); return; }
          var blob = new Blob(parts, { type: 'video/mp4' });
          save(blob, filename, $status);
        }
        var queue = [];
        if (initUrl) queue.push({ idx: 0, url: initUrl });
        segs.forEach(function (u, i) { queue.push({ idx: i + (initUrl ? 1 : 0), url: u }); });
        var ptr = 0, CONC = 4;
        function worker() {
          if (failed) return;
          if (ptr >= queue.length) return;
          var job = queue[ptr++];
          fetch(job.url).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.blob();
          }).then(function (b) {
            results[job.idx] = b;
            done++; update();
            if (done >= total) finish(); else worker();
          }).catch(function (e) {
            failed = true;
            $status.text('Ошибка: ' + e.message);
          });
        }
        for (var w = 0; w < CONC; w++) worker();
        update();
      }

      function save(blob, filename, $status) {
        if (window.showSaveFilePicker) {
          window.showSaveFilePicker({ suggestedName: filename, types: [{ description: 'MP4 video', accept: { 'video/mp4': ['.mp4'] } }] })
            .then(function (handle) {
              return handle.createWritable().then(function (w) { return w.write(blob).then(function () { return w.close(); }); });
            }).then(function () {
              Lampa.Modal.close();
              toast('Wily: скачивание завершено');
            }).catch(function (e) {
              if (e && e.name === 'AbortError') return;
              $status.text('Ошибка сохранения: ' + e.message);
            });
        } else {
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 3000);
          Lampa.Modal.close();
          toast('Wily: скачивание завершено');
        }
      }

      function sectionTitle(t) {
        return $('<div style="opacity:.45;margin:1.2em 0 .5em;font-size:.85em;letter-spacing:.08em">' + t + '</div>');
      }
      function row() {
        return $('<div class="wily-row"></div>').css({ display: 'flex', flexWrap: 'wrap', gap: '.5em' });
      }
      function selBtn(txt) {
        return $('<div class="selector wily-btn" style="padding:.7em 1em;background:rgba(255,255,255,.06);border-radius:.8em;cursor:pointer">' + txt + '</div>');
      }
      function pad(n) { n = String(n); return n.length < 2 ? '0' + n : n; }

      this.render = function () { return scroll.render(); };
      this.start = function () {
        if (Lampa.Activity.active().activity !== this.activity) return;
        Lampa.Controller.add('content', {
          toggle: function () {
            Lampa.Controller.collectionSet(scroll.render());
            Lampa.Controller.collectionFocus(false, scroll.render());
          },
          up: function () {
            if (Navigator.canmove('up')) Navigator.move('up');
            else Lampa.Controller.toggle('head');
          },
          down: function () {
            Navigator.move('down');
          },
          left: function () {
            if (Navigator.canmove('left')) Navigator.move('left');
            else Lampa.Controller.toggle('menu');
          },
          right: function () {
            if (Navigator.canmove('right')) Navigator.move('right');
          },
          back: this.back
        });
        Lampa.Controller.toggle('content');
      };

      this.inActivity = function () {
        var body = $('body');
        return !(body.hasClass('settings--open') || body.hasClass('menu--open') || body.hasClass('keyboard-input--visible') || body.hasClass('selectbox--open') || body.hasClass('search--open'));
      };
      this.back = function () { Lampa.Activity.backward(); };
      this.pause = function () {};
      this.stop = function () {};
      this.destroy = function () {
        try { scroll.destroy(); } catch (e) {}
        html.remove();
        content.remove();
      };
    };
  }

  /* ================= TEMPLATES ================= */

  function addTemplates() {
    Lampa.Template.add('wily_item', '<div class="online selector wily-item">' +
      '<div class="online__body">' +
      '<div class="online__title">{title}</div>' +
      '<div class="online__quality wily__quality">{quality}{info}</div>' +
      '</div></div>');
    Lampa.Template.add('wily_item_dl', '<div class="online selector wily-item">' +
      '<div class="online__body">' +
      '<div class="online__title">⬇ {title}</div>' +
      '<div class="online__quality wily__quality">{quality}{info}</div>' +
      '</div></div>');
  }

  /* ================= START ================= */

  function startPlugin() {
    if (window.wily_online) return;
    window.wily_online = true;

    addTemplates();
    Lampa.Component.add(COMPONENT, makeComponent('view'));

    var button = '<div class="full-start__button selector ' + BTN_CLASS + '" data-subtitle="' + PLUGIN_NAME + '">' +
      '<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:middle"><path d="M4 4h7v16H4zM13 4h7v7h-7zM13 13h7v7h-7z"/></svg>' +
      '<span>Wily</span></div>';


    Lampa.Listener.follow('full', function (e) {
      try {
        if (e.type !== 'complite' || !e.object || !e.object.activity) return;
        var $view = e.object.activity.render();
        if ($view.find('.wily-view-btn').length) return;
        var movie = (e.data && e.data.movie) || e.object.card || (e.object.data && e.object.data.card);
        if (!movie || !movie.id) return;
        var $btn = $(button);
        $btn.on('hover:enter', function (ev) {
          ev.preventDefault();
          loadComponent(movie, 'view');
        });
        var $anchor = $view.find('.view--torrent').first();
        if (!$anchor.length) $anchor = $view.find('.full-start__button').last();
        if ($anchor.length) $anchor.after($btn);
        else {
          var $zone = $view.find('.full-start__buttons').first();
          if ($zone.length) $zone.append($btn);
        }
      } catch (err) { console.warn('wily full', err); }
    });

    window.WilyLampa = {
      setProxy: function (u) { sset('proxy', u); return 'ok: ' + u; },
      getProxy: function () { return sget('proxy', ''); },
      setQuality: function (q) { sset('quality', String(q)); return 'ok: ' + q; },
      logout: function () { sset('access_token', null); sset('refresh_token', null); return 'ok'; }
    };

    try {
      Lampa.Manifest.plugins = { type: 'video', version: '1.0', name: PLUGIN_NAME, description: 'Wily (wily.to) — онлайн и скачивание', component: COMPONENT };
    } catch (e) {}

    console.log('[Wily] plugin v1.4 loaded (Wily Online). setProxy/setQuality via WilyLampa.*');
  }

  if (window.Lampa) startPlugin();
  else {
    var t = setInterval(function () {
      if (window.Lampa) { clearInterval(t); startPlugin(); }
    }, 300);
    setTimeout(function () { clearInterval(t); }, 30000);
  }
})();
