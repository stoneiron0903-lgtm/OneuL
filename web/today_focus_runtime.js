(function () {
  function createTodayFocusRuntime(bindings) {
    const {
      getTimelineWrap,
      getTimeline,
      getTodayFocusRail,
      getStatusTodayFeatureBtn,
      getStartDate,
      setStartDate,
      getTodayFocusMode,
      setTodayFocusModeState,
      getTodayFocusHourMode,
      setTodayFocusHourModeState,
      getTodayFocusPreferredMinutePx,
      setTodayFocusPreferredMinutePx,
      setTodayFocusHourStartMinute,
      getDayStackOpen,
      setMenuOpen,
      setWeatherDrawerOpen,
      hideHoverGuide,
      hideSelectionElements,
      clearDayStackInlineDraft,
      setDayStackOpen,
      rememberPreviousView,
      recalcSizes,
      buildTimeline,
      alignTimelineToDateTime,
      updateTodayFocusRail,
      updateTodayFocusRailLayout,
      updateStickyDay,
      updateTime,
      persistRefreshViewState,
      todayFocusDate,
      todayFocusHeaderHeight,
      todayFocusHourVerticalPadding,
      todayFocusSelectedHourStartMinute,
      todayFocusRenderedYForBaseY,
      startOfDay,
      constants,
    } = bindings;

    function todayFocusHourScrollBounds() {
      const timelineWrap = getTimelineWrap();
      const timeline = getTimeline();
      if (!timelineWrap || !timeline) {
        return { min: 0, max: 0 };
      }
      if (!getTodayFocusMode() || !getTodayFocusHourMode()) {
        const maxScroll = Math.max(0, timeline.scrollHeight - timelineWrap.clientHeight);
        return { min: 0, max: maxScroll };
      }

      const timelineOffset = timeline.offsetTop;
      const minutePx = constants.getMinutePx();
      const startBaseY = todayFocusSelectedHourStartMinute() * minutePx;
      const endBaseY =
        (todayFocusSelectedHourStartMinute() + constants.TODAY_FOCUS_HOUR_STEP_MINUTES) * minutePx;
      const startY = todayFocusRenderedYForBaseY(startBaseY);
      const endY = todayFocusRenderedYForBaseY(endBaseY);
      const visibleHeight = Math.max(
        0,
        timelineWrap.clientHeight - todayFocusHeaderHeight() - todayFocusHourVerticalPadding() * 2
      );
      const minScroll = Math.max(
        0,
        timelineOffset + startY - todayFocusHeaderHeight() - todayFocusHourVerticalPadding()
      );
      const overflow = Math.max(0, endY - startY - visibleHeight);
      const maxScroll = minScroll + overflow;
      return { min: minScroll, max: Math.max(minScroll, maxScroll) };
    }

    function clampTodayFocusScrollTop(nextTop) {
      const timelineWrap = getTimelineWrap();
      if (!timelineWrap) return 0;
      const bounds = todayFocusHourScrollBounds();
      return Math.max(
        bounds.min,
        Math.min(bounds.max, Number.isFinite(nextTop) ? nextTop : bounds.min)
      );
    }

    function enforceTodayFocusScrollBounds() {
      const timelineWrap = getTimelineWrap();
      if (!getTodayFocusMode() || !timelineWrap) return;
      const clamped = clampTodayFocusScrollTop(timelineWrap.scrollTop);
      if (Math.abs(clamped - timelineWrap.scrollTop) > 0.5) {
        timelineWrap.scrollTop = clamped;
      }
    }

    function setTodayFocusHourMode(nextMode, anchorDateTime) {
      const timelineWrap = getTimelineWrap();
      const shouldEnable = Boolean(nextMode);

      if (shouldEnable) {
        const anchor =
          anchorDateTime instanceof Date && Number.isFinite(anchorDateTime.getTime())
            ? anchorDateTime
            : new Date();
        setTodayFocusHourStartMinute(
          Math.max(0, Math.min(constants.DAY_MINUTES - 60, anchor.getHours() * 60))
        );
        setTodayFocusPreferredMinutePx(null);
      } else {
        setTodayFocusHourStartMinute(NaN);
        setTodayFocusPreferredMinutePx(null);
      }

      setTodayFocusHourModeState(shouldEnable);
      if (timelineWrap) {
        timelineWrap.classList.toggle("today-hour-mode", shouldEnable);
      }
    }

    function enterTodayFocusHourMode(anchorDateTime, anchorClientY) {
      const timelineWrap = getTimelineWrap();
      if (!getTodayFocusMode() || getDayStackOpen() || !timelineWrap) return false;

      setTodayFocusHourMode(true, anchorDateTime);
      recalcSizes();
      buildTimeline();

      if (
        anchorDateTime instanceof Date &&
        Number.isFinite(anchorDateTime.getTime()) &&
        Number.isFinite(anchorClientY)
      ) {
        alignTimelineToDateTime(anchorDateTime, anchorClientY);
        timelineWrap.scrollTop = clampTodayFocusScrollTop(timelineWrap.scrollTop);
      } else {
        timelineWrap.scrollTop = todayFocusHourScrollBounds().min;
      }

      updateTodayFocusRailLayout();
      updateStickyDay();
      updateTime();
      persistRefreshViewState();
      return true;
    }

    function shiftTodayFocusHour(stepDelta) {
      if (!getTodayFocusMode() || !getTodayFocusHourMode() || getDayStackOpen()) return false;

      const delta = Number.isFinite(stepDelta) ? Math.trunc(stepDelta) : 0;
      if (!delta) return false;

      const currentStartMinute = todayFocusSelectedHourStartMinute();
      const nextStartMinute = Math.max(
        0,
        Math.min(
          constants.DAY_MINUTES - constants.TODAY_FOCUS_HOUR_STEP_MINUTES,
          currentStartMinute + delta * constants.TODAY_FOCUS_HOUR_STEP_MINUTES
        )
      );
      if (nextStartMinute === currentStartMinute) return false;

      const focusDate = todayFocusDate();
      const anchorDateTime = new Date(
        focusDate.getFullYear(),
        focusDate.getMonth(),
        focusDate.getDate(),
        Math.floor(nextStartMinute / 60),
        nextStartMinute % 60,
        0,
        0
      );
      return enterTodayFocusHourMode(anchorDateTime);
    }

    function exitTodayFocusHourMode() {
      const timelineWrap = getTimelineWrap();
      if (!getTodayFocusMode() || !getTodayFocusHourMode() || getDayStackOpen() || !timelineWrap) {
        return false;
      }

      setTodayFocusHourMode(false);
      recalcSizes();
      buildTimeline();
      timelineWrap.scrollTop = 0;
      updateTodayFocusRailLayout();
      updateStickyDay();
      updateTime();
      persistRefreshViewState();
      return true;
    }

    function refreshTodayFocusTimelineLayout() {
      const timelineWrap = getTimelineWrap();
      const timeline = getTimeline();
      if (!getTodayFocusMode() || getDayStackOpen() || !timelineWrap || !timeline) return false;

      const previousScrollTop = Math.max(0, timelineWrap.scrollTop);
      buildTimeline();
      if (getTodayFocusHourMode()) {
        timelineWrap.scrollTop = clampTodayFocusScrollTop(previousScrollTop);
      } else {
        const maxScroll = Math.max(0, timeline.scrollHeight - timelineWrap.clientHeight);
        timelineWrap.scrollTop = Math.min(previousScrollTop, maxScroll);
      }

      updateTodayFocusRailLayout();
      updateStickyDay();
      updateTime();
      persistRefreshViewState();
      return true;
    }

    function setTodayFocusMode(nextMode, options) {
      const timelineWrap = getTimelineWrap();
      const todayFocusRail = getTodayFocusRail();
      const statusTodayFeatureBtn = getStatusTodayFeatureBtn();
      const opts = options || {};
      const shouldEnable = Boolean(nextMode);
      const rebuildTimeline = opts.rebuildTimeline !== false;

      if (shouldEnable && !getTodayFocusMode()) {
        setTodayFocusPreferredMinutePx(null);
        setTodayFocusHourMode(false);
      } else if (!shouldEnable) {
        setTodayFocusPreferredMinutePx(null);
        setTodayFocusHourMode(false);
      }

      setTodayFocusModeState(shouldEnable);
      if (timelineWrap) {
        timelineWrap.classList.toggle("today-focus-mode", shouldEnable);
      }
      if (todayFocusRail) {
        todayFocusRail.classList.toggle("open", shouldEnable);
      }
      if (statusTodayFeatureBtn) {
        statusTodayFeatureBtn.classList.toggle("is-active", shouldEnable);
      }

      recalcSizes();
      updateTodayFocusRail();
      if (rebuildTimeline && !getDayStackOpen()) {
        buildTimeline();
      }
      persistRefreshViewState();
    }

    function enterTodayFocusMode(targetDate) {
      const timelineWrap = getTimelineWrap();
      const focusDate =
        targetDate instanceof Date && Number.isFinite(targetDate.getTime())
          ? startOfDay(targetDate)
          : startOfDay(new Date());

      if (!getTodayFocusMode()) {
        rememberPreviousView();
      }
      setMenuOpen(false);
      setWeatherDrawerOpen(false);
      hideHoverGuide();
      hideSelectionElements();
      clearDayStackInlineDraft();
      if (getDayStackOpen()) {
        setDayStackOpen(false);
      }
      setTodayFocusMode(true, { rebuildTimeline: false });
      setTodayFocusHourMode(false);
      setStartDate(focusDate);
      buildTimeline();
      if (timelineWrap) {
        timelineWrap.scrollTop = 0;
      }
      updateStickyDay();
      updateTime();
      persistRefreshViewState();
    }

    return {
      todayFocusHourScrollBounds: todayFocusHourScrollBounds,
      clampTodayFocusScrollTop: clampTodayFocusScrollTop,
      enforceTodayFocusScrollBounds: enforceTodayFocusScrollBounds,
      setTodayFocusHourMode: setTodayFocusHourMode,
      enterTodayFocusHourMode: enterTodayFocusHourMode,
      shiftTodayFocusHour: shiftTodayFocusHour,
      exitTodayFocusHourMode: exitTodayFocusHourMode,
      refreshTodayFocusTimelineLayout: refreshTodayFocusTimelineLayout,
      setTodayFocusMode: setTodayFocusMode,
      enterTodayFocusMode: enterTodayFocusMode,
    };
  }

  window.OneulTodayFocusRuntime = {
    createTodayFocusRuntime: createTodayFocusRuntime,
  };
})();
