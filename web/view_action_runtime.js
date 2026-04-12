(function () {
  function createViewActionRuntime(bindings) {
    const {
      getTimelineWrap,
      getDayStackLayer,
      getMenuOpen,
      setMenuOpen,
      getWeatherDrawerOpen,
      setWeatherDrawerOpen,
      getTodayFocusMode,
      getTodayFocusHourMode,
      getDayStackOpen,
      getMinutePx,
      getDayStackViewMode,
      getDayStackExpandedDate,
      getDayStackYearListMode,
      getPreviousViewState,
      restorePreviousView,
      enterTodayFocusMode,
      exitTodayFocusHourMode,
      focusDateInDayStack,
      focusTodayInDayStack,
      todayFocusDate,
      setStatusNowBtnPointerClientY,
      isPointerOnVerticalScrollbar,
      dateTimeFromClientPoint,
      dayStackDateTimeFromClientPoint,
      animateMinutePx,
      collapseExpandedDayStackItem,
      toggleDayStackViewMode,
      openWakeTimePreferencePrompt,
      getGoogleConfigured,
      getGoogleConnected,
      syncGoogleCalendar,
      showAlert,
      setDayStackOpen,
      constants,
    } = bindings;

    function closeStatusOverlays() {
      setMenuOpen(false);
      setWeatherDrawerOpen(false);
    }

    function triggerStatusNowAction(clientY, options) {
      const opts = options || {};
      closeStatusOverlays();
      focusTodayInDayStack(clientY, { forceExpand: Boolean(opts.forceExpand) });
      setStatusNowBtnPointerClientY(null);
      return true;
    }

    function toggleTodayFeature() {
      if (getTodayFocusMode()) {
        if (getPreviousViewState()) {
          restorePreviousView();
        } else {
          enterTodayFocusMode();
        }
        return true;
      }
      enterTodayFocusMode();
      return true;
    }

    function toggleStatusBarMenu() {
      if (getWeatherDrawerOpen()) {
        setWeatherDrawerOpen(false);
        return true;
      }
      setWeatherDrawerOpen(false);
      setMenuOpen(!getMenuOpen());
      return true;
    }

    function toggleWeatherDrawer() {
      setMenuOpen(false);
      setWeatherDrawerOpen(!getWeatherDrawerOpen());
      return true;
    }

    function openWakeTimePreferences() {
      closeStatusOverlays();
      openWakeTimePreferencePrompt({ source: "manual" });
      return true;
    }

    function triggerGoogleCalendarAction() {
      closeStatusOverlays();
      if (!getGoogleConfigured()) {
        showAlert("Google \uCE98\uB9B0\uB354 \uC124\uC815\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.");
        return false;
      }
      if (!getGoogleConnected()) {
        window.location.assign("/auth/google/start");
        return true;
      }
      void syncGoogleCalendar({ force: true });
      return true;
    }

    function handleEscapeKey() {
      if (getWeatherDrawerOpen()) {
        setWeatherDrawerOpen(false);
        return true;
      }
      if (getMenuOpen()) {
        setMenuOpen(false);
        return true;
      }
      if (getTodayFocusMode()) {
        if (getTodayFocusHourMode()) {
          exitTodayFocusHourMode();
          return true;
        }
        restorePreviousView();
        return true;
      }
      if (getDayStackOpen()) {
        setDayStackOpen(false, false);
        return true;
      }
      return false;
    }

    function handleContextBack(context) {
      const ctx = context || {};
      const timelineWrap = getTimelineWrap();
      const dayStackLayer = getDayStackLayer();
      const target = ctx.target;
      const clientX = Number(ctx.clientX);
      const clientY = Number(ctx.clientY);

      if (!timelineWrap || !(target instanceof Node) || !timelineWrap.contains(target)) {
        return false;
      }
      if (getDayStackOpen()) {
        if (dayStackLayer && isPointerOnVerticalScrollbar(dayStackLayer, clientX)) {
          return false;
        }
      } else if (isPointerOnVerticalScrollbar(timelineWrap, clientX)) {
        return false;
      }

      if (getTodayFocusMode()) {
        if (getTodayFocusHourMode()) {
          setMenuOpen(false);
          exitTodayFocusHourMode();
          return true;
        }
        closeStatusOverlays();
        focusDateInDayStack(todayFocusDate(), { expand: true });
        setStatusNowBtnPointerClientY(null);
        return true;
      }

      const zoomToHalfStepThreshold = (constants.ZOOM_MINUTE_PX + constants.MAX_ZOOM_MINUTE_PX) / 2;
      if (getDayStackOpen()) {
        const anchorDateTime = dayStackDateTimeFromClientPoint(clientX, clientY);
        if (getMinutePx() >= zoomToHalfStepThreshold - constants.MINUTE_PX_EPSILON) {
          animateMinutePx(constants.ZOOM_MINUTE_PX, anchorDateTime, clientY);
          setMenuOpen(false);
          return true;
        }
        if (getMinutePx() > constants.BASE_MINUTE_PX + constants.MINUTE_PX_EPSILON) {
          animateMinutePx(constants.BASE_MINUTE_PX, anchorDateTime, clientY);
          setMenuOpen(false);
          return true;
        }
        if (
          getDayStackViewMode() === constants.DAY_STACK_VIEW_MODE_MONTH_DAY &&
          typeof getDayStackExpandedDate() === "string" &&
          getDayStackExpandedDate()
        ) {
          collapseExpandedDayStackItem();
          setMenuOpen(false);
          return true;
        }
        if (getDayStackViewMode() === constants.DAY_STACK_VIEW_MODE_MONTH_DAY) {
          toggleDayStackViewMode({ centerTarget: true, focusTarget: true });
          setMenuOpen(false);
          return true;
        }
        if (
          getDayStackViewMode() === constants.DAY_STACK_VIEW_MODE_YEAR_MONTH &&
          !getDayStackYearListMode()
        ) {
          toggleDayStackViewMode({ centerTarget: true, focusTarget: true });
          setMenuOpen(false);
          return true;
        }
        setMenuOpen(false);
        return true;
      }

      if (getMinutePx() >= zoomToHalfStepThreshold - constants.MINUTE_PX_EPSILON) {
        const anchorDateTime = dateTimeFromClientPoint(clientX, clientY);
        animateMinutePx(constants.ZOOM_MINUTE_PX, anchorDateTime, clientY);
        return true;
      }
      if (getMinutePx() > constants.BASE_MINUTE_PX + constants.MINUTE_PX_EPSILON) {
        const anchorDateTime = dateTimeFromClientPoint(clientX, clientY);
        animateMinutePx(constants.BASE_MINUTE_PX, anchorDateTime, clientY);
        return true;
      }

      restorePreviousView();
      return true;
    }

    return {
      closeStatusOverlays: closeStatusOverlays,
      triggerStatusNowAction: triggerStatusNowAction,
      toggleTodayFeature: toggleTodayFeature,
      toggleStatusBarMenu: toggleStatusBarMenu,
      toggleWeatherDrawer: toggleWeatherDrawer,
      openWakeTimePreferences: openWakeTimePreferences,
      triggerGoogleCalendarAction: triggerGoogleCalendarAction,
      handleEscapeKey: handleEscapeKey,
      handleContextBack: handleContextBack,
    };
  }

  window.OneulViewActionRuntime = {
    createViewActionRuntime: createViewActionRuntime,
  };
})();
