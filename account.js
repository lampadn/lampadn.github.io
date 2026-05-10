(function () {
  "use strict";

  Lampa.Platform.tv();

  const API_URL = "http://94.156.115.58:803";

  const SYNC_KEYS = [
    "torrents_view",
    "plugins",
    "favorite",
    "file_view",
    "search_history",
  ];

  const accountInfoBlock = $(
    `
      <div class="myBot"
           style="line-height:1;
                  color:#ffffff;
                  font-family:'SegoeUI',sans-serif;
                  font-size:1em;
                  box-sizing:border-box;
                  outline:none;
                  user-select:none;
                  display:flex;
                  align-items:flex-start;
                  position:relative;
                  background-color:rgba(255,255,255,0.1);
                  border-radius:0.3em;
                  margin:1.5em 2em;
                  flex-wrap:wrap;">

        <div class="ad-server__text" style="flex:1;line-height:1.8;">
          Для получения токена перейдите в наш телеграм бот
          <span style="background-color:#ffe216;border-radius:0.3em;padding:0.15em;color:#000;">
            @bylampa_sync_bot
          </span>
          или на сайт
          <span style="background-color:#ffe216;border-radius:0.3em;padding:0.15em;color:#000;">
            sync.bylampa.online
          </span>
        </div>

        <img class="ad-server__qr"
             style="opacity:1;
                    border-radius:0.3em;
                    overflow:hidden;
                    box-sizing:border-box;
                    margin:auto 0.6em auto auto;"
             src="http://bylampa.online/img/qr_sync.png">
      </div>
    `,
  );

  const SyncManager = {
    timer: null,
    needsSync: false,
    isSyncSuccessful: false,
    isApplyingServerData: false,

    handleStorageChange(event) {
      const changedKey = event.name;

      if (!SYNC_KEYS.includes(changedKey)) {
        return;
      }


      this.needsSync = true;

      if (this.timer) {
        clearTimeout(this.timer);
      }

      this.timer = setTimeout(() => {
        const token = localStorage.getItem("token");

        if (token && !this.isApplyingServerData) {
          this.startSync(token);
        }

        this.needsSync = false;
      }, 500);
    },

    async startSync(token) {
      try {

        this.isSyncSuccessful = false;

        await this.sendDataToServer(token);

        if (!this.isSyncSuccessful) {

        }

        this.needsSync = false;
      } catch (error) {
        this.needsSync = true;
      }
    },

    async sendDataToServer(token) {
      const syncData = this.getSyncedData();
      const formData = new FormData();

      Object.keys(syncData).forEach((key) => {
        formData.append(key, JSON.stringify(syncData[key]));
      });

      formData.append(
        "file",
        new Blob([JSON.stringify(syncData)], {
          type: "application/json",
        }),
      );

      const response = await this.makeHttpRequest(
        "POST",
        `${API_URL}/lampa/sync?token=${encodeURIComponent(token)}`,
        formData,
      );

      if (response.status === 200) {
        this.isSyncSuccessful = true;
        return JSON.parse(response.responseText);
      }

      this.isSyncSuccessful = false;
    },

    getSyncedData() {
      return {
        torrents_view: Lampa.Storage.get("torrents_view"),
        plugins: Lampa.Storage.get("plugins"),
        favorite: Lampa.Storage.get("favorite"),
        file_view: Lampa.Storage.get("file_view"),
        search_history: Lampa.Storage.get("search_history"),
      };
    },

    async loadDataFromServer(token) {
      const response = await this.makeHttpRequest(
        "GET",
        `${API_URL}/lampa/sync?token=${encodeURIComponent(token)}`,
      );

      if (response.status !== 200) {
        console.log(
          "Ошибка загрузки данных:",
          response.status,
          response.statusText,
        );

        return null;
      }

      const data = JSON.parse(response.responseText);

      if (data.success && data.data) {
        return data.data;
      }


      return null;
    },

    makeHttpRequest(method, url, body = null) {
      return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();

        request.open(method, url, true);

        request.onload = () => {
          if (request.status >= 200 && request.status < 300) {
            resolve(request);
          } else {
            reject(request);
          }
        };

        request.onerror = () => reject(request);

        request.send(body);
      });
    },

    updateLocalStorage(serverData) {
      if (!serverData || typeof serverData !== "object") {
        return;
      }

      this.isApplyingServerData = true;

      SYNC_KEYS.forEach((key) => {
        if (!serverData.hasOwnProperty(key)) {
          return;
        }

        const value = serverData[key];

        if (!Array.isArray(value) && typeof value !== "object") {
          return;
        }

        if (key === "plugins") {
          this.syncPlugins(value);
          return;
        }

        if (key === "favorite") {
          Lampa.Storage.set("favorite", value);
          Lampa.Favorite.init();
          Lampa.Favorite.read(true);
          return;
        }

        if (key === "file_view") {
          Lampa.Storage.set("file_view", value);
          Lampa.Timeline.read();
          return;
        }

        Lampa.Storage.set(key, value);
      });

      this.isApplyingServerData = false;
    },

    syncPlugins(serverPlugins) {
      let localPlugins = Lampa.Storage.get("plugins") || [];

      serverPlugins.forEach((serverPlugin) => {
        const existingPlugin = localPlugins.find((localPlugin) => {
          if (serverPlugin.id && localPlugin.id) {
            return localPlugin.id === serverPlugin.id;
          }

          return localPlugin.url === serverPlugin.url;
        });

        if (!existingPlugin) {
          const newPlugin = {
            id: serverPlugin.id || Date.now().toString(),
            name: serverPlugin.name || "Без названия",
            url: serverPlugin.url,
            status:
              typeof serverPlugin.status === "number"
                ? serverPlugin.status
                : 1,
            author: serverPlugin.author || "@bylampa",
          };

          localPlugins.push(newPlugin);

          if (newPlugin.status === 1) {
            this.injectPluginScript(newPlugin.url);
          }

          return;
        }

        let pluginChanged = false;

        if (
          serverPlugin.name !== undefined &&
          existingPlugin.name !== serverPlugin.name
        ) {
          existingPlugin.name = serverPlugin.name;
        }

        if (
          serverPlugin.url !== undefined &&
          existingPlugin.url !== serverPlugin.url
        ) {
          this.removePluginScript(existingPlugin.url);

          existingPlugin.url = serverPlugin.url;
          pluginChanged = true;
        }

        if (
          typeof serverPlugin.status === "number" &&
          existingPlugin.status !== serverPlugin.status
        ) {
          existingPlugin.status = serverPlugin.status;
          pluginChanged = true;
        }

        if (pluginChanged && existingPlugin.status === 1) {
          this.injectPluginScript(existingPlugin.url);
        }
      });

      localPlugins = localPlugins.filter((localPlugin) => {
        const existsOnServer = serverPlugins.find((serverPlugin) => {
          if (serverPlugin.id && localPlugin.id) {
            return serverPlugin.id === localPlugin.id;
          }

          return serverPlugin.url === localPlugin.url;
        });

        if (!existsOnServer) {
          this.removePluginScript(localPlugin.url);
        }

        return existsOnServer !== undefined;
      });

      Lampa.Storage.set("plugins", localPlugins);
    },

    injectPluginScript(url) {
      const script = document.createElement("script");
      script.src = url;

      document.head.appendChild(script);
    },

    removePluginScript(url) {
      const script = document.querySelector(`script[src="${url}"]`);

      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    },
  };

  function validateToken(token) {

    const request = new XMLHttpRequest();

    request.open("POST", `${API_URL}/checkToken`, true);
    request.setRequestHeader("Content-Type", "application/json");

    request.onreadystatechange = function () {
      if (request.readyState !== 4) {
        return;
      }

      if (request.status !== 200) {
        Lampa.Noty.show("Ошибка запроса");
        return;
      }

      const response = JSON.parse(request.responseText);


      if (response.userId) {

        localStorage.setItem("token", token);

        Lampa.Noty.show("Токен действителен");

        Lampa.Settings.update();
      } else {

        localStorage.removeItem("token");

        Lampa.Noty.show("Токен недействителен");
      }
    };

    request.send(
      JSON.stringify({
        token,
      }),
    );
  }

  function addSettingsComponent() {
    Lampa.SettingsApi.addComponent({
      component: "acc",
      name: "Аккаунт",
      icon: `
        <svg fill="#ffffff" width="256px" height="256px" viewBox="0 0 32 32">
          <path d="M16 17.25c4.556 0 8.25-3.694 8.25-8.25s-3.694-8.25-8.25-8.25c-4.556 0-8.25 3.694-8.25 8.25v0c0.005 4.554 3.696 8.245 8.249 8.25h0.001z"></path>
        </svg>
      `,
    });
  }

  function addAuthSettings() {
    Lampa.SettingsApi.addParam({
      component: "acc",
      param: {
        name: "acc_title_auth",
        type: "title",
      },
      field: {
        name: "Авторизация",
        description: "",
      },
    });

    Lampa.SettingsApi.addParam({
      component: "acc",
      param: {
        name: "acc_auth",
        type: "input",
        values: "",
        placeholder: "Нужно будет ввести токен",
        default: "",
      },
      field: {
        name: "Выполнить вход",
        description: "",
      },
      onChange: validateToken,
    });
  }

  function addLogoutSetting() {
    Lampa.SettingsApi.addParam({
      component: "acc",
      param: {
        name: "acc_exit",
        type: "static",
      },
      field: {
        name: "Выйти из аккаунта",
        description: "",
      },
      onRender(element) {
        element.on("hover:enter", () => {
          localStorage.removeItem("token");

          Lampa.Storage.set("acc_sync", false);
          Lampa.Settings.update();
        });
      },
    });
  }

  function addSyncSetting() {
    Lampa.SettingsApi.addParam({
      component: "acc",
      param: {
        name: "acc_sync",
        type: "trigger",
        default: false,
      },
      field: {
        name: "Синхронизация данных",
        description:
          "Синхронизация ваших закладок, плагинов, таймкодов, историй просмотров и поиска между устройствами",
      },
      async onChange(value) {
        if (value !== true && value !== "true") {
          return;
        }

        const token = localStorage.getItem("token");

        if (!token) {
          Lampa.Noty.show("Вы не зашли в аккаунт");

          if (Lampa.Storage.field("acc_sync")) {
            Lampa.Storage.set("acc_sync", false);
            Lampa.Settings.update();
          }

          return;
        }

        try {
          const data = await SyncManager.loadDataFromServer(token);

          if (!data) {
            return;
          }

          SyncManager.updateLocalStorage(data);

          Lampa.Noty.show("Приложение будет перезапущено...");

          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } catch (error) {
        }
      },
    });
  }

  function addResetSyncSetting() {
    Lampa.SettingsApi.addParam({
      component: "acc",
      param: {
        name: "sync_reset",
        type: "static",
      },
      field: {
        name: "Сброс данных синхронизации",
        description:
          "Внимание! После нажатия синхронизированные данные будут удалены",
      },
      onRender(element) {
        element.on("hover:enter", () => {
          const token = localStorage.getItem("token");

          if (!token) {
            Lampa.Noty.show("Вы не зашли в аккаунт");
            return;
          }

          const request = new XMLHttpRequest();

          request.open(
            "DELETE",
            `${API_URL}/lampa/sync?token=${encodeURIComponent(token)}`,
          );

          request.onload = () => {
            if (request.status === 200) {
              Lampa.Noty.show("Данные синхронизации удалены");
            } else {
              console.error(
                "Ошибка удаления:",
                request.status,
                request.statusText,
              );

              Lampa.Noty.show(
                "Ошибка при удалении или данные отсутствуют",
              );
            }
          };

          request.onerror = () => {
            console.error(
              "Ошибка удаления:",
              request.status,
              request.statusText,
            );

            Lampa.Noty.show(
              "Ошибка при удалении или данные отсутствуют",
            );
          };

          request.send();
        });
      },
    });
  }

  function setupSettingsListener() {
    Lampa.Settings.listener.follow("open", (event) => {
      setTimeout(() => {
        $("div[data-component=interface]").before(
          $("div[data-component=acc]"),
        );
      }, 30);

      if (event.name !== "acc") {
        return;
      }

      if (!$(".myBot").length) {
        $('div[data-name="acc_auth"]').before(accountInfoBlock);
      }

      const token = localStorage.getItem("token");

      if (token !== null) {
        $('div[data-name="acc_auth"]').hide();

        const accountElement = document.querySelector(
          "#app > div.settings > div.settings__content.layer--height > div.settings__body > div > div > div > div > div:nth-child(5)",
        );

        Lampa.Controller.focus(accountElement);
        Lampa.Controller.toggle("settings_component");
      } else {
        $('div > span:contains("Аккаунт")').hide();

        $('.settings-param > div:contains("Выйти")')
          .parent()
          .hide();
      }
    });
  }

  function watchStorageChanges() {
    Lampa.Storage.listener.follow("change", (event) => {
      if (Lampa.Storage.field("acc_sync")) {
        SyncManager.handleStorageChange(event);
      }
    });
  }

  function runStartupSync() {
    const startupTimer = setInterval(() => {
      if (typeof Lampa === "undefined") {
        return;
      }

      clearInterval(startupTimer);

      const token = localStorage.getItem("token");
      const syncEnabled = Lampa.Storage.get("acc_sync", false);

      if (!token || !syncEnabled) {
        console.log("Вы не зашли в аккаунт или синхронизация отключена");
        return;
      }

      const request = new XMLHttpRequest();

      request.open("POST", `${API_URL}/checkToken`, true);
      request.setRequestHeader("Content-Type", "application/json");

      request.onreadystatechange = async function () {
        if (request.readyState !== 4) {
          return;
        }

        if (request.status !== 200) {
          console.error(
            "Ошибка проверки токена:",
            request.statusText,
          );

          Lampa.Noty.show("Ошибка запроса на сервер");

          return;
        }

        const response = JSON.parse(request.responseText);

        if (!response.userId) {

          localStorage.removeItem("token");
          Lampa.Storage.set("acc_sync", false);

          Lampa.Noty.show("Токен недействителен");

          return;
        }


        try {
          const data = await SyncManager.loadDataFromServer(token);

          if (!data) {
            return;
          }

          SyncManager.updateLocalStorage(data);
        } catch (error) {
        }
      };

      request.send(
        JSON.stringify({
          token,
        }),
      );
    }, 200);
  }

  function initAccountPlugin() {
    addSettingsComponent();
    addAuthSettings();
    addLogoutSetting();
    addSyncSetting();
    addResetSyncSetting();

    setupSettingsListener();
    watchStorageChanges();
    runStartupSync();
  }

  if (window.appready) {
    initAccountPlugin();
  } else {
    Lampa.Listener.follow("app", (event) => {
      if (event.type === "ready") {
        initAccountPlugin();
      }
    });
  }
})();
