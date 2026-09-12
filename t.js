(function () {
  'use strict';

  // Единый загрузчик Showy с резервными доменами.
  // Pro-доступ подтверждается официальным Showy online.js через Telegram/токен.
  // Обход оплаты, подмена токена и фиктивная активация намеренно не добавляются.
  var HOSTS = [
    'http://showy.online',
    'http://showwwy.com',
    'http://smotret24.ru',
    'http://smotret24.com'
  ];

  // Токен из ultra (2). Официальный Showy сам проверит его и срок доступа.
  var SHOWY_TOKEN = 'f8377057-90eb-4d76-93c9-7605952a096l';
  try { Lampa.Storage.set('showy_token', SHOWY_TOKEN); } catch (e) {}

  var KEY = 'showy_unified_pro_host';
  var saved = '';
  try { saved = Lampa.Storage.get(KEY, ''); } catch (e) {}

  var ordered = HOSTS.slice();
  if (HOSTS.indexOf(saved) >= 0) {
    ordered = [saved].concat(HOSTS.filter(function (h) { return h !== saved; }));
  }

  function load(index) {
    if (index >= ordered.length) {
      if (Lampa && Lampa.Noty) Lampa.Noty.show('Showy временно недоступен');
      return;
    }

    var host = ordered[index];
    var script = document.createElement('script');
    script.async = false;
    script.src = host + '/online.js?v=' + Date.now();
    script.onload = function () {
      try { Lampa.Storage.set(KEY, host); } catch (e) {}
      if (Lampa && Lampa.Noty) Lampa.Noty.show('Showy подключён: ' + host.replace(/^https?:\/\//, ''));
    };
    script.onerror = function () {
      if (script.parentNode) script.parentNode.removeChild(script);
      load(index + 1);
    };
    (document.head || document.documentElement).appendChild(script);
  }

  load(0);
})();
