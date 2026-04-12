(function () {
  function createStatusRuntime(bindings) {
    const {
      statusGoogleBtn,
      statusWeatherTicker,
      statusWeatherTickerText,
      weatherDrawer,
      weatherDrawerText,
      getWeatherDrawerOpen,
      setWeatherDrawerOpenState,
      getWeatherCoords,
      setWeatherCoords,
      nextWeatherRequestId,
      isWeatherRequestCurrent,
      getWeatherRefreshTimer,
      setWeatherRefreshTimer,
      getGoogleConfigured,
      setGoogleConfigured,
      getGoogleConnected,
      setGoogleConnected,
      getGoogleSyncing,
      setGoogleSyncing,
      getGoogleSyncPromise,
      setGoogleSyncPromise,
      nextGoogleRequestId,
      isGoogleRequestCurrent,
      getGoogleRangeStart,
      getGoogleRangeEnd,
      setGoogleRange,
      getGoogleEventCount,
      clearGoogleEvents,
      renderAllAlarmViews,
      replaceGoogleEvents,
      desiredGoogleCalendarRange,
      loadedGoogleRangeCovers,
      fetchJsonWithTimeout,
      showAlert,
      formatDateTimeKorean,
      formatDate,
      constants,
    } = bindings;

    let weatherVisibilityListenerBound = false;
    let googleVisibilityListenerBound = false;

    function setWeatherText(text) {
      if (statusWeatherTickerText) {
        statusWeatherTickerText.textContent = text;
      }
      if (statusWeatherTicker) {
        statusWeatherTicker.title = text;
      }
      if (weatherDrawerText) {
        weatherDrawerText.textContent = text;
        weatherDrawerText.title = text;
      }
    }

    function updateGoogleCalendarButton() {
      if (!statusGoogleBtn) return;

      let title = "";
      const disabled = getGoogleSyncing();

      if (!getGoogleConfigured()) {
        title =
          "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET \uC124\uC815\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.";
      } else if (getGoogleSyncing()) {
        title = "Google \uC77C\uC815\uC744 \uAC00\uC838\uC624\uB294 \uC911\uC785\uB2C8\uB2E4.";
      } else if (!getGoogleConnected()) {
        title = "Google \uCE98\uB9B0\uB354 \uC77D\uAE30 \uC804\uC6A9 \uC5F0\uACB0";
      } else {
        title =
          getGoogleEventCount() > 0
            ? `Google \uC77C\uC815 ${getGoogleEventCount()}\uAC1C \uB3D9\uAE30\uD654 \uC644\uB8CC`
            : "Google \uC77C\uC815 \uC0C8\uB85C\uACE0\uCE68";
      }

      statusGoogleBtn.textContent = "G";
      statusGoogleBtn.title = title;
      statusGoogleBtn.disabled = disabled;
      statusGoogleBtn.classList.toggle("is-active", getGoogleConnected());
      statusGoogleBtn.classList.toggle("is-busy", getGoogleSyncing());
      statusGoogleBtn.setAttribute("aria-busy", getGoogleSyncing() ? "true" : "false");
      statusGoogleBtn.setAttribute("aria-label", title || "Google \uCE98\uB9B0\uB354");
    }

    function setWeatherDrawerOpen(nextOpen, options) {
      const shouldOpen = Boolean(nextOpen);
      const animate = shouldOpen && (!options || options.animate !== false);

      setWeatherDrawerOpenState(shouldOpen);

      if (weatherDrawer) {
        if (!animate) {
          weatherDrawer.classList.add("no-motion");
          void weatherDrawer.offsetHeight;
        } else {
          weatherDrawer.classList.remove("no-motion");
        }

        weatherDrawer.classList.toggle("open", getWeatherDrawerOpen());
        weatherDrawer.setAttribute("aria-hidden", getWeatherDrawerOpen() ? "false" : "true");

        if (!animate) {
          requestAnimationFrame(function () {
            if (weatherDrawer) {
              weatherDrawer.classList.remove("no-motion");
            }
          });
        }
      }

      if (statusWeatherTicker) {
        statusWeatherTicker.setAttribute("aria-expanded", getWeatherDrawerOpen() ? "true" : "false");
      }
    }

    function getCurrentCoords() {
      const currentCoords = getWeatherCoords();
      if (currentCoords) {
        return Promise.resolve(currentCoords);
      }

      if (!("geolocation" in navigator)) {
        const fallback = Object.assign({}, constants.WEATHER_FALLBACK_COORDS);
        setWeatherCoords(fallback);
        return Promise.resolve(fallback);
      }

      return new Promise(function (resolve) {
        navigator.geolocation.getCurrentPosition(
          function (position) {
            const nextCoords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              label: "\uD604\uC7AC \uC704\uCE58",
            };
            setWeatherCoords(nextCoords);
            resolve(nextCoords);
          },
          function () {
            const fallback = Object.assign({}, constants.WEATHER_FALLBACK_COORDS);
            setWeatherCoords(fallback);
            resolve(fallback);
          },
          {
            enableHighAccuracy: false,
            timeout: constants.WEATHER_GEO_TIMEOUT_MS,
            maximumAge: constants.WEATHER_REFRESH_MS,
          }
        );
      });
    }

    async function fetchWeatherStatus(coords) {
      const url = new URL("/api/weather/status", window.location.origin);
      url.searchParams.set("latitude", String(coords.latitude));
      url.searchParams.set("longitude", String(coords.longitude));

      const payload = await fetchJsonWithTimeout(url.toString());
      const line = payload && typeof payload.line === "string" ? payload.line.trim() : "";
      if (!line) {
        throw new Error("weather-data-unavailable");
      }
      return line;
    }

    async function refreshWeatherStatus() {
      if (!statusWeatherTickerText && !weatherDrawerText) return;

      const requestId = nextWeatherRequestId();
      const hasText = Boolean(
        statusWeatherTickerText && statusWeatherTickerText.textContent
          ? statusWeatherTickerText.textContent.trim()
          : ""
      );

      if (!hasText) {
        setWeatherText("\uB0A0\uC528 \uC815\uBCF4 \uAC00\uC838\uC624\uB294 \uC911...");
      }

      try {
        const coords = await getCurrentCoords();
        const weatherLine = await fetchWeatherStatus(coords);
        if (!isWeatherRequestCurrent(requestId)) return;
        setWeatherText(weatherLine);
      } catch (_) {
        if (!isWeatherRequestCurrent(requestId)) return;
        setWeatherText("\uB0A0\uC528 \uC815\uBCF4 \uD655\uC778 \uBD88\uAC00");
      }
    }

    function initWeatherStatus() {
      if (!statusWeatherTickerText && !weatherDrawerText) return;

      void refreshWeatherStatus();

      const timer = getWeatherRefreshTimer();
      if (timer) {
        clearInterval(timer);
      }

      setWeatherRefreshTimer(setInterval(refreshWeatherStatus, constants.WEATHER_REFRESH_MS));

      if (!weatherVisibilityListenerBound) {
        document.addEventListener("visibilitychange", function () {
          if (document.hidden) return;
          void refreshWeatherStatus();
        });
        weatherVisibilityListenerBound = true;
      }
    }

    function consumeGoogleAuthResult() {
      const url = new URL(window.location.href);
      const result = url.searchParams.get("google");
      if (!result) return null;

      url.searchParams.delete("google");
      window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);

      if (result === "error") {
        showAlert("Google \uCE98\uB9B0\uB354 \uC5F0\uACB0 \uC2E4\uD328");
      }

      return result;
    }

    async function refreshGoogleCalendarStatus(options) {
      const opts = options || {};
      const sync = Boolean(opts.sync);
      const forceSync = Boolean(opts.forceSync);

      try {
        const data = await fetchJsonWithTimeout("/api/google/status", {
          timeoutMs: constants.GOOGLE_FETCH_TIMEOUT_MS,
          fetchOptions: {
            credentials: "same-origin",
          },
        });

        setGoogleConfigured(Boolean(data && data.configured));
        setGoogleConnected(Boolean(data && data.connected));

        if (!getGoogleConnected()) {
          clearGoogleEvents();
          renderAllAlarmViews();
        }

        updateGoogleCalendarButton();

        if (sync && getGoogleConfigured() && getGoogleConnected()) {
          await syncGoogleCalendar({ force: forceSync });
        }
      } catch (_) {
        setGoogleConfigured(false);
        setGoogleConnected(false);
        clearGoogleEvents();
        updateGoogleCalendarButton();
      }
    }

    async function syncGoogleCalendar(options) {
      const opts = options || {};
      const force = Boolean(opts.force);

      if (!getGoogleConfigured() || !getGoogleConnected()) return;

      const currentPromise = getGoogleSyncPromise();
      if (currentPromise) return currentPromise;

      const requestedRange = desiredGoogleCalendarRange();
      if (!force && loadedGoogleRangeCovers(requestedRange.start, requestedRange.end)) {
        return;
      }

      const currentRangeStart = getGoogleRangeStart();
      const currentRangeEnd = getGoogleRangeEnd();
      const fetchStart =
        !force && currentRangeStart instanceof Date
          ? new Date(Math.min(currentRangeStart.getTime(), requestedRange.start.getTime()))
          : requestedRange.start;
      const fetchEnd =
        !force && currentRangeEnd instanceof Date
          ? new Date(Math.max(currentRangeEnd.getTime(), requestedRange.end.getTime()))
          : requestedRange.end;

      const requestId = nextGoogleRequestId();
      setGoogleSyncing(true);
      updateGoogleCalendarButton();

      const url = new URL("/api/google/events", window.location.origin);
      url.searchParams.set("start", fetchStart.toISOString());
      url.searchParams.set("end", fetchEnd.toISOString());
      if (force) {
        url.searchParams.set("force", "1");
      }

      const nextPromise = fetchJsonWithTimeout(url.toString(), {
        timeoutMs: constants.GOOGLE_FETCH_TIMEOUT_MS,
        fetchOptions: {
          credentials: "same-origin",
        },
      })
        .then(function (payload) {
          if (!isGoogleRequestCurrent(requestId)) return;
          const items = payload && Array.isArray(payload.items) ? payload.items : [];
          replaceGoogleEvents(items);
          setGoogleRange(fetchStart, fetchEnd);
          renderAllAlarmViews();
        })
        .catch(function (error) {
          if (!isGoogleRequestCurrent(requestId)) return;
          const status = error && Number.isFinite(error.status) ? error.status : null;
          if (status === 401) {
            setGoogleConnected(false);
            clearGoogleEvents();
            renderAllAlarmViews();
          }
        })
        .finally(function () {
          if (isGoogleRequestCurrent(requestId)) {
            setGoogleSyncing(false);
            updateGoogleCalendarButton();
          }
          setGoogleSyncPromise(null);
        });

      setGoogleSyncPromise(nextPromise);
      return nextPromise;
    }

    function requestGoogleCalendarSync(force) {
      if (!getGoogleConfigured() || !getGoogleConnected()) return;
      void syncGoogleCalendar({ force: Boolean(force) });
    }

    function handleGoogleCalendarEvent(eventInfo) {
      if (!eventInfo || eventInfo.source !== constants.GOOGLE_EVENT_SOURCE) return false;

      const timeText =
        eventInfo.allDay || !(eventInfo.time instanceof Date)
          ? "\uC885\uC77C"
          : formatDateTimeKorean(
              eventInfo.time,
              eventInfo.time.getHours(),
              eventInfo.time.getMinutes(),
              eventInfo.time.getSeconds()
            );
      const dateText = eventInfo.time instanceof Date ? formatDate(eventInfo.time) : "";
      const titleText =
        typeof eventInfo.title === "string" && eventInfo.title.trim()
          ? eventInfo.title.trim()
          : constants.GOOGLE_EVENT_DEFAULT_TITLE;

      showAlert(`Google \uC77C\uC815: ${dateText} ${timeText} - ${titleText}`.trim());
      return true;
    }

    function initGoogleCalendar() {
      const authResult = consumeGoogleAuthResult();
      updateGoogleCalendarButton();

      void refreshGoogleCalendarStatus({ sync: true }).then(function () {
        if (authResult === "connected" && getGoogleConnected()) {
          showAlert("Google \uCE98\uB9B0\uB354 \uC5F0\uACB0 \uC644\uB8CC");
        }
      });

      if (!googleVisibilityListenerBound) {
        document.addEventListener("visibilitychange", function () {
          if (document.hidden) return;
          void refreshGoogleCalendarStatus({ sync: false });
          requestGoogleCalendarSync(false);
        });
        googleVisibilityListenerBound = true;
      }
    }

    return {
      setWeatherText: setWeatherText,
      updateGoogleCalendarButton: updateGoogleCalendarButton,
      setWeatherDrawerOpen: setWeatherDrawerOpen,
      getCurrentCoords: getCurrentCoords,
      fetchWeatherStatus: fetchWeatherStatus,
      refreshWeatherStatus: refreshWeatherStatus,
      initWeatherStatus: initWeatherStatus,
      consumeGoogleAuthResult: consumeGoogleAuthResult,
      refreshGoogleCalendarStatus: refreshGoogleCalendarStatus,
      syncGoogleCalendar: syncGoogleCalendar,
      requestGoogleCalendarSync: requestGoogleCalendarSync,
      handleGoogleCalendarEvent: handleGoogleCalendarEvent,
      initGoogleCalendar: initGoogleCalendar,
    };
  }

  window.OneulStatusRuntime = {
    createStatusRuntime: createStatusRuntime,
  };
})();
