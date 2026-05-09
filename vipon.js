(function(){
    'use strict';

    // Prevent conflict if both lampac and alcopac on.js are loaded
    if (window.alcopac_onjs) return;
    window.alcopac_onjs = true;
    window.alcopac = true;

    // Disable LGBT content filter (Lampa beta feature)
    if (!window.lampa_settings) window.lampa_settings = {};
    if (!window.lampa_settings.disable_features) window.lampa_settings.disable_features = {};
    window.lampa_settings.disable_features.lgbt = true;

    // Force fixed UID for cross-device access
    try{localStorage.setItem('lampac_unic_id','zc56aeon');}catch(e){}

    var timer = setInterval(function(){
        if(typeof Lampa !== 'undefined'){
            clearInterval(timer);

            var unic_id = 'zc56aeon';
            Lampa.Storage.set('lampac_unic_id', unic_id);

            Lampa.Utils.putScriptAsync(["https://beta.l-vid.online/splash.js","https://beta.l-vid.online/online.js","https://beta.l-vid.online/catalog.js"], function() {});
        }
    },200);
})();
