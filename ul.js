(function () {
    'use strict';

    if (window.lampac_plugin_ready) return;
    window.lampac_plugin_ready = true;

    // --- ПРОКСИ ДЛЯ ОБХОДА БЛОКИРОВОК ---
    var my_proxy = 'http://34.40.76.104:9118/proxy/';

    var connection_source = 'ab2024';

    var AB_TOKENS = ['мар.31', 'TotalᴬᵂUK0PRIMETEAM', 'сентябрь', 'июнь99'];
    var current_ab_token_index = 0;

    var MIRRORS_SHOWY = ['http://185.121.235.124:11176/', 'http://showypro.com/', 'http://smotretk.com/'];
    var current_showy_index = 0;

    var SKAZ_ACCOUNTS = [
        { email: 'naza---rov6@gmail.com', uid: 'rnemtvj3' },
        { email: 'centt04@gmail.com', uid: 'fxz' },
        { email: 'unionvoin@mail.ru', uid: 'freid5q' },
        { email: 'solnce--v--kepke@yandex.ru', uid: 'fort31hg' },
        { email: 'afenkinsergej@gmail.com', uid: '1102' },
        { email: 'corkinigor@gmail.com', uid: '1101' }
    ];
    var current_skaz_account_index = 0;

    var LAMPAUA_UIDS = ['guest'];
    var current_lampaua_index = 0;

    var BETA_UIDS = ['eis3ey9m', 'p8825724-9005-428a-9d86-a466c13ddff3', 'y9725724-9005-428a-9d86-a466c13ddcc4'];
    var current_beta_index = 0;

    var SOURCES_ORDER = ['ab2024', 'showy', 'skaz', 'okeantv', 'hdpoisk', 'lampaua', 'beta'];

    function safeStorageGet(key, def) {
        try { return Lampa.Storage.get(key, def); } catch (e) { return def; }
    }
    function safeStorageSet(key, val) {
        try { Lampa.Storage.set(key, val); } catch (e) {}
    }

    var cf = safeStorageGet('skazonline_servers', false);
    var dd = cf == true ? 'cf' : '';

    function getDefaultSkazUrl() {
        var list = cf == true
            ? ['http://onlinecf3.skaz.tv/', 'http://onlinecf4.skaz.tv/', 'http://onlinecf5.skaz.tv/']
            : ['http://online3.skaz.tv/', 'http://online4.skaz.tv/', 'http://online5.skaz.tv/'];
        return list[Math.floor(Math.random() * list.length)];
    }

    function getHost() {
        if (connection_source === 'ab2024') return my_proxy + 'https://ab2024.ru/';
        if (connection_source === 'showy') return my_proxy + MIRRORS_SHOWY[current_showy_index];
        if (connection_source === 'okeantv') return 'http://148.135.207.174:12359/';
        if (connection_source === 'hdpoisk') return my_proxy + 'https://hdpoisk.ru/';
        if (connection_source === 'lampaua') return my_proxy + 'http://lampaua.mooo.com/';
        if (connection_source === 'beta') return my_proxy + 'http://beta.l-vid.online:888/';
        return my_proxy + getDefaultSkazUrl();
    }

    var Defined = { api: 'lampac', localhost: getHost() };

    var hostkey = ('http://online' + dd + '3.skaz.tv').replace('http://', '').replace('https://', '');

    // ====== РОТАЦИЯ ДОСТУПОВ ======
    function resetCredentialIndexes() {
        current_ab_token_index = 0;
        current_skaz_account_index = 0;
        current_showy_index = 0;
        current_beta_index = 0;
        current_lampaua_index = 0;
    }

    // Есть ли ещё запасной доступ для текущего источника?
    function hasNextCredential() {
        if (connection_source === 'ab2024') return current_ab_token_index < AB_TOKENS.length - 1;
        if (connection_source === 'skaz') return current_skaz_account_index < SKAZ_ACCOUNTS.length - 1;
        if (connection_source === 'showy') return current_showy_index < MIRRORS_SHOWY.length - 1;
        if (connection_source === 'beta') return current_beta_index < BETA_UIDS.length - 1;
        if (connection_source === 'lampaua') return current_lampaua_index < LAMPAUA_UIDS.length - 1;
        return false;
    }

    // Переключиться на следующий доступ. Возвращает понятную подпись для уведомления.
    function nextCredential() {
        if (connection_source === 'ab2024') {
            current_ab_token_index++;
            return 'ab2024: токен ' + (current_ab_token_index + 1) + '/' + AB_TOKENS.length;
        }
        if (connection_source === 'skaz') {
            current_skaz_account_index++;
            return 'skaz: аккаунт ' + (current_skaz_account_index + 1) + '/' + SKAZ_ACCOUNTS.length;
        }
        if (connection_source === 'showy') {
            current_showy_index++;
            Defined.localhost = getHost(); // у showy меняется само зеркало (хост)
            return 'showy: зеркало ' + (current_showy_index + 1) + '/' + MIRRORS_SHOWY.length;
        }
        if (connection_source === 'beta') {
            current_beta_index++;
            return 'beta: uid ' + (current_beta_index + 1) + '/' + BETA_UIDS.length;
        }
        if (connection_source === 'lampaua') {
            current_lampaua_index++;
            return 'lampaua: uid ' + (current_lampaua_index + 1) + '/' + LAMPAUA_UIDS.length;
        }
        return '';
    }

    function account(url) {
        url = url + '';
        if (connection_source === 'ab2024') {
            if (url.indexOf('uid=') === -1) url = Lampa.Utils.addUrlComponent(url, 'uid=4ezu837o');
            url = Lampa.Utils.addUrlComponent(url, 'ab_token=' + encodeURIComponent(AB_TOKENS[current_ab_token_index]));
        } else if (connection_source === 'showy') {
            if (url.indexOf('uid=') === -1) url = Lampa.Utils.addUrlComponent(url, 'uid=i8nqb9vw');
            url = Lampa.Utils.addUrlComponent(url, 'showy_token=f8377057-90eb-4d76-93c9-7605952a096l');
        } else if (connection_source === 'okeantv') {
            if (url.indexOf('uid=') === -1) url = Lampa.Utils.addUrlComponent(url, 'uid=guest');
        } else if (connection_source === 'lampaua') {
            url = Lampa.Utils.addUrlComponent(url, 'uid=' + LAMPAUA_UIDS[current_lampaua_index]);
        } else if (connection_source === 'beta') {
            url = Lampa.Utils.addUrlComponent(url, 'uid=' + BETA_UIDS[current_beta_index]);
        } else if (connection_source === 'skaz') {
            var acc = SKAZ_ACCOUNTS[current_skaz_account_index];
            url = Lampa.Utils.addUrlComponent(url, 'account_email=' + acc.email);
            url = Lampa.Utils.addUrlComponent(url, 'uid=' + acc.uid);
        }
        return url;
    }

    // Признаки «битого»/заблокированного ответа, при которых стоит пробовать запасной доступ
    function looksBlocked(json) {
        if (!json) return true;
        if (json.error || json.blocked || json.accsdb || json.account_unavailable) return true;
        if (typeof json.msg === 'string' && /(забл|block|доступ|ключ|token|аккаунт|лимит)/i.test(json.msg)) return true;
        return false;
    }

    function component(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var files = new Lampa.Explorer(object);
        var filter = new Lampa.Filter(object);
        var sources = {};
        var balanser;
        var last;

        this.create = function () {
            var _this = this;
            Defined.localhost = getHost();

            filter.onSelect = function (type, a, b) {
                if (type == 'filter' && a.stype == 'connection') {
                    connection_source = SOURCES_ORDER[b.index] || 'skaz';
                    resetCredentialIndexes();           // <-- свежий источник начинаем с первого доступа
                    Defined.localhost = getHost();
                    setTimeout(Lampa.Select.close, 10);
                    _this.createSource().then(function () { _this.search(); }).catch(function () { _this.empty('Источник недоступен'); });
                } else if (type == 'sort') {
                    Lampa.Select.close();
                    _this.changeBalanser(a.source);
                }
            };

            filter.set('filter', [{
                title: 'Источник',
                stype: 'connection',
                subtitle: connection_source,
                items: SOURCES_ORDER.map(function (n, i) { return { title: n, index: i, stype: 'connection' }; })
            }]);
            filter.render().find('.filter--search').remove();

            scroll.body().addClass('torrent-list');
            files.appendHead(filter.render());
            files.appendFiles(scroll.render());

            this.activity.loader(true);

            this.externalids()
                .then(function () { return _this.createSource(); })
                .then(function () { _this.search(); })
                .catch(function (e) {
                    console.log('Lampac connect error', e);
                    _this.empty('Не удалось подключиться к источнику');
                });

            return this.render();
        };

        // === Универсальный запрос с авто-ротацией доступов ===
        // buildUrl(): возвращает URL БЕЗ account() (его навесим внутри, т.к. при ротации он меняется)
        // validate(json): true — ответ годный
        this.requestWithRotation = function (buildUrl, method, validate, onDone, onAllFailed) {
            function attempt() {
                var url = account(buildUrl());
                network[method](url, function (json) {
                    if (validate(json) && !looksBlocked(json)) onDone(json);
                    else failover();
                }, failover);
            }
            function failover() {
                if (hasNextCredential()) {
                    var label = nextCredential();
                    if (label) Lampa.Noty.show('Доступ не сработал, пробую ' + label);
                    attempt();
                } else {
                    onAllFailed();
                }
            }
            attempt();
        };

        this.externalids = function () {
            return new Promise(function (resolve) {
                if (!object.movie.imdb_id || !object.movie.kinopoisk_id) {
                    network.silent(account(Defined.localhost + 'externalids?id=' + object.movie.id), function (json) {
                        for (var name in json) object.movie[name] = json[name];
                        resolve();
                    }, resolve);
                } else resolve();
            });
        };

        this.requestParams = function (url) {
            if (connection_source === 'hdpoisk') return 'http://108.165.164.64:3000/api?kp=' + (object.movie.kinopoisk_id || object.movie.id);
            var query = 'id=' + object.movie.id +
                '&title=' + encodeURIComponent(object.movie.title || object.movie.name) +
                '&serial=' + (object.movie.name ? 1 : 0) +
                '&cub_id=' + Lampa.Utils.hash('aru@gmail.com');
            return url + (url.indexOf('?') >= 0 ? '&' : '?') + query;
        };

        this.createSource = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                _this.requestWithRotation(
                    function () { return _this.requestParams(Defined.localhost + 'lite/events'); },
                    'silent',
                    function (json) { return json && json.online && json.online.length; },
                    function (json) {
                        sources = {};
                        json.online.forEach(function (j) {
                            sources[(j.balanser || j.name).toLowerCase()] = { url: j.url, name: j.name };
                        });
                        var keys = Object.keys(sources);
                        if (!keys.length) return reject();
                        balanser = safeStorageGet('online_balanser', keys[0]);
                        if (!sources[balanser]) balanser = keys[0];
                        resolve();
                    },
                    reject
                );
            });
        };

        this.changeBalanser = function (source) {
            if (!sources[source]) return;
            balanser = source;
            safeStorageSet('online_balanser', source);
            this.search();
        };

        this.search = function () {
            var _this = this;
            this.activity.loader(true);
            if (!sources[balanser]) { this.empty('Нет доступных балансеров'); return; }
            this.requestWithRotation(
                function () { return _this.requestParams(sources[balanser].url); },
                'native',
                function (json) { return json && json.items && json.items.length; },
                function (json) { _this.draw(json.items); },
                function () { _this.empty('Не удалось получить список (все доступы исчерпаны)'); }
            );
        };

        this.draw = function (items) {
            var _this = this;
            scroll.clear();
            items.forEach(function (element) {
                var item = Lampa.Template.get('lampac_item', {
                    title: Lampa.Utils.shortText(element.title || element.name || 'Без названия', 120),
                    info: element.info || (sources[balanser] ? sources[balanser].name : '')
                });
                item.on('hover:enter', function () { _this.play(element); })
                    .on('hover:focus', function (e) { last = e.target; scroll.update($(e.target), true); });
                scroll.append(item);
            });
            this.activity.loader(false);
            this.start();
            scroll.update(scroll.render().find('.lampac-item').eq(0), true);
        };

        this.play = function (element) {
            if (!element.url) { Lampa.Noty.show('У элемента нет ссылки для воспроизведения'); return; }
            var data = { url: element.url, title: element.title || object.movie.title || object.movie.name, quality: element.quality || false };
            Lampa.Player.play(data);
            Lampa.Player.playlist([data]);
        };

        this.empty = function (msg) {
            var empty = new Lampa.Empty({ descr: msg || 'Пусто' });
            scroll.clear();
            scroll.append(empty.render());
            this.activity.loader(false);
            this.start();
        };

        this.start = function () {
            if (Lampa.Activity.active().activity !== this.activity) return;
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render(), files.render());
                    Lampa.Controller.collectionFocus(last || false, scroll.render());
                },
                up: function () { if (Navigator.canmove('up')) Navigator.move('up'); else Lampa.Controller.toggle('head'); },
                down: function () { Navigator.move('down'); },
                left: function () { Lampa.Controller.toggle('menu'); },
                right: function () { filter.show('Фильтр', 'filter'); },
                back: function () { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('content');
        };

        this.render = function () { return files.render(); };
        this.pause = function () {};
        this.stop = function () {};
        this.destroy = function () {
            network.clear();
            files.destroy();
            scroll.destroy();
            sources = {};
        };
    }

    function startPlugin() {
        Lampa.Template.add('lampac_item',
            '<div class="lampac-item selector">' +
                '<div class="lampac-item__title">{title}</div>' +
                '<div class="lampac-item__info">{info}</div>' +
            '</div>');

        Lampa.Template.add('lampac_css',
            '<style>' +
            '.lampac-item{padding:1em;margin:.3em 0;border-radius:.6em;background:rgba(255,255,255,.05);}' +
            '.lampac-item.focus{background:#fff;color:#000;}' +
            '.lampac-item__title{font-size:1.3em;}' +
            '.lampac-item__info{opacity:.6;margin-top:.3em;font-size:.9em;}' +
            '</style>');
        $('body').append(Lampa.Template.get('lampac_css', {}, true));

        Lampa.Component.add('lampac', component);

        function addButton(e) {
            if (e.type !== 'complite' || !e.object || !e.object.activity) return;
            var render = e.object.activity.render();
            if (render.find('.view--lampac').length) return;

            var btn = $(
                '<div class="full-start__button selector view--lampac">' +
                    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                        '<path d="M3 5.5C3 4.67 3.67 4 4.5 4h15c.83 0 1.5.67 1.5 1.5v10c0 .83-.67 1.5-1.5 1.5h-15A1.5 1.5 0 0 1 3 15.5v-10Z" stroke="currentColor" stroke-width="2"/>' +
                        '<path d="M10 9.5l4 2.5-4 2.5v-5Z" fill="currentColor"/>' +
                        '<path d="M8 20h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
                    '</svg>' +
                    '<span>Онлайн</span>' +
                '</div>'
            );

            btn.on('hover:enter', function () {
                Lampa.Activity.push({ url: '', title: 'Онлайн', component: 'lampac', movie: e.data.movie, page: 1 });
            });

            var torrent = render.find('.view--torrent');
            if (torrent.length) torrent.after(btn);
            else render.find('.full-start__buttons, .full-start-new__buttons').first().append(btn);
        }

        Lampa.Listener.follow('full', addButton);
    }

    if (window.appready) startPlugin();
    else {
        var fn = function (e) {
            if (e.type == 'ready') { Lampa.Listener.remove('app', fn); startPlugin(); }
        };
        Lampa.Listener.follow('app', fn);
    }
})();
