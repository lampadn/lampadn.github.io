(function () {
  "use strict";

  Lampa.Platform.tv();

  var SOURCE_STORAGE_KEY = "rating_source";
  var DEFAULT_SOURCE = "tmdb";
  var EMPTY_RATING = "0.0";
  var CACHE_TTL = 24 * 60 * 60 * 1000;
  var REQUEST_DELAY = 300;
  var SOURCE_MARKUP = '<span class="source--name"></span>';
  var KINOPOISK_API_URL = "https://kinopoiskapiunofficial.tech/";
  var KINOPOISK_API_KEY = "14342b35-714b-449d-bf10-30d0d9ac22e6";
  var BYLAMPA_RATING_URL = "http://94.156.115.58:841/lampa/ratings/content/";
  var LAMPA_REACTIONS_URL = "http://cub.bylampa.online/api/reactions/get/";

  function findParentWithClass(element, className) {
    var parent = element.parentElement;

    while (parent) {
      if (parent.classList && parent.classList.contains(className))
        return parent;
      parent = parent.parentElement;
    }

    return null;
  }

  var cache = {
    stores: {},

    get: function (storeName, key) {
      var store =
        this.stores[storeName] ||
        (this.stores[storeName] = Lampa.Storage.cache(storeName, 500, {}));
      var value = store[key];

      if (!value) return null;

      if (Date.now() - value.timestamp > CACHE_TTL) {
        delete store[key];
        Lampa.Storage.set(storeName, store);
        return null;
      }

      return value;
    },

    set: function (storeName, key, value) {
      if (
        (value.kp === 0 && value.imdb === 0) ||
        value.rating === EMPTY_RATING
      ) {
        return value;
      }

      var store =
        this.stores[storeName] ||
        (this.stores[storeName] = Lampa.Storage.cache(storeName, 500, {}));

      value.timestamp = Date.now();
      store[key] = value;
      Lampa.Storage.set(storeName, store);

      return value;
    },
  };

  var normalizeCache = {};

  function normalizeTitle(title) {
    if (normalizeCache[title]) return normalizeCache[title];

    var normalized = title
      .replace(/[\s.,:;''`!?]+/g, " ")
      .trim()
      .toLowerCase()
      .replace(/[\-\u2010-\u2015\u2e3a\u2e3b\ufe58\ufe63\uff0d]+/g, "-")
      .replace(/ё/g, "е");

    normalizeCache[title] = normalized;
    return normalized;
  }

  function cleanTitle(title) {
    return title.replace(/[\s.,:;''`!?]+/g, " ").trim();
  }

  function cleanKeyword(title) {
    return cleanTitle(title)
      .replace(/^[ \/\\]+/, "")
      .replace(/[ \/\\]+$/, "")
      .replace(/\+( *[+\/\\])+/g, "+")
      .replace(/([+\/\\] *)+\+/g, "+")
      .replace(/( *[\/\\]+ *)+/g, "+");
  }

  function titleContains(value, expected) {
    return (
      typeof value === "string" &&
      typeof expected === "string" &&
      normalizeTitle(value).indexOf(normalizeTitle(expected)) !== -1
    );
  }

  function getMediaType(data) {
    if (
      data.number_of_seasons ||
      data.seasons ||
      data.last_episode_to_air ||
      data.first_air_date ||
      data.first_episode_to_air ||
      (data.name && !data.title) ||
      (data.original_name && !data.original_title)
    ) {
      return "tv";
    }

    return "movie";
  }

  var requestQueue = [];
  var requestQueueBusy = false;

  function runRequestQueue() {
    if (requestQueueBusy || !requestQueue.length) return;

    requestQueueBusy = true;
    requestQueue.shift().execute();

    setTimeout(function () {
      requestQueueBusy = false;
      runRequestQueue();
    }, REQUEST_DELAY);
  }

  function enqueueRequest(execute) {
    requestQueue.push({ execute: execute });
    runRequestQueue();
  }

  var requestsPool = [];

  function getRequest() {
    return requestsPool.pop() || new Lampa.Reguest();
  }

  function releaseRequest(request) {
    request.clear();
    if (requestsPool.length < 3) requestsPool.push(request);
  }

  function getLampaReactionRating(data, callback) {
    var cached = cache.get("lampa_rating", data.id);

    if (cached && cached.rating !== EMPTY_RATING) {
      callback(cached.rating);
      return;
    }

    enqueueRequest(function () {
      var request = getRequest();
      var mediaType = getMediaType(data);
      var url = LAMPA_REACTIONS_URL + mediaType + "_" + data.id;

      request.timeout(15000);
      request.silent(
        url,
        function (response) {
          var rating = EMPTY_RATING;

          if (response && response.result) {
            var positive = 0;
            var negative = 0;

            response.result.forEach(function (reaction) {
              if (reaction.type === "fire" || reaction.type === "nice") {
                positive += parseInt(reaction.counter, 10);
              }

              if (
                reaction.type === "think" ||
                reaction.type === "bore" ||
                reaction.type === "shit"
              ) {
                negative += parseInt(reaction.counter, 10);
              }
            });

            rating =
              positive + negative > 0
                ? ((positive / (positive + negative)) * 10).toFixed(1)
                : EMPTY_RATING;
          }

          cache.set("lampa_rating", data.id, { rating: rating });
          releaseRequest(request);
          callback(rating);
        },
        function () {
          releaseRequest(request);
          callback(EMPTY_RATING);
        },
      );
    });
  }

  function getByLampaRating(data, callback) {
    var mediaType = getMediaType(data);
    var cacheKey = mediaType + "_" + data.id;
    var cached = cache.get("bylampa_rating", cacheKey);

    if (cached && cached.rating !== EMPTY_RATING) {
      callback(cached.rating, cached.voteCount || 0);
      return;
    }

    enqueueRequest(function () {
      var request = new XMLHttpRequest();
      var url = BYLAMPA_RATING_URL + mediaType + "/" + data.id;

      request.open("GET", url, true);
      request.timeout = 5000;

      request.onload = function () {
        if (this.status === 200) {
          try {
            var response = JSON.parse(this.responseText);
            var rating = response.averageRating || 0;
            var voteCount = response.voteCount || 0;

            cache.set("bylampa_rating", cacheKey, {
              rating: rating.toFixed(1),
              voteCount: voteCount,
            });

            callback(rating.toFixed(1), voteCount);
          } catch (error) {
            callback(EMPTY_RATING, 0);
          }
        } else {
          callback(EMPTY_RATING, 0);
        }
      };

      request.onerror = function () {
        callback(EMPTY_RATING, 0);
      };

      request.ontimeout = function () {
        callback(EMPTY_RATING, 0);
      };

      request.send();
    });
  }

  function getKinopoiskRating(data, callback) {
    var cached = cache.get("kp_rating", data.id);

    if (cached) {
      var selectedSource = Lampa.Storage.get(
        SOURCE_STORAGE_KEY,
        DEFAULT_SOURCE,
      );
      var cachedRating = selectedSource === "kp" ? cached.kp : cached.imdb;

      if (cachedRating && cachedRating > 0) {
        callback(parseFloat(cachedRating).toFixed(1));
        return;
      }
    }

    enqueueRequest(function () {
      var request = getRequest();
      var title = cleanKeyword(data.title || data.name);
      var date =
        data.release_date ||
        data.first_air_date ||
        data.last_air_date ||
        "0000";
      var year = parseInt((date + "").slice(0, 4), 10);
      var originalTitle = data.original_title || data.original_name;
      var requestOptions = { headers: { "X-API-KEY": KINOPOISK_API_KEY } };

      function searchFilm() {
        var url = Lampa.Utils.addUrlComponent(
          KINOPOISK_API_URL + "api/v2.1/films/search-by-keyword",
          "keyword=" + encodeURIComponent(title),
        );

        if (data.imdb_id) {
          url = Lampa.Utils.addUrlComponent(
            KINOPOISK_API_URL + "api/v2.2/films",
            "imdbId=" + encodeURIComponent(data.imdb_id),
          );
        }

        request.timeout(15000);
        request.silent(
          url,
          function (response) {
            if (response.items && response.items.length) {
              chooseFilm(response.items);
            } else if (response.films && response.films.length) {
              chooseFilm(response.films);
            } else {
              chooseFilm([]);
            }
          },
          function () {
            releaseRequest(request);
            callback(EMPTY_RATING);
          },
          false,
          requestOptions,
        );
      }

      function chooseFilm(items) {
        if (!items || !items.length) {
          releaseRequest(request);
          callback(EMPTY_RATING);
          return;
        }

        items.forEach(function (item) {
          var itemYear = item.year || item.start_date || "0000";
          item.tmp_year = parseInt((itemYear + "").slice(0, 4), 10);
        });

        var filtered = items;

        if (originalTitle) {
          var titleMatches = filtered.filter(function (item) {
            return (
              titleContains(
                item.orig_title || item.nameOriginal,
                originalTitle,
              ) ||
              titleContains(item.en_title || item.nameEn, originalTitle) ||
              titleContains(
                item.title || item.ru_title || item.nameRu,
                originalTitle,
              )
            );
          });

          if (titleMatches.length) filtered = titleMatches;
        }

        if (filtered.length > 1 && year) {
          var yearMatches = filtered.filter(function (item) {
            return item.tmp_year === year;
          });

          if (!yearMatches.length) {
            yearMatches = filtered.filter(function (item) {
              return (
                item.tmp_year &&
                item.tmp_year > year - 2 &&
                item.tmp_year < year + 2
              );
            });
          }

          if (yearMatches.length) filtered = yearMatches;
        }

        var kpId =
          filtered[0].kp_id ||
          filtered[0].kinopoisk_id ||
          filtered[0].kinopoiskId ||
          filtered[0].filmId;

        if (!kpId) {
          releaseRequest(request);
          callback(EMPTY_RATING);
          return;
        }

        request.timeout(15000);
        request.silent(
          KINOPOISK_API_URL + "api/v2.2/films/" + kpId,
          function (film) {
            var ratings = cache.set("kp_rating", data.id, {
              kp: film.ratingKinopoisk || 0,
              imdb: film.ratingImdb || 0,
            });
            var selectedSource = Lampa.Storage.get(
              SOURCE_STORAGE_KEY,
              DEFAULT_SOURCE,
            );
            var rating = selectedSource === "kp" ? ratings.kp : ratings.imdb;

            releaseRequest(request);
            callback(rating ? parseFloat(rating).toFixed(1) : EMPTY_RATING);
          },
          function () {
            releaseRequest(request);
            callback(EMPTY_RATING);
          },
          false,
          requestOptions,
        );
      }

      searchFilm();
    });
  }

  var renderQueue = [];
  var renderTimer = null;

  function queueRender(card) {
    renderQueue.push(card);

    if (renderTimer) return;

    renderTimer = setTimeout(function () {
      var cards = renderQueue.splice(0);

      cards.forEach(function (item) {
        renderRating(item);
      });

      renderTimer = null;
    }, 16);
  }

  function createVoteElement(cardElement) {
    var vote = document.createElement("div");
    vote.className = "card__vote";
    vote.style.cssText =
      'line-height: 1; font-family: "SegoeUI", sans-serif; cursor: pointer; box-sizing: border-box; outline: none; user-select: none; position: absolute; right: 0.3em; bottom: 0.3em; background: rgba(0, 0, 0, 0.5); color: #fff; font-size: 1.3em; font-weight: 700; padding: 0.2em 0.5em; border-radius: 1em;';

    var view = cardElement.querySelector(".card__view");
    (view || cardElement).appendChild(vote);

    return vote;
  }

  function updateVote(vote, data, rating) {
    if (vote.dataset && vote.dataset.movieId === data.id.toString()) {
      vote.innerHTML = rating + SOURCE_MARKUP;
    }
  }

  function renderRating(cardInfo) {
    var cardElement = cardInfo.card || cardInfo;

    if (!cardElement || !cardElement.querySelector) return;

    var data = cardElement.card_data || cardInfo.data || {};
    if (!data.id) return;

    var source = Lampa.Storage.get(SOURCE_STORAGE_KEY, DEFAULT_SOURCE);
    var vote =
      cardElement.querySelector(".card__vote") ||
      createVoteElement(cardElement);

    if (
      vote.dataset &&
      vote.dataset.source === source &&
      vote.dataset.movieId === data.id.toString()
    ) {
      return;
    }

    if (vote.dataset) {
      vote.dataset.source = source;
      vote.dataset.movieId = data.id.toString();
    }

    vote.className = "card__vote rate--" + source;
    vote.textContent = "";

    if (source === "tmdb") {
      var tmdbRating = data.vote_average
        ? data.vote_average.toFixed(1)
        : EMPTY_RATING;
      vote.innerHTML = tmdbRating + SOURCE_MARKUP;
      return;
    }

    if (source === "bylampa") {
      getByLampaRating(data, function (rating) {
        updateVote(vote, data, rating);
      });
      return;
    }

    if (source === "lampa") {
      getLampaReactionRating(data, function (rating) {
        updateVote(vote, data, rating);
      });
      return;
    }

    if (source === "kp" || source === "imdb") {
      getKinopoiskRating(data, function (rating) {
        updateVote(vote, data, rating);
      });
    }
  }

  function addSettings() {
    Lampa.SettingsApi.addParam({
      component: "interface",
      param: {
        name: SOURCE_STORAGE_KEY,
        type: "select",
        values: {
          tmdb: "TMDB",
          bylampa: "ByLAMPA",
          lampa: "Lampa",
          kp: "КиноПоиск",
          imdb: "IMDB",
        },
        default: DEFAULT_SOURCE,
      },
      field: {
        name: "Источник рейтинга на карточках",
        description: "Выберите какой рейтинг отображать на карточках",
      },
      onRender: function () {
        setTimeout(function () {
          $('.settings-param > div:contains("Источник рейтинга на карточках")')
            .parent()
            .insertAfter($('div[data-name="interface_size"]'));
        }, 0);
      },
      onChange: function (source) {
        Lampa.Storage.set(SOURCE_STORAGE_KEY, source);

        var votes = document.querySelectorAll(".card__vote");

        for (var index = 0; index < votes.length; index += 1) {
          var vote = votes[index];
          var card = findParentWithClass(vote, "card");

          if (!card) continue;

          if (vote.dataset) {
            delete vote.dataset.source;
            delete vote.dataset.movieId;
          }

          queueRender({ card: card, data: card.card_data });
        }
      },
    });
  }

  function addStyles() {
    var style = document.createElement("style");
    style.type = "text/css";
    style.appendChild(
      document.createTextNode(
        ".card__vote { display: inline-flex !important; align-items: center !important; }" +
          ".card__vote .source--name { font-size: 0; color: transparent; display: inline-block; width: 16px; height: 16px; background-repeat: no-repeat; background-position: center; background-size: contain; margin-left: 4px; flex-shrink: 0; }" +
          "@media (min-width: 481px) { .card__vote .source--name { width: 24px; height: 24px; margin-left: 6px; } }" +
          ".rate--bylampa .source--name { background-image: url(\"data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z' fill='%23ffd700' stroke='%23ffd700' stroke-width='1'/%3E%3C/svg%3E\"); }" +
          ".rate--lampa .source--name { background-image: url(\"data:image/svg+xml,%3Csvg fill='%23ffcc00' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 7v18h32V7H0zm2 2h28v14H2V9zm3 3v8h2v-8H5zm4 0v8h2v-8H9zm5 0v8h2v-8h-2zm4 0v8h8v-8h-8z'/%3E%3C/svg%3E\"); }" +
          ".rate--tmdb .source--name { background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 150 150'%3E%3Ctext x='0' y='62' font-size='60' font-weight='700' fill='%2300b3e5'%3ETM%3C/text%3E%3Ctext x='0' y='125' font-size='60' font-weight='700' fill='%233cbec9'%3EDB%3C/text%3E%3C/svg%3E\"); }" +
          ".rate--kp .source--name { background-image: url(\"data:image/svg+xml,%3Csvg width='300' height='300' viewBox='0 0 300 300' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='150' cy='150' r='150' fill='black'/%3E%3Cpath d='M300 45L145.26 127.827L225.9 45H181.2L126.3 121.203V45H90V255H126.3V178.92L181.2 255H225.9L147.354 174.777L300 255V216L160.776 160.146L300 169.5V130.5L161.658 139.494L300 84V45Z' fill='%23ff5500'/%3E%3C/svg%3E\"); }" +
          ".rate--imdb .source--name { background-image: url(\"data:image/svg+xml,%3Csvg fill='%23f5c518' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 48'%3E%3Crect width='96' height='48' rx='6'/%3E%3Ctext x='10' y='33' font-size='24' font-weight='700' fill='%23000'%3EIMDb%3C/text%3E%3C/svg%3E\"); }",
      ),
    );

    document.head.appendChild(style);
  }

  function init() {
    if (window.lampa_rating_plugin) return;

    window.lampa_rating_plugin = true;

    addSettings();
    addStyles();

    var cardMaker = Lampa.Maker.get("Card");

    if (cardMaker && cardMaker.Card && cardMaker.Card.onVisible) {
      var originalOnVisible = cardMaker.Card.onVisible;

      cardMaker.Card.onVisible = function () {
        originalOnVisible.apply(this);
        queueRender({ data: this.data, card: this.html });
      };
    }
  }

  if (window.appready) {
    init();
  } else {
    Lampa.Listener.follow("app", function (event) {
      if (event.type === "ready") init();
    });
  }
})();
