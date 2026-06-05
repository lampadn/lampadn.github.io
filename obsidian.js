!(function () {
  "use strict";

  var PLUGIN_FLAG = "obsidian_plugin";

  var STORAGE_KEYS = {
    qualityMode: "obsidian_quality",
    ratingsMode: "obsidian_ratings",
    showReleaseYear: "obsidian_show_release_year",
    showEpisodeNumber: "obsidian_show_episode_number",
    showGenres: "obsidian_show_genres",
    replacePoster: "obsidian_replace_poster",
    qualityCache: "obsidian_quality_cache",
    posterCache: "obsidian_poster_cache",
  };

  var LANG_KEYS = {
    quality: "obsidian_quality",
    qualityModeOff: "obsidian_quality_mode_off",
    qualityModeShow: "obsidian_quality_mode_show",
    qualityModeColor: "obsidian_quality_mode_color",
    ratings: "obsidian_ratings",
    showReleaseYear: "obsidian_show_release_year",
    showEpisodeNumber: "obsidian_show_episode_number",
    showGenres: "obsidian_show_genres",
    replacePoster: "obsidian_replace_poster",
    memory: "obsidian_settings_memory",
    resetSettings: "obsidian_reset_settings",
    clearCache: "obsidian_clear_cache",
    settingsReset: "obsidian_settings_reset",
    cacheCleared: "obsidian_cache_cleared",
  };

  var DEFAULT_CONFIG = {
    apiPrefixes: [""],
    qualityApi: [
      {
        url: "https://api.apbugall.org",
        token: "8da1c9beda9545174264dc9f63a77d",
      },
      {
        url: "https://upn.stull.xyz",
        token: "d317441359e505c343c2063edc97e7",
      },
    ],
    cache: {
      quality: { key: STORAGE_KEYS.qualityCache, size: 1000, ttl: 8640000 },
      poster: { key: STORAGE_KEYS.posterCache, size: 2000, ttl: 604800000 },
    },
    queue: { maxParallel: 12, maxSize: 100 },
    ui: {
      qualityMode: "color",
      ratingsMode: "show",
      showReleaseYear: true,
      showEpisodeNumber: true,
      showGenres: true,
      replacePoster: true,
    },
  };

  var TRANSLATIONS = {};
  TRANSLATIONS[LANG_KEYS.quality] = {
    uk: "Якість",
    ru: "Качество",
    en: "Quality",
  };
  TRANSLATIONS[LANG_KEYS.qualityModeOff] = {
    uk: "Вимкнено",
    ru: "Отключено",
    en: "Disabled",
  };
  TRANSLATIONS[LANG_KEYS.qualityModeShow] = {
    uk: "Увімкнено",
    ru: "Включено",
    en: "Enabled",
  };
  TRANSLATIONS[LANG_KEYS.qualityModeColor] = {
    uk: "З кольорами",
    ru: "С цветами",
    en: "Colored",
  };
  TRANSLATIONS[LANG_KEYS.ratings] = {
    uk: "Рейтинг",
    ru: "Рейтинг",
    en: "Ratings",
  };
  TRANSLATIONS[LANG_KEYS.showReleaseYear] = {
    uk: "Відображати рік випуску",
    ru: "Показывать год выпуска",
    en: "Show release year",
  };
  TRANSLATIONS[LANG_KEYS.showEpisodeNumber] = {
    uk: "Відображати номер серії",
    ru: "Показывать номер серии",
    en: "Show episode number",
  };
  TRANSLATIONS[LANG_KEYS.showGenres] = {
    uk: "Відображати жанри",
    ru: "Показывать жанры",
    en: "Show genres",
  };
  TRANSLATIONS[LANG_KEYS.replacePoster] = {
    uk: "Мінімалістичний постер",
    ru: "Минималистичный постер",
    en: "Minimal poster",
  };
  TRANSLATIONS[LANG_KEYS.memory] = {
    uk: "Пам'ять",
    ru: "Память",
    en: "Memory",
  };
  TRANSLATIONS[LANG_KEYS.resetSettings] = {
    uk: "Скинути налаштування",
    ru: "Сбросить настройки",
    en: "Reset settings",
  };
  TRANSLATIONS[LANG_KEYS.clearCache] = {
    uk: "Очистити кеш",
    ru: "Очистить кэш",
    en: "Clear cache",
  };
  TRANSLATIONS[LANG_KEYS.settingsReset] = {
    uk: "Налаштування скинуто",
    ru: "Настройки сброшены",
    en: "Settings reset",
  };
  TRANSLATIONS[LANG_KEYS.cacheCleared] = {
    uk: "Кеш очищено",
    ru: "Кэш очищен",
    en: "Cache cleared",
  };

  var GENRES = {
    movie: [
      { id: 28, title: "#{filter_genre_ac}" },
      { id: 12, title: "#{filter_genre_ad}" },
      { id: 16, title: "#{filter_genre_mv}" },
      { id: 35, title: "#{filter_genre_cm}" },
      { id: 80, title: "#{filter_genre_cr}" },
      { id: 99, title: "#{filter_genre_dc}" },
      { id: 18, title: "#{filter_genre_dr}" },
      { id: 10751, title: "#{filter_genre_fm}" },
      { id: 14, title: "#{filter_genre_fe}" },
      { id: 36, title: "#{filter_genre_hi}" },
      { id: 27, title: "#{filter_genre_ho}" },
      { id: 10402, title: "#{filter_genre_mu}" },
      { id: 9648, title: "#{filter_genre_de}" },
      { id: 10749, title: "#{filter_genre_md}" },
      { id: 878, title: "#{filter_genre_fa}" },
      { id: 10770, title: "#{filter_genre_tv}" },
      { id: 53, title: "#{filter_genre_tr}" },
      { id: 10752, title: "#{filter_genre_mi}" },
      { id: 37, title: "#{filter_genre_ve}" },
    ],
    tv: [
      { id: 10759, title: "#{filter_genre_aa}" },
      { id: 16, title: "#{filter_genre_mv}" },
      { id: 35, title: "#{filter_genre_cm}" },
      { id: 80, title: "#{filter_genre_cr}" },
      { id: 99, title: "#{filter_genre_dc}" },
      { id: 18, title: "#{filter_genre_dr}" },
      { id: 10751, title: "#{filter_genre_fm}" },
      { id: 10762, title: "#{filter_genre_ch}" },
      { id: 9648, title: "#{filter_genre_de}" },
      { id: 10763, title: "#{filter_genre_nw}" },
      { id: 10764, title: "#{filter_genre_rs}" },
      { id: 10765, title: "#{filter_genre_hf}" },
      { id: 10766, title: "#{filter_genre_op}" },
      { id: 10767, title: "#{filter_genre_tc}" },
      { id: 10768, title: "#{filter_genre_mp}" },
      { id: 37, title: "#{filter_genre_ve}" },
    ],
  };

  var PLUGIN_CSS = `
    .card--tv .card__type {
        left: 0;
        top: 0;
        padding: 0.6em 1.2em;
        border-radius: 1.2em 0 0.4em 0;
        overflow: hidden;
        text-indent: -9999px;
        white-space: nowrap;
        background:
            rgba(0, 0, 0, 0.82)
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1.7em' height='1.7em' viewBox='0 0 51.802 51.801'%3E%3Cpath d='M47.947 4.43H12.495A3.86 3.86 0 0 0 8.64 8.284v2.641h-.466a3.86 3.86 0 0 0-3.855 3.854v2.642h-.465A3.86 3.86 0 0 0 0 21.275v22.242a3.86 3.86 0 0 0 3.854 3.854h35.453a3.86 3.86 0 0 0 3.855-3.854v-2.644h.465a3.86 3.86 0 0 0 3.854-3.854v-2.641h.467a3.86 3.86 0 0 0 3.854-3.854V8.284a3.857 3.857 0 0 0-3.855-3.854m-8.75 25.987v12.99H3.963V21.385h35.234zm4.321 6.494h-.355V21.275a3.86 3.86 0 0 0-3.855-3.854H12.604v-.001H8.641v-1.266h-.357v-1.266h35.235V36.91zm4.321-6.494h-.356V14.78a3.86 3.86 0 0 0-3.854-3.854H12.604V8.394H47.84z' fill='white'/%3E%3Cpath d='m26.401 30.446-5.788-4.215a1.916 1.916 0 0 0-3.044 1.549v8.43a1.914 1.914 0 0 0 1.916 1.916c.398 0 .794-.125 1.128-.367l5.788-4.215a1.92 1.92 0 0 0 0-3.098' fill='white'/%3E%3C/svg%3E")
            center / 1.2em no-repeat;
    }

    .card--tv .card__type.episode_metadata {
        text-indent: unset;
        padding-left: 3em;

        background:
            rgba(0, 0, 0, 0.82)
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1.7em' height='1.7em' viewBox='0 0 51.802 51.801'%3E%3Cpath d='M47.947 4.43H12.495A3.86 3.86 0 0 0 8.64 8.284v2.641h-.466a3.86 3.86 0 0 0-3.855 3.854v2.642h-.465A3.86 3.86 0 0 0 0 21.275v22.242a3.86 3.86 0 0 0 3.854 3.854h35.453a3.86 3.86 0 0 0 3.855-3.854v-2.644h.465a3.86 3.86 0 0 0 3.854-3.854v-2.641h.467a3.86 3.86 0 0 0 3.854-3.854V8.284a3.857 3.857 0 0 0-3.855-3.854m-8.75 25.987v12.99H3.963V21.385h35.234zm4.321 6.494h-.355V21.275a3.86 3.86 0 0 0-3.855-3.854H12.604v-.001H8.641v-1.266h-.357v-1.266h35.235V36.91zm4.321-6.494h-.356V14.78a3.86 3.86 0 0 0-3.854-3.854H12.604V8.394H47.84z' fill='white'/%3E%3Cpath d='m26.401 30.446-5.788-4.215a1.916 1.916 0 0 0-3.044 1.549v8.43a1.914 1.914 0 0 0 1.916 1.916c.398 0 .794-.125 1.128-.367l5.788-4.215a1.92 1.92 0 0 0 0-3.098' fill='white'/%3E%3C/svg%3E")
            1em center / 1.2em no-repeat;
    }

    .card__metadata {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;

        padding: 3.5em 0.75em 0.5em;

        color: #fff;
        display: block;

        border-radius: 0 0 1em 1em;

        background: linear-gradient(
            to top,
            rgba(0,0,0,0.95) 0%,
            rgba(0,0,0,0.90) 25%,
            rgba(0,0,0,0.80) 45%,
            rgba(0,0,0,0.65) 65%,
            rgba(0,0,0,0.40) 80%,
            rgba(0,0,0,0) 100%
        );
    }

    .card--wide .card__metadata {
        background: none;
        z-index: 1;
    }

    .metadata__genres {
        font-size: 0.75em;
        opacity: 0.95;
        margin-bottom: 0.35em;

        display: flex;
        align-items: center;
        gap: 0.5em;

        text-shadow: 0 0.0625em 0.1875em rgba(0,0,0,0.8);
    }

    .metadata__title {
        font-size: 1.15em;
        line-height: 1.2;
        max-height: 3.6em;
        overflow: hidden;
        text-overflow: ellipsis;
        text-shadow: 0 0.0625em 0.1875em rgba(0, 0, 0, 0.9);

        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
    }

    .metadata__bottom {
        margin-top: 0.45em;
        min-height: 1em;

        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .metadata__bottom > div {
        display: flex;
        align-items: center;
    }

    .metadata__rating {
        font-size: 0.8em;
        opacity: 0.95;
        color: #ffd54a;
        margin-right: 0.5em;

        text-shadow: 0 0.0625em 0.1875em rgba(0,0,0,0.9);
    }

    .metadata__rating.rating-excellent {
        color: #81c784;
    }

    .metadata__rating.rating-good {
        color: #64b5f6;
    }

    .metadata__rating.rating-average {
        color: #ff9800;
    }

    .metadata__rating.rating-poor {
        color: #ff7043;
    }

    .metadata__rating.rating-terrible {
        color: #e53935;
    }

    .metadata__year {
        font-size: 0.75em;
        opacity: 0.9;

        text-shadow: 0 0.0625em 0.1875em rgba(0,0,0,0.9);
    }

    .metadata__badge {
        display: inline-block;
        padding: 0.1em 0.35em;
        font-size: 0.75em;
        font-weight: 700;
        letter-spacing: 0.05em;
        line-height: 1.3;
        border-radius: 0.25em;
        text-shadow: none;
        text-transform: uppercase;
    }

    .metadata__quality--placeholder {
        color: rgba(255, 255, 255, 0.01);
        border: 0.1em solid rgba(255, 255, 255, 0.01);
    }

    .metadata__quality--4k {
        color: #81c784;
        border: 0.1em solid rgba(76,175,80,0.4);
    }

    .metadata__quality--hd {
        color: #64b5f6;
        border: 0.1em solid rgba(33,150,243,0.4);
    }

    .metadata__quality--ts {
        color: #e57373;
        border: 0.1em solid rgba(244,67,54,0.4);
    }

    .metadata__quality--no-color {
        color: #ffffff !important;
        border-color: rgba(255, 255, 255, 0.3) !important;
    }

    .metadata__episode {
        color: #BCAAA4;
        border: 0.1em solid rgba(151,101,87,0.4);
        font-weight: 600;
    }

    .card__marker {
        right: 0.4em;
        top: 0.4em;
        left: auto;
        bottom: auto;
    }

    .card__icons {
        top: 2em;
    }

    .card__title,
    .card__age,
    .card__vote,
    .card__quality {
        display: none;
    }
`;

  var qualityCache = null;
  var posterCache = null;
  var lampaRequest = null;

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  function getObjectKeys(object) {
    var keys = [];
    for (var key in object) if (hasOwn(object, key)) keys.push(key);
    return keys;
  }

  function getRandomItem(items) {
    return items && items.length
      ? items[Math.floor(Math.random() * items.length)]
      : null;
  }

  function getSetting(key, defaultValue) {
    return Lampa.Storage.get(key, defaultValue);
  }

  function getMediaType(cardData) {
    if (cardData.media_type) return cardData.media_type;
    return cardData.original_name || cardData.name || cardData.first_air_date
      ? "tv"
      : "movie";
  }

  function StorageCache(storageKey, maxSize, ttlMs) {
    var saveTimer = null;
    var entries = {};
    var usageOrder = [];
    var self = this;

    function saveNow() {
      try {
        Lampa.Storage.set(storageKey, entries);
      } catch (error) {
        console.warn("Cache save error:", error);
      }
    }

    function markAsRecentlyUsed(key) {
      var index = usageOrder.indexOf(key);
      if (index > -1) usageOrder.splice(index, 1);
      usageOrder.push(key);
    }

    function removeExpiredEntries() {
      var expiredKeys = [];
      var expiresBefore = Date.now() - ttlMs;

      for (var key in entries) {
        if (!hasOwn(entries, key)) continue;
        if (!entries[key] || entries[key].timestamp <= expiresBefore) {
          expiredKeys.push(key);
        }
      }

      for (var index = 0; index < expiredKeys.length; index++) {
        var expiredKey = expiredKeys[index];
        delete entries[expiredKey];

        var usageIndex = usageOrder.indexOf(expiredKey);
        if (usageIndex > -1) usageOrder.splice(usageIndex, 1);
      }

      if (expiredKeys.length) self.save();
    }

    function trimCacheIfNeeded() {
      var cacheSize = getObjectKeys(entries).length;
      if (cacheSize < maxSize) return;

      var removeCount = Math.floor(cacheSize / 2);
      var keysToRemove = usageOrder.slice(0, removeCount);

      for (var index = 0; index < keysToRemove.length; index++) {
        delete entries[keysToRemove[index]];
      }

      usageOrder = usageOrder.slice(removeCount);
      self.save();
    }

    this.init = function () {
      try {
        entries = Lampa.Storage.get(storageKey, {}) || {};
        usageOrder = getObjectKeys(entries);
      } catch (error) {
        console.warn("Cache init error:", error);
        entries = {};
        usageOrder = [];
      }

      self.init = function () {};
    };

    this.save = function () {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(saveNow, 500);
    };

    this.get = function (key) {
      var entry = entries[key];
      var expiresBefore = Date.now() - ttlMs;

      if (entry && entry.timestamp > expiresBefore) {
        markAsRecentlyUsed(key);
        return entry.value;
      }

      removeExpiredEntries();
      return null;
    };

    this.set = function (key, value) {
      removeExpiredEntries();
      trimCacheIfNeeded();

      entries[key] = { timestamp: Date.now(), value: value };
      markAsRecentlyUsed(key);
      self.save();
    };
  }

  var requestQueue = {
    tasks: [],
    activeCount: 0,
    maxParallel: DEFAULT_CONFIG.queue.maxParallel,
    maxSize: null,

    add: function (task) {
      if (
        typeof this.maxSize === "number" &&
        this.tasks.length >= this.maxSize
      ) {
        console.warn("Request queue is full, dropping task");
        return;
      }

      this.tasks.push(task);
      this.process();
    },

    process: function () {
      if (this.activeCount >= this.maxParallel || !this.tasks.length) return;

      var task = this.tasks.shift();
      this.activeCount++;

      task(function () {
        requestQueue.activeCount--;
        requestQueue.process();
      });
    },

    clear: function () {
      this.tasks = [];
      this.activeCount = 0;
    },
  };

  var settings = {
    qualityMode: function () {
      return getSetting(
        STORAGE_KEYS.qualityMode,
        DEFAULT_CONFIG.ui.qualityMode,
      );
    },
    showRatings: function () {
      return (
        getSetting(STORAGE_KEYS.ratingsMode, DEFAULT_CONFIG.ui.ratingsMode) !==
        "off"
      );
    },
    ratingsMode: function () {
      return getSetting(
        STORAGE_KEYS.ratingsMode,
        DEFAULT_CONFIG.ui.ratingsMode,
      );
    },
    showReleaseYear: function () {
      return getSetting(
        STORAGE_KEYS.showReleaseYear,
        DEFAULT_CONFIG.ui.showReleaseYear,
      );
    },
    showEpisodeNumber: function () {
      return getSetting(
        STORAGE_KEYS.showEpisodeNumber,
        DEFAULT_CONFIG.ui.showEpisodeNumber,
      );
    },
    showGenres: function () {
      return getSetting(STORAGE_KEYS.showGenres, DEFAULT_CONFIG.ui.showGenres);
    },
    replacePoster: function () {
      return getSetting(
        STORAGE_KEYS.replacePoster,
        DEFAULT_CONFIG.ui.replacePoster,
      );
    },
  };

  function getQualityCacheKey(cardData) {
    return cardData && cardData.id
      ? (cardData.original_name ? "tv" : "movie") + "_" + cardData.id
      : null;
  }

  function buildQualityApiUrl(cardData) {
    var apiPrefix = getRandomItem(DEFAULT_CONFIG.apiPrefixes) || "";
    var apiEndpoint = getRandomItem(DEFAULT_CONFIG.qualityApi);
    var url = (apiPrefix + apiEndpoint.url).replace(/\s+/g, "");

    url += "?token=" + apiEndpoint.token;

    if (cardData.kinopoisk_id) {
      url += "&kp=" + encodeURIComponent(cardData.kinopoisk_id);
    } else if (cardData.imdb_id) {
      url += "&imdb=" + encodeURIComponent(cardData.imdb_id);
    } else if (cardData.id) {
      url += "&tmdb=" + encodeURIComponent(cardData.id);
    }

    return url;
  }

  function normalizeQuality(apiData) {
    if (!apiData || !apiData.quality) return null;

    var quality = "HD";
    if (apiData.uhd) quality = "4K";
    if (/(^|,\s*)ts(\s*,|$)/i.test(apiData.quality)) quality = "TS";

    return quality.toLowerCase();
  }

  function fetchQuality(cardData, callback) {
    var cacheKey = getQualityCacheKey(cardData);
    if (!cacheKey) return;

    var cached = qualityCache.get(cacheKey);
    if (cached && cached.quality) {
      callback(cached.quality);
      return;
    }

    var apiUrl = buildQualityApiUrl(cardData);

    requestQueue.add(function (done) {
      Lampa.Network.silent(apiUrl, function (response) {
        if (response && response.status === "success" && response.data) {
          var quality = normalizeQuality(response.data);
          if (quality) {
            qualityCache.set(cacheKey, { quality: quality });
            callback(quality);
          }
        }

        done();
      });
    });
  }

  function getTranslatedGenres(cardData) {
    var mediaType = cardData.name || cardData.first_air_date ? "tv" : "movie";
    var genreIds = cardData.genre_ids || [];
    var genres = GENRES[mediaType] || [];
    var titles = [];

    for (var index = 0; index < genreIds.length; index++) {
      for (var genreIndex = 0; genreIndex < genres.length; genreIndex++) {
        if (genres[genreIndex].id == genreIds[index]) {
          titles.push(
            Lampa.Utils.capitalizeFirstLetter(
              Lampa.Lang.translate(genres[genreIndex].title),
            ),
          );
          break;
        }
      }
    }

    return titles.slice(0, 2);
  }

  function appendGenres(metadata, cardData) {
    if (!settings.showGenres()) return;

    var genres = getTranslatedGenres(cardData);
    if (!genres.length) return;

    var element = document.createElement("div");
    element.className = "metadata__genres";
    element.textContent = genres.join(", ");
    metadata.appendChild(element);
  }

  function appendTitle(metadata, cardData) {
    var title =
      cardData.title ||
      cardData.name ||
      cardData.original_title ||
      cardData.original_name ||
      "";

    if (!title) return;

    var element = document.createElement("div");
    element.className = "metadata__title";
    element.textContent = title;
    metadata.appendChild(element);
  }

  function getRatingClass(rating) {
    var value = parseFloat(rating);
    if (isNaN(value)) return "";
    if (value >= 8 && value <= 10) return "rating-excellent";
    if (value >= 6.5 && value < 8) return "rating-good";
    if (value >= 5 && value < 6.5) return "rating-average";
    if (value >= 3 && value < 5) return "rating-poor";
    if (value >= 0 && value < 3) return "rating-terrible";
    return "";
  }

  function appendRating(container, cardData) {
    if (!settings.showRatings()) return;

    var rating =
      cardData.imdb_rating || cardData.kp_rating || cardData.vote_average || 0;
    rating = parseFloat(rating || 0).toFixed(1);

    if (rating == 0) return;

    var element = document.createElement("span");
    element.className = "metadata__rating";
    element.innerHTML = "★ " + rating;

    if (settings.ratingsMode() === "color") {
      var className = getRatingClass(rating);
      if (className) element.classList.add(className);
    }

    container.appendChild(element);
  }

  function appendQualityBadge(container, cardData) {
    var qualityMode = settings.qualityMode();
    if (qualityMode === "off") return;

    var element = document.createElement("span");
    element.className = "metadata__badge metadata__quality--placeholder";
    element.textContent = "TS";
    container.appendChild(element);

    fetchQuality(cardData, function (quality) {
      if (!quality) {
        element.style.display = "none";
        return;
      }

      cardData.release_quality = quality;
      element.className = "metadata__badge metadata__quality--" + quality;
      element.textContent = quality;

      if (qualityMode !== "color") {
        element.classList.add("metadata__quality--no-color");
      }
    });
  }

  function appendReleaseYear(container, cardData) {
    if (!settings.showReleaseYear()) return;

    var year = (cardData.release_date || cardData.first_air_date || "").slice(
      0,
      4,
    );
    if (!year || year === "0000") return;

    var element = document.createElement("span");
    element.className = "metadata__year";
    element.textContent = year;
    container.appendChild(element);
  }

  function renderCardMetadata(card, isWideCard) {
    var cardView = card.html.querySelector(".card__view");
    if (!cardView) return;

    var metadata = document.createElement("div");
    var bottomRow = document.createElement("div");
    var leftColumn = document.createElement("div");
    var rightColumn = document.createElement("div");

    metadata.className = "card__metadata";
    bottomRow.className = "metadata__bottom";

    if (!isWideCard) {
      appendGenres(metadata, card.data);
      appendTitle(metadata, card.data);
      appendRating(leftColumn, card.data);
      appendQualityBadge(leftColumn, card.data);
      appendReleaseYear(rightColumn, card.data);
    } else {
      appendRating(rightColumn, card.data);
      appendQualityBadge(rightColumn, card.data);
      appendReleaseYear(rightColumn, card.data);
    }

    bottomRow.appendChild(leftColumn);
    bottomRow.appendChild(rightColumn);
    metadata.appendChild(bottomRow);
    cardView.appendChild(metadata);
  }

  function updateEpisodeBadge(cardHtml, cardData) {
    if (cardData.media_type !== "tv") return;

    var typeElement = cardHtml.querySelector(".card__type");
    if (!typeElement) return;

    Lampa.Network.silent(
      Lampa.TMDB.api("tv/" + cardData.id + "?api_key=" + Lampa.TMDB.key()),
      function (tvInfo) {
        if (!tvInfo || !tvInfo.last_episode_to_air) return;

        var episode = tvInfo.last_episode_to_air;
        typeElement.className += " episode_metadata";
        typeElement.textContent =
          "S" + episode.season_number + ":E" + episode.episode_number;
      },
    );
  }

  function getPosterCacheKey(cardData) {
    return cardData && cardData.id && cardData.media_type
      ? cardData.media_type + "_" + cardData.id
      : null;
  }

  function fetchPosterPath(cardData, callback) {
    var cacheKey = getPosterCacheKey(cardData);
    if (!cacheKey) {
      callback("./img/img_broken.svg", false);
      return;
    }

    var cachedPoster = posterCache.get(cacheKey);
    if (cachedPoster) {
      callback(cachedPoster, true);
      return;
    }

    var completed = false;
    var timeout = setTimeout(function () {
      finish(null, false);
    }, 2000);

    var imagesUrl = Lampa.TMDB.api(
      cardData.media_type +
        "/" +
        cardData.id +
        "/images?include_image_language=null&api_key=" +
        Lampa.TMDB.key(),
    );

    lampaRequest.native(
      imagesUrl,
      function (response) {
        var posterPath =
          response && response.posters && response.posters[0]
            ? response.posters[0].file_path
            : cardData.poster_path ||
              cardData.backdrop_path ||
              "./img/img_broken.svg";

        finish(posterPath, true);
      },
      function () {
        finish("./img/img_broken.svg", false);
      },
    );

    function finish(posterPath, isTmdbPath) {
      if (completed) return;
      completed = true;
      clearTimeout(timeout);

      if (isTmdbPath && posterPath !== "./img/img_broken.svg") {
        posterCache.set(cacheKey, posterPath);
      }

      callback(posterPath, isTmdbPath);
    }
  }

  function setPosterWithPreload(card, posterPath, fallbackPosterPath) {
    var posterUrl = Lampa.TMDB.image("t/p/w780/" + posterPath);
    if ((card.img.src || "").indexOf(posterUrl) > -1) return;

    var currentImage = card.img;
    var imageContainer = currentImage.parentNode;

    if (!imageContainer) {
      currentImage.src = posterUrl;
      return;
    }

    var preloadedImage = new Image();
    preloadedImage.src = posterUrl;

    preloadedImage.onload = function () {
      if (!imageContainer.parentNode) return;

      try {
        currentImage.onload = null;
      } catch (error) {}

      currentImage.onerror = function () {};
      currentImage.src = posterUrl;
    };

    preloadedImage.onerror = function () {
      if (!imageContainer.parentNode) return;

      try {
        currentImage.onload = null;
      } catch (error) {}

      currentImage.onerror = function () {};
      currentImage.src = Lampa.TMDB.image("t/p/w780/" + fallbackPosterPath);
    };

    if (preloadedImage.complete && preloadedImage.naturalWidth > 0) {
      currentImage.src = posterUrl;
    }
  }

  function refreshPoster(card) {
    var isResolved = false;
    var fallbackPosterPath = card.data.poster_path || card.data.backdrop_path;

    var fallbackTimer = setTimeout(function () {
      isResolved = true;
      if (card.img && card.img.parentNode) {
        card.img.src = Lampa.TMDB.image("t/p/w780/" + fallbackPosterPath);
      }
    }, 2000);

    fetchPosterPath(card.data, function (posterPath, isTmdbPath) {
      if (isResolved) return;

      isResolved = true;
      clearTimeout(fallbackTimer);

      if (isTmdbPath) {
        setPosterWithPreload(card, posterPath, fallbackPosterPath);
      } else if (card.img && card.img.parentNode) {
        card.img.src = Lampa.TMDB.image("t/p/w780/" + fallbackPosterPath);
      }
    });
  }

  function shouldReplacePoster(card, isWideCard) {
    return (
      settings.replacePoster() &&
      !isWideCard &&
      card.data &&
      card.data.source &&
      (card.data.source === "tmdb" || card.data.source === "cub")
    );
  }

  function patchCardRenderer() {
    var cardMaker = Lampa.Maker.map("Card");
    var originalOnCreate = cardMaker.Card.onCreate;
    var originalOnVisible = cardMaker.Card.onVisible;

    cardMaker.Card.onCreate = function () {
      var card = this;
      var isWideCard =
        card.params && card.params.style && card.params.style.name === "wide";

      card.refreshPoster = shouldReplacePoster(card, isWideCard);
      if (card.refreshPoster) {
        card.getPosterPath = function () {
          return "./img/img_load.svg";
        };
      }

      originalOnCreate.apply(card, arguments);

      if (card.data && (card.data.original_name || card.data.title)) {
        card.data.media_type =
          card.data.media_type || (card.data.first_air_date ? "tv" : "movie");
        renderCardMetadata(card, isWideCard);
      }
    };

    cardMaker.Card.onVisible = function () {
      var card = this;

      if (settings.showEpisodeNumber() && card.html && card.data) {
        updateEpisodeBadge(card.html, card.data);
      }

      if (card.refreshPoster && card.img) {
        refreshPoster(card);
      }

      originalOnVisible.apply(card, arguments);
    };
  }

  function patchCardTemplate() {
    var cardMaker = Lampa.Maker.map("Card");
    cardMaker.Ratting.onCreate = function () {};
    cardMaker.Release.onCreate = function () {};

    var templateWrapper = document.createElement("div");
    templateWrapper.innerHTML = Lampa.Template.string("card");

    removeTemplateElement(templateWrapper, ".card__title");
    removeTemplateElement(templateWrapper, ".card__age");
    removeTemplateElement(templateWrapper, ".card__vote");

    Lampa.Template.add("card", templateWrapper.innerHTML);
  }

  function removeTemplateElement(root, selector) {
    var element = root.querySelector(selector);
    if (element && element.parentNode) element.parentNode.removeChild(element);
  }

  function addPluginStyles() {
    var styleElement = document.createElement("style");
    styleElement.innerHTML = PLUGIN_CSS;
    document.head.appendChild(styleElement);
  }

  function registerSettings() {
    if (Lampa.Lang && Lampa.Lang.add) Lampa.Lang.add(TRANSLATIONS);

    var component = "obsidian_settings";

    Lampa.SettingsApi.addComponent({
      component: component,
      name: "Obsidian",
      icon: '<svg fill="currentColor" width="800px" height="800px" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M30.531 15.47l-14.001-14c-0.136-0.136-0.323-0.22-0.53-0.22s-0.395 0.084-0.53 0.22l-14 14c-0.136 0.136-0.22 0.323-0.22 0.53s0.084 0.395 0.22 0.53l14 14.001c0.136 0.135 0.323 0.219 0.53 0.219s0.394-0.084 0.53-0.219l14.001-14.001c0.135-0.136 0.218-0.323 0.218-0.53s-0.083-0.394-0.218-0.53l0 0zM16 28.939l-12.939-12.939 12.939-12.939 12.939 12.939z"></path></svg>',
    });

    Lampa.SettingsApi.addParam({
      component: component,
      param: {
        name: STORAGE_KEYS.qualityMode,
        type: "select",
        values: {
          color: Lampa.Lang.translate(LANG_KEYS.qualityModeColor),
          show: Lampa.Lang.translate(LANG_KEYS.qualityModeShow),
          off: Lampa.Lang.translate(LANG_KEYS.qualityModeOff),
        },
        default: DEFAULT_CONFIG.ui.qualityMode,
      },
      field: { name: Lampa.Lang.translate(LANG_KEYS.quality) },
      onChange: function (value) {
        Lampa.Storage.set(STORAGE_KEYS.qualityMode, value);
      },
    });

    Lampa.SettingsApi.addParam({
      component: component,
      param: {
        name: STORAGE_KEYS.ratingsMode,
        type: "select",
        values: {
          show: Lampa.Lang.translate(LANG_KEYS.qualityModeShow),
          color: Lampa.Lang.translate(LANG_KEYS.qualityModeColor),
          off: Lampa.Lang.translate(LANG_KEYS.qualityModeOff),
        },
        default: DEFAULT_CONFIG.ui.ratingsMode,
      },
      field: { name: Lampa.Lang.translate(LANG_KEYS.ratings) },
      onChange: function (value) {
        Lampa.Storage.set(STORAGE_KEYS.ratingsMode, value);
      },
    });

    addToggleSetting(
      component,
      STORAGE_KEYS.showEpisodeNumber,
      LANG_KEYS.showEpisodeNumber,
      DEFAULT_CONFIG.ui.showEpisodeNumber,
    );
    addToggleSetting(
      component,
      STORAGE_KEYS.replacePoster,
      LANG_KEYS.replacePoster,
      DEFAULT_CONFIG.ui.replacePoster,
    );
    addToggleSetting(
      component,
      STORAGE_KEYS.showGenres,
      LANG_KEYS.showGenres,
      DEFAULT_CONFIG.ui.showGenres,
    );
    addToggleSetting(
      component,
      STORAGE_KEYS.showReleaseYear,
      LANG_KEYS.showReleaseYear,
      DEFAULT_CONFIG.ui.showReleaseYear,
    );

    Lampa.SettingsApi.addParam({
      component: component,
      param: { type: "title" },
      field: { name: Lampa.Lang.translate(LANG_KEYS.memory) },
      onChange: function () {},
    });

    Lampa.SettingsApi.addParam({
      component: component,
      param: { type: "button" },
      field: { name: Lampa.Lang.translate(LANG_KEYS.resetSettings) },
      onChange: resetSettings,
    });

    Lampa.SettingsApi.addParam({
      component: component,
      param: { type: "button" },
      field: { name: Lampa.Lang.translate(LANG_KEYS.clearCache) },
      onChange: clearCache,
    });
  }

  function addToggleSetting(component, storageKey, langKey, defaultValue) {
    Lampa.SettingsApi.addParam({
      component: component,
      param: { name: storageKey, type: "trigger", default: defaultValue },
      field: { name: Lampa.Lang.translate(langKey) },
      onChange: function () {},
    });
  }

  function resetSettings() {
    Lampa.Storage.set(STORAGE_KEYS.qualityMode, DEFAULT_CONFIG.ui.qualityMode);
    Lampa.Storage.set(STORAGE_KEYS.ratingsMode, DEFAULT_CONFIG.ui.ratingsMode);
    Lampa.Storage.set(
      STORAGE_KEYS.showReleaseYear,
      DEFAULT_CONFIG.ui.showReleaseYear,
    );
    Lampa.Storage.set(
      STORAGE_KEYS.showEpisodeNumber,
      DEFAULT_CONFIG.ui.showEpisodeNumber,
    );
    Lampa.Storage.set(STORAGE_KEYS.showGenres, DEFAULT_CONFIG.ui.showGenres);
    Lampa.Storage.set(
      STORAGE_KEYS.replacePoster,
      DEFAULT_CONFIG.ui.replacePoster,
    );
    Lampa.Noty.show(Lampa.Lang.translate(LANG_KEYS.settingsReset));
  }

  function clearCache() {
    Lampa.Storage.set(DEFAULT_CONFIG.cache.quality.key, {});
    Lampa.Storage.set(DEFAULT_CONFIG.cache.poster.key, {});
    Lampa.Noty.show(Lampa.Lang.translate(LANG_KEYS.cacheCleared));
  }

  function initCaches() {
    qualityCache = new StorageCache(
      DEFAULT_CONFIG.cache.quality.key,
      DEFAULT_CONFIG.cache.quality.size,
      DEFAULT_CONFIG.cache.quality.ttl,
    );
    posterCache = new StorageCache(
      DEFAULT_CONFIG.cache.poster.key,
      DEFAULT_CONFIG.cache.poster.size,
      DEFAULT_CONFIG.cache.poster.ttl,
    );

    qualityCache.init();
    posterCache.init();
  }

  function initializePlugin() {
    if (window[PLUGIN_FLAG]) return;
    window[PLUGIN_FLAG] = true;

    lampaRequest = new Lampa.Reguest();

    patchCardTemplate();
    registerSettings();
    addPluginStyles();
    initCaches();
    patchCardRenderer();
  }

  if (window.appready) {
    initializePlugin();
  } else {
    Lampa.Listener.follow("app", function (event) {
      if (event.type === "ready") initializePlugin();
    });
  }
})();
