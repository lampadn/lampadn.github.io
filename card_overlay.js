(function () {
    'use strict';

    var ANIMATED_REACTIONS_BASE_URL = 'https://amikdn.github.io/img';
    var SVG_REACTIONS_BASE_URL = 'https://cubnotrip.top/img';
    var KP_API_URL = 'https://kinopoiskapiunofficial.tech/';
    var QUALITY_CACHE_KEY = 'qualview_quality_cache';
    var QUALITY_API_DOMAIN = 'jr.maxvol.pro';
    var CACHE_TTL = 24 * 60 * 60 * 1000;

    function isTriggerOn(key, def) {
        var v = Lampa.Storage.get(key, def);
        return (v === true || v === 'true' || v === '1' || v === 1);
    }
    function getOverlayAlpha() {
        var v = parseFloat(Lampa.Storage.get('rating_window_opacity', '40'));
        if (isNaN(v)) v = 40;
        v = Math.max(0, Math.min(100, v));
        return 1 - (v / 100);
    }
    function isColoredRatingsPosterOn() {
        return isTriggerOn('colored_ratings_poster', false);
    }
    function setColoredRatingsPoster(on) {
        Lampa.Storage.set('colored_ratings_poster', on ? 'true' : 'false');
    }
    function isQualityShowOn() {
        return isTriggerOn('quality_show', true);
    }
    function isQualityColoredOn() {
        return isTriggerOn('quality_colored', false);
    }
    function isTypeLabelsShowOn() {
        return isTriggerOn('type_labels_show', true);
    }
    function isTypeLabelsColoredOn() {
        return isTriggerOn('type_labels_colored', false);
    }
    function getRatingColor(value) {
        if (isTriggerOn('rating_colored_windows', false)) return '#fff';
        if (!isColoredRatingsPosterOn()) return '#fff';
        var v = parseFloat(String(value).replace(',', '.'));
        if (isNaN(v) || v <= 0) return '#fff';
        if (v <= 3) return 'red';
        if (v < 6) return 'orange';
        if (v < 8) return 'cornflowerblue';
        return 'lawngreen';
    }
    function getRatingBackgroundColor(value) {
        if (!isTriggerOn('rating_colored_windows', false)) return '';
        var alpha = getOverlayAlpha();
        var v = parseFloat(String(value).replace(',', '.'));
        if (isNaN(v) || v <= 0) return 'rgba(0,0,0,' + alpha + ')';
        if (v <= 3) return 'rgba(180,0,0,' + alpha + ')';
        if (v < 6) return 'rgba(200,120,0,' + alpha + ')';
        if (v < 8) return 'rgba(70,130,180,' + alpha + ')';
        return 'rgba(80,180,0,' + alpha + ')';
    }
    function getQualityBackground(quality) {
        if (!isQualityColoredOn()) return 'rgba(0,0,0,' + getOverlayAlpha() + ')';
        switch (quality) {
            case '4K': return 'rgba(46,204,113,0.75)';
            case 'FHD': return 'rgba(52,152,219,0.75)';
            case 'HD': return 'rgba(243,156,18,0.75)';
            case 'SD': return 'rgba(231,76,60,0.75)';
            case 'TS': return 'rgba(180,0,0,0.75)';
            default: return 'rgba(0,0,0,' + getOverlayAlpha() + ')';
        }
    }
    function getTypeLabelBackground(isTV) {
        if (isTypeLabelsColoredOn()) {
            return isTV ? 'rgba(52,152,219,0.85)' : 'rgba(46,204,113,0.85)';
        }
        return 'rgba(0,0,0,' + getOverlayAlpha() + ')';
    }
    function formatRating(value) {
        var n = parseFloat(value);
        if (isNaN(n)) return '0.0';
        if (n === 10) return '10';
        return n.toFixed(1);
    }
    function getReactionImageSrc(medianReaction) {
        if (!medianReaction) return '';
        if (isTriggerOn('animated_reactions', false)) {
            return ANIMATED_REACTIONS_BASE_URL + '/reaction-' + medianReaction + '.gif';
        }
        return SVG_REACTIONS_BASE_URL + '/' + medianReaction + '.svg';
    }

    var ratingCache = {
        caches: {},
        get: function (source, key) {
            var cache = this.caches[source] || (this.caches[source] = loadPersistentCache(source));
            var data = cache[key];
            if (!data) return null;
            if (Date.now() - data.timestamp > CACHE_TTL) {
                delete cache[key];
                debouncedSave(source, cache);
                return null;
            }
            return data;
        },
        set: function (source, key, value) {
            var cache = this.caches[source] || (this.caches[source] = loadPersistentCache(source));
            value.timestamp = Date.now();
            var isEmpty = ((!value.kp || value.kp === 0) && (!value.imdb || value.imdb === 0) && (!value.rating || value.rating === 0) && (!value.vote_average || value.vote_average === 0));
            if (isEmpty) value._empty = true;
            cache[key] = value;
            debouncedSave(source, cache);
            return value;
        }
    };
    function loadPersistentCache(source) {
        var stored = null;
        try { stored = Lampa.Storage.get('rating_cache_' + source, null); } catch (e) {}
        if (stored && typeof stored === 'object') return stored;
        try { stored = Lampa.Storage.cache(source, 500, {}); } catch (e2) { stored = null; }
        return stored && typeof stored === 'object' ? stored : {};
    }
    var _savePending = {};
    function debouncedSave(source, cache) {
        if (_savePending[source]) return;
        _savePending[source] = true;
        setTimeout(function () {
            _savePending[source] = false;
            try { Lampa.Storage.set('rating_cache_' + source, cache); } catch (e) {}
        }, 2000);
    }

    var taskQueue = [];
    var isProcessing = false;
    var taskInterval = 350;
    var taskBatchSize = 1;
    var requestPool = [];
    function getRequest() { return requestPool.pop() || new Lampa.Reguest(); }
    function releaseRequest(request) { request.clear(); if (requestPool.length < 5) requestPool.push(request); }
    function processQueue() {
        if (isProcessing || !taskQueue.length) return;
        isProcessing = true;
        var batch = taskQueue.splice(0, taskBatchSize);
        for (var i = 0; i < batch.length; i++) { batch[i].execute(); }
        setTimeout(function () { isProcessing = false; processQueue(); }, taskInterval);
    }
    function addToQueue(task) {
        if (taskQueue.length > 20) taskQueue.splice(10);
        taskQueue.push({ execute: task });
        processQueue();
    }

    var stringCache = {};
    function normalizeString(str) {
        if (stringCache[str]) return stringCache[str];
        var normalized = str.replace(/[\s.,:;''`!?]+/g, ' ').trim().toLowerCase().replace(/[\-\u2010-\u2015\u2E3A\u2E3B\uFE58\uFE63\uFF0D]+/g, '-').replace(/ё/g, 'е');
        stringCache[str] = normalized;
        return normalized;
    }
    function cleanString(str) {
        return normalizeString(str).replace(/^[ \/\\]+/, '').replace(/[ \/\\]+$/, '').replace(/\+( *[+\/\\])+/g, '+').replace(/([+\/\\] *)+\+/g, '+').replace(/( *[\/\\]+ *)+/g, '+');
    }
    function matchStrings(str1, str2) { return typeof str1 === 'string' && typeof str2 === 'string' && normalizeString(str1) === normalizeString(str2); }
    function containsString(str1, str2) { return typeof str1 === 'string' && typeof str2 === 'string' && normalizeString(str1).indexOf(normalizeString(str2)) !== -1; }

    function getKpApiKey() { var k = Lampa.Storage.get('rating_kp_api_key', '') || Lampa.Storage.get('source_api_key', ''); return String(k || '').trim(); }
    function canUseKinopoiskApi() { return getKpApiKey().length > 0; }
    function getKpHeaders() { var k = getKpApiKey(); if (!k) return {}; return { 'X-API-KEY': k }; }
    function cacheEmptyKpRating(itemId) { return ratingCache.set('kp_rating', itemId, { kp: 0, imdb: 0 }); }
    function findBestKpMatch(results, title, originalTitle, releaseYear) {
        if (!results || !results.length) return null;
        results.forEach(function (r) { r.tmp_year = parseInt(String(r.year || r.start_date || "0000").slice(0, 4)); });
        var filtered = results;
        if (originalTitle) {
            var matched = results.filter(function (r) { return containsString(r.orig_title || r.nameEn, originalTitle) || containsString(r.en_title || r.nameOriginal, originalTitle) || containsString(r.title || r.nameRu || r.name, originalTitle); });
            if (matched.length) filtered = matched;
        }
        if (filtered.length > 1 && releaseYear) {
            var yearMatch = filtered.filter(function (r) { return r.tmp_year == releaseYear; });
            if (!yearMatch.length) { yearMatch = filtered.filter(function (r) { return r.tmp_year && r.tmp_year > releaseYear - 2 && r.tmp_year < releaseYear + 2; }); }
            if (yearMatch.length) filtered = yearMatch;
        }
        return filtered[0] || null;
    }
    function getKinopoiskRating(item, callback) {
        if (item.kp_rating > 0 || item.imdb_rating > 0) { callback(ratingCache.set('kp_rating', item.id, { kp: parseFloat(item.kp_rating) || 0, imdb: parseFloat(item.imdb_rating) || 0, timestamp: Date.now() })); return; }
        if (item.ratingKinopoisk > 0 || item.ratingImdb > 0) { callback(ratingCache.set('kp_rating', item.id, { kp: parseFloat(item.ratingKinopoisk) || 0, imdb: parseFloat(item.ratingImdb) || 0, timestamp: Date.now() })); return; }
        var cached = ratingCache.get('kp_rating', item.id);
        if (cached) { callback(cached); return; }
        try {
            var otherCache = Lampa.Storage.cache('kp_rating', 500, {});
            var otherData = otherCache[item.id];
            if (otherData && (otherData.kp > 0 || otherData.imdb > 0)) { callback(ratingCache.set('kp_rating', item.id, { kp: parseFloat(otherData.kp) || 0, imdb: parseFloat(otherData.imdb) || 0, timestamp: Date.now() })); return; }
        } catch (e) {}
        if (!canUseKinopoiskApi()) { callback(cacheEmptyKpRating(item.id)); return; }
        if (item.kinopoisk_id) {
            addToQueue(function () {
                var request = getRequest(); request.timeout(5000);
                request.silent(KP_API_URL + 'api/v2.2/films/' + item.kinopoisk_id, function (data) {
                    callback(ratingCache.set('kp_rating', item.id, { kp: parseFloat(data.ratingKinopoisk) || 0, imdb: parseFloat(data.ratingImdb) || 0, timestamp: Date.now() }));
                    releaseRequest(request);
                }, function () { releaseRequest(request); callback(cacheEmptyKpRating(item.id)); }, false, { headers: getKpHeaders() });
            }); return;
        }
        if (!(item.title || item.name) && !item.imdb_id) { callback(cacheEmptyKpRating(item.id)); return; }
        addToQueue(function () {
            var request = getRequest();
            var title = cleanString(item.title || item.name || '');
            var releaseYear = parseInt(String(item.release_date || item.first_air_date || item.last_air_date || "0000").slice(0, 4));
            var originalTitle = item.original_title || item.original_name;
            var searchUrl = item.imdb_id ? KP_API_URL + 'api/v2.2/films?imdbId=' + encodeURIComponent(item.imdb_id) : KP_API_URL + 'api/v2.1/films/search-by-keyword?keyword=' + encodeURIComponent(title);
            request.timeout(5000);
            request.silent(searchUrl, function (data) {
                var results = data.films || data.items || [];
                if (!results.length && data && (data.kinopoiskId || data.filmId)) results = [data];
                var best = findBestKpMatch(results, title, originalTitle, releaseYear);
                if (!best) { releaseRequest(request); callback(cacheEmptyKpRating(item.id)); return; }
                var kpFromSearch = parseFloat(best.rating || best.ratingKinopoisk) || 0;
                var imdbFromSearch = parseFloat(best.ratingImdb) || 0;
                var movieId = best.kinopoiskId || best.filmId || best.kp_id || best.kinopoisk_id;
                if (kpFromSearch > 0) ratingCache.set('kp_rating', item.id, { kp: kpFromSearch, imdb: imdbFromSearch, timestamp: Date.now() });
                if (movieId && (kpFromSearch === 0 || imdbFromSearch === 0)) {
                    if (kpFromSearch > 0) callback({ kp: kpFromSearch, imdb: imdbFromSearch });
                    request.timeout(5000);
                    request.silent(KP_API_URL + 'api/v2.2/films/' + movieId, function (detail) {
                        var fullKp = parseFloat(detail.ratingKinopoisk) || 0;
                        var fullImdb = parseFloat(detail.ratingImdb) || 0;
                        callback(ratingCache.set('kp_rating', item.id, { kp: fullKp > 0 ? fullKp : kpFromSearch, imdb: fullImdb > 0 ? fullImdb : imdbFromSearch, timestamp: Date.now() }));
                        releaseRequest(request);
                    }, function () { releaseRequest(request); callback(ratingCache.set('kp_rating', item.id, { kp: kpFromSearch, imdb: imdbFromSearch, timestamp: Date.now() })); }, false, { headers: getKpHeaders() });
                } else {
                    releaseRequest(request);
                    callback(ratingCache.set('kp_rating', item.id, { kp: kpFromSearch, imdb: imdbFromSearch, timestamp: Date.now() }));
                }
            }, function () { releaseRequest(request); callback(cacheEmptyKpRating(item.id)); }, false, { headers: getKpHeaders() });
        });
    }

    function calculateLampaRating10(reactions) {
        var weightedSum = 0, totalCount = 0, reactionCnt = {}, reactionCoef = { fire: 5, nice: 4, think: 3, bore: 2, shit: 1 };
        for (var i = 0; i < reactions.length; i++) { var item = reactions[i]; var count = parseInt(item.counter, 10) || 0; var coef = reactionCoef[item.type] || 0; weightedSum += count * coef; totalCount += count; reactionCnt[item.type] = (reactionCnt[item.type] || 0) + count; }
        if (totalCount === 0) return { rating: 0, medianReaction: '' };
        var avgRating = weightedSum / totalCount;
        var rating10 = (avgRating - 1) * 2.5;
        var finalRating = rating10 >= 0 ? parseFloat(rating10.toFixed(1)) : 0;
        var medianReaction = '', medianIndex = Math.ceil(totalCount / 2.0);
        var keys = Object.keys(reactionCoef);
        var sortedReactions = keys.sort(function (a, b) { return reactionCoef[a] - reactionCoef[b]; });
        var cumulativeCount = 0;
        while (sortedReactions.length && cumulativeCount < medianIndex) { medianReaction = sortedReactions.pop(); cumulativeCount += (reactionCnt[medianReaction] || 0); }
        return { rating: finalRating, medianReaction: medianReaction };
    }
    function fetchLampaRating(ratingKey) {
        return new Promise(function (resolve) {
            var request = getRequest(); request.timeout(10000);
            request.silent("https://cubnotrip.top/api/reactions/get/" + ratingKey, function (data) {
                try { resolve(data && data.result && Array.isArray(data.result) ? calculateLampaRating10(data.result) : { rating: 0, medianReaction: '' }); } catch (e) { resolve({ rating: 0, medianReaction: '' }); }
                finally { releaseRequest(request); }
            }, function () { releaseRequest(request); resolve({ rating: 0, medianReaction: '' }); }, false);
        });
    }
    var pendingLampaRequests = {};
    function getLampaRating(ratingKey) {
        var cached = ratingCache.get('lampa_rating', ratingKey);
        if (cached) return Promise.resolve(cached);
        if (pendingLampaRequests[ratingKey]) return pendingLampaRequests[ratingKey];
        pendingLampaRequests[ratingKey] = fetchLampaRating(ratingKey).then(function (result) { return ratingCache.set('lampa_rating', ratingKey, result); }).catch(function () { return { rating: 0, medianReaction: '' }; }).then(function (result) { delete pendingLampaRequests[ratingKey]; return result; }, function (error) { delete pendingLampaRequests[ratingKey]; throw error; });
        return pendingLampaRequests[ratingKey];
    }
    function getTMDBRating(data) {
        var ratingKey = data.id;
        var cached = ratingCache.get('tmdb_rating', ratingKey);
        if (cached) return cached.vote_average.toFixed(1);
        var rating = data.vote_average ? data.vote_average.toFixed(1) : '0.0';
        ratingCache.set('tmdb_rating', ratingKey, { vote_average: parseFloat(rating) });
        return rating;
    }

    function getRatingPositionCSS() {
        var pos = Lampa.Storage.get('rating_position', 'bottom');
        if (pos === 'bottom') return 'right:0!important;bottom:0!important;top:auto!important;left:auto!important;';
        return 'right:0!important;top:0!important;bottom:auto!important;left:auto!important;';
    }
    function voteClass(extra) {
        var pos = Lampa.Storage.get('rating_position', 'bottom');
        return 'card__vote card__vote--' + pos + (extra ? ' ' + extra : '');
    }
    function getRatingParent(card) {
        var parent = card.querySelector && card.querySelector('.card__view');
        if (!parent) parent = card;
        parent.setAttribute('data-rate-anchor', '1');
        parent.style.position = 'relative';
        return parent;
    }
    function isRatingSourceVisible(source) {
        var v = Lampa.Storage.get('rating_show_' + source, '1');
        return !(v === false || v === 'false' || v === 0 || v === '0' || v === '' || v === null || v === undefined);
    }

    function createRatingElement(card) {
        var ratingElement = document.createElement('div');
        ratingElement.className = voteClass();
        var posCSS = getRatingPositionCSS();
        var bgAlpha = getOverlayAlpha();
        ratingElement.style.cssText = 'line-height:1;font-family:"SegoeUI",sans-serif;cursor:pointer;box-sizing:border-box;outline:none;user-select:none;position:absolute;z-index:1;display:flex;align-items:center;' + posCSS + 'background:rgba(0,0,0,' + bgAlpha + ');color:#fff;padding:0.2em 0.1em 0.2em 0.35em;';
        getRatingParent(card).appendChild(ratingElement);
        return ratingElement;
    }
    function createRatingInnerBlock() {
        var el = document.createElement('div');
        el.className = voteClass();
        var bgAlpha = getOverlayAlpha();
        el.style.cssText = 'line-height:1;font-family:"SegoeUI",sans-serif;cursor:pointer;box-sizing:border-box;outline:none;user-select:none;display:flex;align-items:center;background:rgba(0,0,0,' + bgAlpha + ');color:#fff;padding:0.2em 0.1em 0.2em 0.35em;';
        return el;
    }
    function createRatingLineElement(card) {
        var line = document.createElement('div');
        line.className = voteClass('card__vote-line');
        var posCSS = getRatingPositionCSS();
        var bgAlpha = getOverlayAlpha();
        line.style.cssText = 'line-height:1;font-family:"SegoeUI",sans-serif;cursor:pointer;box-sizing:border-box;outline:none;user-select:none;position:absolute;z-index:1;display:flex;flex-direction:column;align-items:flex-start;' + posCSS + 'background:rgba(0,0,0,' + bgAlpha + ');color:#fff;padding:0.2em 0.1em 0.2em 0.35em;';
        line.innerHTML = '<div class="card__rate-item rate--tmdb" style="display:none"><div>0.0</div><span class="source--name"></span></div><div class="card__rate-item rate--imdb" style="display:none"><div>0.0</div><span class="source--name"></span></div><div class="card__rate-item rate--kp" style="display:none"><div>0.0</div><span class="source--name"></span></div><div class="card__rate-item rate--lampa" style="display:none"><span class="rate-value">0.0</span><span class="source--name rate-icon-reaction"></span></div>';
        getRatingParent(card).appendChild(line);
        return line;
    }

    function updateCardRatingLine(ratingLine, data) {
        if (!ratingLine || !ratingLine.parentNode) return;
        var idStr = data.id.toString();
        if (ratingLine.dataset.movieId !== idStr) return;
        var tmdbItem, imdbItem, kpItem, lampaItem;
        try {
            tmdbItem = ratingLine.querySelector('.rate--tmdb');
            if (tmdbItem) {
                var tmdbRating = getTMDBRating(data);
                var tmdbDiv = tmdbItem.querySelector('div');
                if (tmdbDiv) { tmdbDiv.textContent = formatRating(tmdbRating); tmdbDiv.style.color = getRatingColor(tmdbRating); }
                tmdbItem.style.display = (tmdbRating !== '0.0') && isRatingSourceVisible('tmdb') ? '' : 'none';
            }
        } catch (e) {}
        try {
            var kpFromData = (data.kp_rating != null ? data.kp_rating : (data.ratingKinopoisk != null ? data.ratingKinopoisk : 0));
            var imdbFromData = (data.imdb_rating != null ? data.imdb_rating : (data.ratingImdb != null ? data.ratingImdb : 0));
            var cachedKp = ratingCache.get('kp_rating', data.id);
            var kpVal = (kpFromData > 0 ? kpFromData : (cachedKp && cachedKp.kp)) || 0;
            var imdbVal = (imdbFromData > 0 ? imdbFromData : (cachedKp && cachedKp.imdb)) || 0;
            imdbItem = ratingLine.querySelector('.rate--imdb');
            if (imdbItem) {
                var imdbDiv = imdbItem.querySelector('div');
                var imdbText = imdbVal ? formatRating(imdbVal) : '0.0';
                if (imdbDiv) { imdbDiv.textContent = imdbText; imdbDiv.style.color = getRatingColor(imdbText); }
                imdbItem.style.display = (imdbVal > 0) && isRatingSourceVisible('imdb') ? '' : 'none';
            }
            kpItem = ratingLine.querySelector('.rate--kp');
            if (kpItem) {
                var kpDiv = kpItem.querySelector('div');
                var kpText = kpVal ? formatRating(kpVal) : '0.0';
                if (kpDiv) { kpDiv.textContent = kpText; kpDiv.style.color = getRatingColor(kpText); }
                kpItem.style.display = (kpVal > 0) && isRatingSourceVisible('kp') ? '' : 'none';
            }
        } catch (e) {}
        try {
            var lampaKey = (data.seasons || data.first_air_date || data.original_name) ? 'tv_' + data.id : 'movie_' + data.id;
            var cachedLampa = ratingCache.get('lampa_rating', lampaKey);
            lampaItem = ratingLine.querySelector('.rate--lampa');
            if (lampaItem) {
                var lampaValEl = lampaItem.querySelector('.rate-value');
                var lampaReactionIcon = lampaItem.querySelector('.rate-icon-reaction');
                var hasLampa = cachedLampa && cachedLampa.rating > 0;
                var lampaText = hasLampa ? formatRating(cachedLampa.rating) : '0.0';
                if (lampaValEl) { lampaValEl.textContent = lampaText; lampaValEl.style.color = getRatingColor(lampaText); }
                if (lampaReactionIcon) { lampaReactionIcon.style.backgroundImage = (hasLampa && cachedLampa.medianReaction) ? 'url(' + getReactionImageSrc(cachedLampa.medianReaction) + ')' : ''; }
                lampaItem.style.display = hasLampa && isRatingSourceVisible('lampa') ? '' : 'none';
            }
        } catch (e) {}
        var firstRating = null;
        try {
            var tmdbR = getTMDBRating(data);
            if (tmdbR !== '0.0' && isRatingSourceVisible('tmdb')) firstRating = tmdbR;
            if (!firstRating && imdbVal > 0 && isRatingSourceVisible('imdb')) firstRating = String(imdbVal);
            if (!firstRating && kpVal > 0 && isRatingSourceVisible('kp')) firstRating = String(kpVal);
            if (!firstRating && cachedLampa && cachedLampa.rating > 0 && isRatingSourceVisible('lampa')) firstRating = String(cachedLampa.rating);
        } catch (e) {}
        ratingLine.style.background = getRatingBackgroundColor(firstRating || '0') || ('rgba(0,0,0,' + getOverlayAlpha() + ')');
        var anyVisible = (tmdbItem && tmdbItem.style.display !== 'none') || (imdbItem && imdbItem.style.display !== 'none') || (kpItem && kpItem.style.display !== 'none') || (lampaItem && lampaItem.style.display !== 'none');
        ratingLine.style.display = anyVisible ? '' : 'none';
    }

    function getRatingDisplayMode() { return Lampa.Storage.get('rating_display_mode', 'separate'); }

    function fillSingleRatingElement(el, data, rateSource) {
        if (!el || !data || !rateSource) return;
        var idStr = data.id.toString();
        if (el.dataset.movieId !== idStr) return;
        el.classList.add('card__vote--separate');
        if (rateSource === 'tmdb') {
            var rating = getTMDBRating(data);
            if (rating !== '0.0') {
                el.className = voteClass('rate--tmdb card__vote--separate');
                el.innerHTML = '<span style="color:' + getRatingColor(rating) + '">' + formatRating(rating) + '</span><span class="source--name"></span>';
                el.style.display = ''; el.classList.remove('card__vote--hidden');
                el.style.background = getRatingBackgroundColor(rating) || ('rgba(0,0,0,' + getOverlayAlpha() + ')');
            } else { el.classList.add('card__vote--hidden'); }
            return;
        }
        if (rateSource === 'imdb' || rateSource === 'kp') {
            getKinopoiskRating(data, function (res) {
                if (!el.parentNode || el.dataset.movieId !== idStr) return;
                var val = rateSource === 'kp' ? res.kp : res.imdb;
                if (val && val > 0) {
                    el.className = voteClass('rate--' + rateSource + ' card__vote--separate');
                    el.innerHTML = '<span style="color:' + getRatingColor(val) + '">' + formatRating(val) + '</span><span class="source--name"></span>';
                    el.style.display = ''; el.classList.remove('card__vote--hidden');
                    el.style.background = getRatingBackgroundColor(val) || ('rgba(0,0,0,' + getOverlayAlpha() + ')');
                } else { el.classList.add('card__vote--hidden'); }
            }); return;
        }
        if (rateSource === 'lampa') {
            var lampaKey = (data.seasons || data.first_air_date || data.original_name) ? 'tv_' + data.id : 'movie_' + data.id;
            getLampaRating(lampaKey).then(function (result) {
                if (!el.parentNode || el.dataset.movieId !== idStr) return;
                if (result.rating > 0) {
                    var html = '<span style="color:' + getRatingColor(result.rating) + '">' + formatRating(result.rating) + '</span>';
                    if (result.medianReaction) html += '<img style="max-height:12px;max-width:12px;object-fit:contain;flex-shrink:0;margin-left:auto;" src="' + getReactionImageSrc(result.medianReaction) + '">';
                    el.className = voteClass('rate--lampa card__vote--separate');
                    el.innerHTML = html; el.style.display = ''; el.classList.remove('card__vote--hidden');
                    el.style.background = getRatingBackgroundColor(result.rating) || ('rgba(0,0,0,' + getOverlayAlpha() + ')');
                } else { el.classList.add('card__vote--hidden'); }
            });
        }
    }
    function createRatingSeparateElements(card) {
        var parent = getRatingParent(card);
        var sources = [];
        if (isRatingSourceVisible('tmdb')) sources.push('tmdb');
        if (isRatingSourceVisible('imdb')) sources.push('imdb');
        if (isRatingSourceVisible('kp')) sources.push('kp');
        if (isRatingSourceVisible('lampa')) sources.push('lampa');
        var wrapper = document.createElement('div');
        wrapper.className = voteClass('card__vote-separate-wrap');
        var posCSS = getRatingPositionCSS();
        wrapper.style.cssText = 'position:absolute;z-index:1;display:flex;flex-direction:column;align-items:stretch;gap:0.15em;box-sizing:border-box;' + posCSS;
        for (var i = 0; i < sources.length; i++) {
            var el = createRatingInnerBlock();
            el.dataset.rateSource = sources[i];
            el.classList.add('card__vote--separate', 'card__vote--hidden');
            wrapper.appendChild(el);
        }
        parent.appendChild(wrapper);
    }
    function updateCardRatingSeparate(card, data) {
        var idStr = data.id.toString();
        var elements = card.querySelectorAll('.card__vote-separate-wrap [data-rate-source]');
        for (var i = 0; i < elements.length; i++) { elements[i].dataset.movieId = idStr; fillSingleRatingElement(elements[i], data, elements[i].dataset.rateSource); }
    }
    function showTmdbFallback(ratingElement, data) {
        var tmdb = getTMDBRating(data);
        if (tmdb !== '0.0') {
            ratingElement.className = voteClass('rate--tmdb');
            ratingElement.innerHTML = '<span style="color:' + getRatingColor(tmdb) + '">' + formatRating(tmdb) + '</span><span class="source--name"></span>';
            ratingElement.style.background = getRatingBackgroundColor(tmdb) || ('rgba(0,0,0,' + getOverlayAlpha() + ')');
            return;
        }
        var lampaKey = (data.seasons || data.first_air_date || data.original_name) ? 'tv_' + data.id : 'movie_' + data.id;
        var cachedLampa = ratingCache.get('lampa_rating', lampaKey);
        if (cachedLampa && cachedLampa.rating > 0) {
            var html = '<span style="color:' + getRatingColor(cachedLampa.rating) + '">' + formatRating(cachedLampa.rating) + '</span>';
            if (cachedLampa.medianReaction) html += '<img style="max-height:12px;max-width:12px;object-fit:contain;flex-shrink:0;margin-left:auto;" src="' + getReactionImageSrc(cachedLampa.medianReaction) + '">';
            ratingElement.className = voteClass('rate--lampa');
            ratingElement.innerHTML = html;
            ratingElement.style.background = getRatingBackgroundColor(cachedLampa.rating) || ('rgba(0,0,0,' + getOverlayAlpha() + ')');
            return;
        }
        getLampaRating(lampaKey).then(function (result) {
            if (!ratingElement.parentNode || ratingElement.dataset.movieId !== data.id.toString()) return;
            if (result.rating > 0) {
                var html = '<span style="color:' + getRatingColor(result.rating) + '">' + formatRating(result.rating) + '</span>';
                if (result.medianReaction) html += '<img style="max-height:12px;max-width:12px;object-fit:contain;flex-shrink:0;margin-left:auto;" src="' + getReactionImageSrc(result.medianReaction) + '">';
                ratingElement.className = voteClass('rate--lampa');
                ratingElement.innerHTML = html;
                ratingElement.style.background = getRatingBackgroundColor(result.rating) || ('rgba(0,0,0,' + getOverlayAlpha() + ')');
            } else { ratingElement.classList.add('card__vote--hidden'); }
        });
    }
    function removeAllRatingElements(card) {
        var parent = card.querySelector && card.querySelector('[data-rate-anchor="1"]');
        if (!parent) return;
        var list = parent.querySelectorAll('.card__vote, .card__vote-line');
        for (var i = 0; i < list.length; i++) list[i].remove();
    }

    function updateCardRating(item) {
        var card = item.card || item;
        if (!card || !card.querySelector || !document.body.contains(card)) return;
        var data = card.card_data || item.data || {};
        if (!data.id) return;
        var idStr = data.id.toString();
        var source = Lampa.Storage.get('rating_source', 'all');
        var ratingElement;
        var displayMode = getRatingDisplayMode();
        if (source === 'all') {
            var isSeparate = displayMode === 'separate';
            if (isSeparate) {
                var separateWrap = card.querySelector('.card__vote-separate-wrap');
                if (!separateWrap || separateWrap.dataset.movieId !== idStr || separateWrap.dataset.source !== 'all') {
                    removeAllRatingElements(card);
                    createRatingSeparateElements(card);
                    separateWrap = card.querySelector('.card__vote-separate-wrap');
                }
                if (separateWrap) { separateWrap.dataset.movieId = idStr; separateWrap.dataset.source = 'all'; }
                updateCardRatingSeparate(card, data);
                if (canUseKinopoiskApi()) getKinopoiskRating(data, function () { if (card.parentNode && document.body.contains(card)) updateCardRatingSeparate(card, data); });
                var lampaKey = (data.seasons || data.first_air_date || data.original_name) ? 'tv_' + data.id : 'movie_' + data.id;
                getLampaRating(lampaKey).then(function () { if (card.parentNode && document.body.contains(card)) updateCardRatingSeparate(card, data); });
            } else {
                ratingElement = card.querySelector('.card__vote-line');
                if (!ratingElement || ratingElement.dataset.movieId !== idStr || ratingElement.dataset.source !== 'all') { removeAllRatingElements(card); ratingElement = createRatingLineElement(card); }
                ratingElement.dataset.source = 'all'; ratingElement.dataset.movieId = idStr;
                ratingElement.style.display = ''; ratingElement.classList.remove('card__vote--hidden');
                updateCardRatingLine(ratingElement, data);
                if (canUseKinopoiskApi() && !ratingElement.dataset.kpRequested) {
                    ratingElement.dataset.kpRequested = String(Date.now());
                    getKinopoiskRating(data, function () { if (ratingElement.parentNode && ratingElement.dataset.movieId === idStr) updateCardRatingLine(ratingElement, data); });
                }
                var lampaKey2 = (data.seasons || data.first_air_date || data.original_name) ? 'tv_' + data.id : 'movie_' + data.id;
                getLampaRating(lampaKey2).then(function () { if (ratingElement.parentNode && ratingElement.dataset.movieId === idStr) updateCardRatingLine(ratingElement, data); });
            }
            return;
        }
        ratingElement = card.querySelector('.card__vote:not(.card__vote-line):not(.card__vote--separate):not(.card__vote-separate-wrap)');
        if (!ratingElement || ratingElement.dataset.source !== source || ratingElement.dataset.movieId !== idStr) { removeAllRatingElements(card); ratingElement = createRatingElement(card); }
        ratingElement.dataset.source = source; ratingElement.dataset.movieId = idStr;
        ratingElement.style.display = ''; ratingElement.classList.remove('card__vote--hidden');
        function applyTmdbToElement(el) {
            var tmdb = getTMDBRating(data);
            if (tmdb !== '0.0') {
                el.className = voteClass('rate--tmdb');
                el.innerHTML = '<span style="color:' + getRatingColor(tmdb) + '">' + formatRating(tmdb) + '</span><span class="source--name"></span>';
                el.style.background = getRatingBackgroundColor(tmdb) || ('rgba(0,0,0,' + getOverlayAlpha() + ')');
                return true;
            }
            return false;
        }
        if (source === 'tmdb') { ratingElement.className = voteClass('rate--tmdb'); if (!applyTmdbToElement(ratingElement)) showTmdbFallback(ratingElement, data); }
        else if (source === 'lampa') {
            var type = (data.seasons || data.first_air_date || data.original_name) ? 'tv' : 'movie';
            var ratingKey = type + '_' + data.id;
            var cached = ratingCache.get('lampa_rating', ratingKey);
            if (cached && cached.rating > 0) {
                ratingElement.className = voteClass('rate--lampa');
                var html = '<span style="color:' + getRatingColor(cached.rating) + '">' + formatRating(cached.rating) + '</span>';
                if (cached.medianReaction) html += '<img style="max-height:12px;max-width:12px;object-fit:contain;flex-shrink:0;margin-left:auto;" src="' + getReactionImageSrc(cached.medianReaction) + '">';
                ratingElement.innerHTML = html;
                ratingElement.style.background = getRatingBackgroundColor(cached.rating) || ('rgba(0,0,0,' + getOverlayAlpha() + ')');
                return;
            }
            applyTmdbToElement(ratingElement);
            addToQueue(function () {
                getLampaRating(ratingKey).then(function (result) {
                    if (ratingElement.parentNode && ratingElement.dataset.movieId === idStr && result.rating > 0) {
                        ratingElement.className = voteClass('rate--lampa');
                        var html = '<span style="color:' + getRatingColor(result.rating) + '">' + formatRating(result.rating) + '</span>';
                        if (result.medianReaction) html += '<img style="max-height:12px;max-width:12px;object-fit:contain;flex-shrink:0;margin-left:auto;" src="' + getReactionImageSrc(result.medianReaction) + '">';
                        ratingElement.innerHTML = html;
                        ratingElement.style.background = getRatingBackgroundColor(result.rating) || ('rgba(0,0,0,' + getOverlayAlpha() + ')');
                    }
                });
            });
        } else if (source === 'kp' || source === 'imdb') {
            applyTmdbToElement(ratingElement);
            getKinopoiskRating(data, function (res) {
                if (ratingElement.parentNode && ratingElement.dataset.movieId === idStr) {
                    var val = source === 'kp' ? res.kp : res.imdb;
                    if (val && val > 0) {
                        ratingElement.className = voteClass('rate--' + source);
                        ratingElement.innerHTML = '<span style="color:' + getRatingColor(val) + '">' + formatRating(val) + '</span><span class="source--name"></span>';
                        ratingElement.style.background = getRatingBackgroundColor(val) || ('rgba(0,0,0,' + getOverlayAlpha() + ')');
                    }
                }
            });
        }
    }

    window.refreshAllRatings = function () {
        var allCards = document.querySelectorAll('.card');
        for (var i = 0; i < allCards.length; i++) {
            var card = allCards[i]; var data = card.card_data;
            if (data && data.id) updateCardRating({ card: card, data: data });
        }
    };

    var _scrollRatingMaxCardsPerRun = 80;
    var _ratingUpdateTimer = 0;
    var _ratingUpdateRafScheduled = false;
    var _ratingObserver = null;
    var _ratingHeartbeatTimer = 0;
    function isCardNearViewport(card, windowHeight) { var rect = card.getBoundingClientRect(); return !(rect.bottom < -200 || rect.top > windowHeight + 200); }
    function updateVisibleCards(limit) {
        if (document.hidden) return;
        var allCards = document.querySelectorAll('.card');
        var maxCards = typeof limit === 'number' && limit > 0 ? limit : allCards.length;
        var wH = window.innerHeight || 1000;
        var updated = 0;
        var source = Lampa.Storage.get('rating_source', 'all');
        var displayMode = getRatingDisplayMode();
        for (var i = 0; i < allCards.length && updated < maxCards; i++) {
            var card = allCards[i]; var data = card.card_data;
            if (!data || !data.id) continue;
            if (!isCardNearViewport(card, wH)) continue;
            var idStr = data.id.toString();
            var lineEl = card.querySelector('.card__vote-line');
            var separateEls = card.querySelectorAll('.card__vote-separate-wrap [data-rate-source]');
            var singleEl = card.querySelector('.card__vote:not(.card__vote-line):not(.card__vote--separate):not(.card__vote-separate-wrap)');
            var needFull = false;
            if (source === 'all') {
                if (displayMode === 'single') { if (!lineEl || lineEl.dataset.movieId !== idStr) needFull = true; else updateCardRatingLine(lineEl, data); }
                else { if (separateEls.length === 0 || (separateEls[0] && separateEls[0].dataset.movieId !== idStr)) needFull = true; else updateCardRatingSeparate(card, data); }
            } else {
                if (!singleEl || singleEl.dataset.source !== source || singleEl.dataset.movieId !== idStr) needFull = true;
                else if (singleEl.innerHTML === '') {
                    if (source === 'lampa') {
                        var ratingKey = (data.seasons || data.first_air_date || data.original_name) ? 'tv_' + data.id : 'movie_' + data.id;
                        var cachedLampa = ratingCache.get('lampa_rating', ratingKey);
                        if (cachedLampa && cachedLampa.rating > 0) {
                            singleEl.innerHTML = '<span style="color:' + getRatingColor(cachedLampa.rating) + '">' + formatRating(cachedLampa.rating) + '</span>' + (cachedLampa.medianReaction ? '<img style="max-height:12px;max-width:12px;object-fit:contain;flex-shrink:0;margin-left:auto;" src="' + getReactionImageSrc(cachedLampa.medianReaction) + '">' : '');
                        }
                    } else if (source === 'tmdb') {
                        var cachedTmdb = ratingCache.get('tmdb_rating', data.id);
                        if (cachedTmdb && cachedTmdb.vote_average > 0) singleEl.innerHTML = '<span style="color:' + getRatingColor(cachedTmdb.vote_average) + '">' + formatRating(cachedTmdb.vote_average) + '</span><span class="source--name"></span>';
                    } else if (source === 'kp' || source === 'imdb') {
                        var cachedKp = ratingCache.get('kp_rating', data.id);
                        if (cachedKp && (cachedKp.kp > 0 || cachedKp.imdb > 0)) { var r = source === 'kp' ? cachedKp.kp : cachedKp.imdb; singleEl.innerHTML = '<span style="color:' + getRatingColor(r) + '">' + formatRating(r) + '</span><span class="source--name"></span>'; }
                    }
                }
            }
            if (needFull) updateCardRating({ card: card, data: data });
            updated++;
        }
    }
    function scheduleVisibleRatingsUpdate(delay) {
        if (_ratingUpdateTimer) clearTimeout(_ratingUpdateTimer);
        _ratingUpdateTimer = setTimeout(function () { _ratingUpdateTimer = 0; if (_ratingUpdateRafScheduled) return; _ratingUpdateRafScheduled = true; requestAnimationFrame(function () { _ratingUpdateRafScheduled = false; updateVisibleCards(_scrollRatingMaxCardsPerRun); }); }, delay || 0);
    }
    function startRatingsObserver() {
        if (_ratingObserver || typeof MutationObserver === 'undefined' || !document.body) return;
        _ratingObserver = new MutationObserver(function (mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var mutation = mutations[i];
                if (!mutation.addedNodes || !mutation.addedNodes.length) continue;
                for (var j = 0; j < mutation.addedNodes.length; j++) {
                    var node = mutation.addedNodes[j];
                    if (!node || node.nodeType !== 1) continue;
                    if ((node.matches && node.matches('.card')) || (node.querySelector && node.querySelector('.card'))) {
                        scheduleVisibleRatingsUpdate(0);
                        return;
                    }
                }
            }
        });
        _ratingObserver.observe(document.body, { childList: true, subtree: true });
    }
    function startRatingsHeartbeat() {
        if (_ratingHeartbeatTimer) clearInterval(_ratingHeartbeatTimer);
        _ratingHeartbeatTimer = setInterval(function () { if (!document.hidden) scheduleVisibleRatingsUpdate(0); }, 900);
    }

    function colorizeFullCardRatings(render) {
        if (!isColoredRatingsPosterOn()) return;
        var scope = $(render).length ? $(render) : $(document);
        scope.find('.full-start__rate, .full-start-new__rate, .info__rate, .card__imdb-rate, .card__kinopoisk-rate').each(function () {
            var el = $(this); if (el.closest('.explorer').length) return;
            var text = el.text().trim(); var m = text.match(/(\d+[\.,]\d+|\d+)/); if (!m) return;
            var v = parseFloat(m[0].replace(',', '.')); if (isNaN(v)) return;
            el.css('color', v <= 3 ? 'red' : v < 6 ? 'orange' : v < 8 ? 'cornflowerblue' : 'lawngreen');
        });
    }
    function insertLampaBlock(render) {
        if (!render) return false;
        var rateLine = $(render).find('.full-start-new__rate-line');
        if (!rateLine.length || rateLine.find('.rate--lampa').length > 0) return false;
        var html = '<div class="full-start-new__rate full-start__rate rate--lampa"><div class="rate-value">0.0</div><div class="rate-icon"></div><div class="source--name">LAMPA</div></div>';
        var $anchor = rateLine.find('.full-start-new__rate.rate--tmdb, .full-start-new__rate.rate--kp, .full-start-new__rate.rate--imdb, .full-start__rate.rate--tmdb, .full-start__rate.rate--kp, .full-start__rate.rate--imdb').last();
        if (!$anchor.length) $anchor = rateLine.find('.rate--tmdb, .rate--kp, .rate--imdb').last().closest('.full-start-new__rate, .full-start__rate');
        if (!$anchor.length) $anchor = rateLine.find('.full-start-new__rate:not(.rate--lampa), .full-start__rate:not(.rate--lampa)').last();
        if ($anchor.length) $anchor.after(html); else rateLine.append(html);
        return true;
    }
    function applyRatingScale() {
        var v = parseFloat(Lampa.Storage.get('rating_scale', '100'));
        if (isNaN(v)) v = 100;
        v = Math.max(60, Math.min(150, v)) / 100;
        try { document.body.style.setProperty('--rating-scale', String(v)); } catch (e) {}
    }
    function applyRatingSettingsRefresh() {
        applyRatingScale();
        var allCards = document.querySelectorAll('.card');
        for (var i = 0; i < allCards.length; i++) removeAllRatingElements(allCards[i]);
        if (typeof window.refreshAllRatings === 'function') window.refreshAllRatings();
        scheduleVisibleRatingsUpdate(0);
        refreshAllQualityLabels();
        refreshAllTypeLabels();
    }

    // ===== QUALITY SYSTEM =====
    function convertQuality(resolution) {
        switch (resolution) {
            case 2160: return '4K';
            case 1080: return 'FHD';
            case 720: return 'HD';
            case 'TS': return 'TS';
            default: return resolution >= 720 ? 'HD' : 'SD';
        }
    }
    var forbiddenTerms = ['camrip', 'камрип', 'ts', 'telecine', 'telesync', 'telesynch', 'upscale', 'tc', 'тс'];
    var forbiddenPatterns = forbiddenTerms.map(function (term) { return new RegExp('\\b' + term + '\\b', 'i'); });
    function detectLowQuality(title) { if (!title) return false; var l = title.toLowerCase(); return forbiddenPatterns.some(function (p) { return p.test(l); }); }
    function determineType(item) { var ct = item.media_type || item.type; if (ct === 'movie' || ct === 'tv') return ct; return item.name || item.original_name ? 'tv' : 'movie'; }

    function fetchOptimalRelease(normalizedItem, itemId, onComplete) {
        var HIGHEST_RES = 2160, detectedForbidden = false;
        function containsText(input) { return /[a-zа-яё]/i.test(input || ''); }
        function isNumericOnly(input) { return /^\d+$/.test(input); }
        var releaseYear = '';
        var dateString = normalizedItem.release_date || '';
        if (dateString.length >= 4) releaseYear = dateString.substring(0, 4);
        if (!releaseYear || isNaN(releaseYear)) { onComplete(null); return; }
        var uniqueId = Lampa.Storage.get('lampac_unic_id', '');
        var requestUrl = 'https://' + QUALITY_API_DOMAIN + '/api/v2.0/indexers/all/results?apikey=&uid=' + uniqueId + '&year=' + releaseYear;
        var titlePresent = false;
        if (normalizedItem.title && (containsText(normalizedItem.title) || isNumericOnly(normalizedItem.title))) { requestUrl += '&title=' + encodeURIComponent(normalizedItem.title.trim()); titlePresent = true; }
        if (normalizedItem.original_title && (containsText(normalizedItem.original_title) || isNumericOnly(normalizedItem.original_title))) { requestUrl += '&title_original=' + encodeURIComponent(normalizedItem.original_title.trim()); titlePresent = true; }
        if (!titlePresent) { onComplete(null); return; }
        new Lampa.Reguest().silent(requestUrl, function (responseData) {
            if (!responseData) { onComplete(null); return; }
            try {
                var parsedData = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
                var releases = parsedData.Results || [];
                if (!Array.isArray(releases)) releases = [];
                if (!releases.length) { onComplete(null); return; }
                var optimalRes = -1, optimalRelease = null;
                var targetYear = parseInt(releaseYear, 10), priorYear = targetYear - 1;
                for (var index = 0; index < releases.length; index++) {
                    var release = releases[index];
                    var details = release.info || release.Info || {};
                    var resValue = details.quality, yearValue = details.relased, checkTitle = release.Title || '';
                    if (typeof resValue !== 'number' || resValue === 0) continue;
                    var validYear = false, extractedYear = 0;
                    if (yearValue && !isNaN(yearValue)) { extractedYear = parseInt(yearValue, 10); if (extractedYear > 1900) validYear = true; }
                    if (!validYear) continue;
                    if (extractedYear !== targetYear && extractedYear !== priorYear) continue;
                    if (detectLowQuality(checkTitle)) { detectedForbidden = true; continue; }
                    if (resValue === HIGHEST_RES) { onComplete({ quality: convertQuality(resValue), title: checkTitle }); return; }
                    if (resValue > optimalRes) { optimalRes = resValue; optimalRelease = { title: checkTitle, quality: resValue, year: extractedYear }; }
                }
                if (optimalRelease) onComplete({ quality: convertQuality(optimalRelease.quality), title: optimalRelease.title });
                else if (detectedForbidden) onComplete({ quality: convertQuality('TS'), title: "NOT SAVED" });
                else onComplete(null);
            } catch (error) { onComplete(null); }
        });
    }
    function retrieveQualityCache(entryKey) {
        var storedCache = Lampa.Storage.get(QUALITY_CACHE_KEY) || {};
        var cacheEntry = storedCache[entryKey];
        return cacheEntry && (Date.now() - cacheEntry.timestamp < CACHE_TTL) ? cacheEntry : null;
    }
    function storeQualityCache(entryKey, entryData) {
        var storedCache = Lampa.Storage.get(QUALITY_CACHE_KEY) || {};
        storedCache[entryKey] = { quality: entryData.quality || null, timestamp: Date.now() };
        Lampa.Storage.set(QUALITY_CACHE_KEY, storedCache);
    }
    function loadQualityForDetail(item, viewRenderer) {
        var standardizedItem = { id: item.id, title: item.title || item.name || '', original_title: item.original_title || item.original_name || '', release_date: item.release_date || item.first_air_date || '', type: determineType(item) };
        var cacheEntryKey = standardizedItem.type + '_' + standardizedItem.id;
        var cachedQuality = retrieveQualityCache(cacheEntryKey);
        if (cachedQuality) { refreshDetailQuality(cachedQuality.quality, viewRenderer); }
        else { displayQualityLoader(viewRenderer); fetchOptimalRelease(standardizedItem, standardizedItem.id, function (releaseResult) { var q = (releaseResult && releaseResult.quality) || null; if (q && q !== 'NO') { storeQualityCache(cacheEntryKey, { quality: q }); refreshDetailQuality(q, viewRenderer); } else { removeQualityElements(viewRenderer); } }); }
    }
    function refreshDetailQuality(resQuality, viewRenderer) {
        if (!viewRenderer) return;
        var ratingSection = $('.full-start-new__rate-line', viewRenderer);
        if (!ratingSection.length) return;
        var qualityDisplay = $('.full-start__status.qualview-quality', viewRenderer);
        if (qualityDisplay.length) { qualityDisplay.text(resQuality).css('opacity', '1'); }
        else { ratingSection.append('<div class="full-start__status qualview-quality">' + resQuality + '</div>'); }
    }
    function displayQualityLoader(viewRenderer) {
        if (!viewRenderer) return;
        var ratingSection = $('.full-start-new__rate-line', viewRenderer);
        if (ratingSection.length && !$('.full-start__status.qualview-quality', viewRenderer).length) { ratingSection.append('<div class="full-start__status qualview-quality" style="opacity:0.7">...</div>'); }
    }
    function removeQualityElements(viewRenderer) { if (viewRenderer) $('.full-start__status.qualview-quality', viewRenderer).remove(); }

    function applyQualityToItem(itemElement, resQuality) {
        if (!document.body.contains(itemElement)) return;
        itemElement.setAttribute('data-quality-added', 'true');
        var viewSection = itemElement.querySelector('.card__view');
        if (!viewSection) return;
        var existing = viewSection.querySelectorAll('.card__quality');
        for (var i = 0; i < existing.length; i++) existing[i].remove();
        if (resQuality && resQuality !== 'NO' && resQuality !== '...') {
            var qualityContainer = document.createElement('div');
            qualityContainer.className = 'card__quality card__quality-' + resQuality.toLowerCase();
            var inner = document.createElement('div');
            inner.textContent = resQuality;
            qualityContainer.appendChild(inner);
            qualityContainer.style.background = getQualityBackground(resQuality);
            viewSection.appendChild(qualityContainer);
        }
    }
    function processQualityForCards(itemsList) {
        for (var idx = 0; idx < itemsList.length; idx++) {
            var itemElement = itemsList[idx];
            if (itemElement.hasAttribute('data-quality-added')) continue;
            var itemInfo = itemElement.card_data;
            if (!itemInfo) continue;
            var stdInfo = { id: itemInfo.id || '', title: itemInfo.title || itemInfo.name || '', original_title: itemInfo.original_title || itemInfo.original_name || '', release_date: itemInfo.release_date || itemInfo.first_air_date || '', type: determineType(itemInfo) };
            (function (currElement, sInfo, entryKey) {
                var cachedEntry = retrieveQualityCache(entryKey);
                if (cachedEntry) { applyQualityToItem(currElement, cachedEntry.quality); }
                else { applyQualityToItem(currElement, '...'); fetchOptimalRelease(sInfo, sInfo.id, function (releaseData) { var q = (releaseData && releaseData.quality) || null; applyQualityToItem(currElement, q); if (q && q !== 'NO') storeQualityCache(entryKey, { quality: q }); }); }
            })(itemElement, stdInfo, stdInfo.type + '_' + stdInfo.id);
        }
    }
    function refreshAllQualityLabels() {
        var allCards = document.querySelectorAll('.card');
        for (var i = 0; i < allCards.length; i++) {
            allCards[i].removeAttribute('data-quality-added');
            var existing = allCards[i].querySelectorAll('.card__quality');
            for (var j = 0; j < existing.length; j++) existing[j].remove();
        }
        processQualityForCards(allCards);
    }

    // ===== TYPE LABELS =====
    function addTypeLabel(card) {
        if (!isTypeLabelsShowOn()) return;
        if ($(card).closest('.explorer, .layer--online, .select-box').length) { $(card).find('.content-label').remove(); return; }
        if ($(card).find('.content-label').length) return;
        var view = $(card).find('.card__view');
        if (!view.length) return;
        var meta = {}, tmp;
        try {
            tmp = $(card).attr('data-card'); if (tmp) meta = JSON.parse(tmp);
            tmp = $(card).data(); if (tmp && Object.keys(tmp).length) meta = Object.assign(meta, tmp);
            if (Lampa.Card && $(card).attr('id')) { var c = Lampa.Card.get($(card).attr('id')); if (c) meta = Object.assign(meta, c); }
            var id = $(card).data('id') || $(card).attr('data-id') || meta.id;
            if (id && Lampa.Storage.cache('card_' + id)) meta = Object.assign(meta, Lampa.Storage.cache('card_' + id));
        } catch (e) {}
        var isTV = false;
        if (meta.type === 'tv' || meta.card_type === 'tv' || meta.seasons || meta.number_of_seasons > 0 || meta.episodes || meta.number_of_episodes > 0 || meta.is_series) isTV = true;
        if (!isTV) { if ($(card).hasClass('card--tv') || $(card).data('type') === 'tv') isTV = true; else if ($(card).find('.card__type, .card__temp').text().match(/(сезон|серия|эпизод|ТВ|TV)/i)) isTV = true; }
        var isPerson = $(card).hasClass('card--person') || $(card).closest('.scroll--persons, .items--persons, .crew').length > 0;
        if (isPerson) return;
        var hasMovieTraits = $(card).find('.card__age').length > 0 || $(card).find('.card__vote').length > 0 || /\b(19|20)\d{2}\b/.test($(card).text());
        if (!isTV && !hasMovieTraits) return;
        var lbl = $('<div class="content-label"></div>');
        lbl.text(isTV ? 'Сериал' : 'Фильм');
        lbl.css({ backgroundColor: getTypeLabelBackground(isTV) });
        if (isTypeLabelsColoredOn()) { lbl.addClass(isTV ? 'serial-label' : 'movie-label'); }
        view.append(lbl);
        if (isTV) $('body[data-movie-labels="on"] .card--tv .card__type').css('display', 'none!important');
    }
    function processAllTypeLabels() {
        if (!isTypeLabelsShowOn()) { $('.card .content-label').remove(); return; }
        $('body').attr('data-movie-labels', isTypeLabelsShowOn() ? 'on' : 'off');
        $('.card').each(function () { addTypeLabel(this); });
    }
    function refreshAllTypeLabels() {
        $('.card .content-label').remove();
        processAllTypeLabels();
    }
    function addTypeLabelToDetail(poster, movie) {
        if (!isTypeLabelsShowOn()) return;
        poster.find('.content-label').remove();
        var isTV = movie.number_of_seasons > 0 || movie.seasons || movie.type === 'tv';
        var lbl = $('<div class="content-label"></div>').css({
            position: 'absolute', left: '0', top: '0', color: 'white', padding: '0.25em 0.45em',
            borderRadius: '0.75em 0', fontSize: '1.1em', zIndex: 10, lineHeight: 1,
            backgroundColor: getTypeLabelBackground(isTV)
        });
        if (isTypeLabelsColoredOn()) lbl.addClass(isTV ? 'serial-label' : 'movie-label');
        lbl.text(isTV ? 'Сериал' : 'Фильм');
        poster.css('position', 'relative').append(lbl);
    }

    // ===== SEASONS INFO =====
    var seasonInfoSettings = {
        seasons_info_mode: 'none',
        label_position: 'top-right'
    };
    function addSeasonInfo() {
        Lampa.Listener.follow('full', function (data) {
            if (data.type === 'complite' && data.data.movie.number_of_seasons) {
                if (seasonInfoSettings.seasons_info_mode === 'none') return;
                var movie = data.data.movie;
                var status = movie.status;
                var totalSeasons = movie.number_of_seasons || 0;
                var totalEpisodes = movie.number_of_episodes || 0;
                var airedSeasons = 0, airedEpisodes = 0;
                var now = new Date();
                if (movie.seasons) {
                    movie.seasons.forEach(function (s) {
                        if (s.season_number === 0) return;
                        var seasonAired = s.air_date && new Date(s.air_date) <= now;
                        if (seasonAired) airedSeasons++;
                        if (s.episodes) { s.episodes.forEach(function (ep) { if (ep.air_date && new Date(ep.air_date) <= now) airedEpisodes++; }); }
                        else if (seasonAired && s.episode_count) airedEpisodes += s.episode_count;
                    });
                } else if (movie.last_episode_to_air) {
                    airedSeasons = movie.last_episode_to_air.season_number || 0;
                    if (movie.seasons) { movie.seasons.forEach(function (s) { if (s.season_number === 0) return; if (s.season_number < movie.last_episode_to_air.season_number) airedEpisodes += s.episode_count || 0; else if (s.season_number === movie.last_episode_to_air.season_number) airedEpisodes += movie.last_episode_to_air.episode_number; }); }
                    else { var prev = 0; for (var i = 1; i < movie.last_episode_to_air.season_number; i++) prev += 10; airedEpisodes = prev + movie.last_episode_to_air.episode_number; }
                }
                if (movie.next_episode_to_air && totalEpisodes > 0) {
                    var ne = movie.next_episode_to_air, rem = 0;
                    if (movie.seasons) { movie.seasons.forEach(function (s) { if (s.season_number === ne.season_number) rem += (s.episode_count || 0) - ne.episode_number + 1; else if (s.season_number > ne.season_number) rem += s.episode_count || 0; }); }
                    if (rem > 0) { var calc = totalEpisodes - rem; if (calc >= 0 && calc <= totalEpisodes) airedEpisodes = calc; }
                }
                if (!airedSeasons) airedSeasons = totalSeasons;
                if (!airedEpisodes) airedEpisodes = totalEpisodes;
                if (totalEpisodes > 0 && airedEpisodes > totalEpisodes) airedEpisodes = totalEpisodes;
                function plural(n, one, two, five) { var m = Math.abs(n) % 100; if (m >= 5 && m <= 20) return five; m %= 10; if (m === 1) return one; if (m >= 2 && m <= 4) return two; return five; }
                function getStatusText(st) { if (st === 'Ended') return 'Завершён'; if (st === 'Canceled') return 'Отменён'; if (st === 'Returning Series') return 'Выходит'; if (st === 'In Production') return 'В производстве'; return st || 'Неизвестно'; }
                var displaySeasons, displayEpisodes;
                if (seasonInfoSettings.seasons_info_mode === 'aired') { displaySeasons = airedSeasons; displayEpisodes = airedEpisodes; }
                else { displaySeasons = totalSeasons; displayEpisodes = totalEpisodes; }
                var seasonsText = plural(displaySeasons, 'сезон', 'сезона', 'сезонов');
                var episodesText = plural(displayEpisodes, 'серия', 'серии', 'серий');
                var isCompleted = (status === 'Ended' || status === 'Canceled');
                var bgColor = isCompleted ? 'rgba(33,150,243,0.8)' : 'rgba(244,67,54,0.8)';
                var info = $('<div class="season-info-label"></div>');
                if (isCompleted) { info.append($('<div>').text(displaySeasons + ' ' + seasonsText + ' ' + displayEpisodes + ' ' + episodesText)); info.append($('<div>').text(getStatusText(status))); }
                else {
                    var txt = displaySeasons + ' ' + seasonsText + ' ' + displayEpisodes + ' ' + episodesText;
                    if (seasonInfoSettings.seasons_info_mode === 'aired' && totalEpisodes > 0 && airedEpisodes < totalEpisodes && airedEpisodes > 0) txt = displaySeasons + ' ' + seasonsText + ' ' + airedEpisodes + ' ' + episodesText + ' из ' + totalEpisodes;
                    info.append($('<div>').text(txt));
                }
                var positions = { 'top-right': { top: '1.4em', right: '-0.8em' }, 'top-left': { top: '1.4em', left: '-0.8em' }, 'bottom-right': { bottom: '1.4em', right: '-0.8em' }, 'bottom-left': { bottom: '1.4em', left: '-0.8em' } };
                var pos = positions[seasonInfoSettings.label_position] || positions['top-right'];
                info.css($.extend({ position: 'absolute', backgroundColor: bgColor, color: 'white', padding: '0.4em 0.6em', borderRadius: '0.3em', fontSize: '0.8em', zIndex: 999, textAlign: 'center', whiteSpace: 'nowrap', lineHeight: '1.2em', backdropFilter: 'blur(2px)', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }, pos));
                setTimeout(function () { var poster = $(data.object.activity.render()).find('.full-start-new__poster'); if (poster.length) poster.css('position', 'relative').append(info); }, 100);
            }
        });
    }

    // ===== THEMES =====
    function applyTheme(theme) {
        var old = document.getElementById('card_overlay_theme');
        if (old) old.remove();
        if (!theme || theme === 'default') return;
        var b = '.menu__item, .settings-folder, .settings-param, .selectbox-item, .full-start__button, .full-descr__tag, .player-panel .button, .custom-online-btn, .custom-torrent-btn, .main2-more-btn, .simple-button, .menu__version';
        var f = '.menu__item.focus, .menu__item.traverse, .menu__item.hover, .settings-folder.focus, .settings-param.focus, .selectbox-item.focus, .full-start__button.focus, .full-descr__tag.focus, .player-panel .button.focus, .custom-online-btn.focus, .custom-torrent-btn.focus, .main2-more-btn.focus, .simple-button.focus, .menu__version.focus';
        var c = '.card.focus .card__view::after, .card.hover .card__view::after';
        var m = '.settings__content, .settings-input__content, .selectbox__content, .modal__content';
        var perf = b + ' { transition: transform 0.2s ease-out, box-shadow 0.2s ease-out, background-color 0.2s ease-out, color 0.2s ease-out !important; } ';
        var themeCss = {
            emerald_v1: 'body { background: linear-gradient(135deg, #0c1619 0%, #132730 50%, #18323a 100%) !important; color: #dfdfdf !important; } ' + b + ' { border-radius: 1.0em !important; } ' + f + ' { background: linear-gradient(to right, #1a594d, #0e3652) !important; color: #fff !important; box-shadow: 0 2px 8px rgba(26,89,77,.25) !important; } ' + c + ' { border: 2px solid #1a594d !important; box-shadow: 0 0 10px rgba(26,89,77,.35) !important; border-radius: 1.0em !important; } ' + m + ' { background: rgba(12,22,25,.97) !important; border: 1px solid rgba(26,89,77,.12) !important; border-radius: 1.0em !important; }',
            emerald_v2: 'body { background: radial-gradient(1200px 600px at 70% 10%, #214a57 0%, transparent 60%), linear-gradient(135deg, #112229 0%, #15303a 45%, #0f1c22 100%) !important; color:#e6f2ef !important; } ' + b + ' { border-radius: .85em !important; } ' + f + ' { background: linear-gradient(90deg, rgba(38,164,131,0.95), rgba(18,94,138,0.95)) !important; color:#fff !important; -webkit-backdrop-filter: blur(2px) !important; backdrop-filter: blur(2px) !important; box-shadow:0 6px 18px rgba(18,94,138,.35) !important; } ' + c + ' { border: 3px solid rgba(38,164,131,0.9) !important; box-shadow: 0 0 20px rgba(38,164,131,.45) !important; border-radius: .9em !important; } ' + m + ' { background: rgba(10,24,29,0.98) !important; border: 1px solid rgba(38,164,131,.15) !important; border-radius: .9em !important; }',
            aurora: 'body { background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%) !important; color: #ffffff !important; } ' + b + ' { border-radius: .85em !important; } ' + f + ' { background: linear-gradient(90deg, #aa4b6b, #6b6b83, #3b8d99) !important; color:#fff !important; box-shadow: 0 0 20px rgba(170,75,107,.35) !important; } ' + c + ' { border: 2px solid #aa4b6b !important; box-shadow: 0 0 22px rgba(170,75,107,.45) !important; border-radius: .9em !important; } ' + m + ' { background: rgba(20, 32, 39, 0.98) !important; border: 1px solid rgba(59,141,153,.18) !important; border-radius: .9em !important; }',
            netflix: 'body { background: #141414 !important; color: #ffffff !important; } ' + b + ' { border-radius: 0.4em !important; } ' + f + ' { background: #E50914 !important; color: #fff !important; box-shadow: 0 4px 15px rgba(229,9,20,.4) !important; } ' + c + ' { border: 3px solid #E50914 !important; box-shadow: 0 0 18px rgba(229,9,20,.5) !important; border-radius: 0.4em !important; } ' + m + ' { background: rgba(20, 20, 20, 0.98) !important; border: 1px solid rgba(229,9,20,.25) !important; border-radius: 0.4em !important; }',
            spotify: 'body { background: linear-gradient(135deg, #282828 0%, #121212 40%, #000000 100%) !important; color: #ffffff !important; } ' + b + ' { border-radius: 2em !important; } ' + f + ' { background: #1DB954 !important; color: #000 !important; box-shadow: 0 4px 15px rgba(29,185,84,.3) !important; font-weight: bold !important; } ' + c + ' { border: 3px solid #1DB954 !important; box-shadow: 0 0 15px rgba(29,185,84,.4) !important; border-radius: 0.6em !important; } ' + m + ' { background: rgba(18, 18, 18, 0.98) !important; border: 1px solid rgba(29,185,84,.2) !important; border-radius: 0.6em !important; }',
            cyberpunk: 'body { background: linear-gradient(135deg, #09090e 0%, #1a0b2e 100%) !important; color: #e0e0e0 !important; } ' + b + ' { border-radius: 0.3em !important; } ' + f + ' { background: linear-gradient(90deg, #ff003c, #00f0ff) !important; color: #fff !important; box-shadow: 0 0 15px rgba(255,0,60,.6) !important; } ' + c + ' { border: 2px solid #00f0ff !important; box-shadow: 0 0 20px rgba(0,240,255,.6), inset 0 0 10px rgba(255,0,60,.4) !important; border-radius: 0.3em !important; } ' + m + ' { background: rgba(10, 10, 15, 0.96) !important; border: 1px solid #ff003c !important; border-radius: 0.3em !important; }',
            amoled: 'body { background: #000000 !important; color: #dfdfdf !important; } ' + b + ' { border-radius: 0.5em !important; } ' + f + ' { background: #bb86fc !important; color: #000 !important; box-shadow: 0 0 12px rgba(187,134,252,.5) !important; font-weight: 600 !important; } ' + c + ' { border: 2px solid #bb86fc !important; box-shadow: 0 0 15px rgba(187,134,252,.4) !important; border-radius: 0.5em !important; } ' + m + ' { background: #0a0a0a !important; border: 1px solid rgba(187,134,252,.2) !important; border-radius: 0.5em !important; }',
            ocean: 'body { background: radial-gradient(circle at top right, #122238, #050a14) !important; color: #e6f1ff !important; } ' + b + ' { border-radius: 0.4em !important; } ' + f + ' { background: rgba(100,255,218,0.15) !important; color: #64ffda !important; box-shadow: 0 0 15px rgba(100,255,218,.25), inset 0 0 0 1px #64ffda !important; -webkit-backdrop-filter: blur(4px) !important; backdrop-filter: blur(4px) !important; } ' + c + ' { border: 2px solid #64ffda !important; box-shadow: 0 0 20px rgba(100,255,218,.3) !important; border-radius: 0.4em !important; } ' + m + ' { background: rgba(10, 18, 32, 0.98) !important; border: 1px solid rgba(100,255,218,.2) !important; border-radius: 0.4em !important; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5) !important; }',
            dark_mint: 'body { background: linear-gradient(135deg, #050e0d 0%, #0a1614 50%, #11211e 100%) !important; color: #e6f2ef !important; } ' + b + ' { border-radius: 0.6em !important; } ' + f + ' { background: rgba(0, 184, 148, 0.15) !important; color: #00b894 !important; box-shadow: 0 0 15px rgba(0, 184, 148, 0.25), inset 0 0 0 1px #00b894 !important; -webkit-backdrop-filter: blur(4px) !important; backdrop-filter: blur(4px) !important; } ' + c + ' { border: 2px solid #00b894 !important; box-shadow: 0 0 20px rgba(0, 184, 148, 0.3) !important; border-radius: 0.8em !important; } ' + m + ' { background: rgba(5, 11, 10, 0.98) !important; border: 1px solid rgba(0, 184, 148, 0.2) !important; border-radius: 0.6em !important; }',
            mint: 'body { background: linear-gradient(135deg, #122220 0%, #1c3633 50%, #254a46 100%) !important; color: #ffffff !important; } ' + b + ' { border-radius: 0.6em !important; } ' + f + ' { background: rgba(46, 204, 113, 0.15) !important; color: #2ecc71 !important; box-shadow: 0 0 15px rgba(46, 204, 113, 0.25), inset 0 0 0 1px #2ecc71 !important; -webkit-backdrop-filter: blur(4px) !important; backdrop-filter: blur(4px) !important; } ' + c + ' { border: 2px solid #2ecc71 !important; box-shadow: 0 0 20px rgba(46, 204, 113, 0.3) !important; border-radius: 0.8em !important; } ' + m + ' { background: rgba(18, 34, 32, 0.98) !important; border: 1px solid rgba(46, 204, 113, 0.2) !important; border-radius: 0.6em !important; }',
            prime: 'body { background: linear-gradient(135deg, #1e2b3c 0%, #232f3e 100%) !important; color: #ffffff !important; } ' + b + ' { border-radius: 0.4em !important; } ' + f + ' { background: #00a8e1 !important; color: #fff !important; box-shadow: 0 4px 12px rgba(0, 168, 225, 0.4) !important; } ' + c + ' { border: 2px solid #00a8e1 !important; box-shadow: 0 0 15px rgba(0, 168, 225, 0.4) !important; border-radius: 0.4em !important; } ' + m + ' { background: rgba(30, 43, 60, 0.98) !important; border: 1px solid rgba(0, 168, 225, 0.2) !important; border-radius: 0.4em !important; }',
            twitch: 'body { background: radial-gradient(circle at 50% 0%, #201533 0%, #0e0e10 80%) !important; color: #efeff1 !important; } ' + b + ' { border-radius: 0.4em !important; } ' + f + ' { background: #9146FF !important; color: #fff !important; box-shadow: 0 4px 15px rgba(145, 70, 255, 0.4) !important; } ' + c + ' { border: 2px solid #9146FF !important; box-shadow: 0 0 15px rgba(145, 70, 255, 0.4) !important; border-radius: 0.4em !important; } ' + m + ' { background: rgba(24, 24, 27, 0.98) !important; border: 1px solid rgba(145, 70, 255, 0.2) !important; border-radius: 0.4em !important; }',
            apple: 'body { background: linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 100%) !important; color: #ffffff !important; } ' + b + ' { border-radius: 0.8em !important; } ' + f + ' { background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.15) 100%) !important; color: #fff !important; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 0 1.5px rgba(255, 255, 255, 0.6) !important; -webkit-backdrop-filter: blur(15px) !important; backdrop-filter: blur(15px) !important; } ' + c + ' { border: 2px solid rgba(255, 255, 255, 0.8) !important; box-shadow: 0 0 20px rgba(255, 255, 255, 0.3) !important; border-radius: 0.8em !important; } ' + m + ' { background: rgba(30, 30, 30, 0.2) !important; border: 1px solid rgba(255, 255, 255, 0.2) !important; border-radius: 1em !important; -webkit-backdrop-filter: blur(12px) !important; backdrop-filter: blur(12px) !important; }',
            hulu: 'body { background: radial-gradient(ellipse at top, #1a3020 0%, #0f1210 80%) !important; color: #ffffff !important; } ' + b + ' { border-radius: 0.4em !important; } ' + f + ' { background: #1ce783 !important; color: #000 !important; font-weight: bold !important; box-shadow: 0 4px 15px rgba(28, 231, 131, 0.3) !important; } ' + c + ' { border: 2px solid #1ce783 !important; box-shadow: 0 0 15px rgba(28, 231, 131, 0.3) !important; border-radius: 0.4em !important; } ' + m + ' { background: rgba(15, 18, 16, 0.98) !important; border: 1px solid rgba(28, 231, 131, 0.2) !important; border-radius: 0.4em !important; }'
        };
        var st = document.createElement('style');
        st.id = 'card_overlay_theme';
        st.textContent = perf + (themeCss[theme] || '');
        document.head.appendChild(st);
    }

    // ===== COLORED ELEMENTS =====
    function isColoredElementsOn() { return isTriggerOn('colored_elements', true); }
    function colorizeSeriesStatus() {
        if (!isColoredElementsOn()) return;
        var map = { completed: { bg: 'rgba(46,204,113,0.8)', text: 'white' }, canceled: { bg: 'rgba(231,76,60,0.8)', text: 'white' }, ongoing: { bg: 'rgba(243,156,18,0.8)', text: 'black' }, production: { bg: 'rgba(52,152,219,0.8)', text: 'white' }, planned: { bg: 'rgba(155,89,182,0.8)', text: 'white' }, pilot: { bg: 'rgba(230,126,34,0.8)', text: 'white' }, released: { bg: 'rgba(26,188,156,0.8)', text: 'white' }, rumored: { bg: 'rgba(149,165,166,0.8)', text: 'white' }, post: { bg: 'rgba(0,188,212,0.8)', text: 'white' } };
        function apply(el) {
            var t = $(el).text().trim().toLowerCase(); var cfg = null;
            if (t.includes('завершён') || t.includes('завершен') || t.includes('ended')) cfg = map.completed;
            else if (t.includes('отменён') || t.includes('отменен') || t.includes('canceled')) cfg = map.canceled;
            else if (t.includes('выходит') || t.includes('в эфире') || t.includes('ongoing')) cfg = map.ongoing;
            else if (t.includes('в производстве') || t.includes('production')) cfg = map.production;
            else if (t.includes('запланирован') || t.includes('planned')) cfg = map.planned;
            else if (t.includes('пилотный') || t.includes('pilot')) cfg = map.pilot;
            else if (t.includes('выпущен') || t.includes('вышел') || t.includes('released')) cfg = map.released;
            else if (t.includes('слухи') || t.includes('rumored')) cfg = map.rumored;
            else if (t.includes('скоро') || t.includes('post')) cfg = map.post;
            if (cfg) $(el).css({ backgroundColor: cfg.bg, color: cfg.text, borderRadius: '0.3em', display: 'inline-block' });
        }
        $('.full-start__status').each(function () { apply(this); });
        new MutationObserver(function (muts) { muts.forEach(function (m) { if (m.addedNodes) $(m.addedNodes).find('.full-start__status').each(function () { apply(this); }); }); }).observe(document.body, { childList: true, subtree: true });
        Lampa.Listener.follow('full', function (d) { if (d.type === 'complite') setTimeout(function () { $(d.object.activity.render()).find('.full-start__status').each(function () { apply(this); }); }, 100); });
    }
    function colorizeAgeRating() {
        if (!isColoredElementsOn()) return;
        var groups = { kids: ['G', 'TV-Y', '0+', '3+'], children: ['PG', 'TV-PG', '6+', '7+'], teens: ['PG-13', 'TV-14', '12+', '13+', '14+'], almostAdult: ['R', '16+', '17+'], adult: ['NC-17', '18+', 'X'] };
        var colors = { kids: { bg: '#2ecc71', text: 'white' }, children: { bg: '#3498db', text: 'white' }, teens: { bg: '#f1c40f', text: 'black' }, almostAdult: { bg: '#e67e22', text: 'white' }, adult: { bg: '#e74c3c', text: 'white' } };
        function apply(el) {
            if ($(el).closest('.explorer').length) return;
            var t = $(el).text().trim(); var grp = null;
            for (var key in groups) { groups[key].forEach(function (r) { if (t.includes(r)) grp = key; }); if (grp) break; }
            if (grp) $(el).css({ backgroundColor: colors[grp].bg, color: colors[grp].text, borderRadius: '0.3em', padding: '0.2em 0.4em', display: 'inline-block' });
        }
        $('.full-start__pg').each(function () { apply(this); });
        new MutationObserver(function (muts) { muts.forEach(function (m) { if (m.addedNodes) { $(m.addedNodes).find('.full-start__pg').each(function () { apply(this); }); if ($(m.addedNodes).hasClass('full-start__pg')) apply(m.addedNodes); } }); }).observe(document.body, { childList: true, subtree: true });
        Lampa.Listener.follow('full', function (d) { if (d.type === 'complite') setTimeout(function () { $(d.object.activity.render()).find('.full-start__pg').each(function () { apply(this); }); }, 100); });
    }

    // ===== SETTINGS MODAL =====
    function openRatingSettingsModal() {
        var $ = typeof window.$ !== 'undefined' ? window.$ : (typeof window.jQuery !== 'undefined' ? window.jQuery : null);
        if (!$) return;
        try { if (typeof Lampa.Modal !== 'undefined' && Lampa.Modal.close) Lampa.Modal.close(); } catch (err) {}
        setTimeout(function () {
            var SOURCE_LABELS = { tmdb: 'TMDB', lampa: 'Lampa', kp: 'КиноПоиск', imdb: 'IMDB', all: 'Все' };
            var POSITION_LABELS = { top: 'Сверху справа', bottom: 'Снизу справа' };
            var DISPLAY_MODE_LABELS = { single: 'Одно окно', separate: 'Каждый в отдельном окне' };
            var list = $('<div class="menu-edit-list rate-settings-modal"></div>').css({ maxWidth: '100%', overflow: 'hidden', boxSizing: 'border-box', padding: '0.5em 0', pointerEvents: 'auto', cursor: 'default' });
            list.on('click mousedown touchstart', function (e) { e.stopPropagation(); });
            function isMouseEvent(e) { return e && (e.pointerType === 'mouse' || (e.clientX !== undefined && e.clientY !== undefined)); }
            function blurActiveAfterMouseClick(e) { if (isMouseEvent(e)) setTimeout(function () { try { var a = document.activeElement; if (a && a.blur) a.blur(); } catch (err) {} }, 0); }
            function makeRow(label, valueText, onClick) {
                var row = $('<div class="selector menu-edit-list__item rate-settings-row" tabindex="0"></div>').css({ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '0.5em', padding: '0.5em 0.4em', marginBottom: '0.2em', borderRadius: '0.35em', border: '3px solid transparent', boxSizing: 'border-box' });
                var title = $('<div class="menu-edit-list__title"></div>').css({ minWidth: 0, overflow: 'hidden' }).text(label);
                var val = $('<div class="rate-settings-value"></div>').css({ whiteSpace: 'nowrap', opacity: 0.9 }).text(valueText);
                row.append(title).append(val);
                if (typeof onClick === 'function') { row.on('hover:enter', function () { onClick(row, val); }); row.on('click', function (e) { if (e && e.preventDefault) e.preventDefault(); if (e && e.stopPropagation) e.stopPropagation(); blurActiveAfterMouseClick(e); }); }
                return { row: row, updateVal: function (text) { val.text(text); } };
            }
            function addCycleRow(label, storageKey, options, defaultVal) {
                var current = Lampa.Storage.get(storageKey, defaultVal);
                var labels = options.labels || options; var values = options.values || Object.keys(labels);
                if (typeof labels === 'object' && !Array.isArray(labels)) { var arr = []; for (var k in labels) arr.push(k); values = arr; }
                var r = makeRow(label, labels[current] || current, function (rowEl, valEl) {
                    var cur = Lampa.Storage.get(storageKey, defaultVal); var idx = values.indexOf(cur); if (idx < 0) idx = 0;
                    idx = (idx + 1) % values.length; var next = values[idx];
                    Lampa.Storage.set(storageKey, next); valEl.text(labels[next] || next); applyRatingSettingsRefresh();
                });
                r.updateVal(labels[current] || current); list.append(r.row); return r;
            }
            function addTriggerRow(label, storageKey, defaultVal) {
                var isOn = function () { var v = Lampa.Storage.get(storageKey, defaultVal); return (v === true || v === 'true' || v === '1' || v === 1); };
                var r = makeRow(label, isOn() ? 'Вкл' : 'Выкл', function (rowEl, valEl) {
                    var next = !isOn();
                    if (storageKey === 'colored_ratings_poster') setColoredRatingsPoster(next);
                    else Lampa.Storage.set(storageKey, next ? 'true' : 'false');
                    valEl.text(next ? 'Вкл' : 'Выкл'); applyRatingSettingsRefresh();
                });
                list.append(r.row); return r;
            }
            function addNumberRowWithButtons(label, storageKey, defaultVal, min, max, step, suffix) {
                var current = parseFloat(Lampa.Storage.get(storageKey, defaultVal));
                var val = isNaN(current) ? defaultVal : Math.max(min, Math.min(max, current));
                Lampa.Storage.set(storageKey, String(val));
                var valEl = $('<div class="rate-settings-value"></div>').css({ whiteSpace: 'nowrap', opacity: 0.9, minWidth: '2.5em', textAlign: 'center' }).text(val + (suffix || ''));
                var btnMinus = $('<div class="selector menu-edit-list__item rate-settings-plusminus-btn" tabindex="0" aria-label="Уменьшить"></div>').text('−').css({ width: '2em', minHeight: '2em', padding: 0, borderRadius: '0.35em', border: '3px solid transparent', boxSizing: 'border-box', background: 'rgba(255,255,255,0.12)', fontSize: '1.1em', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' });
                var btnPlus = $('<div class="selector menu-edit-list__item rate-settings-plusminus-btn" tabindex="0" aria-label="Увеличить"></div>').text('+').css({ width: '2em', minHeight: '2em', padding: 0, borderRadius: '0.35em', border: '3px solid transparent', boxSizing: 'border-box', background: 'rgba(255,255,255,0.12)', fontSize: '1.1em', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' });
                function applyChange(delta) { var num = parseFloat(Lampa.Storage.get(storageKey, defaultVal)); num = isNaN(num) ? defaultVal : num; var next = Math.max(min, Math.min(max, num + delta)); Lampa.Storage.set(storageKey, String(next)); valEl.text(next + (suffix || '')); applyRatingSettingsRefresh(); }
                btnMinus.on('hover:enter', function () { applyChange(-(step || 1)); }); btnMinus.on('click', function (e) { if (e && e.preventDefault) e.preventDefault(); if (e && e.stopPropagation) e.stopPropagation(); blurActiveAfterMouseClick(e); });
                btnPlus.on('hover:enter', function () { applyChange(step || 1); }); btnPlus.on('click', function (e) { if (e && e.preventDefault) e.preventDefault(); if (e && e.stopPropagation) e.stopPropagation(); blurActiveAfterMouseClick(e); });
                var row = $('<div class="menu-edit-list__item rate-settings-row rate-settings-number-row"></div>').css({ display: 'grid', gridTemplateColumns: '1fr auto auto auto', alignItems: 'center', gap: '0.35em', padding: '0.5em 0.4em', marginBottom: '0.2em', borderRadius: '0.35em', border: '3px solid transparent', boxSizing: 'border-box' });
                row.append($('<div class="menu-edit-list__title"></div>').css({ minWidth: 0, overflow: 'hidden' }).text(label)).append(btnMinus).append(valEl).append(btnPlus);
                list.append(row); return { row: row, updateVal: function (text) { valEl.text(text); } };
            }

            list.append($('<div style="padding:0.3em 0.4em 0.1em;opacity:0.6;font-size:0.85em;text-align:center">— Рейтинги —</div>'));
            var rowSource = addCycleRow('Источник рейтинга', 'rating_source', SOURCE_LABELS, 'all');
            var rowDisplayMode = addCycleRow('Режим отображения', 'rating_display_mode', DISPLAY_MODE_LABELS, 'separate');
            var rowPosition = addCycleRow('Позиция на постере', 'rating_position', POSITION_LABELS, 'bottom');
            var rowColored = addTriggerRow('Цветные цифры рейтингов', 'colored_ratings_poster', false);
            var rowColoredWin = addTriggerRow('Цветные окна (цифры белые)', 'rating_colored_windows', false);
            var rowAnimated = addTriggerRow('Анимированные реакции', 'animated_reactions', false);
            var rowShowTmdb = addTriggerRow('Показывать TMDB', 'rating_show_tmdb', true);
            var rowShowImdb = addTriggerRow('Показывать IMDB', 'rating_show_imdb', true);
            var rowShowKp = addTriggerRow('Показывать КиноПоиск', 'rating_show_kp', true);
            var rowShowLampa = addTriggerRow('Показывать Lampa', 'rating_show_lampa', true);
            var rowOpacity = addNumberRowWithButtons('Прозрачность окон (0=нет, 100=макс)', 'rating_window_opacity', 40, 0, 100, 10, '%');
            var rowScale = addNumberRowWithButtons('Масштаб окон', 'rating_scale', 100, 60, 150, 5, '%');

            list.append($('<div style="padding:0.5em 0.4em 0.1em;opacity:0.6;font-size:0.85em;text-align:center;border-top:1px solid rgba(255,255,255,0.1);margin-top:0.3em">— Качество —</div>'));
            var rowQualityShow = addTriggerRow('Показывать качество', 'quality_show', true);
            var rowQualityColored = addTriggerRow('Цветные окна качества', 'quality_colored', false);

            list.append($('<div style="padding:0.5em 0.4em 0.1em;opacity:0.6;font-size:0.85em;text-align:center;border-top:1px solid rgba(255,255,255,0.1);margin-top:0.3em">— Лейблы типа —</div>'));
            var rowTypeLabelsShow = addTriggerRow('Показывать «Фильм»/«Сериал»', 'type_labels_show', true);
            var rowTypeLabelsColored = addTriggerRow('Цветные лейблы типа', 'type_labels_colored', false);

            list.append($('<div style="padding:0.5em 0.4em 0.1em;opacity:0.6;font-size:0.85em;text-align:center;border-top:1px solid rgba(255,255,255,0.1);margin-top:0.3em">— API —</div>'));
            function kpApiKeyRowText() { var k = String(Lampa.Storage.get('rating_kp_api_key', '') || Lampa.Storage.get('source_api_key', '') || '').trim(); if (!k) return 'не задан'; if (k.length <= 10) return 'указан: ' + k; return 'указан: ' + k.slice(0, 4) + '...' + k.slice(-4); }
            list.append($('<div class="rate-settings-note rate-settings-note-text"></div>').css({ display: 'block', width: '100%', padding: '0.45em 0.4em 0.1em', opacity: 0.92, lineHeight: 1.35, boxSizing: 'border-box', textAlign: 'center', whiteSpace: 'nowrap' }).text('API-ключ можно получить на сайте'));
            list.append($('<div class="rate-settings-note rate-settings-note-link"></div>').css({ display: 'block', width: '100%', padding: '0 0.4em 0.45em', marginBottom: '0.2em', opacity: 0.98, lineHeight: 1.35, boxSizing: 'border-box', textAlign: 'center' }).html('<a class="rate-settings-site" href="https://kinopoiskapiunofficial.tech/" target="_blank" rel="noopener noreferrer">kinopoiskapiunofficial.tech</a>'));
            var rowKpKey = makeRow('API-ключ КиноПоиск', kpApiKeyRowText(), function (rowEl, valEl) {
                if (typeof Lampa.Input !== 'undefined' && typeof Lampa.Input.edit === 'function') {
                    Lampa.Input.edit({ free: true, title: 'API-ключ kinopoiskapiunofficial.tech', nosave: true, value: String(Lampa.Storage.get('rating_kp_api_key', '') || ''), nomic: true }, function (raw) { Lampa.Storage.set('rating_kp_api_key', (raw || '').trim()); valEl.text(kpApiKeyRowText()); applyRatingSettingsRefresh(); });
                }
            });
            rowKpKey.updateVal(kpApiKeyRowText());
            list.append(rowKpKey.row);

            function resetAllToDefault() {
                Lampa.Storage.set('rating_source', 'all'); Lampa.Storage.set('animated_reactions', 'false'); setColoredRatingsPoster(false);
                Lampa.Storage.set('rating_colored_windows', 'false'); Lampa.Storage.set('rating_position', 'bottom');
                Lampa.Storage.set('rating_show_tmdb', 'true'); Lampa.Storage.set('rating_show_imdb', 'true');
                Lampa.Storage.set('rating_show_kp', 'true'); Lampa.Storage.set('rating_show_lampa', 'true');
                Lampa.Storage.set('rating_display_mode', 'separate'); Lampa.Storage.set('rating_window_opacity', '40');
                Lampa.Storage.set('rating_scale', '100'); Lampa.Storage.set('rating_kp_api_key', '');
                Lampa.Storage.set('quality_show', 'true'); Lampa.Storage.set('quality_colored', 'false');
                Lampa.Storage.set('type_labels_show', 'true'); Lampa.Storage.set('type_labels_colored', 'false');
                rowSource.updateVal(SOURCE_LABELS.all); rowDisplayMode.updateVal(DISPLAY_MODE_LABELS.separate);
                rowPosition.updateVal(POSITION_LABELS.bottom); rowColored.updateVal('Выкл'); rowColoredWin.updateVal('Выкл');
                rowAnimated.updateVal('Выкл'); rowShowTmdb.updateVal('Вкл'); rowShowImdb.updateVal('Вкл');
                rowShowKp.updateVal('Вкл'); rowShowLampa.updateVal('Вкл');
                rowOpacity.updateVal('40%'); rowScale.updateVal('100%'); rowKpKey.updateVal(kpApiKeyRowText());
                rowQualityShow.updateVal('Вкл'); rowQualityColored.updateVal('Выкл');
                rowTypeLabelsShow.updateVal('Вкл'); rowTypeLabelsColored.updateVal('Выкл');
                applyRatingSettingsRefresh();
                try { Lampa.Noty.show('Настройки сброшены'); } catch (e) {}
            }
            var resetBtn = $('<div class="selector menu-edit-list__item rate-settings-reset" tabindex="0">Сбросить всё по умолчанию</div>').css({ display: 'block', textAlign: 'center', padding: '0.6em 0.4em', marginTop: '0.4em', background: 'rgba(200,100,80,0.5)', borderRadius: '0.35em', border: '3px solid transparent', boxSizing: 'border-box' });
            resetBtn.on('hover:enter', resetAllToDefault); resetBtn.on('click', function (e) { if (e && e.preventDefault) e.preventDefault(); if (e && e.stopPropagation) e.stopPropagation(); blurActiveAfterMouseClick(e); });
            list.append(resetBtn);
            var closeBtn = $('<div class="selector menu-edit-list__item rate-settings-close" tabindex="0">Готово</div>').css({ display: 'block', textAlign: 'center', padding: '0.75em', marginTop: '0.5em', background: 'rgba(66,133,244,0.6)', borderRadius: '0.35em', border: '3px solid transparent', boxSizing: 'border-box' });
            function closeModal() { Lampa.Modal.close(); applyRatingSettingsRefresh(); setTimeout(function () { try { Lampa.Controller.toggle('settings'); } catch (err) {} }, 50); }
            closeBtn.on('hover:enter', closeModal); closeBtn.on('click', function (e) { if (e && e.preventDefault) e.preventDefault(); if (e && e.stopPropagation) e.stopPropagation(); blurActiveAfterMouseClick(e); });
            list.append(closeBtn);
            if (typeof Lampa.Modal !== 'undefined' && Lampa.Modal.open) {
                Lampa.Modal.open({ title: 'Настройки карточек', html: list, size: 'medium', scroll_to_center: true, onBack: function () { closeModal(); } });
            }
        }, 200);
    }

    function positionAfter(element, anchorName) {
        setTimeout(function () {
            var node = element && (element.nodeType === 1 ? element : (element[0] || (element.get && element.get(0))));
            var anchor = document.querySelector('div[data-name="' + anchorName + '"]');
            if (anchor && anchor.parentNode && node && node.nodeType === 1) anchor.parentNode.insertBefore(node, anchor.nextSibling);
        }, 0);
    }
    function migrateStorageFormat() {
        var keys = ['animated_reactions', 'colored_ratings_poster', 'rating_colored_windows', 'rating_show_tmdb', 'rating_show_imdb', 'rating_show_kp', 'rating_show_lampa', 'quality_show', 'quality_colored', 'type_labels_show', 'type_labels_colored'];
        for (var i = 0; i < keys.length; i++) { var v = Lampa.Storage.get(keys[i], undefined); if (v === '1' || v === 1) Lampa.Storage.set(keys[i], 'true'); else if (v === '0' || v === 0) Lampa.Storage.set(keys[i], 'false'); }
    }

    function addSettings() {
        if (!Lampa.SettingsApi) return;
        migrateStorageFormat();
        Lampa.SettingsApi.addComponent({
            component: 'card_overlay',
            name: 'Накладки на карточках',
            icon: '<svg viewBox="1 1 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" stroke-width="2"/><path d="M12 15V9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M16 15V11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M8 15V11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
        });
        Lampa.SettingsApi.addParam({
            component: 'card_overlay',
            param: { name: 'rating_modal_open', type: 'trigger', default: false },
            field: { name: 'Настройки накладок', description: 'Открыть окно настроек рейтингов, качества и лейблов' },
            onChange: function () { openRatingSettingsModal(); }
        });
        Lampa.SettingsApi.addParam({
            component: 'card_overlay',
            param: { name: 'seasons_info_mode', type: 'select', values: { none: 'Выключить', aired: 'Актуальная информация', total: 'Полное количество' }, default: 'none' },
            field: { name: 'Информация о сериях', description: 'Как отображать информацию о сериях и сезонах' },
            onChange: function (v) { seasonInfoSettings.seasons_info_mode = v; Lampa.Settings.update(); }
        });
        Lampa.SettingsApi.addParam({
            component: 'card_overlay',
            param: { name: 'label_position', type: 'select', values: { 'top-right': 'Верхний правый', 'top-left': 'Верхний левый', 'bottom-right': 'Нижний правый', 'bottom-left': 'Нижний левый' }, default: 'top-right' },
            field: { name: 'Позиция лейбла о сериях', description: 'Позиция лейбла на постере детальной страницы' },
            onChange: function (v) { seasonInfoSettings.label_position = v; Lampa.Settings.update(); Lampa.Noty.show('Откройте карточку заново'); }
        });
        Lampa.SettingsApi.addParam({
            component: 'card_overlay',
            param: { name: 'theme_select', type: 'select', values: { 'default': 'По умолчанию', 'emerald_v1': 'Изумруд V1', 'emerald_v2': 'Изумруд V2', 'aurora': 'Аврора', 'netflix': 'Netflix', 'spotify': 'Spotify Dark', 'cyberpunk': 'Киберпанк', 'amoled': 'AMOLED Black', 'ocean': 'Ocean Glass', 'mint': 'Mint Fresh', 'dark_mint': 'Dark Mint', 'prime': 'Prime Blue', 'twitch': 'Twitch Dark', 'apple': 'Apple Glass', 'hulu': 'Hulu Green' }, default: 'default' },
            field: { name: 'Тема интерфейса', description: 'Выберите тему оформления' },
            onChange: function (v) { Lampa.Settings.update(); applyTheme(v); }
        });
        Lampa.SettingsApi.addParam({
            component: 'card_overlay',
            param: { name: 'colored_elements', type: 'trigger', default: true },
            field: { name: 'Цветные элементы', description: 'Статусы сериалов и возрастные ограничения цветными' },
            onChange: function (v) {
                Lampa.Settings.update();
                if (isTriggerOn('colored_elements', true)) { colorizeSeriesStatus(); colorizeAgeRating(); }
                else { $('.full-start__status').css({ backgroundColor: '', color: '', borderRadius: '', display: '' }); $('.full-start__pg').css({ backgroundColor: '', color: '' }); }
            }
        });

        function moveAfterInterface() {
            var $folders = $('.settings-folder');
            var $interface = $folders.filter(function () { return $(this).data('component') === 'interface'; });
            var $mod = $folders.filter(function () { return $(this).data('component') === 'card_overlay'; });
            if ($interface.length && $mod.length && $mod.prev()[0] !== $interface[0]) $mod.insertAfter($interface);
        }
        var moveTries = 0, moveTimer = setInterval(function () { moveAfterInterface(); if (++moveTries >= 40) clearInterval(moveTimer); }, 150);
        new MutationObserver(function () { moveAfterInterface(); }).observe(document.body, { childList: true, subtree: true });
    }

    function setupCardListener() {
        if (window.lampa_listener_extensions) return;
        window.lampa_listener_extensions = true;
        Object.defineProperty(window.Lampa.Card.prototype, 'build', {
            get: function () { return this._build; },
            set: function (func) {
                var self = this;
                this._build = function () { func.apply(self); Lampa.Listener.send('card', { type: 'build', object: self }); };
            }
        });
    }

    function initPlugin() {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.textContent =
            '.rate-settings-modal .selector{cursor:pointer!important;pointer-events:auto!important;-webkit-tap-highlight-color:rgba(255,255,255,0.15);user-select:none;border:3px solid transparent;box-sizing:border-box;border-radius:0.35em}' +
            '.rate-settings-modal .selector.focus{border-color:rgba(255,255,255,0.8)!important;box-shadow:none!important}' +
            '.rate-settings-modal .selector:hover{background:rgba(255,255,255,0.08)}' +
            '.rate-settings-modal .selector:active{background:rgba(255,255,255,0.22)!important}' +
            '.rate-settings-note{display:block!important;width:100%!important;overflow:visible!important;box-sizing:border-box!important}' +
            '.rate-settings-site{display:inline-block;color:#8ab4ff!important;text-decoration:underline!important;white-space:nowrap!important}' +
            '[data-name="rating_modal_open"] .settings-param__value,[data-name="rating_modal_open"] .settings-param__control,[data-name="rating_modal_open"] input[type="checkbox"]{display:none!important}' +
            '.card .card__view{position:relative!important}' +
            '.card__view > .card__vote:not(.card__vote--top):not(.card__vote--bottom):not(.card__vote-line):not(.card__vote-separate-wrap):not(.card__vote--separate){display:none!important}' +
            '.card__vote{display:flex!important;align-items:center!important;justify-content:flex-start!important;position:absolute!important;z-index:1!important;width:auto!important;min-width:3.5em!important;max-width:100%!important;box-sizing:border-box!important;transform:scale(var(--rating-scale,1))!important;padding:0.2em 0.1em 0.2em 0.35em!important;white-space:nowrap!important;font-size:1.1em!important;line-height:1!important;height:auto!important;border:none!important;margin:0!important}' +
            '.card__vote.card__vote--hidden,.card__vote-separate-wrap .card__vote.card__vote--hidden{display:none!important;height:0!important;padding:0!important;margin:0!important;overflow:hidden!important;min-width:0!important;min-height:0!important;border:none!important;width:0!important;position:absolute!important;opacity:0!important;pointer-events:none!important}' +
            '.card__vote-line{display:flex!important;flex-direction:column!important;align-items:flex-start!important;position:absolute!important;width:auto!important;min-width:3.5em!important;max-width:100%!important;box-sizing:border-box!important;transform:scale(var(--rating-scale,1))!important;padding:0.2em 0.1em 0.2em 0.35em!important;font-size:1.1em!important;line-height:1!important;height:auto!important;border:none!important;margin:0!important}' +
            '.card__vote-separate-wrap{background:transparent!important;padding:0!important;width:auto!important;min-width:3.5em!important;max-width:100%!important;overflow:visible!important;transform:scale(var(--rating-scale,1))!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:0.15em!important;font-size:1.1em!important}' +
            '.card__vote-separate-wrap .card__vote{display:flex!important;align-items:center!important;justify-content:flex-start!important;position:static!important;width:auto!important;min-width:2.8em!important;max-width:100%!important;padding:0.2em 0.1em 0.2em 0.7em!important;white-space:nowrap!important;flex-shrink:0!important;box-sizing:border-box!important;transform:none!important;font-size:1.1em!important;line-height:1!important;height:auto!important;border:none!important;margin:0!important}' +
            '.card__vote > span:first-child,.card__vote-line .card__rate-item > div,.card__vote-line .card__rate-item > .rate-value{display:inline-block!important;min-width:3ch!important;text-align:left!important}' +
            '.card__vote--top,.card__vote-line.card__vote--top,.card__vote-separate-wrap.card__vote--top{transform-origin:top right!important;transform:scale(var(--rating-scale,1))!important}' +
            '.card__vote--bottom,.card__vote-line.card__vote--bottom,.card__vote-separate-wrap.card__vote--bottom{transform-origin:bottom right!important;transform:scale(var(--rating-scale,1))!important}' +
            '.card__vote--top{top:0!important;right:0!important;bottom:auto!important;border-radius:0 0.75em!important}' +
            '.card__vote--bottom{top:auto!important;right:0!important;bottom:0!important;border-radius:0.75em 0!important}' +
            '.card__vote-separate-wrap.card__vote--bottom .card__vote{border-radius:0.75em 0 0 0.75em!important}' +
            '.card__vote-separate-wrap.card__vote--bottom .card__vote:last-child{border-radius:0.75em 0!important}' +
            '.card__vote-separate-wrap.card__vote--top .card__vote{border-radius:0.75em 0 0 0.75em!important}' +
            '.card__vote-separate-wrap.card__vote--top .card__vote:first-child{border-radius:0 0.75em!important}' +
            '.card__vote-line .card__rate-item{display:-webkit-box;display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;white-space:nowrap}' +
            '.card__vote-line .card__rate-item:last-child{margin-bottom:0}' +
            '.card__vote .source--name{font-size:0!important;display:block!important;color:transparent!important;width:12px!important;height:12px!important;overflow:hidden!important;background-repeat:no-repeat!important;background-position:center!important;background-size:contain!important;margin-left:auto!important;padding:0!important;border:none!important;flex-shrink:0!important}' +
            '@media (min-width:481px){.card__vote .source--name{width:18px!important;height:18px!important}}' +
            '@media (min-width:481px){.card__vote,.card__vote-line,.card__vote-separate-wrap,.card__vote-separate-wrap .card__vote{font-size:1.1em!important}}' +
            '.rate--kp .source--name{background-image:url("data:image/svg+xml,%3Csvg width=\'300\' height=\'300\' viewBox=\'0 0 300 300\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cmask id=\'mask0_1_69\' style=\'mask-type:alpha\' maskUnits=\'userSpaceOnUse\' x=\'0\' y=\'0\' width=\'300\' height=\'300\'%3E%3Ccircle cx=\'150\' cy=\'150\' r=\'150\' fill=\'white\'/%3E%3C/mask%3E%3Cg mask=\'url(%23mask0_1_69)\'%3E%3Ccircle cx=\'150\' cy=\'150\' r=\'150\' fill=\'black\'/%3E%3Cpath d=\'M300 45L145.26 127.827L225.9 45H181.2L126.3 121.203V45H89.9999V255H126.3V178.92L181.2 255H225.9L147.354 174.777L300 255V216L160.776 160.146L300 169.5V130.5L161.658 139.494L300 84V45Z\' fill=\'url(%23paint0_radial_1_69)\'/%3E%3C/g%3E%3Cdefs%3E%3CradialGradient id=\'paint0_radial_1_69\' cx=\'0\' cy=\'0\' r=\'1\' gradientUnits=\'userSpaceOnUse\' gradientTransform=\'translate(89.9999 45) rotate(45) scale(296.985)\'%3E%3Cstop offset=\'0.5\' stop-color=\'%23FF5500\'/%3E%3Cstop offset=\'1\' stop-color=\'%23BBFF00\'/%3E%3C/radialGradient%3E%3C/defs%3E%3C/svg%3E")}' +
            '.rate--tmdb .source--name{background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 300 300\' width=\'300\' height=\'300\'%3E%3Cdefs%3E%3ClinearGradient id=\'grad\' x1=\'0\' y1=\'0\' x2=\'1\' y2=\'0\'%3E%3Cstop offset=\'0%25\' stop-color=\'%2390cea1\'/%3E%3Cstop offset=\'56%25\' stop-color=\'%233cbec9\'/%3E%3Cstop offset=\'100%25\' stop-color=\'%2300b3e5\'/%3E%3C/linearGradient%3E%3Cstyle%3E.text-style%7Bfont-weight:bold;fill:url(%23grad);text-anchor:start;dominant-baseline:middle;textLength:300;lengthAdjust:spacingAndGlyphs;font-size:120px;%7D%3C/style%3E%3C/defs%3E%3Ctext class=\'text-style\' x=\'0\' y=\'150\' textLength=\'300\' lengthAdjust=\'spacingAndGlyphs\'%3ETMDB%3C/text%3E%3C/svg%3E")}' +
            '.rate--lampa .rate-icon-reaction{background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%23e040fb\'%3E%3Cpath d=\'M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm2 14h-4v-1h4v1zm0-2h-4v-1h4v1zM9 20h6v1c0 .55-.45 1-1 1h-4c-.55 0-1-.45-1-1v-1z\'/%3E%3C/svg%3E")}' +
            '.rate-icon-reaction{background-repeat:no-repeat;background-position:center;background-size:contain}' +
            '.rate--lampa .rate-icon{font-size:0!important}' +
            '.card__vote img[src*=".gif"]{object-fit:contain!important}' +
            '.card__vote.rate--lampa img{display:block!important;max-height:12px!important;max-width:12px!important;min-width:0!important;min-height:0!important;object-fit:contain!important;margin-left:auto!important;height:auto!important;width:auto!important;flex-shrink:0!important}' +
            '@media (min-width:481px){.card__vote.rate--lampa img{max-height:18px!important;max-width:18px!important}}' +
            '.rate--lampa.rate--lampa--animated .rate-icon img{max-height:12px;max-width:12px;object-fit:contain;display:block!important;margin-left:auto!important}' +
            '.rate--imdb .source--name{background-image:url("data:image/svg+xml,%3Csvg fill=\'%23ffcc00\' viewBox=\'0 0 32 32\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg id=\'SVGRepo_bgCarrier\' stroke-width=\'0\'%3E%3C/g%3E%3Cg id=\'SVGRepo_tracerCarrier\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3C/g%3E%3Cg id=\'SVGRepo_iconCarrier\'%3E%3Cpath d=\'M 0 7 L 0 25 L 32 25 L 32 7 Z M 2 9 L 30 9 L 30 23 L 2 23 Z M 5 11.6875 L 5 20.3125 L 7 20.3125 L 7 11.6875 Z M 8.09375 11.6875 L 8.09375 20.3125 L 10 20.3125 L 10 15.5 L 10.90625 20.3125 L 12.1875 20.3125 L 13 15.5 L 13 20.3125 L 14.8125 20.3125 L 14.8125 11.6875 L 12 11.6875 L 11.5 15.8125 L 10.8125 11.6875 Z M 15.90625 11.6875 L 15.90625 20.1875 L 18.3125 20.1875 C 19.613281 20.1875 20.101563 19.988281 20.5 19.6875 C 20.898438 19.488281 21.09375 19 21.09375 18.5 L 21.09375 13.3125 C 21.09375 12.710938 20.898438 12.199219 20.5 12 C 20 11.800781 19.8125 11.6875 18.3125 11.6875 Z M 22.09375 11.8125 L 22.09375 20.3125 L 23.90625 20.3125 C 23.90625 20.3125 23.992188 19.710938 24.09375 19.8125 C 24.292969 19.8125 25.101563 20.1875 25.5 20.1875 C 26 20.1875 26.199219 20.195313 26.5 20.09375 C 26.898438 19.894531 27 19.613281 27 19.3125 L 27 14.3125 C 27 13.613281 26.289063 13.09375 25.6875 13.09375 C 25.085938 13.09375 24.511719 13.488281 24.3125 13.6875 L 24.3125 11.8125 Z M 18 13 C 18.398438 13 18.8125 13.007813 18.8125 13.40625 L 18.8125 18.40625 C 18.8125 18.804688 18.300781 18.8125 18 18.8125 Z M 24.59375 14 C 24.695313 14 24.8125 14.105469 24.8125 14.40625 L 24.8125 18.6875 C 24.8125 18.886719 24.792969 19.09375 24.59375 19.09375 C 24.492188 19.09375 24.40625 18.988281 24.40625 18.6875 L 24.40625 14.40625 C 24.40625 14.207031 24.394531 14 24.59375 14 Z\'/%3E%3C/g%3E%3C/svg%3E")}' +
            '@media (max-width:480px) and (orientation:portrait){.full-start-new__rate.rate--lampa,.full-start__rate.rate--lampa{min-width:80px}}' +
            '.card__quality{position:absolute!important;left:0!important;bottom:0!important;padding:0.25em 0.45em!important;border-radius:0 0.75em!important;color:white!important;font-size:1.1em!important;line-height:1!important;z-index:10!important;white-space:nowrap!important}' +
            '.content-label{position:absolute!important;left:0!important;top:0!important;color:white!important;padding:0.25em 0.45em!important;border-radius:0.75em 0!important;font-size:1.1em!important;line-height:1!important;z-index:10!important;display:flex!important;align-items:center!important;justify-content:center!important}' +
            'body[data-movie-labels="on"] .card--tv .card__type{display:none!important}';
        document.head.appendChild(style);

        applyRatingScale();
        addSettings();
        setupCardListener();
        startRatingsObserver();
        startRatingsHeartbeat();
        scheduleVisibleRatingsUpdate(0);
        setTimeout(function () { scheduleVisibleRatingsUpdate(120); }, 120);
        setTimeout(function () { scheduleVisibleRatingsUpdate(350); }, 350);
        setTimeout(function () { scheduleVisibleRatingsUpdate(900); }, 900);
        window.addEventListener('scroll', function () { scheduleVisibleRatingsUpdate(0); }, { passive: true });
        window.addEventListener('keydown', function (e) {
            var code = e && (e.code || e.key);
            if (code === 'ArrowUp' || code === 'ArrowDown' || code === 'ArrowLeft' || code === 'ArrowRight' || code === 'PageUp' || code === 'PageDown') scheduleVisibleRatingsUpdate(0);
        }, { passive: true });
        window.addEventListener('resize', function () { scheduleVisibleRatingsUpdate(0); }, { passive: true });
        document.addEventListener('visibilitychange', function () { if (!document.hidden) scheduleVisibleRatingsUpdate(0); });

        Lampa.Listener.follow('card', function (event) {
            if (event.type === 'build' && event.object.card) {
                var data = event.object.card.card_data;
                if (data && data.id) {
                    updateCardRating({ card: event.object.card, data: data });
                    if (isQualityShowOn()) processQualityForCards([event.object.card]);
                    addTypeLabel(event.object.card);
                    scheduleVisibleRatingsUpdate(0);
                }
            }
        });

        Lampa.Listener.follow('full', function (event) {
            if (event.type === 'complite') {
                var render = event.object.activity.render();
                if (render && event.object.id) {
                    var kpBlock = $(render).find('.rate--kp');
                    var imdbBlock = $(render).find('.rate--imdb');
                    if (kpBlock.length || imdbBlock.length) {
                        var kpVal = parseFloat(kpBlock.find('div').first().text().trim()) || 0;
                        var imdbVal = parseFloat(imdbBlock.find('div').first().text().trim()) || 0;
                        if (kpVal > 0 || imdbVal > 0) {
                            var existing = ratingCache.get('kp_ratings', event.object.id) || {};
                            ratingCache.set('kp_rating', event.object.id, { kp: kpVal > 0 ? kpVal : (existing.kp || 0), imdb: imdbVal > 0 ? imdbVal : (existing.imdb || 0), timestamp: Date.now() });
                        }
                    }
                }
                if (render && insertLampaBlock(render)) {
                    if (event.object.method && event.object.id) {
                        var ratingKey = event.object.method + "_" + event.object.id;
                        var cached = ratingCache.get('lampa_rating', ratingKey);
                        if (cached && cached.rating > 0) {
                            $(render).find('.rate--lampa .rate-value').text(formatRating(cached.rating));
                            if (cached.medianReaction) {
                                $(render).find('.rate--lampa .rate-icon').html('<img style="width:1em;height:1em;margin:0 0.2em;" data-reaction-type="' + cached.medianReaction + '" src="' + getReactionImageSrc(cached.medianReaction) + '">');
                                if (isTriggerOn('animated_reactions', false)) $(render).find('.rate--lampa').addClass('rate--lampa--animated');
                            }
                            colorizeFullCardRatings(render);
                            scheduleVisibleRatingsUpdate(0);
                            return;
                        }
                        addToQueue(function () {
                            getLampaRating(ratingKey).then(function (result) {
                                if (result.rating !== null && result.rating > 0) {
                                    $(render).find('.rate--lampa .rate-value').text(formatRating(result.rating));
                                    if (result.medianReaction) {
                                        $(render).find('.rate--lampa .rate-icon').html('<img style="width:1em;height:1em;margin:0 0.2em;" data-reaction-type="' + result.medianReaction + '" src="' + getReactionImageSrc(result.medianReaction) + '">');
                                        if (isTriggerOn('animated_reactions', false)) $(render).find('.rate--lampa').addClass('rate--lampa--animated');
                                    }
                                } else { $(render).find('.rate--lampa').hide(); }
                                colorizeFullCardRatings(render);
                                scheduleVisibleRatingsUpdate(0);
                            });
                        });
                    }
                }
                if (render && event.data.movie) {
                    if (isQualityShowOn()) loadQualityForDetail(event.data.movie, render);
                    var poster = $(render).find('.full-start-new__poster');
                    if (poster.length) addTypeLabelToDetail(poster, event.data.movie);
                }
                scheduleVisibleRatingsUpdate(0);
                setTimeout(function () { colorizeFullCardRatings(render); }, 100);
            }
        });

        seasonInfoSettings.seasons_info_mode = Lampa.Storage.get('seasons_info_mode', 'none');
        seasonInfoSettings.label_position = Lampa.Storage.get('label_position', 'top-right');
        addSeasonInfo();

        var currentTheme = Lampa.Storage.get('theme_select', 'default');
        applyTheme(currentTheme);

        if (isColoredElementsOn()) { colorizeSeriesStatus(); colorizeAgeRating(); }

        setInterval(function () {
            if (!document.hidden && isTypeLabelsShowOn()) processAllTypeLabels();
        }, 2000);

        new MutationObserver(function (muts) {
            muts.forEach(function (m) {
                if (m.addedNodes) {
                    var cards = [];
                    $(m.addedNodes).find('.card').each(function () { cards.push(this); addTypeLabel(this); });
                    if (isQualityShowOn() && cards.length) processQualityForCards(cards);
                }
                if (m.type === 'attributes' && ['class', 'data-card', 'data-type'].indexOf(m.attributeName) !== -1 && $(m.target).hasClass('card')) addTypeLabel(m.target);
            });
        }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'data-card', 'data-type'] });

        processAllTypeLabels();
    }

    Lampa.Manifest.plugins = {
        name: 'Интерфейс',
        version: '1.0.0',
        description: 'Рейтинги, качество, лейблы типа на карточках + темы'
    };

    if (window.appready) { initPlugin(); }
    else { Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') initPlugin(); }); }
})();
