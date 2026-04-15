const BASE_MINUTE_PX = 0.5;
const ZOOM_MINUTE_PX = 1.0;
const MAX_ZOOM_MINUTE_PX = 2.0;
const MINUTE_PX_EPSILON = 0.0001;
const DAY_BAR_HEIGHT = 24;
const DAYS_BEFORE = 3;
const DAYS_AFTER = 3;
const TOTAL_DAYS = DAYS_BEFORE + DAYS_AFTER + 1;
const DAY_MINUTES = 24 * 60;
const NOW_OFFSET = DAY_BAR_HEIGHT + 17;
const INFINITE_SCROLL_ENABLED = true;
const SHIFT_THRESHOLD_DAYS = 0.35;
const DAY_STACK_BEFORE_DAYS = 180;
const DAY_STACK_AFTER_DAYS = 360;
const DAY_STACK_TOTAL_DAYS = DAY_STACK_BEFORE_DAYS + DAY_STACK_AFTER_DAYS + 1;
const DAY_STACK_MIN_TOTAL_DAYS = DAY_STACK_TOTAL_DAYS;
const DAY_STACK_LAZY_SHIFT_DAYS = 120;
const DAY_STACK_EDGE_THRESHOLD_PX = DAY_BAR_HEIGHT * 4;
const DAY_STACK_RANGE_START = new Date(1976, 8, 3);
const DAY_STACK_RANGE_END = new Date(2076, 8, 3);
const YEAR_LIST_AGE_ZERO_YEAR = 1976;
const DAY_STACK_VIEW_MODE_MONTH_DAY = "month-day";
const DAY_STACK_VIEW_MODE_YEAR_MONTH = "year-month";
const DAY_STACK_INTRO_DELAY_MS = 10;
const DAY_STACK_EXPAND_TRANSITION_MS = 180;
const DAY_STACK_REVEAL_FOCUS_MS = 1600;
const DAY_STACK_MONTH_LIST_DAYS_OUT_MS = 300;
const DAY_STACK_MONTH_LIST_SLIDE_IN_DELAY_MS = 300;
const DAY_STACK_MONTH_LIST_MONTH_IN_MS = 300;
const DAY_STACK_SPREAD_DRAG_PX = 260;
const DAY_STACK_SPREAD_WHEEL_SCALE = 0.0022;
const DAY_STACK_WHEEL_STEP_PX = 40;
const DAY_STACK_NOW_HIDE_NEAR_PX = 24;
const ALARM_HIDE_NEAR_PX = 18;
const TODAY_FOCUS_NOW_LABEL_OFFSET_PX = 18;
const TODAY_FOCUS_NOW_LABEL_BOTTOM_PADDING_PX = 14;
const TODAY_FOCUS_HOUR_VERTICAL_PADDING_PX = 10;
const TODAY_FOCUS_HOUR_STEP_MINUTES = 60;
const TODAY_FOCUS_HOUR_DRAG_STEP_PX = 48;
const TODAY_FOCUS_HOUR_WHEEL_THRESHOLD = 48;
const TODAY_FOCUS_HOUR_WHEEL_RESET_MS = 160;
const ALARM_EXPANDED_HEIGHT_PX = 46;
const ALARM_ZOOMED_HEIGHT_PX = 18;
const ALARM_EXPANDED_GAP_PX = 3;
const DAY_STACK_INLINE_EDITOR_LONG_PRESS_MS = 300;
const DAY_STACK_INLINE_EDITOR_STEP_TITLE = 0;
const DAY_STACK_INLINE_EDITOR_STEP_START = 1;
const DAY_STACK_INLINE_EDITOR_STEP_REPEAT = 2;
const DAY_STACK_INLINE_EDITOR_CARD_HEIGHTS = [80, 132, 132];
const DAY_STACK_INLINE_ALARM_CARD_HEIGHT = 132;
const DAY_STACK_INLINE_EDITOR_SLOT_GAP_PX = 12;
const SELECTION_SPREAD_MS = 200;
const OPACITY_JITTER_MS = 90;
const OPACITY_IDLE_MS = 140;
const OPACITY_JITTER_MIN = 0.5;
const OPACITY_JITTER_MAX = 0.8;
const DRAG_START_THRESHOLD_PX = 3;
const CONTEXT_BACK_REPEAT_SUPPRESS_MS = 360;
const CONTEXT_BACK_REPEAT_SUPPRESS_PX = 24;
const ZOOM_ANIMATION_RENDER_STEPS = 1;
const ZOOM_IN_DURATION_MS = 35;
const ZOOM_OUT_DURATION_MS = 45;
const LONG_PRESS_SELECT_MS = 420;
const WEATHER_REFRESH_MS = 10 * 60 * 1000;
const WEATHER_GEO_TIMEOUT_MS = 3500;
const WEATHER_FETCH_TIMEOUT_MS = 6000;
const GOOGLE_FETCH_TIMEOUT_MS = 10000;
const GOOGLE_RANGE_BEFORE_DAYS = 45;
const GOOGLE_RANGE_AFTER_DAYS = 400;
const REFRESH_VIEW_STORAGE_KEY = "oneul:refresh-view";
const WAKE_TIME_STORAGE_KEY = "oneul:wake-time";
const SLEEP_DURATION_STORAGE_KEY = "oneul:sleep-duration-minutes";
const WAKE_SETUP_PROMPTED_STORAGE_KEY = "oneul:wake-setup-prompted";
const LOCAL_EVENT_SOURCE = "local";
const GOOGLE_EVENT_SOURCE = "google";
const GOOGLE_EVENT_DEFAULT_TITLE = "Google 일정";
const WEATHER_FALLBACK_COORDS = {
  latitude: 37.5665,
  longitude: 126.978,
  label: "\uC11C\uC6B8",
};

let minutePx = BASE_MINUTE_PX;
let dayBlockHeight = DAY_BAR_HEIGHT + DAY_MINUTES * minutePx;
let hourHeight = 60 * minutePx;

const timelineWrap = document.getElementById("timelineWrap");
const timeline = document.getElementById("timeline");
const dateLabel = document.getElementById("dateLabel");
const timeLabel = document.getElementById("timeLabel");
const statusBar = document.getElementById("statusBar");
const statusDateText = document.getElementById("statusDateText");
const statusWeatherTicker = document.getElementById("statusWeatherTicker");
const statusWeatherTickerText = document.getElementById("statusWeatherTickerText");
const statusGoogleBtn = document.getElementById("statusGoogleBtn");
const statusWakeTimeBtn = document.getElementById("statusWakeTimeBtn");
const statusTimeText = document.getElementById("statusTimeText");
const statusNowBtn = document.getElementById("statusNowBtn");
const statusTodayFeatureBtn = document.getElementById("statusTodayFeatureBtn");
const todayFocusRail = document.getElementById("todayFocusRail");
const weatherDrawer = document.getElementById("weatherDrawer");
const weatherDrawerText = document.getElementById("weatherDrawerText");
const menuBar = document.getElementById("menuBar");
const menuCalendar = document.getElementById("menuCalendar");
const dayStackLayer = document.getElementById("dayStackLayer");
const stickyDay = document.getElementById("stickyDay");
const nowLine = document.getElementById("nowLine");
const nowText = nowLine.querySelector(".timeText");
let hoverGuide = null;
let hoverGuideText = null;

let startDate = defaultTimelineStartDate(new Date());
let shifting = false;
let selectedDateTime = null;
let selectedX = 0;
let selectionMarker = null;
let selectionBar = null;
let selectionLine = null;
let selectAnchorTime = null;
let selectAnchorY = 0;
let selectAnchorX = 0;
const alarms = [];
const googleEvents = [];
const googleEventsById = new Map();
let zoomAnimToken = 0;
let zoomAnchorCorrectionRaf = 0;
let timelineRebuildDeferred = false;
let deferredTimelineScrollTop = NaN;
let selectionLineAnimated = false;
let pointerActive = false;
let modalOverlay = null;
let modalTitle = null;
let modalMessage = null;
let modalInput = null;
let modalConfirmBtn = null;
let modalCancelBtn = null;
let modalOnConfirm = null;
let modalOnCancel = null;
let modalPointerGuardUntil = 0;
let menuOpen = false;
let menuCalendarViewDate = null;
let menuCalendarWheelDelta = 0;
let menuCalendarWheelResetTimer = 0;
let weatherDrawerOpen = false;
let dayStackOpen = false;
let dayStackTransitioning = false;
let dayStackAnimTimer = null;
let dayStackMonthPhaseTimer = null;
let dayStackMonthSlideTimer = null;
let dayStackMonthYearTimer = null;
let dayStackBaseDate = null;
let dayStackEndDate = null;
let dayStackExpandedDate = null;
let dayStackExpandedMonthKey = "";
let dayStackSpread = 0;
let dayStackMonthListMode = false;
let dayStackYearListMode = false;
let dayStackViewMode = DAY_STACK_VIEW_MODE_MONTH_DAY;
let dayStackWindowShiftLock = false;
let hoverGuideEnabled = false;
let hoverPointerInside = false;
let hoverPointerClientX = 0;
let hoverPointerClientY = 0;
let previousViewState = null;
let restoringPreviousView = false;
let weatherRefreshTimer = null;
let weatherCoords = null;
let weatherRequestId = 0;
let googleCalendarConfigured = false;
let googleCalendarConnected = false;
let googleCalendarSyncing = false;
let googleCalendarSyncPromise = null;
let googleCalendarRequestId = 0;
let googleEventsRangeStart = null;
let googleEventsRangeEnd = null;
let localAlarmStoreReady = false;
let localAlarmStoreLoadPromise = null;
let localAlarmStoreSaveChain = Promise.resolve();
let localAlarmStoreRevision = 0;
let userWakeTimePreference = "";
let userSleepDurationMinutes = null;
let stickyDayCacheKey = "";
let dayStackShiftRaf = 0;
let dayStackLastScrollTop = 0;
let dayStackCenterTimer = 0;
let dayStackCenterAnimRaf = 0;
let dayStackShiftIntent = 0;
let dayStackShiftCooldownUntil = 0;
let statusNowBtnPointerClientY = null;
let dayStackBackAnchorDate = null;
let dayStackReturnFocusKey = "";
let dayStackRailFocusKey = "";
let dayStackInlineDraft = null;
let dayStackInlineAlarmView = null;
let todayFocusSuppressNextInlineClick = false;
let timelineHoverSuppressionY = NaN;
let dayStackHoverSuppressionDateKey = "";
let dayStackHoverSuppressionY = NaN;
let dayStackAlarmBundleOpenKey = "";
let dayStackAlarmFocusTimer = 0;
let dayStackRevealToken = 0;
let todayFocusMode = false;
let todayFocusPreferredMinutePx = null;
let todayFocusHourMode = false;
let todayFocusHourStartMinute = NaN;

if (
  !window.OneulStatusRuntime ||
  typeof window.OneulStatusRuntime.createStatusRuntime !== "function"
) {
  throw new Error("Oneul status runtime is not available.");
}

function createStatusRuntimeBindings() {
  return {
    statusGoogleBtn,
    statusWeatherTicker,
    statusWeatherTickerText,
    weatherDrawer,
    weatherDrawerText,
    getWeatherDrawerOpen: () => weatherDrawerOpen,
    setWeatherDrawerOpenState: (value) => {
      weatherDrawerOpen = Boolean(value);
    },
    getWeatherCoords: () => weatherCoords,
    setWeatherCoords: (value) => {
      weatherCoords = value;
    },
    nextWeatherRequestId: () => {
      weatherRequestId += 1;
      return weatherRequestId;
    },
    isWeatherRequestCurrent: (requestId) => requestId === weatherRequestId,
    getWeatherRefreshTimer: () => weatherRefreshTimer,
    setWeatherRefreshTimer: (value) => {
      weatherRefreshTimer = value;
    },
    getGoogleConfigured: () => googleCalendarConfigured,
    setGoogleConfigured: (value) => {
      googleCalendarConfigured = Boolean(value);
    },
    getGoogleConnected: () => googleCalendarConnected,
    setGoogleConnected: (value) => {
      googleCalendarConnected = Boolean(value);
    },
    getGoogleSyncing: () => googleCalendarSyncing,
    setGoogleSyncing: (value) => {
      googleCalendarSyncing = Boolean(value);
    },
    getGoogleSyncPromise: () => googleCalendarSyncPromise,
    setGoogleSyncPromise: (value) => {
      googleCalendarSyncPromise = value;
    },
    nextGoogleRequestId: () => {
      googleCalendarRequestId += 1;
      return googleCalendarRequestId;
    },
    isGoogleRequestCurrent: (requestId) => requestId === googleCalendarRequestId,
    getGoogleRangeStart: () => googleEventsRangeStart,
    getGoogleRangeEnd: () => googleEventsRangeEnd,
    setGoogleRange: (start, end) => {
      googleEventsRangeStart = start;
      googleEventsRangeEnd = end;
    },
    getGoogleEventCount: () => googleEvents.length,
    clearGoogleEvents,
    renderAllAlarmViews,
    replaceGoogleEvents,
    desiredGoogleCalendarRange,
    loadedGoogleRangeCovers,
    fetchJsonWithTimeout,
    showAlert,
    formatDateTimeKorean,
    formatDate,
    constants: {
      WEATHER_FALLBACK_COORDS,
      WEATHER_FETCH_TIMEOUT_MS,
      WEATHER_GEO_TIMEOUT_MS,
      WEATHER_REFRESH_MS,
      GOOGLE_FETCH_TIMEOUT_MS,
      GOOGLE_EVENT_SOURCE,
      GOOGLE_EVENT_DEFAULT_TITLE,
    },
  };
}

const statusRuntime = window.OneulStatusRuntime.createStatusRuntime(
  createStatusRuntimeBindings()
);

if (
  !window.OneulViewActionRuntime ||
  typeof window.OneulViewActionRuntime.createViewActionRuntime !== "function"
) {
  throw new Error("Oneul view action runtime is not available.");
}

function createViewActionBindings() {
  return {
    getTimelineWrap: () => timelineWrap,
    getDayStackLayer: () => dayStackLayer,
    getMenuOpen: () => menuOpen,
    setMenuOpen,
    getWeatherDrawerOpen: () => weatherDrawerOpen,
    setWeatherDrawerOpen,
    getTodayFocusMode: () => todayFocusMode,
    getTodayFocusHourMode: () => todayFocusHourMode,
    getDayStackOpen: () => dayStackOpen,
    getMinutePx: () => minutePx,
    getDayStackViewMode: () => dayStackViewMode,
    getDayStackExpandedDate: () => dayStackExpandedDate,
    getDayStackYearListMode: () => dayStackYearListMode,
    getPreviousViewState: () => previousViewState,
    restorePreviousView,
    enterTodayFocusMode,
    exitTodayFocusHourMode,
    focusDateInDayStack,
    focusTodayInDayStack,
    todayFocusDate,
    setStatusNowBtnPointerClientY: (value) => {
      statusNowBtnPointerClientY = Number.isFinite(value) ? value : null;
    },
    isPointerOnVerticalScrollbar,
    dateTimeFromClientPoint,
    dayStackDateTimeFromClientPoint,
    animateMinutePx,
    collapseExpandedDayStackItem,
    toggleDayStackViewMode,
    openWakeTimePreferencePrompt,
    getGoogleConfigured: () => googleCalendarConfigured,
    getGoogleConnected: () => googleCalendarConnected,
    syncGoogleCalendar,
    showAlert,
    setDayStackOpen,
    constants: {
      BASE_MINUTE_PX,
      ZOOM_MINUTE_PX,
      MAX_ZOOM_MINUTE_PX,
      MINUTE_PX_EPSILON,
      DAY_STACK_VIEW_MODE_MONTH_DAY,
      DAY_STACK_VIEW_MODE_YEAR_MONTH,
    },
  };
}

const viewActionRuntime = window.OneulViewActionRuntime.createViewActionRuntime(
  createViewActionBindings()
);

if (
  !window.OneulTodayFocusRuntime ||
  typeof window.OneulTodayFocusRuntime.createTodayFocusRuntime !== "function"
) {
  throw new Error("Oneul today focus runtime is not available.");
}

function createTodayFocusBindings() {
  return {
    getTimelineWrap: () => timelineWrap,
    getTimeline: () => timeline,
    getTodayFocusRail: () => todayFocusRail,
    getStatusTodayFeatureBtn: () => statusTodayFeatureBtn,
    getStartDate: () => startDate,
    setStartDate: (value) => {
      startDate = value;
    },
    getTodayFocusMode: () => todayFocusMode,
    setTodayFocusModeState: (value) => {
      todayFocusMode = Boolean(value);
    },
    getTodayFocusHourMode: () => todayFocusHourMode,
    setTodayFocusHourModeState: (value) => {
      todayFocusHourMode = Boolean(value);
    },
    getTodayFocusPreferredMinutePx: () => todayFocusPreferredMinutePx,
    setTodayFocusPreferredMinutePx: (value) => {
      todayFocusPreferredMinutePx = Number.isFinite(value) ? value : null;
    },
    setTodayFocusHourStartMinute: (value) => {
      todayFocusHourStartMinute = value;
    },
    getDayStackOpen: () => dayStackOpen,
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
    constants: {
      DAY_MINUTES,
      TODAY_FOCUS_HOUR_STEP_MINUTES,
      BASE_MINUTE_PX,
      getMinutePx: () => minutePx,
    },
  };
}

const todayFocusRuntime = window.OneulTodayFocusRuntime.createTodayFocusRuntime(
  createTodayFocusBindings()
);

function loadPersistedRefreshViewState() {
  try {
    const storage = window.sessionStorage;
    if (!storage) return null;
    const raw = storage.getItem(REFRESH_VIEW_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.todayFocusMode) {
      storage.removeItem(REFRESH_VIEW_STORAGE_KEY);
      return null;
    }
    const focusDate = parseDateKey(parsed.focusDate);
    const hourStartMinute = Number(parsed.todayFocusHourStartMinute);
    const preferredMinutePx = Number(parsed.minutePx);
    const timelineScrollTop = Number(parsed.timelineScrollTop);
    return {
      focusDate:
        focusDate instanceof Date && Number.isFinite(focusDate.getTime())
          ? startOfDay(focusDate)
          : startOfDay(new Date()),
      todayFocusHourMode: Boolean(parsed.todayFocusHourMode),
      todayFocusHourStartMinute: Number.isFinite(hourStartMinute)
        ? Math.max(0, Math.min(DAY_MINUTES - 60, Math.floor(hourStartMinute / 60) * 60))
        : NaN,
      minutePx:
        Number.isFinite(preferredMinutePx) && preferredMinutePx > 0 ? preferredMinutePx : null,
      timelineScrollTop:
        Number.isFinite(timelineScrollTop) && timelineScrollTop > 0 ? timelineScrollTop : 0,
    };
  } catch (_) {
    try {
      window.sessionStorage.removeItem(REFRESH_VIEW_STORAGE_KEY);
    } catch (_) {}
    return null;
  }
}

function persistRefreshViewState() {
  try {
    const storage = window.sessionStorage;
    if (!storage) return;
    if (!todayFocusMode || dayStackOpen) {
      storage.removeItem(REFRESH_VIEW_STORAGE_KEY);
      return;
    }
    const focusDate =
      startDate instanceof Date && Number.isFinite(startDate.getTime())
        ? startOfDay(startDate)
        : startOfDay(new Date());
    const storedMinutePx = Number.isFinite(todayFocusPreferredMinutePx)
      ? todayFocusPreferredMinutePx
      : minutePx;
    storage.setItem(
      REFRESH_VIEW_STORAGE_KEY,
      JSON.stringify({
        todayFocusMode: true,
        focusDate: dateKeyFromDate(focusDate),
        todayFocusHourMode,
        todayFocusHourStartMinute: todayFocusHourMode ? todayFocusSelectedHourStartMinute() : null,
        minutePx: Number.isFinite(storedMinutePx) && storedMinutePx > 0 ? storedMinutePx : null,
        timelineScrollTop: timelineWrap ? Math.max(0, timelineWrap.scrollTop) : 0,
      })
    );
  } catch (_) {}
}

function restorePersistedRefreshViewState() {
  const state = loadPersistedRefreshViewState();
  if (!state) return null;
  setTodayFocusMode(true, { rebuildTimeline: false });
  startDate = state.focusDate;
  setTodayFocusHourMode(false);
  if (state.todayFocusHourMode) {
    const focusDate = state.focusDate;
    const hourStartMinute = Number.isFinite(state.todayFocusHourStartMinute)
      ? state.todayFocusHourStartMinute
      : new Date().getHours() * 60;
    const anchorDateTime = new Date(
      focusDate.getFullYear(),
      focusDate.getMonth(),
      focusDate.getDate(),
      Math.floor(hourStartMinute / 60),
      hourStartMinute % 60,
      0,
      0
    );
    setTodayFocusHourMode(true, anchorDateTime);
  }
  if (Number.isFinite(state.minutePx) && state.minutePx > 0) {
    todayFocusPreferredMinutePx = state.minutePx;
  }
  recalcSizes();
  return state;
}

function timelineVisibleDayCount() {
  return todayFocusMode ? 1 : TOTAL_DAYS;
}

function timelineDayHeaderHeight() {
  return todayFocusMode ? 0 : DAY_BAR_HEIGHT;
}

function defaultTimelineStartDate(baseDate = new Date()) {
  return addDays(startOfDay(baseDate), -DAYS_BEFORE);
}

function timelineNowOffset() {
  return todayFocusMode ? 12 : NOW_OFFSET;
}

function todayFocusDate() {
  return startDate instanceof Date ? startOfDay(startDate) : startOfDay(new Date());
}

function todayFocusDateKey() {
  return dateKeyFromDate(todayFocusDate());
}

function todayFocusSelectedHourStartMinute() {
  const raw = Number.isFinite(todayFocusHourStartMinute) ? Math.trunc(todayFocusHourStartMinute) : NaN;
  if (Number.isFinite(raw)) {
    return Math.max(0, Math.min(DAY_MINUTES - 60, Math.floor(raw / 60) * 60));
  }
  return new Date().getHours() * 60;
}

function todayFocusSelectedHourDateTime() {
  const date = todayFocusDate();
  const totalMinutes = todayFocusSelectedHourStartMinute();
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    Math.floor(totalMinutes / 60),
    totalMinutes % 60,
    0,
    0
  );
}

function todayFocusHeaderHeight() {
  return todayFocusHourMode ? DAY_BAR_HEIGHT : 0;
}

function todayFocusHourVerticalPadding() {
  return todayFocusHourMode ? TODAY_FOCUS_HOUR_VERTICAL_PADDING_PX : 0;
}

function todayFocusUsesInlineHostForKey(itemDateKey = "") {
  return Boolean(todayFocusMode && !dayStackOpen && itemDateKey && itemDateKey === todayFocusDateKey());
}

function todayFocusRenderedYForBaseY(baseY) {
  const renderedY = dayStackRenderedYForItem(baseY, todayFocusDateKey());
  return renderedY + todayFocusHourVerticalPadding();
}

function todayFocusBaseYFromRenderedY(renderedY) {
  const itemDateKey = todayFocusDateKey();
  if (!todayFocusHourMode) {
    return dayStackBaseYForItem(renderedY, itemDateKey);
  }
  const hourStartBaseY = todayFocusSelectedHourStartMinute() * minutePx;
  const hourEndBaseY = (todayFocusSelectedHourStartMinute() + 60) * minutePx;
  const minRenderedY = dayStackRenderedYForItem(hourStartBaseY, itemDateKey);
  const maxRenderedY = dayStackRenderedYForItem(hourEndBaseY, itemDateKey);
  const adjustedY = renderedY - todayFocusHourVerticalPadding();
  const clampedY = Math.max(minRenderedY, Math.min(maxRenderedY, adjustedY));
  return dayStackBaseYForItem(clampedY, itemDateKey);
}

function todayFocusTimelineHeight() {
  return Math.max(
    dayBlockHeight,
    dayStackRenderedMaxYForItem(todayFocusDateKey()) + todayFocusHourVerticalPadding() * 2
  );
}

function todayFocusMinimumMinutePx() {
  const fittedMinutePx = todayFocusFittedMinutePx();
  if (fittedMinutePx <= 0) return BASE_MINUTE_PX;
  return Math.max(BASE_MINUTE_PX, fittedMinutePx);
}

function todayFocusFittedMinutePx() {
  if (!todayFocusMode || !timelineWrap) return 0;
  const viewportHeight = Math.max(
    0,
    timelineWrap.clientHeight -
      timelineDayHeaderHeight() -
      todayFocusHeaderHeight() -
      todayFocusHourVerticalPadding() * 2
  );
  if (!Number.isFinite(viewportHeight) || viewportHeight <= 0) return 0;
  return viewportHeight / (todayFocusHourMode ? 60 : DAY_MINUTES);
}

function applyTodayFocusFittedScale() {
  const minimumMinutePx = todayFocusMinimumMinutePx();
  const preferredMinutePx = Number.isFinite(todayFocusPreferredMinutePx)
    ? todayFocusPreferredMinutePx
    : 0;
  minutePx = Math.max(minimumMinutePx, preferredMinutePx || 0);
}

function recalcSizes() {
  if (todayFocusMode) {
    applyTodayFocusFittedScale();
  }
  dayBlockHeight = timelineDayHeaderHeight() + DAY_MINUTES * minutePx;
  hourHeight = 60 * minutePx;
  if (dayStackLayer) {
    dayStackLayer.style.setProperty("--stack-day-body-height", `${DAY_MINUTES * minutePx}px`);
    dayStackLayer.style.setProperty("--stack-hour-height", `${hourHeight}px`);
  }
}

function isPointerOnVerticalScrollbar(element, clientX) {
  if (!element || !Number.isFinite(clientX)) return false;
  const scrollbarWidth = element.offsetWidth - element.clientWidth;
  if (!Number.isFinite(scrollbarWidth) || scrollbarWidth <= 0) return false;
  const rect = element.getBoundingClientRect();
  return clientX >= rect.right - scrollbarWidth;
}

function nextDblClickZoomMinutePx(value) {
  if (!Number.isFinite(value)) return ZOOM_MINUTE_PX;
  if (value < ZOOM_MINUTE_PX - MINUTE_PX_EPSILON) return ZOOM_MINUTE_PX;
  if (value < MAX_ZOOM_MINUTE_PX - MINUTE_PX_EPSILON) return MAX_ZOOM_MINUTE_PX;
  return MAX_ZOOM_MINUTE_PX;
}

function startOfHour(dateTime) {
  if (!(dateTime instanceof Date) || !Number.isFinite(dateTime.getTime())) {
    return new Date();
  }
  return new Date(
    dateTime.getFullYear(),
    dateTime.getMonth(),
    dateTime.getDate(),
    dateTime.getHours(),
    0,
    0,
    0
  );
}

function timelineRenderYForDateTime(dateTime) {
  if (!(dateTime instanceof Date) || !Number.isFinite(dateTime.getTime())) return 0;
  const dayIndex = diffDays(startOfDay(dateTime), startDate);
  const minutes =
    dateTime.getHours() * 60 +
    dateTime.getMinutes() +
    dateTime.getSeconds() / 60;
  if (todayFocusMode) {
    return todayFocusRenderedYForBaseY(minutes * minutePx);
  }
  return dayIndex * dayBlockHeight + timelineDayHeaderHeight() + minutes * minutePx;
}

function timelineRenderedYForTotalMinutes(totalMinutes) {
  const safeTotal = Number.isFinite(totalMinutes) ? Math.max(0, totalMinutes) : 0;
  const dayIndex = Math.floor(safeTotal / DAY_MINUTES);
  const minuteOfDay = safeTotal - dayIndex * DAY_MINUTES;
  const baseY = minuteOfDay * minutePx;
  if (todayFocusMode) {
    return todayFocusRenderedYForBaseY(baseY);
  }
  return dayIndex * dayBlockHeight + timelineDayHeaderHeight() + baseY;
}

function timelineDateTimeFromClientY(clientY, fallbackDateTime = null) {
  if (!timelineWrap || !timeline || !Number.isFinite(clientY)) {
    return fallbackDateTime instanceof Date && Number.isFinite(fallbackDateTime.getTime())
      ? new Date(fallbackDateTime.getTime())
      : new Date();
  }
  const rect = timelineWrap.getBoundingClientRect();
  const timelineOffset = timeline.offsetTop;
  const rawY = clientY - rect.top + timelineWrap.scrollTop - timelineOffset;
  const clampedY = Math.max(0, rawY);
  const totalMinutes = Math.max(0, minutesForY(clampedY));
  let dayIndex = Math.floor(totalMinutes / DAY_MINUTES);
  let minuteOfDay = totalMinutes - dayIndex * DAY_MINUTES;
  if (minuteOfDay < 0) minuteOfDay = 0;
  let hour = Math.floor(minuteOfDay / 60);
  let minute = Math.floor(minuteOfDay - hour * 60);
  let second = Math.round((minuteOfDay - hour * 60 - minute) * 60);

  if (second === 60) {
    second = 0;
    minute += 1;
  }
  if (minute === 60) {
    minute = 0;
    hour += 1;
  }
  if (hour === 24) {
    hour = 0;
    dayIndex += 1;
  }

  const date = addDays(startDate, dayIndex);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hour,
    minute,
    second,
    0
  );
}

function alignTimelineToDateTime(dateTime, anchorClientY) {
  if (!timelineWrap || !timeline) return;
  const rect = timelineWrap.getBoundingClientRect();
  const timelineOffset = timeline.offsetTop;
  const anchorOffset =
    typeof anchorClientY === "number"
      ? anchorClientY - rect.top
      : timelineWrap.clientHeight / 2;
  const y = timelineRenderYForDateTime(dateTime);
  const maxScroll = Math.max(0, timeline.scrollHeight - timelineWrap.clientHeight);
  timelineWrap.scrollTop = Math.max(0, Math.min(maxScroll, timelineOffset + y - anchorOffset));
  updateTodayFocusRailLayout();
  updateStickyDay();
  updateTime();
}

function scheduleZoomAnchorCorrection(
  value,
  anchorClientY,
  timelineAnchorTotalMinutes,
  stackAnchorKey = "",
  stackAnchorTotalMinutes = NaN
) {
  if (zoomAnchorCorrectionRaf) {
    cancelAnimationFrame(zoomAnchorCorrectionRaf);
    zoomAnchorCorrectionRaf = 0;
  }
  const expectedValue = value;
  const expectedClientY = anchorClientY;
  const expectedTimelineAnchorTotalMinutes = Number.isFinite(timelineAnchorTotalMinutes)
    ? timelineAnchorTotalMinutes
    : 0;
  const expectedStackAnchorKey = typeof stackAnchorKey === "string" ? stackAnchorKey : "";
  const expectedStackAnchorTotalMinutes = Number.isFinite(stackAnchorTotalMinutes)
    ? stackAnchorTotalMinutes
    : NaN;
  zoomAnchorCorrectionRaf = requestAnimationFrame(() => {
    zoomAnchorCorrectionRaf = 0;
    if (!timelineWrap || Math.abs(minutePx - expectedValue) >= MINUTE_PX_EPSILON) return;

    const rect = timelineWrap.getBoundingClientRect();
    const timelineOffset = timeline.offsetTop;
    const timelineAnchorOffset =
      typeof expectedClientY === "number"
        ? expectedClientY - rect.top
        : timelineWrap.clientHeight / 2;
    const timelineTarget =
      timelineOffset +
      timelineRenderedYForTotalMinutes(expectedTimelineAnchorTotalMinutes) -
      timelineAnchorOffset;
    const timelineMaxScroll = Math.max(0, timelineWrap.scrollHeight - timelineWrap.clientHeight);
    timelineWrap.scrollTop = Math.max(0, Math.min(timelineMaxScroll, timelineTarget));

    if (!dayStackOpen || !dayStackLayer) return;
    const effectiveStackKey =
      expectedStackAnchorKey ||
      (typeof dayStackExpandedDate === "string" ? dayStackExpandedDate : "");
    if (!effectiveStackKey) return;
    const expandedItem = dayStackLayer.querySelector(`.dayStackItem[data-date="${effectiveStackKey}"]`);
    if (!expandedItem) return;
    const stackAnchorOffset = dayStackOffsetForClientY(
      expectedClientY,
      dayStackLayer.clientHeight / 2
    );
    const targetTop =
      scrollTopForDayStackItem(expandedItem) +
      DAY_BAR_HEIGHT +
      dayStackRenderedYForItem(
        Math.max(0, expectedStackAnchorTotalMinutes || 0) * minutePx,
        effectiveStackKey
      ) -
      stackAnchorOffset;
    setDayStackScrollTop(targetTop);
  });
}

function setMinutePx(value, anchorDateTime, anchorClientY) {
  if (Math.abs(minutePx - value) < MINUTE_PX_EPSILON) return;
  if (todayFocusMode && !dayStackOpen) {
    todayFocusPreferredMinutePx = value;
  }
  const stackWasOpen = dayStackOpen;
  const stackScrollTop = dayStackLayer ? dayStackLayer.scrollTop : 0;
  const stackExpandedDate = dayStackExpandedDate;
  const stackAnchorKey =
    stackWasOpen && anchorDateTime instanceof Date
      ? dateKeyFromDate(anchorDateTime)
      : stackExpandedDate;
  const stackAnchorMinutes =
    anchorDateTime instanceof Date
      ? anchorDateTime.getHours() * 60 +
        anchorDateTime.getMinutes() +
        anchorDateTime.getSeconds() / 60
      : 0;
  const rect = timelineWrap.getBoundingClientRect();
  const timelineOffset = timeline.offsetTop;
  const anchorOffset =
    typeof anchorClientY === "number"
      ? anchorClientY - rect.top
      : timelineWrap.clientHeight / 2;
  const timelineAnchorTotalMinutes = minutesForY(
    Math.max(0, anchorOffset + timelineWrap.scrollTop - timelineOffset)
  );
  const stackAnchorOffset =
    stackWasOpen && dayStackLayer
      ? dayStackOffsetForClientY(
          anchorClientY,
          dayStackLayer ? dayStackLayer.clientHeight / 2 : 0
        )
      : 0;
  let stackAnchorTotalMinutes = stackAnchorMinutes;
  if (stackWasOpen && dayStackLayer && stackAnchorKey) {
    const stackAnchorItem = dayStackLayer.querySelector(`.dayStackItem[data-date="${stackAnchorKey}"]`);
    if (stackAnchorItem) {
      const itemTop = scrollTopForDayStackItem(stackAnchorItem);
      const renderedY =
        stackScrollTop + stackAnchorOffset - itemTop - DAY_BAR_HEIGHT;
      stackAnchorTotalMinutes = dayStackBaseYForItem(renderedY, stackAnchorKey) / minutePx;
    }
  }
  minutePx = value;
  if (timelineWrap) {
    timelineWrap.classList.toggle(
      "zooming",
      Math.abs(minutePx - BASE_MINUTE_PX) >= MINUTE_PX_EPSILON
    );
  }
  recalcSizes();
  const y = timelineRenderedYForTotalMinutes(timelineAnchorTotalMinutes);
  const nextTimelineScrollTop = Math.max(0, timelineOffset + y - anchorOffset);
  if (stackWasOpen) {
    timelineRebuildDeferred = true;
    deferredTimelineScrollTop = nextTimelineScrollTop;
  } else {
    buildTimeline();
    timelineWrap.scrollTop = nextTimelineScrollTop;
  }
  if (stackWasOpen && dayStackLayer) {
    const refreshedStackLayout = refreshDayStackZoomLayout();
    if (!refreshedStackLayout) {
      renderDayStack({ preserveAnchorPosition: false });
    }
    if (stackExpandedDate) {
      const anchorKey = stackAnchorKey;
      const expandedItem = dayStackLayer.querySelector(`.dayStackItem[data-date="${anchorKey}"]`);
      if (expandedItem) {
        const yWithinItem =
          DAY_BAR_HEIGHT +
          dayStackRenderedYForItem(
            Math.max(0, stackAnchorTotalMinutes || 0) * minutePx,
            anchorKey
          );
        setDayStackScrollTop(scrollTopForDayStackItem(expandedItem) + yWithinItem - stackAnchorOffset);
      } else {
        setDayStackScrollTop(stackScrollTop);
      }
    } else {
      setDayStackScrollTop(stackScrollTop);
    }
  }
  updateStickyDay();
  updateTime();
  scheduleZoomAnchorCorrection(
    value,
    anchorClientY,
    timelineAnchorTotalMinutes,
    stackWasOpen ? stackAnchorKey : "",
    stackWasOpen ? stackAnchorTotalMinutes : NaN
  );
  persistRefreshViewState();
}

function clearZoomPreview() {
  if (!timelineWrap) return;
  timelineWrap.classList.remove("zoom-preview");
  timelineWrap.style.removeProperty("--zoom-preview-scale");
  timelineWrap.style.removeProperty("--zoom-preview-origin-y");
  timelineWrap.style.removeProperty("--zoom-preview-duration");
}

function zoomPreviewOriginY(anchorClientY) {
  if (!Number.isFinite(anchorClientY)) return 0;
  if (dayStackOpen && dayStackLayer) {
    const expandedItem = expandedDayStackItem();
    const body = expandedItem ? expandedItem.querySelector(".dayStackBody") : null;
    if (body) {
      return Math.max(0, anchorClientY - body.getBoundingClientRect().top);
    }
    const layerRect = dayStackLayer.getBoundingClientRect();
    return Math.max(0, anchorClientY - layerRect.top);
  }
  if (!timelineWrap || !timeline) return 0;
  const rect = timelineWrap.getBoundingClientRect();
  return Math.max(0, anchorClientY - rect.top + timelineWrap.scrollTop - timeline.offsetTop);
}

function applyZoomPreview(from, to, anchorClientY, duration) {
  if (!timelineWrap || !Number.isFinite(from) || !Number.isFinite(to) || from <= 0 || to <= 0) {
    return false;
  }
  const scale = Math.max(0.25, Math.min(4, to / from));
  if (!Number.isFinite(scale) || Math.abs(scale - 1) < 0.001) return false;
  timelineWrap.style.setProperty("--zoom-preview-scale", scale.toFixed(4));
  timelineWrap.style.setProperty(
    "--zoom-preview-origin-y",
    `${zoomPreviewOriginY(anchorClientY).toFixed(2)}px`
  );
  timelineWrap.style.setProperty("--zoom-preview-duration", `${Math.max(0, duration).toFixed(0)}ms`);
  timelineWrap.classList.add("zoom-preview");
  return true;
}

function animateMinutePx(value, anchorDateTime, anchorClientY) {
  if (Math.abs(minutePx - value) < MINUTE_PX_EPSILON) return;
  if (dayStackOpen) {
    clearDayStackCenterTimer();
  }
  clearZoomPreview();
  const from = minutePx;
  const to = value;
  if (Math.abs(from - to) < MINUTE_PX_EPSILON) {
    timelineWrap.classList.toggle("zooming", Math.abs(value - BASE_MINUTE_PX) >= MINUTE_PX_EPSILON);
    return;
  }
  const start = performance.now();
  const zoomingIn = to > from;
  const targetIsZoomed = Math.abs(to - BASE_MINUTE_PX) >= MINUTE_PX_EPSILON;
  const keepZoomClassDuringAnim =
    Math.abs(from - BASE_MINUTE_PX) >= MINUTE_PX_EPSILON || targetIsZoomed;
  const duration = zoomingIn ? ZOOM_IN_DURATION_MS : ZOOM_OUT_DURATION_MS;
  zoomAnimToken += 1;
  const token = zoomAnimToken;
  let lastRenderStep = 0;
  timelineWrap.classList.toggle("zooming", keepZoomClassDuringAnim);
  applyZoomPreview(from, to, anchorClientY, duration);

  const step = (now) => {
    if (token !== zoomAnimToken) return;
    const t = Math.min(1, (now - start) / duration);
    const renderStep =
      t >= 1 ? ZOOM_ANIMATION_RENDER_STEPS : Math.floor(t * ZOOM_ANIMATION_RENDER_STEPS);
    if (renderStep > lastRenderStep) {
      lastRenderStep = renderStep;
      const renderT = Math.min(1, renderStep / ZOOM_ANIMATION_RENDER_STEPS);
      const eased = renderT * renderT * (3 - 2 * renderT);
      const next = renderStep >= ZOOM_ANIMATION_RENDER_STEPS ? to : from + (to - from) * eased;
      clearZoomPreview();
      setMinutePx(next, anchorDateTime, anchorClientY);
    }
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      clearZoomPreview();
      timelineWrap.classList.toggle("zooming", targetIsZoomed);
    }
  };
  requestAnimationFrame(step);
}
function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function diffDays(a, b) {
  return Math.round((startOfDay(a) - startOfDay(b)) / 86400000);
}

function clampDateBetween(date, minDate, maxDate) {
  const d = startOfDay(date);
  if (d.getTime() < minDate.getTime()) return new Date(minDate);
  if (d.getTime() > maxDate.getTime()) return new Date(maxDate);
  return d;
}

function clampDayStackDate(date) {
  return clampDateBetween(
    date instanceof Date ? date : new Date(),
    DAY_STACK_RANGE_START,
    DAY_STACK_RANGE_END
  );
}

function dayStackRangeDays() {
  return diffDays(DAY_STACK_RANGE_END, DAY_STACK_RANGE_START) + 1;
}

function dayStackWindowDays() {
  return Math.max(1, Math.min(Math.max(DAY_STACK_TOTAL_DAYS, DAY_STACK_MIN_TOTAL_DAYS), dayStackRangeDays()));
}

function normalizedDayStackWindowDays(requestedDays) {
  const fallback = Math.max(DAY_STACK_TOTAL_DAYS, DAY_STACK_MIN_TOTAL_DAYS);
  const base = Number.isFinite(requestedDays) ? Math.floor(requestedDays) : fallback;
  return Math.max(1, Math.min(base, dayStackRangeDays()));
}

function isDayStackWindowValid() {
  if (!(dayStackBaseDate instanceof Date) || !(dayStackEndDate instanceof Date)) return false;
  return dayStackBaseDate.getTime() <= dayStackEndDate.getTime();
}

function ensureDayStackWindow(anchorDate, requestedWindowDays = null) {
  const anchor = clampDayStackDate(anchorDate instanceof Date ? anchorDate : new Date());
  const windowDays = normalizedDayStackWindowDays(requestedWindowDays);
  const maxBefore = Math.max(0, windowDays - 1);
  const before = Math.min(DAY_STACK_BEFORE_DAYS, maxBefore);
  let start = addDays(anchor, -before);
  let end = addDays(start, windowDays - 1);

  if (start.getTime() < DAY_STACK_RANGE_START.getTime()) {
    start = new Date(DAY_STACK_RANGE_START);
    end = addDays(start, windowDays - 1);
  }
  if (end.getTime() > DAY_STACK_RANGE_END.getTime()) {
    end = new Date(DAY_STACK_RANGE_END);
    start = addDays(end, -(windowDays - 1));
  }
  if (start.getTime() < DAY_STACK_RANGE_START.getTime()) {
    start = new Date(DAY_STACK_RANGE_START);
  }
  if (end.getTime() > DAY_STACK_RANGE_END.getTime()) {
    end = new Date(DAY_STACK_RANGE_END);
  }

  dayStackBaseDate = startOfDay(start);
  dayStackEndDate = startOfDay(end);
}

function pad2(num) {
  return String(num).padStart(2, "0");
}

function formatTime(now) {
  let hour = now.getHours();
  const ampm = hour < 12 ? "AM" : "PM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${ampm} ${hour}:${pad2(now.getMinutes())}`;
}

const WEEKDAY_KR = ["\uC77C", "\uC6D4", "\uD654", "\uC218", "\uBAA9", "\uAE08", "\uD1A0"];

function formatDate(date) {
  return `${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${WEEKDAY_KR[date.getDay()]}`;
}

function formatYearListAge(year) {
  const age = Number(year) - YEAR_LIST_AGE_ZERO_YEAR;
  return age >= 0 ? `${age}세` : "";
}

function parseIsoDateOnly(raw) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(raw || ""));
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
}

function googleEventDateTimeValue(event) {
  if (!event || typeof event !== "object") return null;
  if (event.allDay) {
    return parseIsoDateOnly(event.start);
  }
  const parsed = new Date(event.start);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function googleEventEndDateTimeValue(event) {
  if (!event || typeof event !== "object") return null;
  if (event.allDay) {
    const endDate = parseIsoDateOnly(event.end);
    if (endDate) return endDate;
    const startDate = parseIsoDateOnly(event.start);
    return startDate ? addDays(startDate, 1) : null;
  }
  const parsed = new Date(event.end);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function googleEventDisplayTitle(event) {
  const title = event && typeof event.title === "string" ? event.title.trim() : "";
  return title || GOOGLE_EVENT_DEFAULT_TITLE;
}

function scheduleEntrySourceOrder(entry) {
  return entry && entry.source === GOOGLE_EVENT_SOURCE ? 1 : 0;
}

function compareScheduleEntries(a, b, positionKey = "baseY") {
  const aPosition = Number(a && a[positionKey]);
  const bPosition = Number(b && b[positionKey]);
  if (Number.isFinite(aPosition) && Number.isFinite(bPosition) && Math.abs(aPosition - bPosition) > 0.001) {
    return aPosition - bPosition;
  }
  const sourceDelta = scheduleEntrySourceOrder(a) - scheduleEntrySourceOrder(b);
  if (sourceDelta !== 0) return sourceDelta;
  const aIndex = Number.isFinite(a && a.alarmIndex) ? Math.trunc(a.alarmIndex) : Number.MAX_SAFE_INTEGER;
  const bIndex = Number.isFinite(b && b.alarmIndex) ? Math.trunc(b.alarmIndex) : Number.MAX_SAFE_INTEGER;
  if (aIndex !== bIndex) return aIndex - bIndex;
  const aId = a && typeof a.eventId === "string" ? a.eventId : "";
  const bId = b && typeof b.eventId === "string" ? b.eventId : "";
  if (aId !== bId) return aId.localeCompare(bId);
  const aTitle = a && typeof a.title === "string" ? a.title : "";
  const bTitle = b && typeof b.title === "string" ? b.title : "";
  return aTitle.localeCompare(bTitle);
}

function scheduleEntryDisplayTitle(entry) {
  const title = entry && typeof entry.title === "string" ? entry.title.trim() : "";
  if (title) return title;
  return entry && entry.source === GOOGLE_EVENT_SOURCE ? GOOGLE_EVENT_DEFAULT_TITLE : "\uC54C\uB9BC";
}

function scheduleEntryTimeText(entry) {
  if (!entry || !(entry.alarmTime instanceof Date) || !Number.isFinite(entry.alarmTime.getTime())) {
    return "";
  }
  if (entry.source === GOOGLE_EVENT_SOURCE && entry.allDay) {
    return "\uC885\uC77C";
  }
  return formatDateTimeKorean(
    entry.alarmTime,
    entry.alarmTime.getHours(),
    entry.alarmTime.getMinutes(),
    entry.alarmTime.getSeconds()
  );
}

function scheduleEntryCompactLabel(entry) {
  const timeText = scheduleEntryTimeText(entry);
  const hasTitle = Boolean(entry && typeof entry.title === "string" && entry.title.trim());
  if (!hasTitle && entry && entry.source !== GOOGLE_EVENT_SOURCE) {
    return timeText;
  }
  const titleText = scheduleEntryDisplayTitle(entry);
  return timeText ? `${timeText} \u00b7 ${titleText}` : titleText;
}

function appendScheduleEntryLabel(label, entry, timeClassName, titleClassName) {
  if (!label) return;
  label.textContent = "";
  const timeEl = document.createElement("div");
  timeEl.className = timeClassName;
  timeEl.textContent = scheduleEntryTimeText(entry);
  const titleEl = document.createElement("div");
  titleEl.className = titleClassName;
  titleEl.textContent = scheduleEntryDisplayTitle(entry);
  label.append(timeEl, titleEl);
}

function scheduleEntryTimeValue(entry) {
  if (entry && entry.time instanceof Date && Number.isFinite(entry.time.getTime())) {
    return new Date(entry.time.getTime());
  }
  if (entry && entry.alarmTime instanceof Date && Number.isFinite(entry.alarmTime.getTime())) {
    return new Date(entry.alarmTime.getTime());
  }
  return null;
}

function normalizeGoogleCalendarItem(item) {
  if (!item || typeof item !== "object") return null;
  const normalized = {
    id:
      typeof item.id === "string" && item.id
        ? item.id
        : `${String(item.start || "")}|${String(item.title || "")}`,
    title: typeof item.title === "string" ? item.title : "",
    start: typeof item.start === "string" ? item.start : "",
    end: typeof item.end === "string" ? item.end : "",
    allDay: Boolean(item.allDay),
    htmlLink: typeof item.htmlLink === "string" ? item.htmlLink : "",
    status: typeof item.status === "string" ? item.status : "confirmed",
  };
  const startDateTime = googleEventDateTimeValue(normalized);
  return startDateTime instanceof Date && Number.isFinite(startDateTime.getTime()) ? normalized : null;
}

function replaceGoogleEvents(items) {
  googleEvents.length = 0;
  googleEventsById.clear();
  if (!Array.isArray(items)) return;
  items.forEach((item) => {
    const normalized = normalizeGoogleCalendarItem(item);
    if (!normalized) return;
    googleEvents.push(normalized);
    googleEventsById.set(normalized.id, normalized);
  });
}

function clearGoogleEvents() {
  googleEvents.length = 0;
  googleEventsById.clear();
  googleEventsRangeStart = null;
  googleEventsRangeEnd = null;
}

function desiredGoogleCalendarRange() {
  let rangeStart = addDays(startOfDay(startDate), -GOOGLE_RANGE_BEFORE_DAYS);
  let rangeEnd = addDays(startOfDay(startDate), timelineVisibleDayCount() + GOOGLE_RANGE_AFTER_DAYS);
  const expandedDate = parseDateKey(dayStackExpandedDate);
  if (expandedDate) {
    rangeStart = new Date(Math.min(rangeStart.getTime(), addDays(expandedDate, -GOOGLE_RANGE_BEFORE_DAYS).getTime()));
    rangeEnd = new Date(Math.max(rangeEnd.getTime(), addDays(expandedDate, GOOGLE_RANGE_AFTER_DAYS).getTime()));
  }
  if (dayStackBackAnchorDate instanceof Date && Number.isFinite(dayStackBackAnchorDate.getTime())) {
    rangeStart = new Date(
      Math.min(rangeStart.getTime(), addDays(dayStackBackAnchorDate, -GOOGLE_RANGE_BEFORE_DAYS).getTime())
    );
    rangeEnd = new Date(
      Math.max(rangeEnd.getTime(), addDays(dayStackBackAnchorDate, GOOGLE_RANGE_AFTER_DAYS).getTime())
    );
  }
  return {
    start: startOfDay(rangeStart),
    end: addDays(startOfDay(rangeEnd), 1),
  };
}

function loadedGoogleRangeCovers(start, end) {
  return Boolean(
    googleEventsRangeStart instanceof Date &&
      googleEventsRangeEnd instanceof Date &&
      start instanceof Date &&
      end instanceof Date &&
      start.getTime() >= googleEventsRangeStart.getTime() &&
      end.getTime() <= googleEventsRangeEnd.getTime()
  );
}

function updateGoogleCalendarButton() {
  return statusRuntime.updateGoogleCalendarButton();
  if (!statusGoogleBtn) return;
  let title = "";
  const disabled = googleCalendarSyncing;
  if (!googleCalendarConfigured) {
    title = "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET \uC124\uC815\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.";
  } else if (googleCalendarSyncing) {
    title = "Google \uC77C\uC815\uC744 \uAC00\uC838\uC624\uB294 \uC911\uC785\uB2C8\uB2E4.";
  } else if (!googleCalendarConnected) {
    title = "Google \uCE98\uB9B0\uB354 \uC77D\uAE30 \uC804\uC6A9 \uC5F0\uACB0";
  } else {
    title =
      googleEvents.length > 0
        ? `Google \uC77C\uC815 ${googleEvents.length}\uAC1C \uB3D9\uAE30\uD654 \uC644\uB8CC`
        : "Google \uC77C\uC815 \uC0C8\uB85C\uACE0\uCE68";
  }
  statusGoogleBtn.textContent = "G";
  statusGoogleBtn.title = title;
  statusGoogleBtn.disabled = disabled;
  statusGoogleBtn.classList.toggle("is-active", googleCalendarConnected);
  statusGoogleBtn.classList.toggle("is-busy", googleCalendarSyncing);
  statusGoogleBtn.setAttribute("aria-busy", googleCalendarSyncing ? "true" : "false");
  statusGoogleBtn.setAttribute("aria-label", title || "Google 캘린더");
}

function formatStatusRight(date) {
  let hour = date.getHours();
  const ampm = hour < 12 ? "AM" : "PM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return {
    date: `${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`,
    weekday: WEEKDAY_KR[date.getDay()],
    ampm,
    hour: String(hour),
    minute: pad2(date.getMinutes()),
    second: pad2(date.getSeconds()),
  };
}

function formatDateParts(date) {
  return {
    date: `${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`,
    weekday: WEEKDAY_KR[date.getDay()],
  };
}

function menuCalendarFocusDate() {
  const expandedDate = parseDateKey(dayStackExpandedDate);
  if (expandedDate) return expandedDate;
  const returnFocusDate = parseDateKey(dayStackReturnFocusKey);
  if (returnFocusDate) return returnFocusDate;
  if (dayStackBackAnchorDate instanceof Date && Number.isFinite(dayStackBackAnchorDate.getTime())) {
    return startOfDay(dayStackBackAnchorDate);
  }
  return startOfDay(new Date());
}

function menuCalendarMonthLabel(date) {
  return `${date.getFullYear()}.${pad2(date.getMonth() + 1)}`;
}

function menuCalendarFocusLabel(date) {
  return `${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${WEEKDAY_KR[date.getDay()]}`;
}

function menuCalendarMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function menuCalendarVisibleMonthDate() {
  if (menuCalendarViewDate instanceof Date && Number.isFinite(menuCalendarViewDate.getTime())) {
    return menuCalendarMonthStart(menuCalendarViewDate);
  }
  return menuCalendarMonthStart(menuCalendarFocusDate());
}

function renderMenuCalendar() {
  if (!menuCalendar) return;

  const focusDate = menuCalendarFocusDate();
  const monthStart = menuCalendarVisibleMonthDate();
  const gridStart = addDays(monthStart, -monthStart.getDay());
  const todayKey = dateKeyFromDate(startOfDay(new Date()));
  const selectedKey = dateKeyFromDate(focusDate);
  const renderSignature = `${dateKeyFromDate(monthStart)}|${selectedKey}|${todayKey}`;
  if (menuCalendar.dataset.renderSignature === renderSignature) {
    return;
  }

  const header = document.createElement("div");
  header.className = "menuCalendarHeader";

  const headerMain = document.createElement("div");
  headerMain.className = "menuCalendarHeaderMain";

  const monthLabel = document.createElement("div");
  monthLabel.className = "menuCalendarMonthLabel";
  monthLabel.textContent = menuCalendarMonthLabel(monthStart);
  headerMain.appendChild(monthLabel);

  const focusLabel = document.createElement("div");
  focusLabel.className = "menuCalendarFocusLabel";
  focusLabel.textContent = menuCalendarFocusLabel(focusDate);
  headerMain.appendChild(focusLabel);

  const nav = document.createElement("div");
  nav.className = "menuCalendarNav";

  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.className = "menuCalendarNavBtn";
  prevBtn.textContent = "<";
  prevBtn.setAttribute("aria-label", "이전달 보기");
  prevBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    menuCalendarViewDate = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1);
    renderMenuCalendar();
  });
  nav.appendChild(prevBtn);

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "menuCalendarNavBtn";
  nextBtn.textContent = ">";
  nextBtn.setAttribute("aria-label", "다음달 보기");
  nextBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    menuCalendarViewDate = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
    renderMenuCalendar();
  });
  nav.appendChild(nextBtn);

  header.appendChild(headerMain);
  header.appendChild(nav);

  const weekdayRow = document.createElement("div");
  weekdayRow.className = "menuCalendarWeekdays";
  WEEKDAY_KR.forEach((weekday) => {
    const cell = document.createElement("div");
    cell.className = "menuCalendarWeekday";
    cell.textContent = weekday;
    weekdayRow.appendChild(cell);
  });

  const grid = document.createElement("div");
  grid.className = "menuCalendarGrid";

  for (let index = 0; index < 42; index += 1) {
    const date = addDays(gridStart, index);
    const key = dateKeyFromDate(date);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "menuCalendarDay";
    button.textContent = String(date.getDate());
    button.dataset.date = key;
    button.setAttribute("aria-label", `${menuCalendarFocusLabel(date)}로 이동`);
    button.classList.toggle("is-outside", date.getMonth() !== monthStart.getMonth());
    button.classList.toggle("is-weekend", date.getDay() === 0 || date.getDay() === 6);
    button.classList.toggle("is-today", key === todayKey);
    button.classList.toggle("is-selected", key === selectedKey);
    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      menuCalendarViewDate = new Date(date.getFullYear(), date.getMonth(), 1);
      setWeatherDrawerOpen(false);
      focusDateInDayStack(date, { expand: true });
    });
    grid.appendChild(button);
  }

  menuCalendar.replaceChildren(header, weekdayRow, grid);
  menuCalendar.dataset.renderSignature = renderSignature;
}

function dateKeyFromDate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseDateKey(raw) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(raw || ""));
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const d = new Date(year, month - 1, day);
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return null;
  }
  return d;
}

function monthShortLabel(date) {
  return pad2(date.getMonth() + 1);
}

function monthRailAriaLabel(monthDate, expanded = false) {
  if (!(monthDate instanceof Date) || Number.isNaN(monthDate.getTime())) return "월 토글";
  return `${monthDate.getFullYear()}년 ${monthDate.getMonth() + 1}월 ${expanded ? "접기" : "펼치기"}`;
}

function formatHourMinuteLabel(totalMinutes) {
  const minuteInt = Math.max(0, Math.floor(totalMinutes));
  const dayMinute = ((minuteInt % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  const hour24 = Math.floor(dayMinute / 60);
  const minute = dayMinute % 60;
  const ampm = hour24 < 12 ? "AM" : "PM";
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return `${ampm} ${hour12}:${pad2(minute)}`;
}

function setMeridiemTimeLabel(element, totalMinutes) {
  if (!element) return;
  const label = formatHourMinuteLabel(totalMinutes);
  const splitIndex = label.indexOf(" ");
  if (splitIndex <= 0) {
    element.textContent = label;
    return;
  }
  const meridiem = label.slice(0, splitIndex);
  const timeValue = label.slice(splitIndex + 1);
  const meridiemSpan = document.createElement("span");
  meridiemSpan.className = "meridiem";
  meridiemSpan.textContent = meridiem;
  const timeSpan = document.createElement("span");
  timeSpan.className = "timeValue";
  timeSpan.textContent = timeValue;
  element.replaceChildren(meridiemSpan, timeSpan);
}

function formatDateTimeKorean(date, hour, minute, second) {
  return `${pad2(hour)}\uC2DC ${pad2(minute)}\uBD84`;
}

function formatAlarmInfo(alarm) {
  const time = alarm instanceof Date ? alarm : alarm.time;
  const title = alarm && !(alarm instanceof Date) ? alarm.title : "";
  const dateText = formatDate(time);
  const timeText = formatDateTimeKorean(
    time,
    time.getHours(),
    time.getMinutes(),
    time.getSeconds()
  );
  return title ? `${dateText} ${timeText} - ${title}` : `${dateText} ${timeText}`;
}

function alarmDateTimeValue(alarm) {
  const raw = alarm instanceof Date ? alarm : alarm && typeof alarm === "object" ? alarm.time : null;
  if (raw instanceof Date && Number.isFinite(raw.getTime())) return raw;
  if (raw === null || raw === undefined) return null;
  const parsed = new Date(raw);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function minuteStampFromDateTime(dateTime) {
  if (!(dateTime instanceof Date) || !Number.isFinite(dateTime.getTime())) return NaN;
  return Math.floor(dateTime.getTime() / 60000);
}

function findAlarmIndexAtMinute(dateTime, ignoreIndex = -1) {
  const targetMinute = minuteStampFromDateTime(dateTime);
  if (!Number.isFinite(targetMinute)) return -1;
  const ignored = Number.isFinite(ignoreIndex) ? Math.trunc(ignoreIndex) : -1;
  for (let i = 0; i < alarms.length; i += 1) {
    if (i === ignored) continue;
    const alarmTime = alarmDateTimeValue(alarms[i]);
    if (!alarmTime) continue;
    if (minuteStampFromDateTime(alarmTime) === targetMinute) {
      return i;
    }
  }
  return -1;
}

function showDuplicateAlarmMinuteAlert(dateTime) {
  if (!(dateTime instanceof Date) || !Number.isFinite(dateTime.getTime())) {
    showAlert("같은 시간에는 일정을 만들 수 없어요.");
    return;
  }
  const timeText = formatDateTimeKorean(
    dateTime,
    dateTime.getHours(),
    dateTime.getMinutes(),
    dateTime.getSeconds()
  );
  showAlert(`${timeText} 일정이 이미 있어요.`);
}

function normalizeLocalAlarmItem(item) {
  if (!item || typeof item !== "object") return null;
  const time = alarmDateTimeValue(item);
  if (!(time instanceof Date) || !Number.isFinite(time.getTime())) return null;
  return {
    time: new Date(time.getTime()),
    title: typeof item.title === "string" ? item.title : "",
    category: typeof item.category === "string" ? item.category : "",
    remind: typeof item.remind === "string" && item.remind ? item.remind : "none",
    repeat: typeof item.repeat === "string" && item.repeat ? item.repeat : "none",
    remindEnabled: Boolean(item.remindEnabled),
    repeatEnabled: Boolean(item.repeatEnabled),
  };
}

function replaceLocalAlarmItems(items = []) {
  alarms.length = 0;
  if (!Array.isArray(items)) return;
  items.forEach((item) => {
    const normalized = normalizeLocalAlarmItem(item);
    if (!normalized) return;
    alarms.push(normalized);
  });
}

function serializedLocalAlarmItems() {
  const items = [];
  alarms.forEach((alarm) => {
    const time = alarmDateTimeValue(alarm);
    if (!(time instanceof Date) || !Number.isFinite(time.getTime())) return;
    items.push({
      time: time.toISOString(),
      title: alarm && !(alarm instanceof Date) && typeof alarm.title === "string" ? alarm.title : "",
      category:
        alarm && !(alarm instanceof Date) && typeof alarm.category === "string" ? alarm.category : "",
      remind:
        alarm && !(alarm instanceof Date) && typeof alarm.remind === "string" && alarm.remind
          ? alarm.remind
          : "none",
      repeat:
        alarm && !(alarm instanceof Date) && typeof alarm.repeat === "string" && alarm.repeat
          ? alarm.repeat
          : "none",
      remindEnabled: Boolean(alarm && !(alarm instanceof Date) && alarm.remindEnabled),
      repeatEnabled: Boolean(alarm && !(alarm instanceof Date) && alarm.repeatEnabled),
    });
  });
  return items;
}

function markLocalAlarmStoreDirty() {
  localAlarmStoreRevision += 1;
}

async function loadLocalAlarmStore() {
  const loadRevision = localAlarmStoreRevision;
  const payload = await fetchJsonWithTimeout("/api/alarms", {
    timeoutMs: GOOGLE_FETCH_TIMEOUT_MS,
  });
  const items = payload && Array.isArray(payload.items) ? payload.items : [];
  localAlarmStoreReady = true;
  if (loadRevision !== localAlarmStoreRevision) {
    return alarms;
  }
  replaceLocalAlarmItems(items);
  renderAllAlarmViews();
  return alarms;
}

function ensureLocalAlarmStoreReady() {
  if (localAlarmStoreReady) return Promise.resolve(alarms);
  if (localAlarmStoreLoadPromise) return localAlarmStoreLoadPromise;
  localAlarmStoreLoadPromise = loadLocalAlarmStore()
    .catch((error) => {
      console.warn("local alarm load failed", error);
      throw error;
    })
    .finally(() => {
      localAlarmStoreLoadPromise = null;
    });
  return localAlarmStoreLoadPromise;
}

async function persistLocalAlarmStore() {
  const saveRevision = localAlarmStoreRevision;
  const payload = await fetchJsonWithTimeout("/api/alarms", {
    timeoutMs: GOOGLE_FETCH_TIMEOUT_MS,
    fetchOptions: {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: serializedLocalAlarmItems(),
      }),
    },
  });
  localAlarmStoreReady = true;
  if (saveRevision !== localAlarmStoreRevision) {
    return alarms;
  }
  if (payload && Array.isArray(payload.items)) {
    replaceLocalAlarmItems(payload.items);
  }
  renderAllAlarmViews();
  return alarms;
}

function requestLocalAlarmStoreSave() {
  localAlarmStoreSaveChain = localAlarmStoreSaveChain
    .catch(() => null)
    .then(() => persistLocalAlarmStore())
    .catch((error) => {
      console.warn("local alarm save failed", error);
      return alarms;
    });
  return localAlarmStoreSaveChain;
}

function ensureModal() {
  if (modalOverlay) return;
  modalOverlay = document.createElement("div");
  modalOverlay.className = "modal-overlay";
  modalOverlay.setAttribute("aria-hidden", "true");

  const card = document.createElement("div");
  card.className = "modal-card";
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-modal", "true");

  modalTitle = document.createElement("div");
  modalTitle.className = "modal-title";

  modalMessage = document.createElement("div");
  modalMessage.className = "modal-message";

  modalInput = document.createElement("input");
  modalInput.className = "modal-input";
  modalInput.type = "text";
  modalInput.autocomplete = "off";

  const actions = document.createElement("div");
  actions.className = "modal-actions";

  modalCancelBtn = document.createElement("button");
  modalCancelBtn.className = "modal-btn ghost";
  modalCancelBtn.type = "button";
  modalCancelBtn.textContent = "\uCDE8\uC18C";

  modalConfirmBtn = document.createElement("button");
  modalConfirmBtn.className = "modal-btn primary";
  modalConfirmBtn.type = "button";
  modalConfirmBtn.textContent = "\uD655\uC778";

  actions.appendChild(modalCancelBtn);
  actions.appendChild(modalConfirmBtn);
  card.appendChild(modalTitle);
  card.appendChild(modalMessage);
  card.appendChild(modalInput);
  card.appendChild(actions);
  modalOverlay.appendChild(card);
  document.body.appendChild(modalOverlay);

  modalConfirmBtn.addEventListener("click", () => {
    if (Date.now() < modalPointerGuardUntil) return;
    const cb = modalOnConfirm;
    const value =
      modalInput && modalInput.style.display !== "none" ? modalInput.value : null;
    hideModal();
    if (cb) cb(value);
  });
  modalCancelBtn.addEventListener("click", () => {
    if (Date.now() < modalPointerGuardUntil) return;
    const cb = modalOnCancel;
    hideModal();
    if (cb) cb();
  });
  modalOverlay.addEventListener("click", (e) => {
    if (Date.now() < modalPointerGuardUntil) return;
    if (e.target !== modalOverlay) return;
    const cb = modalOnCancel;
    hideModal();
    if (cb) cb();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!modalOverlay.classList.contains("open")) return;
    const cb = modalOnCancel;
    hideModal();
    if (cb) cb();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    if (!modalOverlay.classList.contains("open")) return;
    if (!modalInput || modalInput.style.display === "none") return;
    e.preventDefault();
    modalConfirmBtn.click();
  });
}

function showModal({
  title,
  message,
  confirmText,
  cancelText,
  showCancel,
  input,
  onConfirm,
  onCancel,
  guardPointerMs,
}) {
  ensureModal();
  modalTitle.textContent = title || "";
  modalTitle.style.display = title ? "block" : "none";
  modalMessage.textContent = message;
  modalConfirmBtn.textContent = confirmText || "\uD655\uC778";
  modalCancelBtn.textContent = cancelText || "\uCDE8\uC18C";
  modalCancelBtn.style.display = showCancel ? "inline-flex" : "none";
  if (input && input.show) {
    modalInput.style.display = "block";
    modalInput.placeholder = input.placeholder || "";
    modalInput.value = input.value || "";
  } else {
    modalInput.style.display = "none";
    modalInput.value = "";
    modalInput.placeholder = "";
  }
  modalOnConfirm = onConfirm || null;
  modalOnCancel = onCancel || null;
  modalPointerGuardUntil =
    Number.isFinite(guardPointerMs) && guardPointerMs > 0 ? Date.now() + guardPointerMs : 0;
  modalOverlay.classList.add("open");
  modalOverlay.setAttribute("aria-hidden", "false");
  if (modalInput.style.display !== "none") {
    modalInput.focus();
    modalInput.select();
  } else {
    modalConfirmBtn.focus();
  }
}

function hideModal() {
  if (!modalOverlay) return;
  modalOverlay.classList.remove("open");
  modalOverlay.setAttribute("aria-hidden", "true");
  modalOnConfirm = null;
  modalOnCancel = null;
  modalPointerGuardUntil = 0;
}

function showConfirm(message, onConfirm, onCancel, options = {}) {
  showModal({
    title: "\uC608\uC57D \uD655\uC778",
    message,
    confirmText: "\uD655\uC778",
    cancelText: "\uCDE8\uC18C",
    showCancel: true,
    onConfirm,
    onCancel,
    guardPointerMs: options.guardPointerMs,
  });
}

function showAlert(message) {
  showModal({
    title: "\uC54C\uB9BC",
    message,
    confirmText: "\uD655\uC778",
    showCancel: false,
  });
}

function isPastSelection(dateTime) {
  const now = new Date();
  return dateTime.getTime() < now.getTime();
}

function showPrompt(message, onConfirm, options = {}) {
  showModal({
    title: options.title || "\uC81C\uBAA9 \uC785\uB825",
    message,
    confirmText: options.confirmText || "\uD655\uC778",
    cancelText: options.cancelText || "\uCDE8\uC18C",
    showCancel: true,
    input: {
      show: true,
      placeholder: options.placeholder || "",
      value: options.value || "",
    },
    onConfirm,
    onCancel: options.onCancel,
  });
}

function normalizeWakeTimePreference(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (!match) return "";
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return "";
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return "";
  return `${pad2(hours)}:${pad2(minutes)}`;
}

function normalizeSleepDurationPreference(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const clockMatch = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (clockMatch) {
    const hours = Number(clockMatch[1]);
    const minutes = Number(clockMatch[2]);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
    if (hours < 0 || minutes < 0 || minutes > 59) return null;
    const totalMinutes = hours * 60 + minutes;
    return totalMinutes >= 60 && totalMinutes <= 16 * 60 ? totalMinutes : null;
  }

  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  const totalMinutes =
    Number.isInteger(numeric) && numeric >= 60 ? Math.round(numeric) : Math.round(numeric * 60);
  return totalMinutes >= 60 && totalMinutes <= 16 * 60 ? totalMinutes : null;
}

function formatSleepDurationValue(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) return "8:00";
  const hours = Math.floor(minutes / 60);
  const remainMinutes = minutes % 60;
  return `${hours}:${pad2(remainMinutes)}`;
}

function formatSleepDurationLabel(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) return "";
  const hours = Math.floor(minutes / 60);
  const remainMinutes = minutes % 60;
  if (!remainMinutes) {
    return `${hours}\uC2DC\uAC04`;
  }
  return `${hours}\uC2DC\uAC04 ${remainMinutes}\uBD84`;
}

function loadPersistedWakeTimePreference() {
  try {
    const storage = window.localStorage;
    if (!storage) return "";
    return normalizeWakeTimePreference(storage.getItem(WAKE_TIME_STORAGE_KEY) || "");
  } catch (_) {
    return "";
  }
}

function persistWakeTimePreference(value) {
  try {
    const storage = window.localStorage;
    if (!storage) return;
    if (!value) {
      storage.removeItem(WAKE_TIME_STORAGE_KEY);
      return;
    }
    storage.setItem(WAKE_TIME_STORAGE_KEY, value);
  } catch (_) {}
}

function loadPersistedSleepDurationPreference() {
  try {
    const storage = window.localStorage;
    if (!storage) return null;
    const raw = storage.getItem(SLEEP_DURATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 60 && parsed <= 16 * 60 ? Math.round(parsed) : null;
  } catch (_) {
    return null;
  }
}

function persistSleepDurationPreference(minutes) {
  try {
    const storage = window.localStorage;
    if (!storage) return;
    if (!Number.isFinite(minutes) || minutes <= 0) {
      storage.removeItem(SLEEP_DURATION_STORAGE_KEY);
      return;
    }
    storage.setItem(SLEEP_DURATION_STORAGE_KEY, String(Math.round(minutes)));
  } catch (_) {}
}

function wakeSetupPromptHandled() {
  try {
    const storage = window.localStorage;
    return storage ? storage.getItem(WAKE_SETUP_PROMPTED_STORAGE_KEY) === "1" : false;
  } catch (_) {
    return false;
  }
}

function markWakeSetupPromptHandled() {
  try {
    const storage = window.localStorage;
    if (storage) {
      storage.setItem(WAKE_SETUP_PROMPTED_STORAGE_KEY, "1");
    }
  } catch (_) {}
}

function wakeTimePreferenceSummary() {
  if (!userWakeTimePreference) return "\uAE30\uC0C1 \uC2DC\uAC04 \uBBF8\uC124\uC815";
  const sleepLabel = formatSleepDurationLabel(userSleepDurationMinutes);
  return sleepLabel
    ? `\uAE30\uC0C1 ${userWakeTimePreference} | \uC218\uBA74 ${sleepLabel}`
    : `\uAE30\uC0C1 ${userWakeTimePreference}`;
}

function updateWakeTimeButton() {
  if (!statusWakeTimeBtn) return;
  const hasWakeTime = Boolean(userWakeTimePreference);
  statusWakeTimeBtn.classList.toggle("is-active", hasWakeTime);
  statusWakeTimeBtn.textContent = hasWakeTime ? userWakeTimePreference : "\uAE30\uC0C1";
  statusWakeTimeBtn.title = wakeTimePreferenceSummary();
  statusWakeTimeBtn.setAttribute("aria-label", wakeTimePreferenceSummary());
}

function openSleepDurationPreferencePrompt(options = {}) {
  const initialValue = formatSleepDurationValue(userSleepDurationMinutes);
  const source = options.source === "init" ? "init" : "manual";
  const invalidMessage = options.invalidMessage || "";
  showPrompt(
    invalidMessage ||
      "\uC218\uBA74 \uAE38\uC774\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694. \uC608: 8, 8:00, 7:30",
    (value) => {
      const totalMinutes = normalizeSleepDurationPreference(value);
      if (!Number.isFinite(totalMinutes)) {
        openSleepDurationPreferencePrompt({
          source,
          invalidMessage:
            "\uC218\uBA74 \uAE38\uC774\uB294 1~16\uC2DC\uAC04 \uBC94\uC704\uC5D0\uC11C \uC785\uB825\uD574\uC8FC\uC138\uC694. \uC608: 8:00",
        });
        return;
      }
      userSleepDurationMinutes = totalMinutes;
      persistSleepDurationPreference(totalMinutes);
      markWakeSetupPromptHandled();
      updateWakeTimeButton();
      refreshSleepWindowDisplays();
      showAlert(`${wakeTimePreferenceSummary()} \uC124\uC815\uB418\uC5C8\uC5B4\uC694.`);
    },
    {
      title: "\uC218\uBA74 \uAE38\uC774",
      confirmText: "\uC800\uC7A5",
      cancelText: "\uCDE8\uC18C",
      placeholder: "8:00",
      value: initialValue,
      onCancel: () => {
        if (source === "init") {
          markWakeSetupPromptHandled();
        }
        updateWakeTimeButton();
      },
    }
  );
}

function openWakeTimePreferencePrompt(options = {}) {
  const initialValue = userWakeTimePreference || "07:00";
  const source = options.source === "init" ? "init" : "manual";
  const invalidMessage = options.invalidMessage || "";
  showPrompt(
    invalidMessage ||
      "\uAE30\uC0C1 \uC2DC\uAC04\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694. \uC608: 07:00",
    (value) => {
      const normalized = normalizeWakeTimePreference(value);
      if (!normalized) {
        openWakeTimePreferencePrompt({
          source,
          invalidMessage:
            "\uAE30\uC0C1 \uC2DC\uAC04\uC740 HH:MM \uD615\uC2DD\uC73C\uB85C \uC785\uB825\uD574\uC8FC\uC138\uC694. \uC608: 07:00",
        });
        return;
      }
      userWakeTimePreference = normalized;
      persistWakeTimePreference(normalized);
      updateWakeTimeButton();
      refreshSleepWindowDisplays();
      openSleepDurationPreferencePrompt({ source });
    },
    {
      title: "\uAE30\uC0C1 \uC2DC\uAC04",
      confirmText: "\uB2E4\uC74C",
      cancelText: "\uCDE8\uC18C",
      placeholder: "07:00",
      value: initialValue,
      onCancel: () => {
        if (source === "init") {
          markWakeSetupPromptHandled();
        }
        updateWakeTimeButton();
      },
    }
  );
}

function maybeOpenWakeTimePreferencePromptOnInit() {
  if (userWakeTimePreference && Number.isFinite(userSleepDurationMinutes)) return;
  if (wakeSetupPromptHandled()) return;
  const needsWakeTime = !userWakeTimePreference;
  window.setTimeout(() => {
    if (modalOverlay && modalOverlay.classList.contains("open")) return;
    showModal({
      title: "\uAE30\uC0C1 \uC2DC\uAC04 \uC124\uC815",
      message:
        needsWakeTime
          ? "\uAE30\uC0C1 \uC2DC\uAC04\uACFC \uC218\uBA74 \uAE38\uC774\uB97C \uBA3C\uC800 \uC124\uC815\uD560\uAE4C\uC694?"
          : "\uC218\uBA74 \uAE38\uC774 \uC124\uC815\uC774 \uBE44\uC5B4 \uC788\uC5B4\uC694. \uC774\uC5B4\uC11C \uC785\uB825\uD560\uAE4C\uC694?",
      confirmText: "\uC124\uC815",
      cancelText: "\uB098\uC911\uC5D0",
      showCancel: true,
      onConfirm: () => {
        if (needsWakeTime) {
          openWakeTimePreferencePrompt({ source: "init" });
        } else {
          openSleepDurationPreferencePrompt({ source: "init" });
        }
      },
      onCancel: () => {
        markWakeSetupPromptHandled();
      },
    });
  }, 240);
}

function wakeTimePreferenceMinutes() {
  const normalized = normalizeWakeTimePreference(userWakeTimePreference);
  if (!normalized) return NaN;
  const [hoursText, minutesText] = normalized.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return NaN;
  return hours * 60 + minutes;
}

function hasSleepWindowPreference() {
  return Number.isFinite(wakeTimePreferenceMinutes()) && Number.isFinite(userSleepDurationMinutes);
}

function sleepWindowSegmentsForDate(dayDate) {
  if (!(dayDate instanceof Date) || !Number.isFinite(dayDate.getTime())) return [];
  if (!hasSleepWindowPreference()) return [];
  const wakeMinutes = wakeTimePreferenceMinutes();
  const durationMinutes = Math.round(userSleepDurationMinutes);
  if (!Number.isFinite(wakeMinutes) || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return [];
  }

  const dayStart = startOfDay(dayDate);
  const dayEnd = addDays(dayStart, 1);
  const segments = [];

  for (let offset = 0; offset <= 1; offset += 1) {
    const wakeAt = new Date(dayStart.getTime() + offset * 24 * 60 * 60 * 1000 + wakeMinutes * 60000);
    const sleepStart = new Date(wakeAt.getTime() - durationMinutes * 60000);
    const overlapStart = new Date(Math.max(dayStart.getTime(), sleepStart.getTime()));
    const overlapEnd = new Date(Math.min(dayEnd.getTime(), wakeAt.getTime()));
    if (overlapEnd.getTime() <= overlapStart.getTime()) continue;
    segments.push({
      start: sleepStart,
      end: wakeAt,
      overlapStart,
      overlapEnd,
    });
  }

  return segments;
}

function formatSleepWindowFullRangeLabel(segment) {
  if (!segment || !(segment.start instanceof Date) || !(segment.end instanceof Date)) return "";
  const startLabel = `${pad2(segment.start.getHours())}:${pad2(segment.start.getMinutes())}`;
  const endLabel = `${pad2(segment.end.getHours())}:${pad2(segment.end.getMinutes())}`;
  return `${startLabel}-${endLabel}`;
}

function formatSleepWindowDisplayTime(value, boundary) {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) return "";
  if (
    boundary instanceof Date &&
    Number.isFinite(boundary.getTime()) &&
    value.getTime() === boundary.getTime()
  ) {
    return "24:00";
  }
  return `${pad2(value.getHours())}:${pad2(value.getMinutes())}`;
}

function formatSleepWindowDisplayRangeLabel(segment, dayDate) {
  if (
    !segment ||
    !(segment.overlapStart instanceof Date) ||
    !Number.isFinite(segment.overlapStart.getTime()) ||
    !(segment.overlapEnd instanceof Date) ||
    !Number.isFinite(segment.overlapEnd.getTime()) ||
    !(dayDate instanceof Date) ||
    !Number.isFinite(dayDate.getTime())
  ) {
    return "";
  }
  const dayStart = startOfDay(dayDate);
  const dayEnd = addDays(dayStart, 1);
  const startLabel = formatSleepWindowDisplayTime(segment.overlapStart, null);
  const endLabel = formatSleepWindowDisplayTime(segment.overlapEnd, dayEnd);
  return startLabel && endLabel ? `${startLabel}-${endLabel}` : "";
}

function sleepWindowTitleText(segment) {
  const fullRangeLabel = formatSleepWindowFullRangeLabel(segment);
  return fullRangeLabel ? `수면 ${fullRangeLabel}` : "수면";
}

function renderTimelineSleepWindows() {
  if (!timeline) return;
  timeline.querySelectorAll(".sleep-window").forEach((node) => node.remove());
  if (!hasSleepWindowPreference()) return;

  const insertionPoint = timeline.querySelector(
    "#hoverGuide, #nowLine, .hour-label, .hour-line, .half-line, .alarm-line, .dayStackAlarmLine, .dayStackInlineEditorSlot"
  );
  const visibleDayCount = timelineVisibleDayCount();

  for (let dayIndex = 0; dayIndex < visibleDayCount; dayIndex += 1) {
    const dayDate = todayFocusMode ? todayFocusDate() : addDays(startDate, dayIndex);
    const dayStart = startOfDay(dayDate);
    const segments = sleepWindowSegmentsForDate(dayDate);
    segments.forEach((segment) => {
      const startMinutes = (segment.overlapStart.getTime() - dayStart.getTime()) / 60000;
      const endMinutes = (segment.overlapEnd.getTime() - dayStart.getTime()) / 60000;
      const top = todayFocusMode
        ? todayFocusRenderedYForBaseY(startMinutes * minutePx)
        : dayIndex * dayBlockHeight + timelineDayHeaderHeight() + startMinutes * minutePx;
      const bottom = todayFocusMode
        ? todayFocusRenderedYForBaseY(endMinutes * minutePx)
        : dayIndex * dayBlockHeight + timelineDayHeaderHeight() + endMinutes * minutePx;
      const height = Math.max(0, bottom - top);
      if (height <= 1) return;
      const windowEl = document.createElement("div");
      windowEl.className = "sleep-window";
      windowEl.setAttribute("aria-hidden", "true");
      if (height < 28) {
        windowEl.classList.add("is-compact");
      }
      windowEl.style.top = `${top}px`;
      windowEl.style.height = `${height}px`;
      const rangeLabel = formatSleepWindowDisplayRangeLabel(segment, dayDate);
      const compact = height < 28;
      windowEl.title = sleepWindowTitleText(segment);
      if (rangeLabel && height >= 14) {
        const label = document.createElement("span");
        label.className = "sleep-window__label";
        label.textContent = compact ? rangeLabel : `수면 ${rangeLabel}`;
        windowEl.appendChild(label);
      }
      if (insertionPoint) {
        timeline.insertBefore(windowEl, insertionPoint);
      } else {
        timeline.appendChild(windowEl);
      }
    });
  }
}

function renderDayStackSleepWindows(body, itemDateKey = "") {
  if (!body) return;
  body.querySelectorAll(".dayStackSleepWindow").forEach((node) => node.remove());
  if (!hasSleepWindowPreference() || !itemDateKey) return;
  const dayDate = parseDateKey(itemDateKey);
  if (!(dayDate instanceof Date) || !Number.isFinite(dayDate.getTime())) return;

  const dayStart = startOfDay(dayDate);
  const insertionPoint = body.querySelector(".dayStackHourLabels, .dayStackNowLine, .dayStackInlineEditorSlot, .dayStackAlarmLine");
  const segments = sleepWindowSegmentsForDate(dayDate);
  segments.forEach((segment) => {
    const startMinutes = (segment.overlapStart.getTime() - dayStart.getTime()) / 60000;
    const endMinutes = (segment.overlapEnd.getTime() - dayStart.getTime()) / 60000;
    const top = dayStackRenderedYForItem(startMinutes * minutePx, itemDateKey);
    const bottom = dayStackRenderedYForItem(endMinutes * minutePx, itemDateKey);
    const height = Math.max(0, bottom - top);
    if (height <= 1) return;
    const windowEl = document.createElement("div");
    windowEl.className = "dayStackSleepWindow";
    windowEl.setAttribute("aria-hidden", "true");
    if (height < 28) {
      windowEl.classList.add("is-compact");
    }
    windowEl.style.top = `${top}px`;
    windowEl.style.height = `${height}px`;
    const rangeLabel = formatSleepWindowDisplayRangeLabel(segment, dayDate);
    const compact = height < 28;
    windowEl.title = sleepWindowTitleText(segment);
    if (rangeLabel && height >= 14) {
      const label = document.createElement("span");
      label.className = "dayStackSleepWindow__label";
      label.textContent = compact ? rangeLabel : `수면 ${rangeLabel}`;
      windowEl.appendChild(label);
    }
    if (insertionPoint) {
      body.insertBefore(windowEl, insertionPoint);
    } else {
      body.appendChild(windowEl);
    }
  });
}

function refreshSleepWindowDisplays() {
  renderAllAlarmViews();
  if (dayStackOpen) {
    renderDayStack();
  }
}

function promptAlarmCreation(dateTime, options = {}) {
  if (!(dateTime instanceof Date) || !Number.isFinite(dateTime.getTime())) return;
  const alarmTime = new Date(dateTime.getTime());
  const onFinish = typeof options.onFinish === "function" ? options.onFinish : null;
  const finish = (created = false) => {
    if (onFinish) {
      onFinish({ created, time: new Date(alarmTime.getTime()) });
    }
  };
  const label = formatDateTimeKorean(
    alarmTime,
    alarmTime.getHours(),
    alarmTime.getMinutes(),
    alarmTime.getSeconds()
  );
  showConfirm(
    `${label}\uC5D0 \uC54C\uB78C\uC744 \uB9CC\uB4E4\uAE4C\uC694?`,
    () => {
      showPrompt(
        "\uC81C\uBAA9\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.",
        (value) => {
          const title = typeof value === "string" ? value.trim() : "";
          if (findAlarmIndexAtMinute(alarmTime) >= 0) {
            showDuplicateAlarmMinuteAlert(alarmTime);
            finish(false);
            return;
          }
          alarms.push({ time: new Date(alarmTime.getTime()), title });
          markLocalAlarmStoreDirty();
          void requestLocalAlarmStoreSave();
          renderAllAlarmViews();
          finish(true);
        },
        {
          onCancel: () => finish(false),
        }
      );
    },
    () => finish(false),
    {
      guardPointerMs: options.guardPointerMs,
    }
  );
}

function updateLocalAlarmTitleAtIndex(alarmIndex, nextTitle = "") {
  const index = Number.isFinite(alarmIndex) ? Math.trunc(alarmIndex) : -1;
  if (index < 0 || index >= alarms.length) return false;
  const source = alarms[index];
  const title = typeof nextTitle === "string" ? nextTitle.trim() : "";
  if (source && typeof source === "object" && !(source instanceof Date)) {
    alarms[index] = { ...source, title };
    return true;
  }
  const sourceTimeRaw = source instanceof Date ? source : source ? source.time : null;
  const sourceTime =
    sourceTimeRaw instanceof Date
      ? new Date(sourceTimeRaw.getTime())
      : sourceTimeRaw !== null && sourceTimeRaw !== undefined
        ? new Date(sourceTimeRaw)
        : null;
  if (!(sourceTime instanceof Date) || !Number.isFinite(sourceTime.getTime())) return false;
  alarms[index] = { time: sourceTime, title };
  return true;
}

function promptTodayFocusAlarmEdit(alarmInfo) {
  const alarmIndex = Number.isFinite(alarmInfo && alarmInfo.alarmIndex)
    ? Math.trunc(alarmInfo.alarmIndex)
    : -1;
  if (alarmIndex < 0) {
    showAlert(`\uC608\uC57D \uD655\uC778: ${formatAlarmInfo(alarmInfo)}`);
    return;
  }
  showPrompt(
    "\uC81C\uBAA9\uC744 \uC218\uC815\uD574\uC8FC\uC138\uC694.",
    (value) => {
      if (!updateLocalAlarmTitleAtIndex(alarmIndex, value)) {
        showAlert("\uC608\uC57D \uC218\uC815\uC744 \uC644\uB8CC\uD558\uC9C0 \uBABB\uD588\uC5B4\uC694.");
        return;
      }
      markLocalAlarmStoreDirty();
      void requestLocalAlarmStoreSave();
      renderAllAlarmViews();
    },
    {
      title: "\uC608\uC57D \uC218\uC815",
      value: typeof alarmInfo.title === "string" ? alarmInfo.title : "",
    }
  );
}

function showTodayFocusAlarmDetails(alarmInfo) {
  if (!alarmInfo) return;
  if (alarmInfo.source === GOOGLE_EVENT_SOURCE) {
    const message = `Google \uC77C\uC815: ${formatAlarmInfo(alarmInfo)}`;
    const htmlLink = typeof alarmInfo.htmlLink === "string" ? alarmInfo.htmlLink : "";
    if (!htmlLink) {
      showAlert(message);
      return;
    }
    showModal({
      title: "Google \uC77C\uC815",
      message,
      confirmText: "\uC5F4\uAE30",
      cancelText: "\uB2EB\uAE30",
      showCancel: true,
      onConfirm: () => {
        window.open(htmlLink, "_blank", "noopener");
      },
    });
    return;
  }
  showModal({
    title: "\uC608\uC57D \uD655\uC778",
    message: formatAlarmInfo(alarmInfo),
    confirmText: "\uC218\uC815",
    cancelText: "\uB2EB\uAE30",
    showCancel: true,
    onConfirm: () => {
      promptTodayFocusAlarmEdit(alarmInfo);
    },
  });
}

function ensureSelectionElements() {
  if (!selectionMarker) {
    selectionMarker = document.createElement("div");
    selectionMarker.className = "click-marker";
    selectionMarker.innerHTML = '<div class="label"></div>';
  }
  if (!selectionMarker.isConnected) {
    timeline.appendChild(selectionMarker);
  }
  if (!selectionBar) {
    selectionBar = document.createElement("div");
    selectionBar.className = "click-bar";
  }
  if (!selectionBar.isConnected) {
    timeline.appendChild(selectionBar);
  }
  if (!selectionLine) {
    selectionLine = document.createElement("div");
    selectionLine.className = "selection-line";
    const inner = document.createElement("div");
    inner.className = "selection-line__inner";
    selectionLine.appendChild(inner);
  }
  if (!selectionLine.isConnected) {
    timeline.appendChild(selectionLine);
  }
  if (!selectionLine.querySelector(".selection-line__inner")) {
    const inner = document.createElement("div");
    inner.className = "selection-line__inner";
    selectionLine.appendChild(inner);
  }
}

function updateSelectionMarker() {
  if (!selectedDateTime) return;
  ensureSelectionElements();
  const dayIndex = diffDays(startOfDay(selectedDateTime), startDate);
  if (dayIndex < 0 || dayIndex >= timelineVisibleDayCount()) {
    selectionMarker.style.display = "none";
    selectionBar.style.display = "none";
    selectionLine.style.display = "none";
    selectionLine.classList.remove("spread");
    selectionLine.classList.remove("thick");
    selectionLine.classList.remove("dim");
    selectionLine.classList.remove("wobble");
    selectionLineAnimated = false;
    return;
  }
  const minutes =
    selectedDateTime.getHours() * 60 +
    selectedDateTime.getMinutes() +
    selectedDateTime.getSeconds() / 60;
  const y = todayFocusMode
    ? todayFocusRenderedYForBaseY(minutes * minutePx)
    : dayIndex * dayBlockHeight + timelineDayHeaderHeight() + minutes * minutePx;
  const barTop = Math.max(0, y - hourHeight / 2);

  selectionMarker.style.display = "inline-flex";
  selectionMarker.style.top = `${y}px`;
  selectionMarker.style.left = `${Math.max(8, selectedX)}px`;
  selectionMarker.style.transform = "translateY(calc(-100% - 4px))";
  selectionMarker.querySelector('.label').textContent = formatDateTimeKorean(
    selectedDateTime,
    selectedDateTime.getHours(),
    selectedDateTime.getMinutes(),
    selectedDateTime.getSeconds()
  );

  selectionBar.style.display = "block";
  selectionBar.style.height = `${hourHeight}px`;
  selectionBar.style.top = `${barTop}px`;

  if (selectAnchorTime) {
    selectionLine.classList.add("thick");
    selectionLine.classList.add("dim");
  } else {
    selectionLine.classList.remove("thick");
    selectionLine.classList.remove("dim");
  }

  const leftPadValue = getComputedStyle(document.documentElement).getPropertyValue(
    "--left-pad"
  );
  const leftPad = Number.parseFloat(leftPadValue);
  const lineLeft = Number.isFinite(leftPad) ? leftPad : 0;
  const lineRight = timeline.clientWidth - 12;
  const clampedX = Math.min(Math.max(selectedX, lineLeft), lineRight);
  const originPx = Math.max(0, clampedX - lineLeft);
  const wasHidden =
    selectionLine.style.display === "none" || selectionLine.style.display === "";

  selectionLine.style.display = "block";
  selectionLine.style.top = `${y}px`;
  selectionLine.style.transformOrigin = `${originPx}px 50%`;
  if (!selectionLineAnimated) {
    selectionLineAnimated = true;
    selectionLine.classList.remove("spread");
    selectionLine.getBoundingClientRect();
    selectionLine.classList.add("spread");
  }
}

function hideSelectionElements() {
  selectedDateTime = null;
  selectAnchorTime = null;
  if (selectionMarker) selectionMarker.style.display = "none";
  if (selectionBar) selectionBar.style.display = "none";
  if (selectionLine) {
    selectionLine.style.display = "none";
    selectionLine.classList.remove("spread");
    selectionLine.classList.remove("thick");
    selectionLine.classList.remove("dim");
    selectionLine.classList.remove("wobble");
    selectionLineAnimated = false;
  }
}

function applyTimelineAlarmHoverSuppression() {
  if (!timeline) return;
  const hasSuppressionY = Number.isFinite(timelineHoverSuppressionY);
  timeline.querySelectorAll(".alarm-line, .dayStackAlarmLine").forEach((line) => {
    const lineY = Number.parseFloat(line.style.top || "");
    const suppressed =
      hasSuppressionY && Number.isFinite(lineY) && Math.abs(lineY - timelineHoverSuppressionY) <= ALARM_HIDE_NEAR_PX;
    line.classList.toggle("hover-suppressed", suppressed);
  });
}

function setTimelineAlarmHoverSuppression(timelineY = NaN) {
  timelineHoverSuppressionY = Number.isFinite(timelineY) ? timelineY : NaN;
  applyTimelineAlarmHoverSuppression();
}

function timelineAlarmNearY(timelineY = NaN) {
  if (!timeline || !Number.isFinite(timelineY)) return false;
  let nearAlarm = false;
  timeline.querySelectorAll(".alarm-line, .dayStackAlarmLine").forEach((line) => {
    if (nearAlarm) return;
    const lineY = Number.parseFloat(line.style.top || "");
    if (!Number.isFinite(lineY)) return;
    if (Math.abs(lineY - timelineY) <= ALARM_HIDE_NEAR_PX) {
      nearAlarm = true;
    }
  });
  return nearAlarm;
}

function visibleTimelineScheduleEntries() {
  const visibleEntries = [];
  const visibleDayCount = timelineVisibleDayCount();
  const dayHeaderHeight = timelineDayHeaderHeight();
  alarms.forEach((alarm, alarmIndex) => {
    const alarmTime = alarm instanceof Date ? alarm : alarm.time;
    if (!(alarmTime instanceof Date) || !Number.isFinite(alarmTime.getTime())) return;
    const title = alarm && !(alarm instanceof Date) ? alarm.title : "";
    const dayIndex = diffDays(startOfDay(alarmTime), startDate);
    if (dayIndex < 0 || dayIndex >= visibleDayCount) return;
    const minutes =
      alarmTime.getHours() * 60 +
      alarmTime.getMinutes() +
      alarmTime.getSeconds() / 60;
    visibleEntries.push({
      source: LOCAL_EVENT_SOURCE,
      alarmTime,
      title,
      dayIndex,
      y: dayIndex * dayBlockHeight + dayHeaderHeight + minutes * minutePx,
      alarmIndex,
      allDay: false,
      htmlLink: "",
      eventId: "",
    });
  });
  googleEvents.forEach((event) => {
    const alarmTime = googleEventDateTimeValue(event);
    if (!(alarmTime instanceof Date) || !Number.isFinite(alarmTime.getTime())) return;
    const dayIndex = diffDays(startOfDay(alarmTime), startDate);
    if (dayIndex < 0 || dayIndex >= visibleDayCount) return;
    const minutes = event.allDay
      ? 0
      : alarmTime.getHours() * 60 + alarmTime.getMinutes() + alarmTime.getSeconds() / 60;
    visibleEntries.push({
      source: GOOGLE_EVENT_SOURCE,
      alarmTime,
      title: googleEventDisplayTitle(event),
      dayIndex,
      y: dayIndex * dayBlockHeight + dayHeaderHeight + minutes * minutePx,
      alarmIndex: Number.MAX_SAFE_INTEGER,
      allDay: Boolean(event.allDay),
      htmlLink: typeof event.htmlLink === "string" ? event.htmlLink : "",
      eventId: typeof event.id === "string" ? event.id : "",
    });
  });
  visibleEntries.sort((a, b) => compareScheduleEntries(a, b, "y"));
  return visibleEntries;
}

function renderAlarms() {
  {
    timeline
      .querySelectorAll(".alarm-line, .dayStackAlarmLine, .dayStackInlineEditorSlot, .sleep-window")
      .forEach((line) => line.remove());
    renderTimelineSleepWindows();
    if (todayFocusMode) {
      const itemDateKey = todayFocusDateKey();
      const isMaxZoom = minutePx >= MAX_ZOOM_MINUTE_PX - 0.02;
      const showCompactText = minutePx >= ZOOM_MINUTE_PX - MINUTE_PX_EPSILON;
      const isSlotOpen = showCompactText;
      const visibleAlarms = dayStackVisibleAlarmEntriesForKey(itemDateKey);
      const layoutItems = dayStackAlarmLayoutItemsForKey(itemDateKey, visibleAlarms);
      const renderedBundleKeys = new Set(
        layoutItems.filter((item) => item.kind === "bundle").map((item) => item.bundleKey)
      );
      if (dayStackAlarmBundleOpenKey && !renderedBundleKeys.has(dayStackAlarmBundleOpenKey)) {
        dayStackAlarmBundleOpenKey = "";
      }
      const displayHeight = Math.max(2, dayStackAlarmDisplayHeight());
      layoutItems.forEach((item) => {
        const line = document.createElement("div");
        line.className = "dayStackAlarmLine";
        if (isSlotOpen) {
          line.classList.add("slot-open");
        }
        const useColumns = isSlotOpen && item.colCount > 1;
        if (useColumns) {
          line.classList.add("columned");
          line.style.setProperty("--alarm-col", String(item.col));
          line.style.setProperty("--alarm-col-count", String(item.colCount));
        }
        line.style.top = `${item.top}px`;
        const label = document.createElement("div");
        label.className = "dayStackAlarmLine__label";

        if (item.kind === "bundle") {
          const bundleEntries = Array.isArray(item.bundleEntries) ? item.bundleEntries : [];
          const bundleCount = bundleEntries.length;
          const isBundleOpen = dayStackAlarmBundleOpenKey === item.bundleKey;
          line.classList.add("bundle");
          line.dataset.bundleKey = item.bundleKey;
          line.dataset.bundleCount = String(bundleCount);
          line.style.setProperty("--alarm-height", `${displayHeight}px`);
          if (showCompactText) {
            const countEl = document.createElement("div");
            countEl.className = "dayStackAlarmBundleCount";
            countEl.textContent = `+${bundleCount}`;
            label.appendChild(countEl);
          }

          if (showCompactText && isBundleOpen) {
            line.classList.add("bundle-open");
            const list = document.createElement("div");
            list.className = "dayStackAlarmBundleDetails";
            const shownEntries = bundleEntries.slice(0, 6);
            shownEntries.forEach((entry) => {
              const row = document.createElement("div");
              row.className = "dayStackAlarmBundleRow";
              row.textContent = scheduleEntryCompactLabel(entry);
              list.appendChild(row);
            });
            if (bundleEntries.length > shownEntries.length) {
              const more = document.createElement("div");
              more.className = "dayStackAlarmBundleMore";
              more.textContent = `+${bundleEntries.length - shownEntries.length}`;
              list.appendChild(more);
            }
            const rowCount =
              shownEntries.length + (bundleEntries.length > shownEntries.length ? 1 : 0);
            const detailHeight = Math.max(displayHeight, 20 + rowCount * 13);
            line.style.setProperty("--alarm-height", `${detailHeight}px`);
            label.appendChild(list);
          }

          line.appendChild(label);
          timeline.appendChild(line);
          return;
        }

        const { alarmTime, title, alarmIndex } = item.entry;
        const entry = item.entry;
        if (isMaxZoom) {
          line.classList.add("expanded");
        } else if (showCompactText) {
          line.classList.add("compact");
        }
        line.dataset.source = entry.source;
        if (entry.source === GOOGLE_EVENT_SOURCE) {
          line.classList.add("google-event");
          line.dataset.eventId = entry.eventId;
          line.dataset.htmlLink = entry.htmlLink;
          line.dataset.allDay = entry.allDay ? "true" : "false";
        }
        line.dataset.timestamp = String(alarmTime.getTime());
        line.dataset.title = title;
        if (entry.source === LOCAL_EVENT_SOURCE) {
          line.dataset.alarmIndex = String(alarmIndex);
        }
        if (isMaxZoom) {
          appendScheduleEntryLabel(
            label,
            entry,
            "dayStackAlarmLine__time",
            "dayStackAlarmLine__title"
          );
        } else if (showCompactText) {
          appendScheduleEntryLabel(
            label,
            entry,
            "dayStackAlarmLine__time",
            "dayStackAlarmLine__title"
          );
        } else {
          label.textContent = "";
        }
        line.appendChild(label);
        timeline.appendChild(line);
      });
      renderTodayFocusInlineEditorSlot(itemDateKey);
      applyTimelineAlarmHoverSuppression();
      return;
    }
    const isMaxZoom = minutePx >= MAX_ZOOM_MINUTE_PX - 0.02;
    const showCompactText = minutePx >= ZOOM_MINUTE_PX - MINUTE_PX_EPSILON;
    const visibleAlarms = visibleTimelineScheduleEntries();
    const dayHeaderHeight = timelineDayHeaderHeight();
    const lastBottomByDay = new Map();
    visibleAlarms.forEach((entry) => {
      const { alarmTime, title, dayIndex } = entry;
      let renderY = entry.y;
      if (isMaxZoom) {
        const halfHeight = ALARM_EXPANDED_HEIGHT_PX / 2;
        const dayStartY = dayIndex * dayBlockHeight + dayHeaderHeight;
        const dayEndY = (dayIndex + 1) * dayBlockHeight;
        let top = renderY - halfHeight;
        const prevBottom = lastBottomByDay.get(dayIndex);
        if (Number.isFinite(prevBottom) && top < prevBottom + ALARM_EXPANDED_GAP_PX) {
          top = prevBottom + ALARM_EXPANDED_GAP_PX;
        }
        const maxTop = Math.max(dayStartY, dayEndY - ALARM_EXPANDED_HEIGHT_PX);
        top = Math.max(dayStartY, Math.min(maxTop, top));
        renderY = top + halfHeight;
        lastBottomByDay.set(dayIndex, top + ALARM_EXPANDED_HEIGHT_PX);
      }
      const line = document.createElement("div");
      line.className = "alarm-line";
      line.dataset.source = entry.source;
      if (entry.source === GOOGLE_EVENT_SOURCE) {
        line.classList.add("google-event");
        line.dataset.eventId = entry.eventId;
        line.dataset.htmlLink = entry.htmlLink;
        line.dataset.allDay = entry.allDay ? "true" : "false";
      } else if (Number.isFinite(entry.alarmIndex)) {
        line.dataset.alarmIndex = String(Math.trunc(entry.alarmIndex));
      }
      if (isMaxZoom) {
        line.classList.add("expanded");
      } else if (showCompactText) {
        line.classList.add("compact");
      }
      line.dataset.timestamp = String(alarmTime.getTime());
      line.dataset.title = title;
      line.style.top = `${renderY}px`;
      const label = document.createElement("div");
      label.className = "alarm-line__label";
      if (isMaxZoom) {
        appendScheduleEntryLabel(label, entry, "alarm-line__time", "alarm-line__title");
      } else if (showCompactText) {
        appendScheduleEntryLabel(label, entry, "alarm-line__time", "alarm-line__title");
      } else {
        label.textContent = scheduleEntryCompactLabel(entry);
      }
      line.appendChild(label);
      timeline.appendChild(line);
    });
    applyTimelineAlarmHoverSuppression();
    return;
  }
  timeline.querySelectorAll(".alarm-line").forEach((line) => line.remove());
  const isMaxZoom = minutePx >= MAX_ZOOM_MINUTE_PX - 0.02;
  alarms.forEach((alarm) => {
    const alarmTime = alarm instanceof Date ? alarm : alarm.time;
    const title = alarm && !(alarm instanceof Date) ? alarm.title : "";
    const dayIndex = diffDays(startOfDay(alarmTime), startDate);
    if (dayIndex < 0 || dayIndex >= TOTAL_DAYS) return;
    const minutes =
      alarmTime.getHours() * 60 +
      alarmTime.getMinutes() +
      alarmTime.getSeconds() / 60;
    const y =
      dayIndex * dayBlockHeight +
      DAY_BAR_HEIGHT +
      minutes * minutePx;
    const line = document.createElement("div");
    line.className = "alarm-line";
    if (isMaxZoom) {
      line.classList.add("expanded");
    }
    line.dataset.timestamp = String(alarmTime.getTime());
    line.dataset.title = title;
    line.style.top = `${y}px`;
    const label = document.createElement("div");
    label.className = "alarm-line__label";
    const timeText = formatDateTimeKorean(
      alarmTime,
      alarmTime.getHours(),
      alarmTime.getMinutes(),
      alarmTime.getSeconds()
    );
    if (isMaxZoom) {
      const timeEl = document.createElement("div");
      timeEl.className = "alarm-line__time";
      timeEl.textContent = timeText;
      const titleEl = document.createElement("div");
      titleEl.className = "alarm-line__title";
      titleEl.textContent = title && title.trim() ? title.trim() : "알림";
      label.append(timeEl, titleEl);
      if (!title || !title.trim()) {
        titleEl.textContent = "\uC54C\uB9BC";
      }
    } else {
      label.textContent = title ? `${timeText} \u00b7 ${title}` : timeText;
    }
    if (isMaxZoom) {
      label.textContent = "";
      const timeEl = document.createElement("div");
      timeEl.className = "dayStackAlarmLine__time";
      timeEl.textContent = timeText;
      const titleEl = document.createElement("div");
      titleEl.className = "dayStackAlarmLine__title";
      titleEl.textContent = title && title.trim() ? title.trim() : "\uC54C\uB9BC";
      label.append(timeEl, titleEl);
    }
    line.appendChild(label);
    timeline.appendChild(line);
  });
  applyTimelineAlarmHoverSuppression();
}

function renderDayStackAlarms() {
  {
    if (!dayStackLayer || !dayStackOpen) return;
    dayStackLayer.querySelectorAll(".dayStackAlarmLine").forEach((line) => line.remove());
    const expandedItem = expandedDayStackItem();
    if (!expandedItem) return;
    const expandedKey = expandedItem.dataset.date || "";
    const body = ensureDayStackItemBodyBuilt(expandedItem);
    if (!body) return;
    const isMaxZoom = minutePx >= MAX_ZOOM_MINUTE_PX - 0.02;
    const showCompactText = minutePx >= ZOOM_MINUTE_PX - MINUTE_PX_EPSILON;
    const isSlotOpen = showCompactText;
    const visibleAlarms = dayStackVisibleAlarmEntriesForKey(expandedKey);
    const layoutItems = dayStackAlarmLayoutItemsForKey(expandedKey, visibleAlarms);
    const renderedBundleKeys = new Set(
      layoutItems.filter((item) => item.kind === "bundle").map((item) => item.bundleKey)
    );
    if (dayStackAlarmBundleOpenKey && !renderedBundleKeys.has(dayStackAlarmBundleOpenKey)) {
      dayStackAlarmBundleOpenKey = "";
    }
    const displayHeight = Math.max(2, dayStackAlarmDisplayHeight());
    layoutItems.forEach((item) => {
      const line = document.createElement("div");
      line.className = "dayStackAlarmLine";
      if (isSlotOpen) {
        line.classList.add("slot-open");
      }
      const useColumns = isSlotOpen && item.colCount > 1;
      if (useColumns) {
        line.classList.add("columned");
        line.style.setProperty("--alarm-col", String(item.col));
        line.style.setProperty("--alarm-col-count", String(item.colCount));
      }
      line.style.top = `${item.top}px`;
      const label = document.createElement("div");
      label.className = "dayStackAlarmLine__label";

      if (item.kind === "bundle") {
        const bundleEntries = Array.isArray(item.bundleEntries) ? item.bundleEntries : [];
        const bundleCount = bundleEntries.length;
        const isBundleOpen = dayStackAlarmBundleOpenKey === item.bundleKey;
        line.classList.add("bundle");
        line.dataset.bundleKey = item.bundleKey;
        line.dataset.bundleCount = String(bundleCount);
        line.style.setProperty("--alarm-height", `${displayHeight}px`);
        if (showCompactText) {
          const countEl = document.createElement("div");
          countEl.className = "dayStackAlarmBundleCount";
          countEl.textContent = `+${bundleCount}`;
          label.appendChild(countEl);
        }

        if (showCompactText && isBundleOpen) {
          line.classList.add("bundle-open");
          const list = document.createElement("div");
          list.className = "dayStackAlarmBundleDetails";
          const shownEntries = bundleEntries.slice(0, 6);
          shownEntries.forEach((entry) => {
            const row = document.createElement("div");
            row.className = "dayStackAlarmBundleRow";
            row.textContent = scheduleEntryCompactLabel(entry);
            list.appendChild(row);
          });
          if (bundleEntries.length > shownEntries.length) {
            const more = document.createElement("div");
            more.className = "dayStackAlarmBundleMore";
            more.textContent = `+${bundleEntries.length - shownEntries.length}`;
            list.appendChild(more);
          }
          const rowCount =
            shownEntries.length + (bundleEntries.length > shownEntries.length ? 1 : 0);
          const detailHeight = Math.max(displayHeight, 20 + rowCount * 13);
          line.style.setProperty("--alarm-height", `${detailHeight}px`);
          label.appendChild(list);
        }

        line.appendChild(label);
        body.appendChild(line);
        return;
      }

      const { alarmTime, title, alarmIndex } = item.entry;
      const entry = item.entry;
      if (isMaxZoom) {
        line.classList.add("expanded");
      } else if (showCompactText) {
        line.classList.add("compact");
      }
      line.dataset.source = entry.source;
      if (entry.source === GOOGLE_EVENT_SOURCE) {
        line.classList.add("google-event");
        line.dataset.eventId = entry.eventId;
        line.dataset.htmlLink = entry.htmlLink;
        line.dataset.allDay = entry.allDay ? "true" : "false";
      }
      line.dataset.timestamp = String(alarmTime.getTime());
      line.dataset.title = title;
      if (entry.source === LOCAL_EVENT_SOURCE) {
        line.dataset.alarmIndex = String(alarmIndex);
      }
      if (isMaxZoom) {
        appendScheduleEntryLabel(
          label,
          entry,
          "dayStackAlarmLine__time",
          "dayStackAlarmLine__title"
        );
      } else if (showCompactText) {
        appendScheduleEntryLabel(
          label,
          entry,
          "dayStackAlarmLine__time",
          "dayStackAlarmLine__title"
        );
      } else {
        label.textContent = "";
      }
      line.appendChild(label);
      body.appendChild(line);
    });
    return;
  }
  if (!dayStackLayer || !dayStackOpen) return;
  dayStackLayer.querySelectorAll(".dayStackAlarmLine").forEach((line) => line.remove());
  const expandedItem = expandedDayStackItem();
  if (!expandedItem) return;
  const expandedKey = expandedItem.dataset.date || "";
  const body = ensureDayStackItemBodyBuilt(expandedItem);
  if (!body) return;
  const isMaxZoom = minutePx >= MAX_ZOOM_MINUTE_PX - 0.02;
  const activeAlarmView =
    dayStackInlineAlarmView &&
    dayStackInlineAlarmView.dateKey === expandedKey &&
    dayStackInlineAlarmView.dateTime instanceof Date &&
    Number.isFinite(dayStackInlineAlarmView.dateTime.getTime())
      ? dayStackInlineAlarmView
      : null;
  const activeAlarmViewIndex =
    activeAlarmView && Number.isFinite(activeAlarmView.alarmIndex)
      ? Math.trunc(activeAlarmView.alarmIndex)
      : -1;
  const activeAlarmViewTimeMs = activeAlarmView ? activeAlarmView.dateTime.getTime() : NaN;
  const activeAlarmViewTitle =
    activeAlarmView && typeof activeAlarmView.title === "string"
      ? activeAlarmView.title
      : "";
  const activeDraftEditIndex =
    dayStackInlineDraft &&
    dayStackInlineDraft.dateKey === expandedKey &&
    Number.isFinite(dayStackInlineDraft.editingAlarmIndex)
      ? Math.trunc(dayStackInlineDraft.editingAlarmIndex)
      : -1;
  alarms.forEach((alarm, alarmIndex) => {
    const alarmTime = alarm instanceof Date ? alarm : alarm.time;
    if (!(alarmTime instanceof Date) || !Number.isFinite(alarmTime.getTime())) return;
    const title = alarm && !(alarm instanceof Date) ? alarm.title : "";
    const key = dateKeyFromDate(alarmTime);
    if (!expandedKey || key !== expandedKey) return;
    if (activeAlarmViewIndex >= 0 && alarmIndex === activeAlarmViewIndex) return;
    if (activeDraftEditIndex >= 0 && alarmIndex === activeDraftEditIndex) return;
    if (
      activeAlarmViewIndex < 0 &&
      Number.isFinite(activeAlarmViewTimeMs) &&
      alarmTime.getTime() === activeAlarmViewTimeMs &&
      title === activeAlarmViewTitle
    ) {
      return;
    }
    const minutes =
      alarmTime.getHours() * 60 +
      alarmTime.getMinutes() +
      alarmTime.getSeconds() / 60;
    const y = dayStackRenderedYForItem(minutes * minutePx, expandedKey);
    const line = document.createElement("div");
    line.className = "dayStackAlarmLine";
    if (isMaxZoom) {
      line.classList.add("expanded");
    }
    line.dataset.timestamp = String(alarmTime.getTime());
    line.dataset.title = title;
    line.dataset.alarmIndex = String(alarmIndex);
    line.style.top = `${y}px`;
    const label = document.createElement("div");
    label.className = "dayStackAlarmLine__label";
    const timeText = formatDateTimeKorean(
      alarmTime,
      alarmTime.getHours(),
      alarmTime.getMinutes(),
      alarmTime.getSeconds()
    );
    label.textContent = title ? `${timeText} · ${title}` : timeText;
    if (isMaxZoom) {
      label.textContent = "";
      const timeEl = document.createElement("div");
      timeEl.className = "dayStackAlarmLine__time";
      timeEl.textContent = timeText;
      const titleEl = document.createElement("div");
      titleEl.className = "dayStackAlarmLine__title";
      titleEl.textContent = title && title.trim() ? title.trim() : "\uC54C\uB9BC";
      label.append(timeEl, titleEl);
    }
    line.appendChild(label);
    body.appendChild(line);
  });
}

function renderAllAlarmViews() {
  if (todayFocusMode && !dayStackOpen) {
    refreshTodayFocusTimelineLayout();
    return;
  }
  renderAlarms();
  renderDayStackAlarms();
}

function updateTodayFocusRailLayout() {
  if (!todayFocusRail || !timelineWrap) return;
  if (!todayFocusMode) {
    todayFocusRail.style.height = "";
    todayFocusRail.style.transform = "";
    return;
  }
  todayFocusRail.style.height = `${timelineWrap.clientHeight}px`;
  todayFocusRail.style.transform = `translateY(${timelineWrap.scrollTop}px)`;
}

function updateTodayFocusRail() {
  if (!todayFocusRail) return;
  if (!todayFocusMode) {
    todayFocusRail.innerHTML = "";
    todayFocusRail.setAttribute("aria-hidden", "true");
    updateTodayFocusRailLayout();
    return;
  }
  const focusDate = startDate instanceof Date ? startOfDay(startDate) : startOfDay(new Date());
  todayFocusRail.innerHTML = `<span class="todayFocusRailDay">${pad2(focusDate.getDate())}</span><span class="todayFocusRailWeekday">${WEEKDAY_KR[focusDate.getDay()]}</span>`;
  todayFocusRail.setAttribute("aria-hidden", "false");
  updateTodayFocusRailLayout();
}

function todayFocusHourScrollBounds() {
  return todayFocusRuntime.todayFocusHourScrollBounds();
  if (!timelineWrap || !timeline) {
    return { min: 0, max: 0 };
  }
  if (!todayFocusMode || !todayFocusHourMode) {
    const maxScroll = Math.max(0, timeline.scrollHeight - timelineWrap.clientHeight);
    return { min: 0, max: maxScroll };
  }
  const timelineOffset = timeline.offsetTop;
  const startBaseY = todayFocusSelectedHourStartMinute() * minutePx;
  const endBaseY = (todayFocusSelectedHourStartMinute() + 60) * minutePx;
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
  return todayFocusRuntime.clampTodayFocusScrollTop(nextTop);
  if (!timelineWrap) return 0;
  const { min, max } = todayFocusHourScrollBounds();
  return Math.max(min, Math.min(max, Number.isFinite(nextTop) ? nextTop : min));
}

function enforceTodayFocusScrollBounds() {
  return todayFocusRuntime.enforceTodayFocusScrollBounds();
  if (!todayFocusMode || !timelineWrap) return;
  const clamped = clampTodayFocusScrollTop(timelineWrap.scrollTop);
  if (Math.abs(clamped - timelineWrap.scrollTop) > 0.5) {
    timelineWrap.scrollTop = clamped;
  }
}

function setTodayFocusHourMode(nextMode, anchorDateTime = null) {
  return todayFocusRuntime.setTodayFocusHourMode(nextMode, anchorDateTime);
  const shouldEnable = Boolean(nextMode);
  if (shouldEnable) {
    const anchor =
      anchorDateTime instanceof Date && Number.isFinite(anchorDateTime.getTime())
        ? anchorDateTime
        : new Date();
    todayFocusHourStartMinute = Math.max(0, Math.min(DAY_MINUTES - 60, anchor.getHours() * 60));
    todayFocusPreferredMinutePx = null;
  } else {
    todayFocusHourStartMinute = NaN;
    todayFocusPreferredMinutePx = null;
  }
  todayFocusHourMode = shouldEnable;
  if (timelineWrap) {
    timelineWrap.classList.toggle("today-hour-mode", todayFocusHourMode);
  }
}

function enterTodayFocusHourMode(anchorDateTime = null, anchorClientY = null) {
  return todayFocusRuntime.enterTodayFocusHourMode(anchorDateTime, anchorClientY);
  if (!todayFocusMode || dayStackOpen || !timelineWrap) return false;
  setTodayFocusHourMode(true, anchorDateTime);
  recalcSizes();
  buildTimeline();
  if (anchorDateTime instanceof Date && Number.isFinite(anchorDateTime.getTime()) && Number.isFinite(anchorClientY)) {
    alignTimelineToDateTime(anchorDateTime, anchorClientY);
    timelineWrap.scrollTop = clampTodayFocusScrollTop(timelineWrap.scrollTop);
  } else {
    const { min } = todayFocusHourScrollBounds();
    timelineWrap.scrollTop = min;
  }
  updateTodayFocusRailLayout();
  updateStickyDay();
  updateTime();
  persistRefreshViewState();
  return true;
}

function shiftTodayFocusHour(stepDelta = 0) {
  return todayFocusRuntime.shiftTodayFocusHour(stepDelta);
  if (!todayFocusMode || !todayFocusHourMode || dayStackOpen) return false;
  const delta = Number.isFinite(stepDelta) ? Math.trunc(stepDelta) : 0;
  if (!delta) return false;
  const currentStartMinute = todayFocusSelectedHourStartMinute();
  const nextStartMinute = Math.max(
    0,
    Math.min(
      DAY_MINUTES - TODAY_FOCUS_HOUR_STEP_MINUTES,
      currentStartMinute + delta * TODAY_FOCUS_HOUR_STEP_MINUTES
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
  return todayFocusRuntime.exitTodayFocusHourMode();
  if (!todayFocusMode || !todayFocusHourMode || dayStackOpen || !timelineWrap) return false;
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
  return todayFocusRuntime.refreshTodayFocusTimelineLayout();
  if (!todayFocusMode || dayStackOpen || !timelineWrap || !timeline) return false;
  const previousScrollTop = Math.max(0, timelineWrap.scrollTop);
  buildTimeline();
  if (todayFocusHourMode) {
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

function setTodayFocusMode(nextMode, options = {}) {
  return todayFocusRuntime.setTodayFocusMode(nextMode, options);
  const shouldEnable = Boolean(nextMode);
  const rebuildTimeline = options.rebuildTimeline !== false;
  if (shouldEnable && !todayFocusMode) {
    todayFocusPreferredMinutePx = null;
    setTodayFocusHourMode(false);
  } else if (!shouldEnable) {
    todayFocusPreferredMinutePx = null;
    setTodayFocusHourMode(false);
  }
  todayFocusMode = shouldEnable;
  if (timelineWrap) {
    timelineWrap.classList.toggle("today-focus-mode", todayFocusMode);
  }
  if (todayFocusRail) {
    todayFocusRail.classList.toggle("open", todayFocusMode);
  }
  if (statusTodayFeatureBtn) {
    statusTodayFeatureBtn.classList.toggle("is-active", todayFocusMode);
  }
  recalcSizes();
  updateTodayFocusRail();
  if (rebuildTimeline && !dayStackOpen) {
    buildTimeline();
  }
  persistRefreshViewState();
}

function enterTodayFocusMode(targetDate = null) {
  return todayFocusRuntime.enterTodayFocusMode(targetDate);
  const focusDate =
    targetDate instanceof Date && Number.isFinite(targetDate.getTime())
      ? startOfDay(targetDate)
      : startOfDay(new Date());

  if (!todayFocusMode) {
    rememberPreviousView();
  }
  setMenuOpen(false);
  setWeatherDrawerOpen(false);
  hideHoverGuide();
  hideSelectionElements();
  clearDayStackInlineDraft();
  if (dayStackOpen) {
    setDayStackOpen(false);
  }
  setTodayFocusMode(true, { rebuildTimeline: false });
  setTodayFocusHourMode(false);
  startDate = focusDate;
  buildTimeline();
  timelineWrap.scrollTop = 0;
  updateStickyDay();
  updateTime();
  persistRefreshViewState();
}



function buildTimeline() {
  timelineRebuildDeferred = false;
  deferredTimelineScrollTop = NaN;
  timeline.style.height = `${
    todayFocusMode ? todayFocusTimelineHeight() : timelineVisibleDayCount() * dayBlockHeight
  }px`;
  timeline.innerHTML = "";
  timeline.appendChild(nowLine);
  ensureHoverGuideElement();
  buildHourLines();
  buildDayBars();
  updateTodayFocusRail();
}

function flushDeferredTimelineRebuild() {
  if (!timelineRebuildDeferred) return;
  const targetScrollTop = deferredTimelineScrollTop;
  buildTimeline();
  if (timelineWrap && timeline && Number.isFinite(targetScrollTop)) {
    const maxScroll = Math.max(0, timeline.scrollHeight - timelineWrap.clientHeight);
    timelineWrap.scrollTop = Math.max(0, Math.min(maxScroll, targetScrollTop));
  }
}

function ensureHoverGuideElement() {
  if (!hoverGuide) {
    hoverGuide = document.createElement("div");
    hoverGuide.id = "hoverGuide";
    hoverGuide.innerHTML = '<div class="line"></div><div class="timeText"></div>';
    hoverGuideText = hoverGuide.querySelector(".timeText");
  }
  if (!hoverGuide.isConnected) {
    timeline.appendChild(hoverGuide);
  }
}

function timelineAlarmElementFromClientPoint(clientX, clientY) {
  if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return null;
  const hit = document.elementFromPoint(clientX, clientY);
  if (!hit || !hit.closest) return null;
  return hit.closest(".alarm-line, .dayStackAlarmLine");
}

function hideHoverGuide() {
  if (!hoverGuide) return;
  hoverGuide.style.display = "none";
  setTimelineAlarmHoverSuppression(NaN);
}

function setHoverGuideEnabled(nextEnabled) {
  hoverGuideEnabled = Boolean(nextEnabled);
  if (!hoverGuideEnabled) {
    hideHoverGuide();
  }
}

function snapshotViewState() {
  return {
    startDate: startDate instanceof Date ? new Date(startDate) : null,
    timelineScrollTop: timelineWrap ? timelineWrap.scrollTop : 0,
    minutePx,
    todayFocusMode,
    dayStackOpen,
    dayStackScrollTop: dayStackLayer ? dayStackLayer.scrollTop : 0,
    dayStackBaseDate: dayStackBaseDate instanceof Date ? new Date(dayStackBaseDate) : null,
    dayStackEndDate: dayStackEndDate instanceof Date ? new Date(dayStackEndDate) : null,
    dayStackExpandedDate:
      typeof dayStackExpandedDate === "string" ? dayStackExpandedDate : null,
    dayStackSpread,
    dayStackMonthListMode,
    dayStackYearListMode,
    dayStackViewMode,
  };
}

function rememberPreviousView() {
  if (restoringPreviousView) return;
  previousViewState = snapshotViewState();
}

function restorePreviousView() {
  if (!previousViewState || restoringPreviousView) return;
  const state = previousViewState;
  previousViewState = null;
  restoringPreviousView = true;
  try {
    setMenuOpen(false);
    clearDayStackInlineDraft();
    const restoredMinutePx = Number.isFinite(state.minutePx) ? state.minutePx : minutePx;
    if (state.dayStackOpen) {
      setTodayFocusMode(false, { rebuildTimeline: false });
      minutePx = restoredMinutePx;
      recalcSizes();
      const base = state.dayStackBaseDate instanceof Date ? new Date(state.dayStackBaseDate) : null;
      const end = state.dayStackEndDate instanceof Date ? new Date(state.dayStackEndDate) : null;
      dayStackExpandedDate =
        typeof state.dayStackExpandedDate === "string" ? state.dayStackExpandedDate : null;
      setDayStackOpen(true, false);
      dayStackSpread = 0;
      dayStackMonthListMode = Boolean(state.dayStackMonthListMode);
      dayStackYearListMode = Boolean(state.dayStackYearListMode);
      dayStackViewMode =
        state.dayStackViewMode === DAY_STACK_VIEW_MODE_YEAR_MONTH
          ? DAY_STACK_VIEW_MODE_YEAR_MONTH
          : DAY_STACK_VIEW_MODE_MONTH_DAY;
      if (base) {
        dayStackBaseDate = clampDayStackDate(base);
        if (end) {
          dayStackEndDate = clampDayStackDate(end);
        } else {
          dayStackEndDate = addDays(dayStackBaseDate, dayStackWindowDays() - 1);
          if (dayStackEndDate.getTime() > DAY_STACK_RANGE_END.getTime()) {
            dayStackEndDate = new Date(DAY_STACK_RANGE_END);
          }
        }
        if (!isDayStackWindowValid()) {
          ensureDayStackWindow(dayStackBaseDate);
        }
        renderDayStack();
      }
      if (dayStackLayer) {
        dayStackLayer.scrollTop = Math.max(0, state.dayStackScrollTop || 0);
      }
      applyDayStackMonthListMode(false);
      applyDayStackYearListMode(false);
      updateDayStackYearHead();
    } else {
      setDayStackOpen(false, false);
      setTodayFocusMode(Boolean(state.todayFocusMode), { rebuildTimeline: false });
      minutePx = restoredMinutePx;
      recalcSizes();
      if (state.startDate instanceof Date) {
        startDate = new Date(state.startDate);
      }
      buildTimeline();
      if (timelineWrap) {
        timelineWrap.scrollTop = Math.max(0, state.timelineScrollTop || 0);
      }
      updateStickyDay();
      updateTime();
    }
    persistRefreshViewState();
  } finally {
    restoringPreviousView = false;
  }
}

function updateHoverGuideFromClientY(clientY, clientX = hoverPointerClientX) {
  if (!hoverGuideEnabled || dayStackOpen) {
    hideHoverGuide();
    return;
  }
  if (typeof clientY !== "number" || !Number.isFinite(clientY)) {
    hideHoverGuide();
    return;
  }
  if (timelineAlarmElementFromClientPoint(clientX, clientY)) {
    hideHoverGuide();
    return;
  }
  const rect = timelineWrap.getBoundingClientRect();
  const timelineOffset = timeline.offsetTop;
  const localY = clientY - rect.top;
  if (localY <= timelineOffset || localY > timelineWrap.clientHeight) {
    hideHoverGuide();
    return;
  }
  const rawY = localY + timelineWrap.scrollTop - timelineOffset;
  const maxY = Math.max(0, timeline.offsetHeight - 1);
  const timelineY = Math.max(0, Math.min(rawY, maxY));
  if (todayFocusMode) {
    if (todayFocusHourMode) {
      const hourStartY = todayFocusRenderedYForBaseY(todayFocusSelectedHourStartMinute() * minutePx);
      const hourEndY = todayFocusRenderedYForBaseY(
        (todayFocusSelectedHourStartMinute() + 60) * minutePx
      );
      if (timelineY < hourStartY || timelineY >= hourEndY) {
        hideHoverGuide();
        return;
      }
    }
    if (timelineAlarmNearY(timelineY)) {
      hideHoverGuide();
      return;
    }
    const totalMinutes = todayFocusBaseYFromRenderedY(timelineY) / minutePx;
    ensureHoverGuideElement();
    hoverGuide.style.display = "block";
    hoverGuide.style.top = `${timelineY}px`;
    setTimelineAlarmHoverSuppression(NaN);
    if (hoverGuideText) {
      setMeridiemTimeLabel(hoverGuideText, totalMinutes);
      updateHoverGuideLabelOffset(timelineY);
    }
    return;
  }
  const dayIndex = Math.floor(timelineY / dayBlockHeight);
  const withinDay = timelineY - dayIndex * dayBlockHeight;
  if (withinDay < timelineDayHeaderHeight()) {
    hideHoverGuide();
    return;
  }
  if (timelineAlarmNearY(timelineY)) {
    hideHoverGuide();
    return;
  }
  const totalMinutes = minutesForY(timelineY);
  ensureHoverGuideElement();
  hoverGuide.style.display = "block";
  hoverGuide.style.top = `${timelineY}px`;
  setTimelineAlarmHoverSuppression(NaN);
  if (hoverGuideText) {
    setMeridiemTimeLabel(hoverGuideText, totalMinutes);
    updateHoverGuideLabelOffset(timelineY);
  }
}

function buildHourLines() {
  if (todayFocusMode && todayFocusHourMode) {
    const hourStartMinute = todayFocusSelectedHourStartMinute();
    for (let minuteOffset = 0; minuteOffset < 60; minuteOffset += 10) {
      const baseY = (hourStartMinute + minuteOffset) * minutePx;
      const y = todayFocusRenderedYForBaseY(baseY);

      const label = document.createElement("div");
      label.className = "hour-label minute-label";
      label.style.top = `${y}px`;
      label.textContent = `${pad2((hourStartMinute + minuteOffset) % 60)}`;
      timeline.appendChild(label);

      const line = document.createElement("div");
      line.className = "hour-line minute-line";
      line.style.top = `${y}px`;
      timeline.appendChild(line);

      if (minuteOffset + 5 < 60) {
        const half = document.createElement("div");
        half.className = "half-line minute-half-line";
        half.style.top = `${todayFocusRenderedYForBaseY((hourStartMinute + minuteOffset + 5) * minutePx)}px`;
        timeline.appendChild(half);
      }
    }
    return;
  }
  const totalHours = timelineVisibleDayCount() * 24;
  const dayHeaderHeight = timelineDayHeaderHeight();
  for (let h = 0; h < totalHours; h += 1) {
    const dayIndex = Math.floor(h / 24);
    const hourInDay = h % 24;
    const baseY = dayIndex * DAY_MINUTES * minutePx + hourInDay * 60 * minutePx;
    const y = todayFocusMode
      ? todayFocusRenderedYForBaseY(baseY)
      : dayIndex * dayBlockHeight + dayHeaderHeight + hourInDay * 60 * minutePx;

    const label = document.createElement("div");
    label.className = "hour-label";
    label.style.top = `${y}px`;
    label.textContent = `${pad2(hourInDay)}:00`;
    timeline.appendChild(label);

    const line = document.createElement("div");
    line.className = "hour-line";
    line.style.top = `${y}px`;
    timeline.appendChild(line);

    const half = document.createElement("div");
    half.className = "half-line";
    const halfBaseY = dayIndex * DAY_MINUTES * minutePx + hourInDay * 60 * minutePx + 30 * minutePx;
    const halfY = todayFocusMode
      ? todayFocusRenderedYForBaseY(halfBaseY)
      : y + 30 * minutePx;
    half.style.top = `${halfY}px`;
    timeline.appendChild(half);
  }
}

function buildDayBars() {
  for (let i = 0; i < timelineVisibleDayCount(); i += 1) {
    const bar = document.createElement("div");
    bar.className = "day-bar";
    bar.dataset.dayIndex = String(i);
    bar.style.top = `${i * dayBlockHeight}px`;
    timeline.appendChild(bar);
  }
  renderDayBars();
}

function renderDayBars() {
  const bars = timeline.querySelectorAll(".day-bar");
  bars.forEach((bar, index) => {
    const date = addDays(startDate, index);
    const parts = formatDateParts(date);
    bar.innerHTML = `<span class="date">${parts.date}</span><span class="weekday"> ${parts.weekday}</span>`;
    bar.classList.add("special-day");
  });
  renderAlarms();
  requestGoogleCalendarSync(false);
}

function stickyDayIndex() {
  const dayIndex = currentDayIndex(0);
  const visibleDayCount = timelineVisibleDayCount();
  const dayHeaderHeight = timelineDayHeaderHeight();
  let displayIndex = dayIndex;
  const barTop = dayHeaderHeight + dayIndex * dayBlockHeight - timelineWrap.scrollTop;
  if (barTop >= 0 && barTop <= dayHeaderHeight) {
    displayIndex = Math.min(dayIndex + 1, visibleDayCount - 1);
  }
  return Math.max(0, Math.min(visibleDayCount - 1, displayIndex));
}

function updateStickyDay() {
  if (dayStackOpen) {
    return;
  }

  if (todayFocusMode) {
    stickyDayCacheKey = "";
    if (stickyDay) {
      if (todayFocusHourMode) {
        const hourStart = todayFocusSelectedHourStartMinute();
        stickyDay.innerHTML = `<span class="time">${pad2(Math.floor(hourStart / 60))}:00</span>`;
      } else {
        stickyDay.innerHTML = "";
      }
    }
    if (dateLabel) {
      dateLabel.style.visibility = "hidden";
    }
    updateTodayFocusRail();
    updateSelectionMarker();
    return;
  }

  const dayIndex = stickyDayIndex();
  const date = addDays(startDate, dayIndex);
  const dayKey = dateKeyFromDate(date);
  if (dayKey !== stickyDayCacheKey) {
    stickyDayCacheKey = dayKey;
    const parts = formatDateParts(date);
    if (stickyDay) {
      stickyDay.innerHTML = `<span class="date">${parts.date}</span><span class="weekday"> ${parts.weekday}</span>`;
    }
    const today = startOfDay(new Date());
    if (dateLabel) {
      if (startOfDay(date).getTime() === today.getTime()) {
        dateLabel.textContent = "Oneul";
        dateLabel.style.visibility = "visible";
      } else {
        dateLabel.textContent = formatDate(today);
        dateLabel.style.visibility = "visible";
      }
    }
  }
  updateSelectionMarker();
}

function updateTime() {
  const now = new Date();
  if (statusDateText) {
    statusDateText.textContent = String(now.getFullYear());
  }
  if (statusTimeText) {
    const statusRight = formatStatusRight(now);
    statusTimeText.innerHTML = `<span class="statusDate">${statusRight.date}</span><span class="statusWeekday">(${statusRight.weekday})</span><span class="statusAmPm">${statusRight.ampm}</span><span class="statusClock"><span class="statusClockHour">${statusRight.hour}</span><span class="statusClockMinute">:${statusRight.minute}</span><span class="statusClockSecond">:${statusRight.second}</span></span>`;
  }
  if (timeLabel) {
    timeLabel.textContent = formatTime(now);
  }
  updateNowLine(now);
  updateDayStackNowLines(now);
  if (menuOpen) {
    renderMenuCalendar();
  }
}

function setNowLineLabel(timeText = "") {
  if (!nowText) return;
  if (!timeText) {
    nowText.textContent = "";
    return;
  }
  if (todayFocusMode) {
    nowText.innerHTML = `<span class="timeMain">${timeText.slice(0, 5)}</span><span class="seconds">:${timeText.slice(6, 8)}</span>`;
    return;
  }
  nowText.textContent = timeText;
}

function todayFocusFloatingLabelBounds(bottomPaddingPx = TODAY_FOCUS_NOW_LABEL_BOTTOM_PADDING_PX) {
  if (!timelineWrap) {
    return { minTop: 0, maxTop: 0 };
  }
  const topInset = todayFocusHeaderHeight() + todayFocusHourVerticalPadding();
  const minTop = timelineWrap.scrollTop + topInset + 4;
  const maxTop = Math.max(
    minTop,
    timelineWrap.scrollTop +
      timelineWrap.clientHeight -
      todayFocusHourVerticalPadding() -
      bottomPaddingPx
  );
  return { minTop, maxTop };
}

function updateNowLineLabelOffset(lineY = 0) {
  if (!nowText) return;
  if (!todayFocusMode || !timelineWrap || !timeline) {
    nowText.style.top = "";
    return;
  }
  const lineTop = timeline.offsetTop + lineY;
  const { minTop, maxTop } = todayFocusFloatingLabelBounds(TODAY_FOCUS_NOW_LABEL_BOTTOM_PADDING_PX);
  const preferredTop = lineTop - TODAY_FOCUS_NOW_LABEL_OFFSET_PX;
  const labelTop = Math.max(minTop, Math.min(maxTop, preferredTop));
  nowText.style.top = `${labelTop - lineTop}px`;
}

function updateHoverGuideLabelOffset(lineY = 0) {
  if (!hoverGuideText) return;
  if (!todayFocusMode || !timelineWrap || !timeline) {
    hoverGuideText.style.top = "";
    return;
  }
  const lineTop = timeline.offsetTop + lineY;
  const { minTop, maxTop } = todayFocusFloatingLabelBounds(18);
  const preferredTop = lineTop - 18;
  const labelTop = Math.max(minTop, Math.min(maxTop, preferredTop));
  hoverGuideText.style.top = `${labelTop - lineTop}px`;
}

function weatherCodeTextKorean(code) {
  switch (code) {
    case 0:
      return "\uB9D1\uC74C";
    case 1:
    case 2:
      return "\uB300\uCCB4\uB85C \uB9D1\uC74C";
    case 3:
      return "\uD750\uB9BC";
    case 45:
    case 48:
      return "\uC548\uAC1C";
    case 51:
    case 53:
    case 55:
      return "\uC774\uC2AC\uBE44";
    case 56:
    case 57:
      return "\uC5B4\uB294 \uC774\uC2AC\uBE44";
    case 61:
    case 63:
    case 65:
      return "\uBE44";
    case 66:
    case 67:
      return "\uC5B4\uB294 \uBE44";
    case 71:
    case 73:
    case 75:
      return "\uB208";
    case 77:
      return "\uC9C4\uB208\uAE68\uBE44";
    case 80:
    case 81:
    case 82:
      return "\uC18C\uB098\uAE30";
    case 85:
    case 86:
      return "\uB208 \uC18C\uB098\uAE30";
    case 95:
      return "\uB1CC\uC6B0";
    case 96:
    case 99:
      return "\uAC15\uD55C \uB1CC\uC6B0";
    default:
      return "\uB0A0\uC528";
  }
}

function setWeatherText(text) {
  return statusRuntime.setWeatherText(text);
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

function fetchJsonWithTimeout(url, options = {}) {
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : WEATHER_FETCH_TIMEOUT_MS;
  const fetchOptions = options.fetchOptions && typeof options.fetchOptions === "object" ? options.fetchOptions : {};
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, {
    cache: "no-store",
    signal: controller.signal,
    ...fetchOptions,
  })
    .finally(() => {
      clearTimeout(timerId);
    })
    .then((response) => {
      if (!response.ok) {
        const error = new Error(`http-${response.status}`);
        error.status = response.status;
        throw error;
      }
      return response.json();
    });
}

function roundSafe(value) {
  return Number.isFinite(value) ? Math.round(value) : null;
}

function oneDecimalSafe(value) {
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 10) / 10;
}

function windDirectionArrow(degrees) {
  if (!Number.isFinite(degrees)) return null;
  const arrows = ["\u2191", "\u2197", "\u2192", "\u2198", "\u2193", "\u2199", "\u2190", "\u2196"];
  const normalized = ((degrees % 360) + 360) % 360;
  const idx = Math.round(normalized / 45) % 8;
  return arrows[idx];
}

function dustSummary(pm25, pm10) {
  const pm25Value = Number.isFinite(pm25) ? Math.round(pm25) : null;
  const pm10Value = Number.isFinite(pm10) ? Math.round(pm10) : null;
  const pm25Text = pm25Value === null ? "-" : String(pm25Value);
  const pm10Text = pm10Value === null ? "-" : String(pm10Value);

  const gradePm25 =
    pm25Value === null
      ? null
      : pm25Value <= 15
        ? "\uC88B\uC74C"
        : pm25Value <= 35
          ? "\uBCF4\uD1B5"
          : pm25Value <= 75
            ? "\uB098\uC068"
            : "\uB9E4\uC6B0\uB098\uC068";
  const gradePm10 =
    pm10Value === null
      ? null
      : pm10Value <= 30
        ? "\uC88B\uC74C"
        : pm10Value <= 80
          ? "\uBCF4\uD1B5"
          : pm10Value <= 150
            ? "\uB098\uC068"
            : "\uB9E4\uC6B0\uB098\uC068";
  const levels = [
    "\uC88B\uC74C",
    "\uBCF4\uD1B5",
    "\uB098\uC068",
    "\uB9E4\uC6B0\uB098\uC068",
  ];
  const idx25 = gradePm25 ? levels.indexOf(gradePm25) : -1;
  const idx10 = gradePm10 ? levels.indexOf(gradePm10) : -1;
  const overallIdx = Math.max(idx25, idx10);
  const overall = overallIdx >= 0 ? levels[overallIdx] : "\uBBF8\uC815";

  return `${overall} ( ${pm10Text} / ${pm25Text} ) \u00B5g/m\u00B3`;
}

function weatherWithMinMaxText(code, minValue, maxValue) {
  const codeNumber = Number(code);
  const weatherLabel = Number.isFinite(codeNumber)
    ? weatherCodeTextKorean(codeNumber)
    : "\uB0A0\uC528";
  const minTemp = roundSafe(minValue);
  const maxTemp = roundSafe(maxValue);
  const minText = minTemp === null ? "-\u00B0" : `${minTemp}\u00B0`;
  const maxText = maxTemp === null ? "-\u00B0" : `${maxTemp}\u00B0`;
  return `${weatherLabel} ( ${minText} / ${maxText} )`;
}

function windSummary(speed, degrees) {
  const arrow = windDirectionArrow(degrees);
  const speedMs = roundSafe(speed);
  const speedText = speedMs === null ? "-" : `${speedMs}m/s`;
  if (!arrow) {
    return `\uBC14\uB78C ${speedText}`;
  }
  return `\uBC14\uB78C ${arrow} ${speedText}`;
}

function getCurrentCoords() {
  return statusRuntime.getCurrentCoords();
  if (weatherCoords) {
    return Promise.resolve(weatherCoords);
  }
  if (!("geolocation" in navigator)) {
    weatherCoords = { ...WEATHER_FALLBACK_COORDS };
    return Promise.resolve(weatherCoords);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        weatherCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          label: "\uD604\uC7AC \uC704\uCE58",
        };
        resolve(weatherCoords);
      },
      () => {
        weatherCoords = { ...WEATHER_FALLBACK_COORDS };
        resolve(weatherCoords);
      },
      {
        enableHighAccuracy: false,
        timeout: WEATHER_GEO_TIMEOUT_MS,
        maximumAge: WEATHER_REFRESH_MS,
      }
    );
  });
}

async function fetchWeatherStatus(coords) {
  return statusRuntime.fetchWeatherStatus(coords);
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
  return statusRuntime.refreshWeatherStatus();
  if (!statusWeatherTickerText && !weatherDrawerText) return;
  const requestId = ++weatherRequestId;
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
    if (requestId !== weatherRequestId) return;
    setWeatherText(weatherLine);
  } catch (_) {
    if (requestId !== weatherRequestId) return;
    setWeatherText("\uB0A0\uC528 \uC815\uBCF4 \uD655\uC778 \uBD88\uAC00");
  }
}

function initWeatherStatus() {
  return statusRuntime.initWeatherStatus();
  if (!statusWeatherTickerText && !weatherDrawerText) return;
  refreshWeatherStatus();
  if (weatherRefreshTimer) {
    clearInterval(weatherRefreshTimer);
  }
  weatherRefreshTimer = setInterval(refreshWeatherStatus, WEATHER_REFRESH_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    refreshWeatherStatus();
  });
}

function consumeGoogleAuthResult() {
  return statusRuntime.consumeGoogleAuthResult();
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

async function refreshGoogleCalendarStatus({ sync = false, forceSync = false } = {}) {
  return statusRuntime.refreshGoogleCalendarStatus({ sync, forceSync });
  try {
    const data = await fetchJsonWithTimeout("/api/google/status", {
      timeoutMs: GOOGLE_FETCH_TIMEOUT_MS,
      fetchOptions: {
        credentials: "same-origin",
      },
    });
    googleCalendarConfigured = Boolean(data && data.configured);
    googleCalendarConnected = Boolean(data && data.connected);
    if (!googleCalendarConnected) {
      clearGoogleEvents();
      renderAllAlarmViews();
    }
    updateGoogleCalendarButton();
    if (sync && googleCalendarConfigured && googleCalendarConnected) {
      await syncGoogleCalendar({ force: forceSync });
    }
  } catch (_) {
    googleCalendarConfigured = false;
    googleCalendarConnected = false;
    clearGoogleEvents();
    updateGoogleCalendarButton();
  }
}

async function syncGoogleCalendar({ force = false } = {}) {
  return statusRuntime.syncGoogleCalendar({ force });
  if (!googleCalendarConfigured || !googleCalendarConnected) return;
  if (googleCalendarSyncPromise) return googleCalendarSyncPromise;

  const requestedRange = desiredGoogleCalendarRange();
  if (!force && loadedGoogleRangeCovers(requestedRange.start, requestedRange.end)) {
    return;
  }

  const fetchStart =
    !force && googleEventsRangeStart instanceof Date
      ? new Date(Math.min(googleEventsRangeStart.getTime(), requestedRange.start.getTime()))
      : requestedRange.start;
  const fetchEnd =
    !force && googleEventsRangeEnd instanceof Date
      ? new Date(Math.max(googleEventsRangeEnd.getTime(), requestedRange.end.getTime()))
      : requestedRange.end;

  const requestId = ++googleCalendarRequestId;
  googleCalendarSyncing = true;
  updateGoogleCalendarButton();

  const url = new URL("/api/google/events", window.location.origin);
  url.searchParams.set("start", fetchStart.toISOString());
  url.searchParams.set("end", fetchEnd.toISOString());
  if (force) {
    url.searchParams.set("force", "1");
  }

  googleCalendarSyncPromise = fetchJsonWithTimeout(url.toString(), {
    timeoutMs: GOOGLE_FETCH_TIMEOUT_MS,
    fetchOptions: {
      credentials: "same-origin",
    },
  })
    .then((payload) => {
      if (requestId !== googleCalendarRequestId) return;
      const items = payload && Array.isArray(payload.items) ? payload.items : [];
      replaceGoogleEvents(items);
      googleEventsRangeStart = fetchStart;
      googleEventsRangeEnd = fetchEnd;
      renderAllAlarmViews();
    })
    .catch((error) => {
      if (requestId !== googleCalendarRequestId) return;
      const status = error && Number.isFinite(error.status) ? error.status : null;
      if (status === 401) {
        googleCalendarConnected = false;
        clearGoogleEvents();
        renderAllAlarmViews();
      }
    })
    .finally(() => {
      if (requestId === googleCalendarRequestId) {
        googleCalendarSyncing = false;
        updateGoogleCalendarButton();
      }
      googleCalendarSyncPromise = null;
    });

  return googleCalendarSyncPromise;
}

function requestGoogleCalendarSync(force = false) {
  return statusRuntime.requestGoogleCalendarSync(force);
  if (!googleCalendarConfigured || !googleCalendarConnected) return;
  void syncGoogleCalendar({ force });
}

function handleGoogleCalendarEvent(eventInfo) {
  return statusRuntime.handleGoogleCalendarEvent(eventInfo);
  if (!eventInfo || eventInfo.source !== GOOGLE_EVENT_SOURCE) return false;
  const timeText =
    eventInfo.allDay || !(eventInfo.time instanceof Date)
      ? "\uC885\uC77C"
      : formatDateTimeKorean(
          eventInfo.time,
          eventInfo.time.getHours(),
          eventInfo.time.getMinutes(),
          eventInfo.time.getSeconds()
        );
  const dateText =
    eventInfo.time instanceof Date ? formatDate(eventInfo.time) : "";
  const titleText =
    typeof eventInfo.title === "string" && eventInfo.title.trim()
      ? eventInfo.title.trim()
      : GOOGLE_EVENT_DEFAULT_TITLE;
  showAlert(`Google \uC77C\uC815: ${dateText} ${timeText} - ${titleText}`.trim());
  return true;
}

function initGoogleCalendar() {
  return statusRuntime.initGoogleCalendar();
  const authResult = consumeGoogleAuthResult();
  updateGoogleCalendarButton();
  void refreshGoogleCalendarStatus({ sync: true }).then(() => {
    if (authResult === "connected" && googleCalendarConnected) {
      showAlert("Google \uCE98\uB9B0\uB354 \uC5F0\uACB0 \uC644\uB8CC");
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    void refreshGoogleCalendarStatus({ sync: false });
    requestGoogleCalendarSync(false);
  });
}

function updateNowLine(now) {
  const today = startOfDay(now);
  const dayIndex = diffDays(today, startDate);
  if (dayIndex < 0 || dayIndex >= timelineVisibleDayCount()) {
    nowLine.style.display = "none";
    setNowLineLabel("");
    updateNowLineLabelOffset(0);
    return;
  }
  if (todayFocusMode && todayFocusHourMode) {
    const currentHourStartMinute = now.getHours() * 60;
    if (currentHourStartMinute !== todayFocusSelectedHourStartMinute()) {
      nowLine.style.display = "none";
      setNowLineLabel("");
      updateNowLineLabelOffset(0);
      return;
    }
  }
  nowLine.style.display = "block";
  const minutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const y = todayFocusMode
    ? todayFocusRenderedYForBaseY(minutes * minutePx)
    : dayIndex * dayBlockHeight + timelineDayHeaderHeight() + minutes * minutePx;
  const timeText = now.toTimeString().slice(0, 8);
  nowLine.style.top = `${y}px`;
  setNowLineLabel(timeText);
  updateNowLineLabelOffset(y);
}

function buildDayStackTimelineBody(withDetails = false, itemDateKey = "") {
  const body = document.createElement("div");
  body.className = "dayStackBody";
  if (!withDetails) return body;
  body.dataset.built = "1";
  refreshDayStackInlineEditorLayout(null, body, itemDateKey);

  const nowMarker = document.createElement("div");
  nowMarker.className = "dayStackNowLine";
  nowMarker.innerHTML = '<div class="line"></div><div class="dot"></div><div class="timeText"></div>';
  body.appendChild(nowMarker);

  return body;
}

function ensureDayStackItemBodyBuilt(item) {
  if (!item) return null;
  const body = item.querySelector(".dayStackBody");
  if (!body) return null;
  const itemDateKey = item.dataset && typeof item.dataset.date === "string" ? item.dataset.date : "";
  if (body.dataset.built === "1") {
    refreshDayStackInlineEditorLayout(item, body, itemDateKey);
    return body;
  }
  body.dataset.built = "1";
  refreshDayStackInlineEditorLayout(item, body, itemDateKey);

  const nowMarker = document.createElement("div");
  nowMarker.className = "dayStackNowLine";
  nowMarker.innerHTML = '<div class="line"></div><div class="dot"></div><div class="timeText"></div>';
  body.appendChild(nowMarker);
  return body;
}

function compactDayStackItemBody(item) {
  if (!item) return;
  const itemDateKey = item.dataset && typeof item.dataset.date === "string" ? item.dataset.date : "";
  if (dayStackInlineDraft && dayStackInlineDraft.dateKey === itemDateKey) {
    clearDayStackInlineDraft();
  }
  const body = item.querySelector(".dayStackBody");
  if (!body) return;
  body.innerHTML = "";
  delete body.dataset.built;
}

function updateDayStackFloatingNowLabel(item, top, timeText = "") {
  if (!dayStackLayer) return;
  dayStackLayer.querySelectorAll(".dayStackNowFloat").forEach((node) => {
    const owner = node.closest(".dayStackItem");
    if (owner !== item || !timeText) {
      node.remove();
    }
  });
  if (!item || !timeText) return;
  let label = item.querySelector(".dayStackNowFloat");
  if (!label) {
    label = document.createElement("div");
    label.className = "dayStackNowFloat";
    item.appendChild(label);
  }
  label.innerHTML = `<span class="timeMain">${timeText.slice(0, 5)}</span><span class="seconds">:${timeText.slice(6, 8)}</span>`;
  label.style.top = `${Math.max(0, top)}px`;
}

function setDayStackHoverNowSuppression(itemDateKey = "", renderedY = NaN) {
  const nextKey = typeof itemDateKey === "string" ? itemDateKey : "";
  const nextY = Number.isFinite(renderedY) ? renderedY : NaN;
  const sameY =
    (!Number.isFinite(dayStackHoverSuppressionY) && !Number.isFinite(nextY)) ||
    (Number.isFinite(dayStackHoverSuppressionY) &&
      Number.isFinite(nextY) &&
      Math.abs(dayStackHoverSuppressionY - nextY) < 0.5);
  if (dayStackHoverSuppressionDateKey === nextKey && sameY) return;
  dayStackHoverSuppressionDateKey = nextKey;
  dayStackHoverSuppressionY = nextY;
  updateDayStackNowLines(new Date());
}

function shouldHideDayStackNowLine(itemDateKey = "", renderedY = NaN) {
  if (!itemDateKey || itemDateKey !== dayStackHoverSuppressionDateKey) return false;
  if (!Number.isFinite(renderedY) || !Number.isFinite(dayStackHoverSuppressionY)) return false;
  return Math.abs(dayStackHoverSuppressionY - renderedY) <= DAY_STACK_NOW_HIDE_NEAR_PX;
}

function clearDayStackInlineDraft() {
  const activeKey =
    (dayStackInlineDraft && typeof dayStackInlineDraft.dateKey === "string"
      ? dayStackInlineDraft.dateKey
      : "") ||
    (dayStackInlineAlarmView && typeof dayStackInlineAlarmView.dateKey === "string"
      ? dayStackInlineAlarmView.dateKey
      : "");
  dayStackInlineDraft = null;
  dayStackInlineAlarmView = null;
  if (todayFocusUsesInlineHostForKey(activeKey)) {
    refreshTodayFocusTimelineLayout();
    return;
  }
  if (!dayStackLayer) return;
  const activeItem = activeKey
    ? dayStackLayer.querySelector(`.dayStackItem[data-date="${activeKey}"]`)
    : expandedDayStackItem();
  const activeBody = activeItem ? activeItem.querySelector(".dayStackBody") : null;
  if (activeItem && activeBody) {
    refreshDayStackInlineEditorLayout(activeItem, activeBody, activeItem.dataset.date || "");
  } else {
    dayStackLayer
      .querySelectorAll(".dayStackInlineEditorSlot, .dayStackGridLayer")
      .forEach((node) => {
        node.remove();
      });
  }
  renderDayStackAlarms();
  updateDayStackNowLines(new Date());
}

function buildDayStackInlineEditorSelect(currentValue, options) {
  const select = document.createElement("select");
  select.className = "dayStackInlineEditorControl";
  options.forEach(({ value, label }) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    if (value === currentValue) {
      option.selected = true;
    }
    select.appendChild(option);
  });
  return select;
}

function buildDayStackInlineEditorValueRow(text) {
  const row = document.createElement("div");
  row.className = "dayStackInlineEditorValueRow";
  row.textContent = text;
  return row;
}

function buildDayStackInlineEditorPromptRow(text) {
  const row = document.createElement("div");
  row.className = "dayStackInlineEditorPromptRow";
  row.textContent = text;
  return row;
}

function buildDayStackInlineEditorToggleRow(label, field, enabled = false) {
  const row = document.createElement("div");
  row.className = "dayStackInlineEditorToggleRow";

  const text = document.createElement("span");
  text.className = "dayStackInlineEditorToggleRow__label";
  text.textContent = label;
  row.appendChild(text);

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "dayStackInlineEditorToggleBtn";
  if (enabled) {
    toggle.classList.add("is-on");
  }
  toggle.dataset.inlineEditorToggle = field;
  toggle.setAttribute("aria-pressed", enabled ? "true" : "false");
  toggle.innerHTML =
    '<span class="dayStackInlineEditorToggleBtn__track"><span class="dayStackInlineEditorToggleBtn__thumb"></span></span>';
  row.appendChild(toggle);

  return row;
}

function dayStackInlineEditorStep() {
  if (!dayStackInlineDraft) return DAY_STACK_INLINE_EDITOR_STEP_TITLE;
  const raw = Number.isFinite(dayStackInlineDraft.step) ? dayStackInlineDraft.step : 0;
  return Math.max(
    DAY_STACK_INLINE_EDITOR_STEP_TITLE,
    Math.min(DAY_STACK_INLINE_EDITOR_STEP_REPEAT, Math.trunc(raw))
  );
}

function dayStackInlineEditorCardHeight() {
  if (dayStackInlineAlarmView) return DAY_STACK_INLINE_ALARM_CARD_HEIGHT;
  const step = dayStackInlineEditorStep();
  return (
    DAY_STACK_INLINE_EDITOR_CARD_HEIGHTS[step] ||
    DAY_STACK_INLINE_EDITOR_CARD_HEIGHTS[DAY_STACK_INLINE_EDITOR_CARD_HEIGHTS.length - 1]
  );
}

function refreshActiveDayStackInlineDraft() {
  if (!dayStackInlineDraft && !dayStackInlineAlarmView) return;
  const activeKey =
    (dayStackInlineDraft && typeof dayStackInlineDraft.dateKey === "string"
      ? dayStackInlineDraft.dateKey
      : "") ||
    (dayStackInlineAlarmView && typeof dayStackInlineAlarmView.dateKey === "string"
      ? dayStackInlineAlarmView.dateKey
      : "");
  if (!activeKey) return;
  if (todayFocusUsesInlineHostForKey(activeKey)) {
    refreshTodayFocusTimelineLayout();
    return;
  }
  if (!dayStackLayer) return;
  const activeItem = dayStackLayer.querySelector(`.dayStackItem[data-date="${activeKey}"]`);
  const activeBody = activeItem ? activeItem.querySelector(".dayStackBody") : null;
  if (!activeItem || !activeBody) return;
  refreshDayStackInlineEditorLayout(activeItem, activeBody, activeKey);
  renderDayStackAlarms();
  updateDayStackNowLines(new Date());
}

function dayStackInlineEditorLayoutForKey(itemDateKey = "") {
  if (!itemDateKey) return null;
  let sourceType = "";
  let sourceDateTime = null;
  if (
    dayStackInlineDraft &&
    itemDateKey === dayStackInlineDraft.dateKey &&
    dayStackInlineDraft.dateTime instanceof Date
  ) {
    sourceType = "draft";
    sourceDateTime = dayStackInlineDraft.dateTime;
  } else if (
    dayStackInlineAlarmView &&
    itemDateKey === dayStackInlineAlarmView.dateKey &&
    dayStackInlineAlarmView.dateTime instanceof Date
  ) {
    sourceType = "alarm";
    sourceDateTime = dayStackInlineAlarmView.dateTime;
  }
  if (!sourceType || !(sourceDateTime instanceof Date)) return null;
  const slotHeight = dayStackInlineEditorCardHeight() + DAY_STACK_INLINE_EDITOR_SLOT_GAP_PX;
  const totalMinutes =
    sourceDateTime.getHours() * 60 +
    sourceDateTime.getMinutes() +
    sourceDateTime.getSeconds() / 60;
  const splitY = Math.max(0, Math.min(DAY_MINUTES * minutePx, totalMinutes * minutePx));
  return {
    sourceType,
    totalMinutes,
    splitY,
    slotHeight,
    cardTop: 8,
  };
}

function dayStackAlarmDisplayHeight() {
  if (minutePx < ZOOM_MINUTE_PX - MINUTE_PX_EPSILON) return 0;
  if (minutePx >= MAX_ZOOM_MINUTE_PX - 0.02) return ALARM_EXPANDED_HEIGHT_PX;
  return ALARM_ZOOMED_HEIGHT_PX;
}

function dayStackVisibleAlarmEntriesForKey(itemDateKey = "") {
  if (!itemDateKey) return [];

  const activeAlarmView =
    dayStackInlineAlarmView &&
    dayStackInlineAlarmView.dateKey === itemDateKey &&
    dayStackInlineAlarmView.dateTime instanceof Date &&
    Number.isFinite(dayStackInlineAlarmView.dateTime.getTime())
      ? dayStackInlineAlarmView
      : null;
  const activeAlarmViewIndex =
    activeAlarmView && Number.isFinite(activeAlarmView.alarmIndex)
      ? Math.trunc(activeAlarmView.alarmIndex)
      : -1;
  const activeAlarmViewTimeMs = activeAlarmView ? activeAlarmView.dateTime.getTime() : NaN;
  const activeAlarmViewTitle =
    activeAlarmView && typeof activeAlarmView.title === "string"
      ? activeAlarmView.title
      : "";
  const activeAlarmViewEventId =
    activeAlarmView &&
    activeAlarmView.source === GOOGLE_EVENT_SOURCE &&
    typeof activeAlarmView.eventId === "string"
      ? activeAlarmView.eventId
      : "";
  const activeDraftEditIndex =
    dayStackInlineDraft &&
    dayStackInlineDraft.dateKey === itemDateKey &&
    Number.isFinite(dayStackInlineDraft.editingAlarmIndex)
      ? Math.trunc(dayStackInlineDraft.editingAlarmIndex)
      : -1;

  const entries = [];
  alarms.forEach((alarm, alarmIndex) => {
    const alarmTime = alarm instanceof Date ? alarm : alarm.time;
    if (!(alarmTime instanceof Date) || !Number.isFinite(alarmTime.getTime())) return;
    if (dateKeyFromDate(alarmTime) !== itemDateKey) return;
    const title = alarm && !(alarm instanceof Date) ? alarm.title : "";
    if (activeAlarmViewIndex >= 0 && alarmIndex === activeAlarmViewIndex) return;
    if (activeDraftEditIndex >= 0 && alarmIndex === activeDraftEditIndex) return;
    if (
      activeAlarmViewIndex < 0 &&
      Number.isFinite(activeAlarmViewTimeMs) &&
      alarmTime.getTime() === activeAlarmViewTimeMs &&
      title === activeAlarmViewTitle
    ) {
      return;
    }
    const totalMinutes =
      alarmTime.getHours() * 60 +
      alarmTime.getMinutes() +
      alarmTime.getSeconds() / 60;
    entries.push({
      source: LOCAL_EVENT_SOURCE,
      alarmTime,
      title,
      alarmIndex,
      eventId: "",
      htmlLink: "",
      allDay: false,
      baseY: Math.max(0, Math.min(DAY_MINUTES * minutePx, totalMinutes * minutePx)),
    });
  });
  googleEvents.forEach((event) => {
    const alarmTime = googleEventDateTimeValue(event);
    if (!(alarmTime instanceof Date) || !Number.isFinite(alarmTime.getTime())) return;
    if (dateKeyFromDate(alarmTime) !== itemDateKey) return;
    const eventId = typeof event.id === "string" ? event.id : "";
    if (activeAlarmViewEventId && eventId === activeAlarmViewEventId) return;
    if (
      !activeAlarmViewEventId &&
      Number.isFinite(activeAlarmViewTimeMs) &&
      alarmTime.getTime() === activeAlarmViewTimeMs &&
      googleEventDisplayTitle(event) === activeAlarmViewTitle
    ) {
      return;
    }
    const totalMinutes = event.allDay
      ? 0
      : alarmTime.getHours() * 60 + alarmTime.getMinutes() + alarmTime.getSeconds() / 60;
    entries.push({
      source: GOOGLE_EVENT_SOURCE,
      alarmTime,
      title: googleEventDisplayTitle(event),
      alarmIndex: Number.MAX_SAFE_INTEGER,
      eventId,
      htmlLink: typeof event.htmlLink === "string" ? event.htmlLink : "",
      allDay: Boolean(event.allDay),
      baseY: Math.max(0, Math.min(DAY_MINUTES * minutePx, totalMinutes * minutePx)),
    });
  });
  entries.sort((a, b) => compareScheduleEntries(a, b, "baseY"));
  return entries;
}

function dayStackAlarmLayoutItemsForKey(itemDateKey = "", entries = []) {
  if (!itemDateKey || !Array.isArray(entries) || entries.length === 0) return [];
  const displayHeight = dayStackAlarmDisplayHeight();
  const effectiveHeight = Math.max(0, displayHeight);
  const sorted = entries
    .map((entry) => ({
      ...entry,
      renderY: dayStackRenderedYForItem(entry.baseY, itemDateKey),
    }))
    .sort((a, b) => {
      return compareScheduleEntries(a, b, "renderY");
    });
  if (effectiveHeight <= 0) {
    return sorted.map((entry) => ({
      kind: "alarm",
      entry,
      top: entry.renderY,
      col: 0,
      colCount: 1,
    }));
  }

  const groups = [];
  let current = [];
  let currentBottom = Number.NEGATIVE_INFINITY;
  sorted.forEach((entry) => {
    const top = entry.renderY;
    const bottom = top + effectiveHeight;
    if (!current.length || top < currentBottom - 0.0001) {
      current.push(entry);
      currentBottom = Math.max(currentBottom, bottom);
      return;
    }
    groups.push(current);
    current = [entry];
    currentBottom = bottom;
  });
  if (current.length) groups.push(current);

  const layout = [];
  groups.forEach((group, groupIndex) => {
    if (!group.length) return;
    const marks = [];
    group.forEach((entry) => {
      marks.push({ y: entry.renderY, type: 1 });
      marks.push({ y: entry.renderY + effectiveHeight, type: -1 });
    });
    marks.sort((a, b) => {
      if (Math.abs(a.y - b.y) > 0.0001) return a.y - b.y;
      return a.type - b.type;
    });
    let active = 0;
    let maxOverlap = 0;
    marks.forEach((mark) => {
      if (mark.type > 0) {
        active += 1;
        if (active > maxOverlap) {
          maxOverlap = active;
        }
      } else {
        active = Math.max(0, active - 1);
      }
    });

    if (maxOverlap <= 3) {
      const colEnds = [];
      const placed = [];
      let maxCol = 0;
      group.forEach((entry) => {
        let col = -1;
        for (let i = 0; i < 3; i += 1) {
          const endY = colEnds[i];
          if (!Number.isFinite(endY) || entry.renderY >= endY - 0.0001) {
            col = i;
            break;
          }
        }
        if (col < 0) {
          col = 2;
        }
        colEnds[col] = entry.renderY + effectiveHeight;
        maxCol = Math.max(maxCol, col);
        placed.push({
          kind: "alarm",
          entry,
          top: entry.renderY,
          col,
          colCount: 1,
        });
      });
      const colCount = Math.min(3, maxCol + 1);
      placed.forEach((item) => {
        item.colCount = colCount;
        layout.push(item);
      });
      return;
    }

    const realColEnds = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
    const bundles = [];
    group.forEach((entry) => {
      let col = -1;
      for (let i = 0; i < 2; i += 1) {
        if (entry.renderY >= realColEnds[i] - 0.0001) {
          col = i;
          break;
        }
      }
      if (col >= 0) {
        realColEnds[col] = entry.renderY + effectiveHeight;
        layout.push({
          kind: "alarm",
          entry,
          top: entry.renderY,
          col,
          colCount: 3,
        });
        return;
      }
      const top = entry.renderY;
      const bottom = top + effectiveHeight;
      const lastBundle = bundles[bundles.length - 1];
      if (!lastBundle || top >= lastBundle.bottom - 0.0001) {
        bundles.push({
          top,
          bottom,
          entries: [entry],
          key: `${itemDateKey}|g${groupIndex}|b${bundles.length}`,
        });
      } else {
        lastBundle.entries.push(entry);
        lastBundle.bottom = Math.max(lastBundle.bottom, bottom);
      }
    });
    bundles.forEach((bundle) => {
      layout.push({
        kind: "bundle",
        top: bundle.top,
        col: 2,
        colCount: 3,
        bundleKey: bundle.key,
        bundleEntries: bundle.entries,
      });
    });
  });

  layout.sort((a, b) => {
    if (Math.abs(a.top - b.top) > 0.001) return a.top - b.top;
    if (a.col !== b.col) return a.col - b.col;
    if (a.kind === b.kind) return 0;
    return a.kind === "bundle" ? 1 : -1;
  });
  return layout;
}

function dayStackAlarmSlotsForKey(itemDateKey = "") {
  const displayHeight = dayStackAlarmDisplayHeight();
  if (displayHeight <= 0) return [];
  if (!todayFocusUsesInlineHostForKey(itemDateKey)) {
    if (!dayStackExpandedDate || dayStackExpandedDate !== itemDateKey) return [];
  }
  const slotHeight = displayHeight + ALARM_EXPANDED_GAP_PX;
  return dayStackVisibleAlarmEntriesForKey(itemDateKey).map((entry) => ({
    splitY: entry.baseY,
    slotHeight,
  }));
}

function dayStackAlarmExtraHeightForKey(itemDateKey = "") {
  return dayStackAlarmSlotsForKey(itemDateKey).reduce((sum, slot) => sum + slot.slotHeight, 0);
}

function dayStackRenderedMaxYForItem(itemDateKey = "") {
  return (
    DAY_MINUTES * minutePx +
    dayStackAlarmExtraHeightForKey(itemDateKey) +
    (dayStackInlineEditorLayoutForKey(itemDateKey)?.slotHeight || 0)
  );
}

function dayStackRenderedYForItem(baseY, itemDateKey = "") {
  const y = Math.max(0, Math.min(DAY_MINUTES * minutePx, baseY));
  const alarmSlots = dayStackAlarmSlotsForKey(itemDateKey);
  let rendered = y;
  for (let i = 0; i < alarmSlots.length; i += 1) {
    if (y > alarmSlots[i].splitY + 0.0001) {
      rendered += alarmSlots[i].slotHeight;
    }
  }
  const layout = dayStackInlineEditorLayoutForKey(itemDateKey);
  if (!layout) return rendered;
  return y >= layout.splitY ? rendered + layout.slotHeight : rendered;
}

function dayStackBaseYForItem(renderedY, itemDateKey = "") {
  const maxRendered = dayStackRenderedMaxYForItem(itemDateKey);
  const targetY = Math.max(0, Math.min(maxRendered, renderedY));
  let low = 0;
  let high = DAY_MINUTES * minutePx;
  for (let i = 0; i < 24; i += 1) {
    const mid = (low + high) * 0.5;
    const mapped = dayStackRenderedYForItem(mid, itemDateKey);
    if (mapped < targetY) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return Math.max(0, Math.min(DAY_MINUTES * minutePx, high));
}

function buildDayStackInlineEditorCard(layout) {
  const card = document.createElement("div");
  card.className = "dayStackInlineEditorCard";
  card.style.top = `${layout.cardTop}px`;

  const header = document.createElement("div");
  header.className = "dayStackInlineEditorCard__header";
  const headerStamp = document.createElement("div");
  headerStamp.className = "dayStackInlineEditorCard__stamp";
  const sourceDateTime =
    layout.sourceType === "alarm"
      ? dayStackInlineAlarmView && dayStackInlineAlarmView.dateTime instanceof Date
        ? dayStackInlineAlarmView.dateTime
        : null
      : dayStackInlineDraft && dayStackInlineDraft.dateTime instanceof Date
        ? dayStackInlineDraft.dateTime
        : null;
  headerStamp.textContent = sourceDateTime
    ? `${pad2(sourceDateTime.getMonth() + 1)}-${pad2(sourceDateTime.getDate())} ${formatHourMinuteLabel(layout.totalMinutes)}`
    : formatHourMinuteLabel(layout.totalMinutes);
  header.appendChild(headerStamp);
  card.appendChild(header);

  if (layout.sourceType === "alarm" && dayStackInlineAlarmView) {
    const titleText =
      typeof dayStackInlineAlarmView.title === "string" && dayStackInlineAlarmView.title.trim()
        ? dayStackInlineAlarmView.title.trim()
        : dayStackInlineAlarmView.source === GOOGLE_EVENT_SOURCE
          ? GOOGLE_EVENT_DEFAULT_TITLE
          : "\uC54C\uB9BC";
    const isGoogleAlarm = dayStackInlineAlarmView.source === GOOGLE_EVENT_SOURCE;
    const alarmInfo = isGoogleAlarm
      ? `${formatDate(dayStackInlineAlarmView.dateTime)} ${
          dayStackInlineAlarmView.allDay
            ? "\uC885\uC77C"
            : formatDateTimeKorean(
                dayStackInlineAlarmView.dateTime,
                dayStackInlineAlarmView.dateTime.getHours(),
                dayStackInlineAlarmView.dateTime.getMinutes(),
                dayStackInlineAlarmView.dateTime.getSeconds()
              )
        }`
      : formatAlarmInfo({
          time: dayStackInlineAlarmView.dateTime,
          title: dayStackInlineAlarmView.title || "",
        });
    const heading = document.createElement("div");
    heading.className = "dayStackInlineAlarmHeading";
    heading.textContent = titleText;
    card.appendChild(heading);
    const message = document.createElement("div");
    message.className = "dayStackInlineAlarmMessage";
    message.textContent = isGoogleAlarm
      ? `Google \uC77C\uC815: ${alarmInfo}`
      : `\uC608\uC57D \uD655\uC778: ${alarmInfo}`;
    card.appendChild(message);
    if (!isGoogleAlarm) {
      const actions = document.createElement("div");
      actions.className = "dayStackInlineEditorActions";
      actions.innerHTML =
        '<button type="button" class="dayStackInlineEditorActionBtn primary" data-inline-editor-action="alarm-edit">\uC218\uC815</button><button type="button" class="dayStackInlineEditorActionBtn" data-inline-editor-action="alarm-cancel">\uCDE8\uC18C</button>';
      card.appendChild(actions);
    }
    return card;
  }

  if (!dayStackInlineDraft) {
    return card;
  }

  const step = dayStackInlineEditorStep();
  const titleText =
    typeof dayStackInlineDraft.title === "string" && dayStackInlineDraft.title.trim()
      ? dayStackInlineDraft.title.trim()
      : "\uC81C\uBAA9";

  if (step === DAY_STACK_INLINE_EDITOR_STEP_TITLE) {
    card.appendChild(buildDayStackInlineEditorPromptRow("\uC81C\uBAA9\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694."));
    const titleInput = document.createElement("input");
    titleInput.className = "dayStackInlineEditorControl dayStackInlineEditorTitle";
    titleInput.type = "text";
    titleInput.placeholder = "\uC81C\uBAA9";
    titleInput.autocomplete = "off";
    titleInput.value = dayStackInlineDraft.title || "";
    card.appendChild(titleInput);
  } else {
    card.appendChild(buildDayStackInlineEditorValueRow(titleText));
    card.appendChild(
      buildDayStackInlineEditorToggleRow(
        "\uC77C\uC815\uC2DC\uC791\uC2DC\uAC04",
        "remindEnabled",
        Boolean(dayStackInlineDraft.remindEnabled)
      )
    );
    card.appendChild(
      buildDayStackInlineEditorToggleRow(
        "\uBC18\uBCF5\uC548\uD568",
        "repeatEnabled",
        Boolean(dayStackInlineDraft.repeatEnabled)
      )
    );
  }

  const actions = document.createElement("div");
  actions.className = "dayStackInlineEditorActions";
  const isFinalStep = step >= DAY_STACK_INLINE_EDITOR_STEP_START;
  const confirmAction = isFinalStep ? "save" : "confirm";
  const confirmLabel = isFinalStep ? "\uC800\uC7A5" : "\uD655\uC778";
  actions.innerHTML =
    `<button type="button" class="dayStackInlineEditorActionBtn primary" data-inline-editor-action="${confirmAction}">${confirmLabel}</button><button type="button" class="dayStackInlineEditorActionBtn" data-inline-editor-action="cancel">\uCDE8\uC18C</button>`;
  card.appendChild(actions);
  return card;
}

function refreshDayStackInlineEditorLayout(item, body, itemDateKey = "") {
  if (!body) return;
  const layout = dayStackInlineEditorLayoutForKey(itemDateKey);
  const alarmSlots = dayStackAlarmSlotsForKey(itemDateKey);
  const alarmExtraHeight = alarmSlots.reduce((sum, slot) => sum + slot.slotHeight, 0);
  if (item) {
    item.style.setProperty(
      "--day-body-extra-height",
      `${(layout ? layout.slotHeight : 0) + alarmExtraHeight}px`
    );
  }
  body.classList.toggle("has-inline-editor", Boolean(layout));
  const hasGridLayers = Boolean(layout) || alarmSlots.length > 0;
  body.classList.toggle("has-grid-layers", hasGridLayers);
  body
    .querySelectorAll(
      ".dayStackInlineEditorSlot, .dayStackGridLayer, .dayStackHourLabels, .dayStackSleepWindow"
    )
    .forEach((node) => {
      node.remove();
    });
  if (hasGridLayers) {
    const dayEndY = DAY_MINUTES * minutePx;
    const slots = alarmSlots.map((slot) => ({
      splitY: slot.splitY,
      slotHeight: slot.slotHeight,
    }));
    if (layout) {
      slots.push({
        splitY: layout.splitY,
        slotHeight: layout.slotHeight,
      });
    }
    slots.sort((a, b) => {
      if (Math.abs(a.splitY - b.splitY) > 0.0001) return a.splitY - b.splitY;
      return 0;
    });

    const appendGridLayer = (top, height, offset) => {
      if (height <= 0.001) return;
      const grid = document.createElement("div");
      grid.className = "dayStackGridLayer";
      grid.style.top = `${top}px`;
      grid.style.height = `${height}px`;
      if (Math.abs(offset) > 0.001) {
        grid.style.setProperty("--grid-offset", `${-offset}px`);
      }
      body.appendChild(grid);
    };

    let baseCursor = 0;
    let renderedCursor = 0;
    slots.forEach((slot) => {
      const splitY = Math.max(0, Math.min(dayEndY, slot.splitY));
      const segmentHeight = Math.max(0, splitY - baseCursor);
      appendGridLayer(renderedCursor, segmentHeight, baseCursor);
      renderedCursor += segmentHeight + Math.max(0, slot.slotHeight);
      baseCursor = splitY;
    });
    appendGridLayer(renderedCursor, Math.max(0, dayEndY - baseCursor), baseCursor);
  }

  renderDayStackSleepWindows(body, itemDateKey);

  const labels = document.createElement("div");
  labels.className = "dayStackHourLabels";
  for (let hour = 0; hour < 24; hour += 1) {
    const label = document.createElement("div");
    label.className = "dayStackHourLabel";
    label.style.top = `${dayStackRenderedYForItem(hour * hourHeight, itemDateKey)}px`;
    label.textContent = `${pad2(hour)}:00`;
    labels.appendChild(label);
  }
  body.appendChild(labels);

  if (!layout) return;

  const slot = document.createElement("div");
  slot.className = "dayStackInlineEditorSlot";
  const layoutTop = dayStackRenderedYForItem(Math.max(0, layout.splitY - 0.0001), itemDateKey);
  slot.style.top = `${layoutTop}px`;
  slot.style.height = `${layout.slotHeight}px`;
  slot.appendChild(buildDayStackInlineEditorCard(layout));
  body.appendChild(slot);
}

function renderTodayFocusInlineEditorSlot(itemDateKey = "") {
  if (!timeline) return;
  timeline.querySelectorAll(".dayStackInlineEditorSlot").forEach((node) => node.remove());
}

function openInlineEditorForDateKey(itemDateKey, dateTime) {
  if (!itemDateKey || !(dateTime instanceof Date)) return;
  const previousDraft = dayStackInlineDraft;
  dayStackInlineAlarmView = null;
  dayStackInlineDraft = {
    dateKey: itemDateKey,
    dateTime: new Date(dateTime.getTime()),
    step: DAY_STACK_INLINE_EDITOR_STEP_TITLE,
    remindEnabled:
      previousDraft &&
      previousDraft.dateKey === itemDateKey &&
      typeof previousDraft.remindEnabled === "boolean"
        ? previousDraft.remindEnabled
        : false,
    repeatEnabled:
      previousDraft &&
      previousDraft.dateKey === itemDateKey &&
      typeof previousDraft.repeatEnabled === "boolean"
        ? previousDraft.repeatEnabled
        : false,
    title:
      previousDraft && previousDraft.dateKey === itemDateKey && typeof previousDraft.title === "string"
        ? previousDraft.title
        : "",
    remind:
      previousDraft && previousDraft.dateKey === itemDateKey && typeof previousDraft.remind === "string"
        ? previousDraft.remind
        : "none",
    repeat:
      previousDraft && previousDraft.dateKey === itemDateKey && typeof previousDraft.repeat === "string"
        ? previousDraft.repeat
        : "none",
    editingAlarmIndex: -1,
  };
  refreshActiveDayStackInlineDraft();
  requestAnimationFrame(() => {
    const root =
      todayFocusUsesInlineHostForKey(itemDateKey) && timeline
        ? timeline
        : dayStackLayer &&
            dayStackExpandedDate === itemDateKey &&
            dayStackLayer.querySelector(`.dayStackItem[data-date="${itemDateKey}"]`)
          ? dayStackLayer.querySelector(`.dayStackItem[data-date="${itemDateKey}"]`)
          : null;
    const titleInput =
      root && root.querySelector ? root.querySelector(".dayStackInlineEditorTitle") : null;
    if (!(titleInput instanceof HTMLInputElement)) return;
    titleInput.focus();
    titleInput.select();
  });
}

function openInlineAlarmViewForDateKey(itemDateKey, alarm) {
  if (!itemDateKey || !alarm || !(alarm.time instanceof Date)) return;
  dayStackInlineDraft = null;
  dayStackInlineAlarmView = {
    source:
      alarm && typeof alarm.source === "string" && alarm.source === GOOGLE_EVENT_SOURCE
        ? GOOGLE_EVENT_SOURCE
        : LOCAL_EVENT_SOURCE,
    dateKey: itemDateKey,
    dateTime: new Date(alarm.time.getTime()),
    title: typeof alarm.title === "string" ? alarm.title : "",
    remind: typeof alarm.remind === "string" ? alarm.remind : "none",
    repeat: typeof alarm.repeat === "string" ? alarm.repeat : "none",
    remindEnabled: Boolean(alarm.remindEnabled),
    repeatEnabled: Boolean(alarm.repeatEnabled),
    alarmIndex: Number.isFinite(alarm.alarmIndex) ? Math.trunc(alarm.alarmIndex) : -1,
    eventId: typeof alarm.eventId === "string" ? alarm.eventId : "",
    htmlLink: typeof alarm.htmlLink === "string" ? alarm.htmlLink : "",
    allDay: Boolean(alarm.allDay),
  };
  refreshActiveDayStackInlineDraft();
}

function openDayStackInlineEditor(item, body, dateTime) {
  if (!item || !body || !(dateTime instanceof Date)) return;
  const itemDateKey = item.dataset && typeof item.dataset.date === "string" ? item.dataset.date : "";
  if (!itemDateKey) return;
  openInlineEditorForDateKey(itemDateKey, dateTime);
}

function openDayStackInlineAlarmView(item, body, alarm) {
  if (!item || !body || !alarm || !(alarm.time instanceof Date)) return;
  const itemDateKey = item.dataset && typeof item.dataset.date === "string" ? item.dataset.date : "";
  if (!itemDateKey) return;
  openInlineAlarmViewForDateKey(itemDateKey, alarm);
}

function handleInlineEditorInputEvent(target) {
  if (!dayStackInlineDraft) return false;
  const titleInput = target && target.closest ? target.closest(".dayStackInlineEditorTitle") : null;
  if (!titleInput) return false;
  dayStackInlineDraft.title = titleInput.value;
  return true;
}

function handleInlineEditorChangeEvent(target) {
  if (!dayStackInlineDraft) return false;
  const control = target && target.closest ? target.closest("[data-inline-editor-field]") : null;
  if (!control) return false;
  const field = control.dataset.inlineEditorField || "";
  if (field === "remind" || field === "repeat") {
    dayStackInlineDraft[field] = control.value;
    return true;
  }
  return false;
}

function handleInlineEditorClickEvent(target) {
  const toggleBtn =
    target && target.closest ? target.closest("[data-inline-editor-toggle]") : null;
  if (toggleBtn && dayStackInlineDraft) {
    const field = toggleBtn.dataset.inlineEditorToggle || "";
    if (field === "remindEnabled" || field === "repeatEnabled") {
      dayStackInlineDraft[field] = !Boolean(dayStackInlineDraft[field]);
      refreshActiveDayStackInlineDraft();
      return true;
    }
  }

  const actionBtn =
    target && target.closest ? target.closest("[data-inline-editor-action]") : null;
  if (!actionBtn) return false;

  const action = actionBtn.dataset.inlineEditorAction || "";
  if (action === "alarm-cancel") {
    clearDayStackInlineDraft();
    return true;
  }
  if (action === "alarm-open-link") {
    const targetLink =
      dayStackInlineAlarmView && typeof dayStackInlineAlarmView.htmlLink === "string"
        ? dayStackInlineAlarmView.htmlLink
        : "";
    if (targetLink) {
      window.open(targetLink, "_blank", "noopener");
    }
    return true;
  }
  if (action === "alarm-edit") {
    if (!dayStackInlineAlarmView || !(dayStackInlineAlarmView.dateTime instanceof Date)) {
      clearDayStackInlineDraft();
      return true;
    }
    if (dayStackInlineAlarmView.source === GOOGLE_EVENT_SOURCE) {
      return true;
    }
    const editingIndex = Number.isFinite(dayStackInlineAlarmView.alarmIndex)
      ? Math.trunc(dayStackInlineAlarmView.alarmIndex)
      : -1;
    const nextDateKey =
      typeof dayStackInlineAlarmView.dateKey === "string" ? dayStackInlineAlarmView.dateKey : "";
    dayStackInlineDraft = {
      dateKey: nextDateKey,
      dateTime: new Date(dayStackInlineAlarmView.dateTime.getTime()),
      step: DAY_STACK_INLINE_EDITOR_STEP_TITLE,
      remindEnabled: Boolean(dayStackInlineAlarmView.remindEnabled),
      repeatEnabled: Boolean(dayStackInlineAlarmView.repeatEnabled),
      title:
        typeof dayStackInlineAlarmView.title === "string" ? dayStackInlineAlarmView.title : "",
      remind:
        typeof dayStackInlineAlarmView.remind === "string" ? dayStackInlineAlarmView.remind : "none",
      repeat:
        typeof dayStackInlineAlarmView.repeat === "string" ? dayStackInlineAlarmView.repeat : "none",
      editingAlarmIndex: editingIndex >= 0 ? editingIndex : -1,
    };
    dayStackInlineAlarmView = null;
    refreshActiveDayStackInlineDraft();
    return true;
  }
  if (!dayStackInlineDraft) return true;
  if (action === "cancel") {
    clearDayStackInlineDraft();
    return true;
  }
  if ((action === "confirm" || action === "save") && dayStackInlineDraft.dateTime instanceof Date) {
    const step = dayStackInlineEditorStep();
    if (action === "confirm" && step < DAY_STACK_INLINE_EDITOR_STEP_START) {
      dayStackInlineDraft.step = DAY_STACK_INLINE_EDITOR_STEP_START;
      refreshActiveDayStackInlineDraft();
      return true;
    }
    const nextAlarm = {
      time: new Date(dayStackInlineDraft.dateTime.getTime()),
      title: typeof dayStackInlineDraft.title === "string" ? dayStackInlineDraft.title.trim() : "",
      remind: dayStackInlineDraft.remind,
      repeat: dayStackInlineDraft.repeat,
      remindEnabled: Boolean(dayStackInlineDraft.remindEnabled),
      repeatEnabled: Boolean(dayStackInlineDraft.repeatEnabled),
    };
    const editingIndex = Number.isFinite(dayStackInlineDraft.editingAlarmIndex)
      ? Math.trunc(dayStackInlineDraft.editingAlarmIndex)
      : -1;
    if (findAlarmIndexAtMinute(nextAlarm.time, editingIndex) >= 0) {
      showDuplicateAlarmMinuteAlert(nextAlarm.time);
      return true;
    }
    if (editingIndex >= 0 && editingIndex < alarms.length) {
      const prevAlarm = alarms[editingIndex];
      if (prevAlarm && typeof prevAlarm === "object" && !(prevAlarm instanceof Date)) {
        alarms[editingIndex] = { ...prevAlarm, ...nextAlarm };
      } else {
        alarms[editingIndex] = nextAlarm;
      }
    } else {
      alarms.push(nextAlarm);
    }
    markLocalAlarmStoreDirty();
    void requestLocalAlarmStoreSave();
    clearDayStackInlineDraft();
    if (todayFocusMode && !dayStackOpen) {
      return true;
    }
    renderAllAlarmViews();
    return true;
  }
  return true;
}

function buildDayStackYearList() {
  const fragment = document.createDocumentFragment();
  const startYear = DAY_STACK_RANGE_START.getFullYear();
  const endYear = DAY_STACK_RANGE_END.getFullYear();
  const currentYear = new Date().getFullYear();
  const hasExplicitHeaderFocus = Boolean(dayStackReturnFocusKey);
  let decadeWrap = null;
  let decadeKey = "";
  let decadeBandIndex = 0;
  for (let year = startYear; year <= endYear; year += 1) {
    const decadeStart = Math.floor(year / 10) * 10;
    const nextDecadeKey = String(decadeStart);
    if (nextDecadeKey !== decadeKey || !decadeWrap) {
      decadeKey = nextDecadeKey;
      const yearGroup = document.createElement("div");
      yearGroup.className = "dayStackMonthGroup year-list-group";
      yearGroup.classList.add(decadeBandIndex % 2 === 0 ? "year-band-a" : "year-band-b");
      yearGroup.dataset.decade = decadeKey;
      decadeBandIndex += 1;

      const yearRail = document.createElement("div");
      yearRail.className = "dayStackMonthRail dayStackYearListRail";
      const yearRailLabel = document.createElement("span");
      yearRailLabel.className = "dayStackMonthRail__label";
      yearRailLabel.innerHTML = `<span class="yearTop">${String(decadeStart).slice(0, 2)}</span><span class="yearBottom">${String(decadeStart).slice(2)}</span><span class="yearSuffix">s</span>`;
      yearRail.appendChild(yearRailLabel);
      yearRail.setAttribute("aria-hidden", "true");

      decadeWrap = document.createElement("div");
      decadeWrap.className = "dayStackMonthDays";

      yearGroup.appendChild(yearRail);
      yearGroup.appendChild(decadeWrap);
      fragment.appendChild(yearGroup);
    }

    const item = document.createElement("div");
    item.className = "dayStackItem year-list-head";
    item.dataset.date = dateKeyFromDate(new Date(year, 0, 1));
    item.dataset.year = String(year);
    if (item.dataset.date === dayStackReturnFocusKey) {
      item.classList.add("is-return-focus");
    }
    if (year === currentYear && !hasExplicitHeaderFocus) {
      item.classList.add("is-current-year");
    }

    const head = document.createElement("div");
    head.className = "dayStackHead";
    head.setAttribute("role", "button");
    head.setAttribute("tabindex", "0");
    const dateLabel = document.createElement("span");
    dateLabel.className = "date";
    dateLabel.textContent = String(year);
    head.appendChild(dateLabel);

    const ageText = formatYearListAge(year);
    if (ageText) {
      const ageLabel = document.createElement("span");
      ageLabel.className = "yearAge";
      ageLabel.textContent = `(${ageText})`;
      head.appendChild(ageLabel);
    }

    item.appendChild(head);
    decadeWrap.appendChild(item);
  }
  return fragment;
}

function buildDayStackList() {
  if (!dayStackLayer || !isDayStackWindowValid()) return;
  if (dayStackYearListMode) {
    dayStackLayer.innerHTML = "";
    dayStackLayer.appendChild(buildDayStackYearList());
    return;
  }
  const fragment = document.createDocumentFragment();
  const todayKey = dateKeyFromDate(new Date());
  if (dayStackViewMode === DAY_STACK_VIEW_MODE_YEAR_MONTH) {
    dayStackExpandedDate = null;
    dayStackSpread = 0;
    let yearWrap = null;
    let yearKey = "";
    let yearBandIndex = 0;
    const monthStart = new Date(dayStackBaseDate.getFullYear(), dayStackBaseDate.getMonth(), 1);
    const monthEnd = new Date(dayStackEndDate.getFullYear(), dayStackEndDate.getMonth(), 1);
    for (
      let monthDate = new Date(monthStart);
      monthDate.getTime() <= monthEnd.getTime();
      monthDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1)
    ) {
      const nextYearKey = String(monthDate.getFullYear());
      if (nextYearKey !== yearKey || !yearWrap) {
        yearKey = nextYearKey;
        const yearGroup = document.createElement("div");
        yearGroup.className = "dayStackMonthGroup year-view";
        yearGroup.classList.add(yearBandIndex % 2 === 0 ? "year-band-a" : "year-band-b");
        yearGroup.dataset.year = yearKey;
        yearBandIndex += 1;

        const yearRail = document.createElement("div");
        yearRail.className = "dayStackMonthRail";
        const yearRailLabel = document.createElement("span");
        yearRailLabel.className = "dayStackMonthRail__label";
        yearRailLabel.innerHTML = `<span class="yearTop">${yearKey.slice(0, 2)}</span><span class="yearBottom">${yearKey.slice(2)}</span>`;
        yearRail.appendChild(yearRailLabel);
        yearRail.setAttribute("aria-hidden", "true");

        yearWrap = document.createElement("div");
        yearWrap.className = "dayStackMonthDays";
        yearGroup.appendChild(yearRail);
        yearGroup.appendChild(yearWrap);
        fragment.appendChild(yearGroup);
      }

      const item = document.createElement("div");
      item.className = "dayStackItem month-head";
      item.dataset.dayOffset = String(diffDays(monthDate, dayStackBaseDate));
      item.dataset.date = dateKeyFromDate(monthDate);
      if (item.dataset.date === dayStackReturnFocusKey) {
        item.classList.add("is-return-focus");
      }

      const head = document.createElement("div");
      head.className = "dayStackHead";
      head.innerHTML = `<span class="date">${pad2(monthDate.getMonth() + 1)}</span>`;
      item.appendChild(head);
      yearWrap.appendChild(item);
    }
  } else {
    let monthDaysWrap = null;
    let monthKey = "";
    let monthBandIndex = 0;
    for (
      let date = new Date(dayStackBaseDate);
      date.getTime() <= dayStackEndDate.getTime();
      date = addDays(date, 1)
    ) {
      const nextMonthKey = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
      if (nextMonthKey !== monthKey || !monthDaysWrap) {
        monthKey = nextMonthKey;
        const monthGroup = document.createElement("div");
        monthGroup.className = "dayStackMonthGroup";
        monthGroup.classList.add(monthBandIndex % 2 === 0 ? "year-band-a" : "year-band-b");
        monthGroup.dataset.month = monthKey;
        monthBandIndex += 1;

        const monthRail = document.createElement("div");
        monthRail.className = "dayStackMonthRail";
        const monthRailLabel = document.createElement("span");
        monthRailLabel.className = "dayStackMonthRail__label";
        monthRailLabel.textContent = monthShortLabel(date);
        monthRail.appendChild(monthRailLabel);
        monthRail.setAttribute("role", "button");
        monthRail.setAttribute("tabindex", "0");
        monthRail.setAttribute("aria-expanded", dayStackExpandedMonthKey === monthKey ? "true" : "false");
        monthRail.setAttribute(
          "aria-label",
          monthRailAriaLabel(date, dayStackExpandedMonthKey === monthKey)
        );

        monthDaysWrap = document.createElement("div");
        monthDaysWrap.className = "dayStackMonthDays";
        monthGroup.appendChild(monthRail);
        monthGroup.appendChild(monthDaysWrap);
        fragment.appendChild(monthGroup);
      }

      const dayOffset = diffDays(date, dayStackBaseDate);
      const parts = formatDateParts(date);
      const key = dateKeyFromDate(date);
      const item = document.createElement("div");
      item.className = "dayStackItem";
      item.dataset.dayOffset = String(dayOffset);
      item.dataset.date = key;
      if (key === dayStackReturnFocusKey) {
        item.classList.add("is-return-focus");
      }

      const weekStart = addDays(date, -date.getDay());
      const weekEpochDay = Math.floor(
        Date.UTC(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()) / 86400000
      );
      const weekIndex = Math.floor(weekEpochDay / 7);
      if (weekIndex % 2 !== 0) {
        item.classList.add("week-alt");
      }
      if (key === todayKey) {
        item.classList.add("is-today");
      }
      if (dayStackExpandedDate && dayStackExpandedDate === key) {
        item.classList.add("expanded");
      }

      const head = document.createElement("div");
      head.className = "dayStackHead";
      head.setAttribute("role", "button");
      head.setAttribute("tabindex", "0");
      head.innerHTML = `<span class="date">${pad2(date.getDate())}</span><span class="weekday"> ${parts.weekday}</span>`;

      item.appendChild(head);
      item.appendChild(
        buildDayStackTimelineBody(Boolean(dayStackExpandedDate && dayStackExpandedDate === key), key)
      );
      monthDaysWrap.appendChild(item);
    }
  }

  dayStackLayer.innerHTML = "";
  dayStackLayer.appendChild(fragment);
}

function updateDayStackNowLines(now = new Date()) {
  if (!dayStackLayer || !dayStackOpen) return;
  if (dayStackViewMode !== DAY_STACK_VIEW_MODE_MONTH_DAY) return;
  const item = expandedDayStackItem();
  if (!item) return;
  const itemDateKey = item.dataset && typeof item.dataset.date === "string" ? item.dataset.date : "";
  let body = item.querySelector(".dayStackBody");
  if (!body) return;
  if (body.dataset.built !== "1") {
    body = ensureDayStackItemBodyBuilt(item);
  }
  if (!body) return;
  const line = body.querySelector(".dayStackNowLine");
  if (!line) return;

  const todayKey = dateKeyFromDate(now);
  const minutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const y = Math.max(0, Math.min(DAY_MINUTES * minutePx, minutes * minutePx));
  const timeText = now.toTimeString().slice(0, 8);
  const isToday = item.dataset.date === todayKey;
  line.style.display = isToday ? "block" : "none";
  if (!isToday) {
    updateDayStackFloatingNowLabel(item, 0, "");
    return;
  }
  const renderedY = dayStackRenderedYForItem(y, itemDateKey);
  const hideForHover = shouldHideDayStackNowLine(itemDateKey, renderedY);
  if (hideForHover) {
    line.style.display = "none";
    updateDayStackFloatingNowLabel(item, 0, "");
    return;
  }
  line.style.top = `${renderedY}px`;
  updateDayStackFloatingNowLabel(item, DAY_BAR_HEIGHT + renderedY - 22, timeText);
  const label = line.querySelector(".timeText");
  if (label) {
    label.textContent = "";
  }
}

function scrollTopForDayStackItem(item) {
  if (!dayStackLayer || !item || !item.isConnected) return 0;
  const layerRect = dayStackLayer.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();
  const top = dayStackLayer.scrollTop + (itemRect.top - layerRect.top);
  const maxScroll = Math.max(0, dayStackLayer.scrollHeight - dayStackLayer.clientHeight);
  return Math.max(0, Math.min(maxScroll, top));
}

function scrollTopForCenteredDayStackItem(item) {
  if (!dayStackLayer || !item || !item.isConnected) return 0;
  const itemTop = scrollTopForDayStackItem(item);
  const itemHeight = Math.max(1, item.getBoundingClientRect().height || item.offsetHeight || DAY_BAR_HEIGHT);
  const targetTop = itemTop - (dayStackLayer.clientHeight - itemHeight) / 2;
  const maxScroll = Math.max(0, dayStackLayer.scrollHeight - dayStackLayer.clientHeight);
  return Math.max(0, Math.min(maxScroll, targetTop));
}

function scrollTopForCenteredExpandedDayStackItem(item) {
  if (!dayStackLayer || !item || !item.isConnected) return 0;
  const itemTop = scrollTopForDayStackItem(item);
  const itemHeight = Math.max(1, item.getBoundingClientRect().height || item.offsetHeight || dayBlockHeight);
  const targetTop = itemTop - (dayStackLayer.clientHeight - itemHeight) / 2;
  const maxScroll = Math.max(0, dayStackLayer.scrollHeight - dayStackLayer.clientHeight);
  return Math.max(0, Math.min(maxScroll, targetTop));
}

function scrollTopForDayStackDateTime(item, dateTime) {
  if (
    !dayStackLayer ||
    !item ||
    !item.isConnected ||
    !(dateTime instanceof Date) ||
    !Number.isFinite(dateTime.getTime())
  ) {
    return 0;
  }
  const itemDateKey = item.dataset && typeof item.dataset.date === "string" ? item.dataset.date : "";
  if (!itemDateKey) return scrollTopForCenteredExpandedDayStackItem(item);
  const minutes =
    dateTime.getHours() * 60 +
    dateTime.getMinutes() +
    dateTime.getSeconds() / 60;
  const yWithinItem = DAY_BAR_HEIGHT + dayStackRenderedYForItem(minutes * minutePx, itemDateKey);
  const targetTop = scrollTopForDayStackItem(item) + yWithinItem - dayStackLayer.clientHeight / 2;
  const maxScroll = Math.max(0, dayStackLayer.scrollHeight - dayStackLayer.clientHeight);
  return Math.max(0, Math.min(maxScroll, targetTop));
}

function clearDayStackCenterTimer() {
  if (dayStackCenterAnimRaf) {
    cancelAnimationFrame(dayStackCenterAnimRaf);
    dayStackCenterAnimRaf = 0;
  }
  if (!dayStackCenterTimer) return;
  clearTimeout(dayStackCenterTimer);
  dayStackCenterTimer = 0;
}

function clearDayStackCenterTimeout() {
  if (!dayStackCenterTimer) return;
  clearTimeout(dayStackCenterTimer);
  dayStackCenterTimer = 0;
}

function setDayStackReturnFocus(targetKey = "") {
  dayStackReturnFocusKey = typeof targetKey === "string" ? targetKey : "";
  if (!dayStackLayer) return;
  dayStackLayer.querySelectorAll(".dayStackItem.is-return-focus").forEach((item) => {
    if (item.dataset && item.dataset.date === dayStackReturnFocusKey) return;
    item.classList.remove("is-return-focus");
  });
  if (!dayStackReturnFocusKey) return;
  const targetItem = dayStackLayer.querySelector(`.dayStackItem[data-date="${dayStackReturnFocusKey}"]`);
  if (targetItem) {
    targetItem.classList.add("is-return-focus");
  }
}

function dayStackRailFocusKeyForDate(date, viewMode = dayStackViewMode) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  if (viewMode === DAY_STACK_VIEW_MODE_YEAR_MONTH) {
    return `year:${date.getFullYear()}`;
  }
  if (viewMode === DAY_STACK_VIEW_MODE_MONTH_DAY) {
    return `month:${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
  }
  return "";
}

function setDayStackRailFocus(targetKey = "") {
  dayStackRailFocusKey = typeof targetKey === "string" ? targetKey : "";
  if (!dayStackLayer) return;
  dayStackLayer.querySelectorAll(".dayStackMonthGroup.is-rail-focus").forEach((group) => {
    group.classList.remove("is-rail-focus");
  });
  if (!dayStackRailFocusKey) return;
  let targetGroup = null;
  if (dayStackRailFocusKey.startsWith("year:")) {
    const year = dayStackRailFocusKey.slice(5);
    targetGroup = dayStackLayer.querySelector(`.dayStackMonthGroup.year-view[data-year="${year}"]`);
    if (!targetGroup) {
      const yearNumber = Number(year);
      if (Number.isFinite(yearNumber)) {
        const decadeKey = String(Math.floor(yearNumber / 10) * 10);
        targetGroup = dayStackLayer.querySelector(
          `.dayStackMonthGroup.year-list-group[data-decade="${decadeKey}"]`
        );
      }
    }
  } else if (dayStackRailFocusKey.startsWith("month:")) {
    const month = dayStackRailFocusKey.slice(6);
    targetGroup = dayStackLayer.querySelector(`.dayStackMonthGroup[data-month="${month}"]`);
  }
  if (targetGroup) {
    targetGroup.classList.add("is-rail-focus");
  }
}

function scheduleCenteredExpandedDayStackItem(item, targetKey) {
  clearDayStackCenterTimeout();
  dayStackCenterTimer = window.setTimeout(() => {
    dayStackCenterTimer = 0;
    if (!dayStackOpen || !dayStackLayer) return;
    if (!item || !item.isConnected) return;
    if (dayStackExpandedDate !== targetKey) return;
    setDayStackScrollTop(scrollTopForCenteredExpandedDayStackItem(item));
    updateDayStackNowLines(new Date());
  }, DAY_STACK_EXPAND_TRANSITION_MS + 20);
}

function animateCenteredExpandedDayStackItem(item, targetKey) {
  if (!dayStackOpen || !dayStackLayer || !item || !item.isConnected) return;
  clearDayStackCenterTimer();
  const startTop = dayStackLayer.scrollTop;
  const start = performance.now();

  const step = (now) => {
    if (!dayStackOpen || !dayStackLayer) {
      dayStackCenterAnimRaf = 0;
      return;
    }
    if (!item || !item.isConnected) {
      dayStackCenterAnimRaf = 0;
      return;
    }
    if (dayStackExpandedDate !== targetKey) {
      dayStackCenterAnimRaf = 0;
      return;
    }
    const t = Math.min(1, (now - start) / DAY_STACK_EXPAND_TRANSITION_MS);
    const eased = t * t * (3 - 2 * t);
    const targetTop = scrollTopForCenteredExpandedDayStackItem(item);
    setDayStackScrollTop(startTop + (targetTop - startTop) * eased);
    if (t < 1) {
      dayStackCenterAnimRaf = requestAnimationFrame(step);
      return;
    }
    dayStackCenterAnimRaf = 0;
    updateDayStackNowLines(new Date());
  };

  dayStackCenterAnimRaf = requestAnimationFrame(step);
}

function collapseExpandedDayStackItem() {
  if (!dayStackLayer) return false;
  if (dayStackViewMode !== DAY_STACK_VIEW_MODE_MONTH_DAY) return false;
  const item = expandedDayStackItem();
  if (!item) return false;
  const targetKey = item.dataset && typeof item.dataset.date === "string" ? item.dataset.date : "";
  if (Math.abs(minutePx - BASE_MINUTE_PX) >= MINUTE_PX_EPSILON) {
    setMinutePx(BASE_MINUTE_PX, null, dayStackLayer.getBoundingClientRect().top + dayStackLayer.clientHeight / 2);
  }
  clearDayStackCenterTimer();
  dayStackExpandedDate = null;
  dayStackExpandedMonthKey = "";
  dayStackSpread = 0;
  dayStackAlarmBundleOpenKey = "";
  applyDayStackBodyOpenRatios(null, false);
  updateDayStackFloatingNowLabel(item, 0, "");
  compactDayStackItemBody(item);
  setDayStackReturnFocus(targetKey);
  return true;
}

function collapseExpandedDayStackItemIfBoundaryReached(scrollDelta = 0) {
  if (!dayStackLayer) return false;
  if (dayStackViewMode !== DAY_STACK_VIEW_MODE_MONTH_DAY) return false;
  if (dayStackExpandedMonthKey) return false;
  if (!Number.isFinite(scrollDelta) || Math.abs(scrollDelta) < 0.5) return false;
  const item = expandedDayStackItem();
  const body = item ? item.querySelector(".dayStackBody") : null;
  if (!item || !body || body.offsetHeight <= 1) return false;
  const layerRect = dayStackLayer.getBoundingClientRect();
  const bodyRect = body.getBoundingClientRect();
  const towardTop = scrollDelta > 0;
  const topBoundary = layerRect.top + DAY_BAR_HEIGHT + 1;
  const bottomBoundary = layerRect.bottom - 1;
  const reachedBoundary = towardTop
    ? bodyRect.bottom <= topBoundary
    : bodyRect.top >= bottomBoundary;
  if (!reachedBoundary) return false;
  return collapseExpandedDayStackItem();
}

function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function expandedDayStackItem() {
  if (!dayStackLayer || !dayStackExpandedDate) return null;
  return dayStackLayer.querySelector(`.dayStackItem[data-date="${dayStackExpandedDate}"]`);
}

function clearDayStackAlarmFocus() {
  if (dayStackAlarmFocusTimer) {
    clearTimeout(dayStackAlarmFocusTimer);
    dayStackAlarmFocusTimer = 0;
  }
  if (!dayStackLayer) return;
  dayStackLayer.querySelectorAll(".dayStackAlarmLine.is-focused").forEach((line) => {
    line.classList.remove("is-focused");
  });
}

function findDayStackAlarmLineForEntry(entry) {
  if (!dayStackLayer || !dayStackOpen || !entry) return null;
  const expandedItem = expandedDayStackItem();
  const body = expandedItem ? expandedItem.querySelector(".dayStackBody") : null;
  if (!body) return null;
  const entrySource = entry.source || LOCAL_EVENT_SOURCE;
  const entryAlarmIndex = Number(entry.alarmIndex);
  const entryTime = scheduleEntryTimeValue(entry);
  const entryTitle = typeof entry.title === "string" ? entry.title : "";
  const lines = body.querySelectorAll(".dayStackAlarmLine:not(.bundle)");
  for (const line of lines) {
    const source = line.dataset.source || LOCAL_EVENT_SOURCE;
    if (source !== entrySource) continue;
    if (source === GOOGLE_EVENT_SOURCE) {
      if (entry.eventId && line.dataset.eventId === entry.eventId) {
        return line;
      }
      continue;
    }
    const lineAlarmIndex = Number(line.dataset.alarmIndex || "");
    if (Number.isFinite(lineAlarmIndex) && Number.isFinite(entryAlarmIndex)) {
      if (Math.trunc(lineAlarmIndex) === Math.trunc(entryAlarmIndex)) {
        return line;
      }
      continue;
    }
    const lineTimestamp = Number(line.dataset.timestamp || "");
    if (
      entryTime instanceof Date &&
      Number.isFinite(lineTimestamp) &&
      lineTimestamp === entryTime.getTime()
    ) {
      const lineTitle = line.dataset.title || "";
      if (!entryTitle || lineTitle === entryTitle) {
        return line;
      }
    }
  }
  return null;
}

function focusDayStackAlarmEntry(entry) {
  clearDayStackAlarmFocus();
  const line = findDayStackAlarmLineForEntry(entry);
  if (!line) return;
  line.classList.add("is-focused");
  dayStackAlarmFocusTimer = window.setTimeout(() => {
    dayStackAlarmFocusTimer = 0;
    if (line.isConnected) {
      line.classList.remove("is-focused");
    }
  }, DAY_STACK_REVEAL_FOCUS_MS);
}

function revealScheduleEntryInDayStack(entry) {
  if (!dayStackLayer || !entry) return false;
  const time = scheduleEntryTimeValue(entry);
  if (!(time instanceof Date) || !Number.isFinite(time.getTime())) return false;

  const targetDate = clampDayStackDate(startOfDay(time));
  const targetKey = dateKeyFromDate(targetDate);
  const revealToken = ++dayStackRevealToken;

  const finishReveal = () => {
    if (revealToken !== dayStackRevealToken || !dayStackOpen || !dayStackLayer) return;
    const targetItem =
      expandedDayStackItem() || dayStackLayer.querySelector(`.dayStackItem[data-date="${targetKey}"]`);
    if (!targetItem) return;
    const targetTop = scrollTopForDayStackDateTime(targetItem, time);
    setDayStackScrollTop(targetTop);
    dayStackLastScrollTop = targetTop;
    const targetBody = ensureDayStackItemBodyBuilt(targetItem);
    if (targetBody) {
      openDayStackInlineAlarmView(targetItem, targetBody, entry);
      const adjustedTop = scrollTopForDayStackDateTime(targetItem, time);
      setDayStackScrollTop(adjustedTop);
      dayStackLastScrollTop = adjustedTop;
    } else {
      focusDayStackAlarmEntry(entry);
    }
    updateDayStackNowLines(new Date());
  };

  hideHoverGuide();
  clearDayStackInlineDraft();
  dayStackBackAnchorDate = new Date(targetDate.getTime());
  dayStackAlarmBundleOpenKey = "";
  if (!dayStackOpen) {
    setDayStackOpen(true);
  }
  ensureDayStackWindow(targetDate);
  setDayStackReturnFocus("");
  setDayStackRailFocus(dayStackRailFocusKeyForDate(targetDate, DAY_STACK_VIEW_MODE_MONTH_DAY));
  dayStackExpandedDate = targetKey;
  dayStackSpread = 0;
  dayStackMonthListMode = false;
  dayStackYearListMode = false;
  dayStackViewMode = DAY_STACK_VIEW_MODE_MONTH_DAY;
  renderDayStack();

  const targetItem =
    expandedDayStackItem() || dayStackLayer.querySelector(`.dayStackItem[data-date="${targetKey}"]`);
  if (!targetItem) return false;
  const initialTop = scrollTopForCenteredExpandedDayStackItem(targetItem);
  setDayStackScrollTop(initialTop);
  dayStackLastScrollTop = initialTop;
  scheduleCenteredExpandedDayStackItem(targetItem, targetKey);

  const anchorClientY = dayStackLayer.getBoundingClientRect().top + dayStackLayer.clientHeight / 2;
  if (minutePx < ZOOM_MINUTE_PX - MINUTE_PX_EPSILON) {
    animateMinutePx(ZOOM_MINUTE_PX, time, anchorClientY);
    window.setTimeout(finishReveal, 140);
  } else {
    finishReveal();
  }
  return true;
}

function applyDayStackBodyOpenRatios(anchorHeadTop, preserveAnchorPosition = true) {
  if (!dayStackLayer) return;
  const anchorItem = expandedDayStackItem();
  const expandedMonthKey =
    dayStackViewMode === DAY_STACK_VIEW_MODE_MONTH_DAY &&
    !dayStackYearListMode &&
    typeof dayStackExpandedMonthKey === "string"
      ? dayStackExpandedMonthKey
      : "";
  const anchorHead = anchorItem ? anchorItem.querySelector(".dayStackHead") : null;
  const targetTop = preserveAnchorPosition
    ? Number.isFinite(anchorHeadTop)
      ? anchorHeadTop
      : anchorHead
        ? anchorHead.getBoundingClientRect().top
        : null
    : null;
  dayStackLayer.classList.toggle("real-head-sticky", Boolean(anchorItem) && !expandedMonthKey);

  dayStackLayer.querySelectorAll(".dayStackItem").forEach((item) => {
    const itemDateKey = item.dataset && typeof item.dataset.date === "string" ? item.dataset.date : "";
    const itemMonthKey = itemDateKey ? itemDateKey.slice(0, 7) : "";
    const inlineExtra = dayStackInlineEditorLayoutForKey(itemDateKey)?.slotHeight || 0;
    const alarmExtra = dayStackAlarmExtraHeightForKey(itemDateKey);
    item.style.setProperty(
      "--day-body-extra-height",
      `${inlineExtra + alarmExtra}px`
    );
    const isMonthExpandedItem = Boolean(expandedMonthKey && itemMonthKey === expandedMonthKey);
    const ratio =
      isMonthExpandedItem ||
      (!expandedMonthKey && anchorItem && item === anchorItem)
        ? 1
        : 0;
    if (ratio > 0) {
      ensureDayStackItemBodyBuilt(item);
    }
    item.style.setProperty("--day-open-ratio", ratio.toFixed(4));
    if (ratio > 0) {
      item.classList.add("expanded");
    } else {
      item.classList.remove("expanded");
    }
  });

  if (preserveAnchorPosition && anchorHead && Number.isFinite(targetTop)) {
    const currentTop = anchorHead.getBoundingClientRect().top;
    const delta = currentTop - targetTop;
    if (Math.abs(delta) > 0.5) {
      const maxScroll = Math.max(0, dayStackLayer.scrollHeight - dayStackLayer.clientHeight);
      dayStackLayer.scrollTop = Math.max(
        0,
        Math.min(maxScroll, dayStackLayer.scrollTop + delta)
      );
    }
  }
}

function monthRailAtStickyTop() {
  if (!dayStackLayer) return null;
  const rails = dayStackLayer.querySelectorAll(".dayStackMonthRail");
  if (!rails.length) return null;
  const topRef = dayStackLayer.getBoundingClientRect().top + DAY_BAR_HEIGHT * 0.5;
  let target = rails[0];
  for (let i = 0; i < rails.length; i += 1) {
    const top = rails[i].getBoundingClientRect().top;
    if (top <= topRef + 0.5) {
      target = rails[i];
    } else {
      break;
    }
  }
  return target;
}

function updateDayStackMonthRailLabelPositions() {
  if (!dayStackLayer) return;
  const labels = dayStackLayer.querySelectorAll(".dayStackMonthRail__label");
  if (!labels.length) return;
  const shouldTrackVisibleCenter = dayStackOpen && !dayStackMonthListMode;
  const layerRect = dayStackLayer.getBoundingClientRect();
  labels.forEach((label) => {
    if (!(label instanceof HTMLElement)) return;
    const rail = label.closest(".dayStackMonthRail");
    const group = rail ? rail.closest(".dayStackMonthGroup") : null;
    if (!shouldTrackVisibleCenter || !rail || !group) {
      label.style.transform = "translateY(0px)";
      return;
    }
    const groupRect = group.getBoundingClientRect();
    const visibleTop = Math.max(groupRect.top, layerRect.top);
    const visibleBottom = Math.min(groupRect.bottom, layerRect.bottom);
    if (visibleBottom <= visibleTop || groupRect.height <= 0) {
      label.style.transform = "translateY(0px)";
      return;
    }
    const visibleCenter = (visibleTop + visibleBottom) / 2;
    const groupCenter = groupRect.top + groupRect.height / 2;
    const offset = visibleCenter - groupCenter;
    label.style.transform = `translateY(${offset.toFixed(2)}px)`;
  });
}

function topVisibleDayStackItem() {
  if (!dayStackLayer) return null;
  const items = dayStackLayer.querySelectorAll(".dayStackItem");
  if (!items.length) return null;
  const layerRect = dayStackLayer.getBoundingClientRect();
  const topRef = layerRect.top + 1;
  for (let i = 0; i < items.length; i += 1) {
    const rect = items[i].getBoundingClientRect();
    if (rect.bottom > topRef + 0.5) {
      return items[i];
    }
  }
  return items[items.length - 1] || null;
}

function ensureDayStackMonthListViewportFilled() {
  if (!dayStackOpen || !dayStackLayer) return;
  if (!isDayStackWindowValid()) return;

  const monthGroups = dayStackLayer.querySelectorAll(".dayStackMonthGroup");
  const currentMonths = monthGroups.length;
  const neededMonths = Math.ceil(Math.max(1, dayStackLayer.clientHeight) / DAY_BAR_HEIGHT) + 4;
  if (currentMonths >= neededMonths) return;

  const anchorItem = topVisibleDayStackItem();
  const anchorKey = anchorItem ? anchorItem.dataset.date || "" : "";
  const anchorDate = parseDateKey(anchorKey) || clampDayStackDate(new Date());
  const anchorTop = anchorItem ? anchorItem.getBoundingClientRect().top : null;
  const targetDays = normalizedDayStackWindowDays(neededMonths * 31);
  const currentDays = diffDays(dayStackEndDate, dayStackBaseDate) + 1;
  if (targetDays <= currentDays) return;

  ensureDayStackWindow(anchorDate, targetDays);
  renderDayStack();

  if (anchorKey && Number.isFinite(anchorTop)) {
    const nextAnchor = dayStackLayer.querySelector(`.dayStackItem[data-date="${anchorKey}"]`);
    if (nextAnchor) {
      const delta = nextAnchor.getBoundingClientRect().top - anchorTop;
      const maxScroll = Math.max(0, dayStackLayer.scrollHeight - dayStackLayer.clientHeight);
      dayStackLayer.scrollTop = Math.max(
        0,
        Math.min(maxScroll, dayStackLayer.scrollTop + delta)
      );
    }
  }
}

function scheduleDayStackWindowShift(intent = 0) {
  if (!dayStackOpen || !dayStackLayer) return;
  if (intent !== 0) {
    dayStackShiftIntent = intent;
  }
  if (dayStackShiftRaf) return;
  dayStackShiftRaf = requestAnimationFrame(() => {
    dayStackShiftRaf = 0;
    const nextIntent = dayStackShiftIntent;
    dayStackShiftIntent = 0;
    maybeShiftDayStackWindow(nextIntent);
  });
}

function maybeShiftDayStackWindow(scrollIntent = 0) {
  if (!dayStackOpen || !dayStackLayer) return;
  if (!isDayStackWindowValid()) return;
  if (dayStackWindowShiftLock) return;
  if (performance.now() < dayStackShiftCooldownUntil) return;

  const maxScroll = Math.max(0, dayStackLayer.scrollHeight - dayStackLayer.clientHeight);
  if (maxScroll <= 0) return;

  let nearTop = dayStackLayer.scrollTop <= DAY_STACK_EDGE_THRESHOLD_PX;
  let nearBottom = maxScroll - dayStackLayer.scrollTop <= DAY_STACK_EDGE_THRESHOLD_PX;
  if (scrollIntent < 0) {
    nearBottom = false;
  } else if (scrollIntent > 0) {
    nearTop = false;
  }
  if (!nearTop && !nearBottom) return;

  const windowDays = diffDays(dayStackEndDate, dayStackBaseDate) + 1;
  const maxJumpWithinWindow = Math.max(1, windowDays - 31);
  const jumpDays = Math.min(DAY_STACK_LAZY_SHIFT_DAYS, maxJumpWithinWindow);
  let shiftDays = 0;
  if (nearTop && dayStackBaseDate.getTime() > DAY_STACK_RANGE_START.getTime()) {
    const availableBack = diffDays(dayStackBaseDate, DAY_STACK_RANGE_START);
    shiftDays = -Math.min(jumpDays, Math.max(0, availableBack));
  } else if (nearBottom && dayStackEndDate.getTime() < DAY_STACK_RANGE_END.getTime()) {
    const availableForward = diffDays(DAY_STACK_RANGE_END, dayStackEndDate);
    shiftDays = Math.min(jumpDays, Math.max(0, availableForward));
  }
  if (!shiftDays) return;

  dayStackWindowShiftLock = true;
  try {
    let nextStart = addDays(dayStackBaseDate, shiftDays);
    let nextEnd = addDays(dayStackEndDate, shiftDays);
    if (nextStart.getTime() < DAY_STACK_RANGE_START.getTime()) {
      nextStart = new Date(DAY_STACK_RANGE_START);
      nextEnd = addDays(nextStart, windowDays - 1);
    }
    if (nextEnd.getTime() > DAY_STACK_RANGE_END.getTime()) {
      nextEnd = new Date(DAY_STACK_RANGE_END);
      nextStart = addDays(nextEnd, -(windowDays - 1));
    }
    if (nextStart.getTime() < DAY_STACK_RANGE_START.getTime()) {
      nextStart = new Date(DAY_STACK_RANGE_START);
    }
    if (nextEnd.getTime() > DAY_STACK_RANGE_END.getTime()) {
      nextEnd = new Date(DAY_STACK_RANGE_END);
    }

    dayStackBaseDate = startOfDay(nextStart);
    dayStackEndDate = startOfDay(nextEnd);
    renderDayStack();
    const nextMax = Math.max(0, dayStackLayer.scrollHeight - dayStackLayer.clientHeight);
    const edgeRest = DAY_STACK_EDGE_THRESHOLD_PX * 2;
    if (nearTop) {
      dayStackLayer.scrollTop = Math.min(nextMax, edgeRest);
    } else if (nearBottom) {
      dayStackLayer.scrollTop = Math.max(0, nextMax - edgeRest);
    }
    dayStackLastScrollTop = dayStackLayer.scrollTop;
    dayStackShiftCooldownUntil = performance.now() + 180;
  } finally {
    dayStackWindowShiftLock = false;
  }
}

function updateDayStackYearHead() {
  if (!dayStackLayer) return;
  const yearHead = dayStackLayer.querySelector(".dayStackYearHead");
  if (!yearHead) return;
  // Year labels are rendered as per-year vertical segments in month list mode.
  // Keep legacy sticky year head hidden to avoid overlap.
  yearHead.style.display = "none";
  yearHead.textContent = "";
  yearHead.style.transform = "";
  yearHead.style.height = "";
}

function applyDayStackYearListMode(animate = true) {
  if (!dayStackLayer) return;
  if (dayStackYearListMode) {
    dayStackExpandedDate = null;
    dayStackSpread = 0;
    dayStackAlarmBundleOpenKey = "";
    dayStackMonthListMode = false;
    clearDayStackMonthModeTimers();
    resetDayStackMonthModeClasses();
    dayStackLayer.classList.remove("real-head-sticky");
  }
  dayStackLayer.classList.toggle("year-list-mode", dayStackYearListMode);
}

function clearDayStackMonthModeTimers() {
  if (dayStackMonthPhaseTimer) {
    clearTimeout(dayStackMonthPhaseTimer);
    dayStackMonthPhaseTimer = null;
  }
  if (dayStackMonthSlideTimer) {
    clearTimeout(dayStackMonthSlideTimer);
    dayStackMonthSlideTimer = null;
  }
  if (dayStackMonthYearTimer) {
    clearTimeout(dayStackMonthYearTimer);
    dayStackMonthYearTimer = null;
  }
}

function resetDayStackMonthModeClasses() {
  if (!dayStackLayer) return;
  dayStackLayer.classList.remove("month-list-mode");
  dayStackLayer.classList.remove("month-list-phase-hide-left");
  dayStackLayer.classList.remove("month-list-phase-month-out");
  dayStackLayer.classList.remove("month-list-phase-days-left");
  dayStackLayer.classList.remove("month-list-phase-days-right");
  dayStackLayer.classList.remove("month-list-phase-days");
  dayStackLayer.classList.remove("month-list-phase-month-prep");
  dayStackLayer.classList.remove("month-list-phase-month-in");
  dayStackLayer.classList.remove("month-list-phase-year-in");
}

function applyDayStackMonthListMode(animate = true) {
  if (!dayStackLayer) return;
  dayStackMonthListMode = false;
  clearDayStackMonthModeTimers();
  dayStackLayer.classList.remove("month-list-phase-hide-left");
  dayStackLayer.classList.remove("month-list-phase-month-out");
  dayStackLayer.classList.remove("month-list-phase-days-left");
  dayStackLayer.classList.remove("month-list-phase-days-right");
  dayStackLayer.classList.remove("month-list-phase-days");
  dayStackLayer.classList.remove("month-list-phase-month-prep");
  dayStackLayer.classList.remove("month-list-phase-month-in");
  dayStackLayer.classList.remove("month-list-phase-year-in");
  dayStackLayer.classList.remove("month-list-mode");
  updateDayStackYearHead();
}

function setDayStackSpreadProgress(nextProgress, anchorHeadTop) {
  const clamped = clamp01(nextProgress);
  if (
    Math.abs(clamped - dayStackSpread) < 0.0001 &&
    !Number.isFinite(anchorHeadTop)
  ) {
    return;
  }
  dayStackSpread = clamped;
  applyDayStackBodyOpenRatios(anchorHeadTop);
}

function collapseDayStackToHeaders(preferredItem = null, preserveAnchor = true) {
  if (!dayStackLayer || !dayStackOpen) return;
  const focusItem =
    preferredItem && dayStackLayer.contains(preferredItem)
      ? preferredItem
      : expandedDayStackItem();
  const focusHead = focusItem ? focusItem.querySelector(".dayStackHead") : null;
  const beforeTop =
    focusHead && Number.isFinite(focusHead.getBoundingClientRect().top)
      ? focusHead.getBoundingClientRect().top
      : null;

  dayStackSpread = 0;
  dayStackExpandedDate = null;
  applyDayStackBodyOpenRatios();

  if (preserveAnchor && focusHead && Number.isFinite(beforeTop)) {
    const afterTop = focusHead.getBoundingClientRect().top;
    const delta = afterTop - beforeTop;
    if (Math.abs(delta) > 0.5) {
      const maxScroll = Math.max(0, dayStackLayer.scrollHeight - dayStackLayer.clientHeight);
      dayStackLayer.scrollTop = Math.max(
        0,
        Math.min(maxScroll, dayStackLayer.scrollTop + delta)
      );
    }
  }
}

function toggleDayStackViewMode(options = {}) {
  if (!dayStackLayer || !dayStackOpen) return;
  if (dayStackYearListMode) return;
  clearDayStackInlineDraft();
  dayStackExpandedMonthKey = "";
  const { anchorDate: explicitAnchorDate = null, centerTarget = false, focusTarget = false } = options;
  const anchorItem = topVisibleDayStackItem();
  const focusedAnchorDate =
    typeof dayStackReturnFocusKey === "string" && dayStackReturnFocusKey
      ? parseDateKey(dayStackReturnFocusKey)
      : null;
  const candidateAnchor =
    explicitAnchorDate instanceof Date
      ? explicitAnchorDate
      : focusedAnchorDate
        ? focusedAnchorDate
        : parseDateKey(anchorItem && anchorItem.dataset ? anchorItem.dataset.date : "") ||
          (dayStackBackAnchorDate instanceof Date ? dayStackBackAnchorDate : null) ||
          new Date();
  const anchorDate = clampDayStackDate(new Date(candidateAnchor.getTime()));
  dayStackBackAnchorDate = new Date(anchorDate.getTime());
  dayStackExpandedDate = null;
  dayStackSpread = 0;
  let targetKey = dateKeyFromDate(anchorDate);
  if (dayStackViewMode === DAY_STACK_VIEW_MODE_MONTH_DAY) {
    dayStackYearListMode = false;
    dayStackViewMode = DAY_STACK_VIEW_MODE_YEAR_MONTH;
    dayStackRailFocusKey = dayStackRailFocusKeyForDate(anchorDate, DAY_STACK_VIEW_MODE_YEAR_MONTH);
    dayStackBaseDate = startOfDay(new Date(DAY_STACK_RANGE_START));
    dayStackEndDate = startOfDay(new Date(DAY_STACK_RANGE_END));
    targetKey = dateKeyFromDate(new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1));
  } else {
    dayStackYearListMode = true;
    dayStackViewMode = DAY_STACK_VIEW_MODE_YEAR_MONTH;
    dayStackRailFocusKey = dayStackRailFocusKeyForDate(anchorDate, DAY_STACK_VIEW_MODE_YEAR_MONTH);
    dayStackBaseDate = startOfDay(new Date(DAY_STACK_RANGE_START));
    dayStackEndDate = startOfDay(new Date(DAY_STACK_RANGE_END));
    targetKey = dateKeyFromDate(new Date(anchorDate.getFullYear(), 0, 1));
  }
  dayStackReturnFocusKey = focusTarget ? targetKey : "";
  renderDayStack();
  const targetItem = dayStackLayer.querySelector(`.dayStackItem[data-date="${targetKey}"]`);
  if (targetItem) {
    dayStackLayer.scrollTop = centerTarget
      ? scrollTopForCenteredDayStackItem(targetItem)
      : scrollTopForDayStackItem(targetItem);
    dayStackLastScrollTop = dayStackLayer.scrollTop;
  }
}

function renderDayStack(options = {}) {
  if (!dayStackLayer) return;
  const preserveAnchorPosition = options.preserveAnchorPosition !== false;
  if (!isDayStackWindowValid()) {
    const anchorDate = addDays(startDate, currentDayIndex(0));
    ensureDayStackWindow(anchorDate);
  }
  buildDayStackList();
  setDayStackRailFocus(dayStackRailFocusKey);
  applyDayStackBodyOpenRatios(undefined, preserveAnchorPosition);
  applyDayStackMonthListMode(false);
  applyDayStackYearListMode(false);
  updateDayStackMonthRailLabelPositions();
  updateDayStackNowLines(new Date());
  renderDayStackAlarms();
  requestGoogleCalendarSync(false);
}

function refreshDayStackZoomLayout() {
  if (!dayStackLayer || !dayStackOpen) return false;
  if (
    dayStackViewMode !== DAY_STACK_VIEW_MODE_MONTH_DAY ||
    dayStackMonthListMode ||
    dayStackYearListMode
  ) {
    return false;
  }
  applyDayStackBodyOpenRatios(undefined, false);
  updateDayStackMonthRailLabelPositions();
  updateDayStackNowLines(new Date());
  renderDayStackAlarms();
  return true;
}

function setDayStackOpen(nextOpen) {
  dayStackOpen = Boolean(nextOpen);
  if (!dayStackLayer) return;

  if (dayStackOpen && todayFocusMode) {
    setTodayFocusMode(false, { rebuildTimeline: false });
  }

  if (!dayStackOpen) {
    clearDayStackInlineDraft();
    clearDayStackAlarmFocus();
    dayStackLayer.dispatchEvent(new CustomEvent("oneul:stack-close"));
    if (dayStackShiftRaf) {
      cancelAnimationFrame(dayStackShiftRaf);
      dayStackShiftRaf = 0;
    }
    dayStackShiftIntent = 0;
    dayStackShiftCooldownUntil = 0;
    dayStackLastScrollTop = 0;
    if (dayStackAnimTimer) {
      clearTimeout(dayStackAnimTimer);
      dayStackAnimTimer = null;
    }
    clearDayStackMonthModeTimers();
    dayStackLayer.classList.remove("open");
    dayStackLayer.classList.remove("dragging");
    dayStackLayer.classList.remove("transitioning");
    dayStackLayer.setAttribute("aria-hidden", "true");
    dayStackLayer.innerHTML = "";
    dayStackTransitioning = false;
    timelineWrap.classList.remove("day-stack-reveal");
    timelineWrap.classList.remove("day-stack-mode");
    dayStackBaseDate = null;
    dayStackEndDate = null;
    dayStackExpandedDate = null;
    dayStackExpandedMonthKey = "";
    dayStackSpread = 0;
    dayStackMonthListMode = false;
    dayStackYearListMode = false;
    dayStackViewMode = DAY_STACK_VIEW_MODE_MONTH_DAY;
    dayStackWindowShiftLock = false;
    dayStackBackAnchorDate = null;
    dayStackReturnFocusKey = "";
    dayStackRailFocusKey = "";
    dayStackLayer.classList.remove("real-head-sticky");
    dayStackLayer.classList.remove("year-list-mode");
    resetDayStackMonthModeClasses();
    flushDeferredTimelineRebuild();
    updateStickyDay();
    return;
  }

  hideHoverGuide();
  clearDayStackInlineDraft();
  const anchorDate = clampDayStackDate(startOfDay(new Date()));
  const anchorKey = dateKeyFromDate(anchorDate);
  ensureDayStackWindow(anchorDate);
  dayStackBackAnchorDate = new Date(anchorDate.getTime());
  dayStackReturnFocusKey = "";
  dayStackRailFocusKey = dayStackRailFocusKeyForDate(anchorDate, DAY_STACK_VIEW_MODE_MONTH_DAY);
  dayStackExpandedDate = anchorKey;
  dayStackExpandedMonthKey = "";
  dayStackSpread = 0;
  dayStackMonthListMode = false;
  dayStackYearListMode = false;
  dayStackViewMode = DAY_STACK_VIEW_MODE_MONTH_DAY;
  dayStackTransitioning = false;
  timelineWrap.classList.remove("day-stack-reveal");
  timelineWrap.classList.add("day-stack-mode");
  dayStackLayer.classList.add("open");
  dayStackLayer.classList.remove("real-head-sticky");
  dayStackLayer.classList.remove("year-list-mode");
  resetDayStackMonthModeClasses();
  dayStackLayer.classList.remove("transitioning");
  dayStackLayer.setAttribute("aria-hidden", "false");
  renderDayStack();
  const anchorItem =
    expandedDayStackItem() || dayStackLayer.querySelector(`.dayStackItem[data-date="${anchorKey}"]`);
  const nextTop = anchorItem ? scrollTopForCenteredExpandedDayStackItem(anchorItem) : 0;
  dayStackLayer.scrollTop = nextTop;
  dayStackLastScrollTop = nextTop;
  if (anchorItem) {
    scheduleCenteredExpandedDayStackItem(anchorItem, anchorKey);
  }
  dayStackShiftIntent = 0;
  dayStackShiftCooldownUntil = 0;
  updateDayStackNowLines(new Date());
  updateStickyDay();
}

function installDayStackLayerInteractions() {
  if (!dayStackLayer) return;

  let pressed = false;
  let dragging = false;
  let suppressClick = false;
  let dragStartY = 0;
  let dragStartScroll = 0;
  let spreadDragging = false;
  let spreadStart = 0;
  let pressX = 0;
  let pressY = 0;
  let lastY = 0;
  let lastTime = 0;
  let velocity = 0;
  let inertiaId = null;
  let selecting = false;
  let pressTimer = null;
  let selectItem = null;
  let selectBody = null;
  let selectDateTime = null;
  let selectAnchorTime = null;
  let selectAnchorY = 0;
  let selectOverlay = null;
  let selectOverlayAnimated = false;
  let hoverOverlay = null;
  let longPressConsumed = false;
  let wobbleTimer = null;
  let opacityDelayTimer = null;
  let opacityInterval = null;
  let opacityIdleTimer = null;
  let monthRailClickTimer = 0;
  const MONTH_RAIL_CLICK_DELAY_MS = 220;

  const stopInertia = () => {
    if (!inertiaId) return;
    cancelAnimationFrame(inertiaId);
    inertiaId = null;
  };

  const clearPressTimer = () => {
    if (!pressTimer) return;
    clearTimeout(pressTimer);
    pressTimer = null;
  };

  const clearMonthRailClickTimer = () => {
    if (!monthRailClickTimer) return;
    clearTimeout(monthRailClickTimer);
    monthRailClickTimer = 0;
  };

  const clearSelectionOverlay = () => {
    if (selectOverlay && selectOverlay.isConnected) {
      selectOverlay.remove();
    }
    selectOverlay = null;
    selectOverlayAnimated = false;
  };

  const hideHoverOverlay = () => {
    if (hoverOverlay) {
      hoverOverlay.style.display = "none";
    }
    setDayStackHoverNowSuppression("", NaN);
  };

  const clearHoverOverlay = () => {
    if (hoverOverlay && hoverOverlay.isConnected) {
      hoverOverlay.remove();
    }
    hoverOverlay = null;
    setDayStackHoverNowSuppression("", NaN);
  };

  const clearWobble = () => {
    if (wobbleTimer) {
      clearTimeout(wobbleTimer);
      wobbleTimer = null;
    }
    if (selectOverlay) {
      selectOverlay.classList.remove("wobble");
    }
  };

  const triggerWobble = () => {
    if (!selectOverlay) return;
    selectOverlay.classList.add("wobble");
    if (wobbleTimer) clearTimeout(wobbleTimer);
    wobbleTimer = setTimeout(() => {
      if (selectOverlay) selectOverlay.classList.remove("wobble");
      wobbleTimer = null;
    }, 120);
  };

  const clearOpacityJitter = () => {
    if (opacityDelayTimer) {
      clearTimeout(opacityDelayTimer);
      opacityDelayTimer = null;
    }
    if (opacityInterval) {
      clearInterval(opacityInterval);
      opacityInterval = null;
    }
    if (opacityIdleTimer) {
      clearTimeout(opacityIdleTimer);
      opacityIdleTimer = null;
    }
    if (selectOverlay) selectOverlay.style.opacity = "";
  };

  const applyRandomOpacity = () => {
    if (!selectOverlay) return;
    const value =
      OPACITY_JITTER_MIN + Math.random() * (OPACITY_JITTER_MAX - OPACITY_JITTER_MIN);
    selectOverlay.style.opacity = value.toFixed(2);
  };

  const isDayStackZoomed = () => Math.abs(minutePx - BASE_MINUTE_PX) >= MINUTE_PX_EPSILON;

  const collapseDayStackZoomAtPoint = (clientX, clientY) => {
    if (!isDayStackZoomed()) return false;
    const anchorDateTime = dayStackDateTimeFromClientPoint(clientX, clientY) || new Date();
    animateMinutePx(BASE_MINUTE_PX, anchorDateTime, clientY);
    return true;
  };

  const startOpacityJitter = () => {
    if (opacityInterval) return;
    applyRandomOpacity();
    opacityInterval = setInterval(applyRandomOpacity, OPACITY_JITTER_MS);
  };

  const stopOpacityJitter = () => {
    if (opacityInterval) {
      clearInterval(opacityInterval);
      opacityInterval = null;
    }
    if (selectOverlay) selectOverlay.style.opacity = "0.5";
  };

  const noteOpacityActivity = () => {
    if (!opacityDelayTimer && !opacityInterval) {
      opacityDelayTimer = setTimeout(() => {
        opacityDelayTimer = null;
        startOpacityJitter();
      }, SELECTION_SPREAD_MS);
    }
    if (opacityIdleTimer) clearTimeout(opacityIdleTimer);
    opacityIdleTimer = setTimeout(() => {
      opacityIdleTimer = null;
      stopOpacityJitter();
    }, OPACITY_IDLE_MS);
  };

  const clearSelectionState = () => {
    clearPressTimer();
    selecting = false;
    selectItem = null;
    selectBody = null;
    selectDateTime = null;
    selectAnchorTime = null;
    selectAnchorY = 0;
    longPressConsumed = false;
    clearWobble();
    clearOpacityJitter();
    clearSelectionOverlay();
  };

  const parseItemDate = (item) => {
    if (!item) return null;
    const raw = item.dataset.date || "";
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (!m) return null;
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    const targetDate = new Date(year, month - 1, day);
    if (
      targetDate.getFullYear() !== year ||
      targetDate.getMonth() !== month - 1 ||
      targetDate.getDate() !== day
    ) {
      return null;
    }
    return targetDate;
  };

  const dateTimeFromBodyPointer = (item, body, clientY) => {
    const baseDate = parseItemDate(item);
    if (!baseDate || !body) return null;
    const rect = body.getBoundingClientRect();
    const itemDateKey = item.dataset && typeof item.dataset.date === "string" ? item.dataset.date : "";
    const renderedMaxY = dayStackRenderedMaxYForItem(itemDateKey);
    const renderedY = Math.max(0, Math.min(renderedMaxY, clientY - rect.top));
    const y = dayStackBaseYForItem(renderedY, itemDateKey);
    const totalMinutes = y / minutePx;
    let hour = Math.floor(totalMinutes / 60);
    let minute = Math.floor(totalMinutes - hour * 60);
    let second = Math.round((totalMinutes - hour * 60 - minute) * 60);

    if (second === 60) {
      second = 0;
      minute += 1;
    }
    if (minute === 60) {
      minute = 0;
      hour += 1;
    }
    if (hour >= 24) {
      hour = 23;
      minute = 59;
      second = 59;
    }

    return new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      hour,
      minute,
      second,
      0
    );
  };

  const ensureSelectionOverlay = (body) => {
    if (!body) return null;
    if (!selectOverlay || !selectOverlay.isConnected || selectOverlay.parentElement !== body) {
      clearSelectionOverlay();
      selectOverlay = document.createElement("div");
      selectOverlay.className = "dayStackSelectionLine";
      selectOverlay.innerHTML = '<div class="dayStackSelectionLine__track"><div class="dayStackSelectionLine__inner"></div></div><div class="dot"></div><div class="timeText"></div>';
      body.appendChild(selectOverlay);
    }
    return selectOverlay;
  };

  const ensureHoverOverlay = (body) => {
    if (!body) return null;
    if (!hoverOverlay || !hoverOverlay.isConnected || hoverOverlay.parentElement !== body) {
      clearHoverOverlay();
      hoverOverlay = document.createElement("div");
      hoverOverlay.className = "dayStackHoverLine";
      hoverOverlay.innerHTML = '<div class="line"></div><div class="timeText"></div>';
      body.appendChild(hoverOverlay);
    }
    return hoverOverlay;
  };

  const isNearDayStackAlarmLine = (body, renderedY) => {
    if (!body || !Number.isFinite(renderedY)) return false;
    const alarmLines = body.querySelectorAll(".dayStackAlarmLine");
    for (let i = 0; i < alarmLines.length; i += 1) {
      const lineY = Number.parseFloat(alarmLines[i].style.top || "");
      if (!Number.isFinite(lineY)) continue;
      if (Math.abs(lineY - renderedY) <= ALARM_HIDE_NEAR_PX) return true;
    }
    return false;
  };

  const updateHoverOverlay = (body, clientY, clientX = NaN) => {
    if (!body || selecting) {
      hideHoverOverlay();
      return;
    }
    const overlay = ensureHoverOverlay(body);
    if (!overlay) return;
    const rect = body.getBoundingClientRect();
    const bodyItem = body.closest(".dayStackItem");
    const itemDateKey =
      bodyItem && bodyItem.dataset && typeof bodyItem.dataset.date === "string"
        ? bodyItem.dataset.date
        : "";
    const renderedMaxY = dayStackRenderedMaxYForItem(itemDateKey);
    const renderedY = Math.max(0, Math.min(renderedMaxY, clientY - rect.top));
    const hit = Number.isFinite(clientX) ? document.elementFromPoint(clientX, clientY) : null;
    if (hit && hit.closest && hit.closest(".dayStackAlarmLine")) {
      hideHoverOverlay();
      return;
    }
    if (isNearDayStackAlarmLine(body, renderedY)) {
      hideHoverOverlay();
      return;
    }
    const totalMinutes = dayStackBaseYForItem(renderedY, itemDateKey) / minutePx;
    overlay.style.display = "block";
    overlay.style.top = `${renderedY}px`;
    setDayStackHoverNowSuppression(itemDateKey, renderedY);
    const label = overlay.querySelector(".timeText");
    if (label) {
      setMeridiemTimeLabel(label, totalMinutes);
    }
  };

  const updateSelectionOverlay = () => {
    if (!selectBody || !selectDateTime) return;
    const overlay = ensureSelectionOverlay(selectBody);
    if (!overlay) return;
    const bodyItem = selectBody.closest(".dayStackItem");
    const itemDateKey =
      bodyItem && bodyItem.dataset && typeof bodyItem.dataset.date === "string"
        ? bodyItem.dataset.date
        : "";
    const minutes =
      selectDateTime.getHours() * 60 +
      selectDateTime.getMinutes() +
      selectDateTime.getSeconds() / 60;
    overlay.style.display = "block";
    overlay.style.top = `${dayStackRenderedYForItem(minutes * minutePx, itemDateKey)}px`;
    overlay.classList.add("thick");
    overlay.classList.add("dim");
    const label = overlay.querySelector(".timeText");
    if (label) {
      label.textContent = formatDateTimeKorean(
        selectDateTime,
        selectDateTime.getHours(),
        selectDateTime.getMinutes(),
        selectDateTime.getSeconds()
      );
    }
    if (!selectOverlayAnimated) {
      selectOverlayAnimated = true;
      overlay.classList.remove("spread");
      overlay.getBoundingClientRect();
      overlay.classList.add("spread");
    }
  };

  const startSelecting = () => {
    pressTimer = null;
    if (!pressed || !selectItem || !selectBody) return;
    hideHoverOverlay();
    const first = dateTimeFromBodyPointer(selectItem, selectBody, pressY);
    if (!first) {
      clearSelectionState();
      return;
    }
    if (isPastSelection(first)) {
      showAlert("\uD604\uC7AC \uC2DC\uAC04 \uC774\uD6C4\uBD80\uD130 \uC124\uC815\uD560 \uC218 \uC788\uC5B4\uC694.");
      clearSelectionState();
      return;
    }
    selecting = true;
    suppressClick = true;
    selectDateTime = first;
    selectAnchorTime = first;
    selectAnchorY = pressY;
    updateSelectionOverlay();
  };

  const alarmFromDayStackPointer = (clientX, clientY) => {
    const hit = document.elementFromPoint(clientX, clientY);
    if (!hit || !hit.closest) return null;
    const alarmEl = hit.closest(".dayStackAlarmLine");
    if (!alarmEl) return null;
    if (alarmEl.classList.contains("bundle")) return null;
    const source = alarmEl.dataset.source || LOCAL_EVENT_SOURCE;
    if (source === GOOGLE_EVENT_SOURCE) {
      const eventId = alarmEl.dataset.eventId || "";
      const event = googleEventsById.get(eventId);
      const eventTime = event ? googleEventDateTimeValue(event) : null;
      if (event && eventTime instanceof Date && Number.isFinite(eventTime.getTime())) {
        return {
          source: GOOGLE_EVENT_SOURCE,
          time: new Date(eventTime.getTime()),
          title: googleEventDisplayTitle(event),
          htmlLink: typeof event.htmlLink === "string" ? event.htmlLink : "",
          allDay: Boolean(event.allDay),
          eventId: event.id,
        };
      }
    }
    const alarmIndexRaw = Number(alarmEl.dataset.alarmIndex || "");
    const alarmIndex = Number.isFinite(alarmIndexRaw) ? Math.trunc(alarmIndexRaw) : -1;
    if (alarmIndex >= 0 && alarmIndex < alarms.length) {
      const source = alarms[alarmIndex];
      const sourceTimeRaw = source instanceof Date ? source : source ? source.time : null;
      const sourceTime =
        sourceTimeRaw instanceof Date
          ? sourceTimeRaw
          : sourceTimeRaw !== null && sourceTimeRaw !== undefined
            ? new Date(sourceTimeRaw)
            : null;
      if (sourceTime instanceof Date && Number.isFinite(sourceTime.getTime())) {
        return {
          source: LOCAL_EVENT_SOURCE,
          time: new Date(sourceTime.getTime()),
          title:
            source && !(source instanceof Date) && typeof source.title === "string"
              ? source.title
              : "",
          remind:
            source && !(source instanceof Date) && typeof source.remind === "string"
              ? source.remind
              : "none",
          repeat:
            source && !(source instanceof Date) && typeof source.repeat === "string"
              ? source.repeat
              : "none",
          remindEnabled: Boolean(source && !(source instanceof Date) && source.remindEnabled),
          repeatEnabled: Boolean(source && !(source instanceof Date) && source.repeatEnabled),
          alarmIndex,
        };
      }
    }
    const stamp = alarmEl.dataset.timestamp;
    if (!stamp) return null;
    const ts = Number(stamp);
    if (!Number.isFinite(ts)) return null;
    const title = alarmEl.dataset.title || "";
    return {
      source: LOCAL_EVENT_SOURCE,
      time: new Date(ts),
      title,
      remind: "none",
      repeat: "none",
      remindEnabled: false,
      repeatEnabled: false,
      alarmIndex,
    };
  };

  const bundleFromDayStackPointer = (clientX, clientY) => {
    const hit = document.elementFromPoint(clientX, clientY);
    if (!hit || !hit.closest) return null;
    const bundleEl = hit.closest(".dayStackAlarmLine.bundle");
    if (!bundleEl) return null;
    const bundleKey = typeof bundleEl.dataset.bundleKey === "string" ? bundleEl.dataset.bundleKey : "";
    if (!bundleKey) return null;
    const bundleBody = bundleEl.closest(".dayStackBody");
    const bundleItem = bundleBody ? bundleBody.closest(".dayStackItem.expanded") : null;
    if (!bundleBody || !bundleItem || !dayStackLayer.contains(bundleItem)) return null;
    return { bundleKey };
  };

  const monthRailFromDayStackPointer = (clientX, clientY) => {
    if (dayStackViewMode !== DAY_STACK_VIEW_MODE_MONTH_DAY || dayStackYearListMode) {
      return null;
    }
    const hit = document.elementFromPoint(clientX, clientY);
    if (!hit || !hit.closest) return null;
    const rail = hit.closest(".dayStackMonthRail");
    const group = rail ? rail.closest(".dayStackMonthGroup[data-month]") : null;
    if (!rail || !group) return null;
    const monthKey = group.dataset && typeof group.dataset.month === "string" ? group.dataset.month : "";
    if (!monthKey) return null;
    return { rail, group, monthKey };
  };

  const toggleMonthRailExpand = (monthRailInfo) => {
    if (!monthRailInfo || dayStackTransitioning || !dayStackLayer) return;
    const { monthKey } = monthRailInfo;
    if (!monthKey) return;
    clearDayStackCenterTimer();
    hideHoverOverlay();
    clearSelectionState();
    clearDayStackInlineDraft();
    if (dayStackMonthListMode) {
      dayStackMonthListMode = false;
      applyDayStackMonthListMode(false);
    }
    const beforeGroup =
      dayStackLayer.querySelector(`.dayStackMonthGroup[data-month="${monthKey}"]`) ||
      monthRailInfo.group;
    const beforeTop =
      beforeGroup && Number.isFinite(beforeGroup.getBoundingClientRect().top)
        ? beforeGroup.getBoundingClientRect().top
        : NaN;
    const nextMonthExpanded = dayStackExpandedMonthKey === monthKey ? "" : monthKey;
    dayStackExpandedMonthKey = nextMonthExpanded;
    if (nextMonthExpanded) {
      if (
        typeof dayStackExpandedDate !== "string" ||
        !dayStackExpandedDate ||
        !dayStackExpandedDate.startsWith(`${monthKey}-`)
      ) {
        dayStackExpandedDate = `${monthKey}-01`;
      }
      const focusDate = parseDateKey(dayStackExpandedDate);
      if (focusDate) {
        dayStackBackAnchorDate = new Date(focusDate.getTime());
        setDayStackRailFocus(dayStackRailFocusKeyForDate(focusDate, DAY_STACK_VIEW_MODE_MONTH_DAY));
      }
    }
    renderDayStack({ preserveAnchorPosition: false });
    const afterGroup = dayStackLayer.querySelector(`.dayStackMonthGroup[data-month="${monthKey}"]`);
    if (afterGroup && Number.isFinite(beforeTop)) {
      const delta = afterGroup.getBoundingClientRect().top - beforeTop;
      if (Math.abs(delta) > 0.5) {
        setDayStackScrollTop(dayStackLayer.scrollTop + delta);
      }
    }
  };

  const scheduleMonthRailToggle = (monthRailInfo) => {
    if (!monthRailInfo) return;
    clearMonthRailClickTimer();
    monthRailClickTimer = window.setTimeout(() => {
      monthRailClickTimer = 0;
      toggleMonthRailExpand(monthRailInfo);
    }, MONTH_RAIL_CLICK_DELAY_MS);
  };

  const toggleMonthListMode = () => {
    dayStackMonthListMode = false;
    applyDayStackMonthListMode(false);
  };

  const finishSelecting = () => {
    if (!selecting) return;
    const alarmTime = selectDateTime ? new Date(selectDateTime.getTime()) : null;
    clearSelectionState();
    if (!alarmTime) return;
    if (isPastSelection(alarmTime)) {
      showAlert("\uD604\uC7AC \uC2DC\uAC04 \uC774\uD6C4\uBD80\uD130 \uC124\uC815\uD560 \uC218 \uC788\uC5B4\uC694.");
      return;
    }
    promptAlarmCreation(alarmTime);
  };

  const toggleSelectedDay = (item) => {
    if (!item || dayStackTransitioning) return;
    clearDayStackCenterTimer();
    hideHoverOverlay();
    clearSelectionState();
    dayStackExpandedMonthKey = "";
    const targetDate = parseItemDate(item);
    if (!targetDate) return;
    if (!dayStackYearListMode) {
      clearDayStackInlineDraft();
    }
    if (dayStackYearListMode) {
      dayStackBackAnchorDate = new Date(targetDate.getTime());
      setDayStackReturnFocus("");
      dayStackRailFocusKey = dayStackRailFocusKeyForDate(targetDate, DAY_STACK_VIEW_MODE_YEAR_MONTH);
      dayStackExpandedDate = null;
      dayStackSpread = 0;
      dayStackYearListMode = false;
      dayStackViewMode = DAY_STACK_VIEW_MODE_YEAR_MONTH;
      dayStackBaseDate = startOfDay(new Date(DAY_STACK_RANGE_START));
      dayStackEndDate = startOfDay(new Date(DAY_STACK_RANGE_END));
      renderDayStack();
      const targetYear = String(targetDate.getFullYear());
      const targetGroup = dayStackLayer.querySelector(`.dayStackMonthGroup[data-year="${targetYear}"]`);
      const targetKey = dateKeyFromDate(new Date(targetDate.getFullYear(), 0, 1));
      const targetItem = dayStackLayer.querySelector(`.dayStackItem[data-date="${targetKey}"]`);
      if (targetGroup) {
        const nextTop = scrollTopForCenteredDayStackItem(targetGroup);
        dayStackLayer.scrollTop = nextTop;
        dayStackLastScrollTop = nextTop;
        return;
      }
      if (targetItem) {
        const nextTop = scrollTopForDayStackItem(targetItem);
        dayStackLayer.scrollTop = nextTop;
        dayStackLastScrollTop = nextTop;
      }
      return;
    }
    if (dayStackViewMode === DAY_STACK_VIEW_MODE_YEAR_MONTH) {
      dayStackBackAnchorDate = new Date(targetDate.getTime());
      setDayStackReturnFocus("");
      dayStackRailFocusKey = dayStackRailFocusKeyForDate(targetDate, DAY_STACK_VIEW_MODE_MONTH_DAY);
      dayStackExpandedDate = null;
      dayStackSpread = 0;
      dayStackViewMode = DAY_STACK_VIEW_MODE_MONTH_DAY;
      ensureDayStackWindow(targetDate);
      renderDayStack();
      const targetKey = dateKeyFromDate(targetDate);
      const targetItem = dayStackLayer.querySelector(`.dayStackItem[data-date="${targetKey}"]`);
      if (targetItem) {
        const nextTop = scrollTopForDayStackItem(targetItem);
        dayStackLayer.scrollTop = nextTop;
        dayStackLastScrollTop = nextTop;
      }
      return;
    }
    const prevExpandedItem = expandedDayStackItem();
    if (dayStackMonthListMode) {
      dayStackMonthListMode = false;
      applyDayStackMonthListMode(false);
    }

    const targetKey = item.dataset.date || dateKeyFromDate(targetDate);
    const alreadyExpanded = dayStackExpandedDate === targetKey;
    const head = item.querySelector(".dayStackHead");
    const anchorHeadTop = head ? head.getBoundingClientRect().top : null;

    if (alreadyExpanded) {
      enterTodayFocusMode(targetDate);
      return;
    }

    if (prevExpandedItem && prevExpandedItem !== item) {
      compactDayStackItemBody(prevExpandedItem);
    }
    dayStackBackAnchorDate = new Date(targetDate.getTime());
    setDayStackReturnFocus("");
    setDayStackRailFocus(dayStackRailFocusKeyForDate(targetDate, DAY_STACK_VIEW_MODE_MONTH_DAY));
    dayStackAlarmBundleOpenKey = "";
    dayStackExpandedDate = targetKey;
    ensureDayStackItemBodyBuilt(item);
    dayStackSpread = 0;
    const canCenterExpanded = dayBlockHeight <= dayStackLayer.clientHeight;
    applyDayStackBodyOpenRatios(anchorHeadTop, !canCenterExpanded);
    if (canCenterExpanded) {
      animateCenteredExpandedDayStackItem(item, targetKey);
      scheduleCenteredExpandedDayStackItem(item, targetKey);
    }
    updateDayStackNowLines(new Date());
    renderDayStackAlarms();
  };

  const endDrag = (pointerId) => {
    pressed = false;
    dragging = false;
    spreadDragging = false;
    dayStackLayer.classList.remove("dragging");
    if (typeof pointerId === "number") {
      try {
        dayStackLayer.releasePointerCapture(pointerId);
      } catch (_) {
        // Ignore release errors when capture is already lost.
      }
    }
  };

  dayStackLayer.addEventListener("pointerdown", (e) => {
    if (!dayStackOpen) return;
    if (dayStackTransitioning) return;
    if (e.pointerType && e.pointerType !== "mouse") return;
    if (e.button !== 0) return;
    const inlineEditorCard =
      e.target && e.target.closest ? e.target.closest(".dayStackInlineEditorCard") : null;
    const inlineEditorSlot =
      e.target && e.target.closest ? e.target.closest(".dayStackInlineEditorSlot") : null;
    if ((dayStackInlineDraft || dayStackInlineAlarmView) && !inlineEditorCard) {
      clearDayStackInlineDraft();
      if (inlineEditorSlot) {
        hideHoverOverlay();
        stopInertia();
        clearPressTimer();
        return;
      }
    }
    if (inlineEditorCard) {
      hideHoverOverlay();
      stopInertia();
      clearPressTimer();
      return;
    }
    if (isPointerOnVerticalScrollbar(dayStackLayer, e.clientX)) return;
    hideHoverOverlay();
    stopInertia();
    pressed = true;
    dragging = false;
    suppressClick = false;
    pressX = e.clientX;
    pressY = e.clientY;
    dragStartY = e.clientY;
    dragStartScroll = dayStackLayer.scrollTop;
    spreadStart = dayStackSpread;
    spreadDragging = false;
    lastY = e.clientY;
    lastTime = performance.now();
    velocity = 0;
    clearSelectionState();
    const pressBody = e.target && e.target.closest ? e.target.closest(".dayStackBody") : null;
    const pressItem = pressBody ? pressBody.closest(".dayStackItem.expanded") : null;
    if (pressBody && pressItem && dayStackLayer.contains(pressItem)) {
      selectBody = pressBody;
      selectItem = pressItem;
      pressTimer = setTimeout(() => {
        pressTimer = null;
        if (!pressed || dragging || longPressConsumed || !selectBody || !selectItem) return;
        const draftDateTime = dateTimeFromBodyPointer(selectItem, selectBody, pressY);
        if (!draftDateTime) return;
        selectDateTime = new Date(draftDateTime.getTime());
        selectAnchorTime = new Date(draftDateTime.getTime());
        selectAnchorY = pressY;
        updateSelectionOverlay();
        promptAlarmCreation(draftDateTime, {
          onFinish: clearSelectionState,
          guardPointerMs: 220,
        });
        suppressClick = true;
        longPressConsumed = true;
      }, DAY_STACK_INLINE_EDITOR_LONG_PRESS_MS);
    }
    dayStackLayer.setPointerCapture(e.pointerId);
    e.stopPropagation();
    e.preventDefault();
  });

  dayStackLayer.addEventListener("pointermove", (e) => {
    if (!pressed) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      if (e.target && e.target.closest && e.target.closest(".dayStackInlineEditorSlot")) {
        hideHoverOverlay();
        return;
      }
      if (isPointerOnVerticalScrollbar(dayStackLayer, e.clientX)) {
        hideHoverOverlay();
        return;
      }
      const body = e.target && e.target.closest ? e.target.closest(".dayStackBody") : null;
      const item = body ? body.closest(".dayStackItem.expanded") : null;
      if (!body || !item || !dayStackLayer.contains(item)) {
        hideHoverOverlay();
        return;
      }
      updateHoverOverlay(body, e.clientY, e.clientX);
      return;
    }
    hideHoverOverlay();
    if (longPressConsumed) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    if (selecting) {
      if (!selectAnchorTime || !selectItem) return;
      const baseDate = parseItemDate(selectItem);
      if (!baseDate) return;
      const dy = e.clientY - selectAnchorY;
      const deltaSeconds = Math.round((dy / minutePx) * 60);
      const dayStart = startOfDay(baseDate).getTime();
      const dayEnd = dayStart + 86400000 - 1000;
      const rawTime = selectAnchorTime.getTime() + deltaSeconds * 1000;
      const clamped = Math.max(dayStart, Math.min(dayEnd, rawTime));
      selectDateTime = new Date(clamped);
      updateSelectionOverlay();
      triggerWobble();
      noteOpacityActivity();
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    if (!dragging) {
      const dx = e.clientX - pressX;
      const dyPress = e.clientY - pressY;
      if (Math.hypot(dx, dyPress) > 6) {
        clearPressTimer();
        dragging = true;
        suppressClick = true;
        spreadDragging = false;
        dayStackLayer.classList.add("dragging");
      }
    }
    if (!dragging) return;
    if (spreadDragging) {
      const travel = Math.abs(e.clientY - dragStartY);
      const next = Math.min(1, spreadStart + travel / DAY_STACK_SPREAD_DRAG_PX);
      const anchorItem = expandedDayStackItem();
      const anchorHead = anchorItem ? anchorItem.querySelector(".dayStackHead") : null;
      const anchorHeadTop = anchorHead ? anchorHead.getBoundingClientRect().top : null;
      setDayStackSpreadProgress(next, anchorHeadTop);
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    const dy = e.clientY - dragStartY;
    const prevScroll = dayStackLayer.scrollTop;
    const maxScroll = Math.max(0, dayStackLayer.scrollHeight - dayStackLayer.clientHeight);
    const nextScroll = Math.max(0, Math.min(maxScroll, dragStartScroll - dy));
    dayStackLayer.scrollTop = nextScroll;
    const appliedScrollDelta = dayStackLayer.scrollTop - prevScroll;
    const atTopBlocked = nextScroll <= 0 && dy > 0;
    const atBottomBlocked = nextScroll >= maxScroll && dy < 0;
    if (atTopBlocked || atBottomBlocked) {
      maybeShiftDayStackWindow(atTopBlocked ? -1 : 1);
    }
    if (collapseExpandedDayStackItemIfBoundaryReached(appliedScrollDelta)) {
      dragStartY = e.clientY;
      dragStartScroll = dayStackLayer.scrollTop;
      lastY = e.clientY;
      lastTime = performance.now();
      velocity = 0;
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    const now = performance.now();
    const dt = Math.max(1, now - lastTime);
    const dyInst = e.clientY - lastY;
    velocity = velocity * 0.6 + (-dyInst / dt) * 0.4;
    lastY = e.clientY;
    lastTime = now;
    e.stopPropagation();
  });

  dayStackLayer.addEventListener("pointerup", (e) => {
    e.stopPropagation();
    hideHoverOverlay();
    if (e.button !== 0) {
      return;
    }
    if (e.target && e.target.closest && e.target.closest(".dayStackInlineEditorSlot")) {
      clearPressTimer();
      endDrag(e.pointerId);
      suppressClick = false;
      longPressConsumed = false;
      return;
    }
    if (longPressConsumed) {
      clearPressTimer();
      endDrag(e.pointerId);
      suppressClick = false;
      longPressConsumed = false;
      return;
    }
    if (selecting) {
      endDrag(e.pointerId);
      suppressClick = false;
      finishSelecting();
      return;
    }
    clearPressTimer();
    const wasDragging = dragging;
    const wasSpreadDragging = spreadDragging;
    const clickedMonthRail = !wasDragging
      ? monthRailFromDayStackPointer(e.clientX, e.clientY)
      : null;
    const clickedBundle = !wasDragging ? bundleFromDayStackPointer(e.clientX, e.clientY) : null;
    const shouldSelect = dayStackOpen && !suppressClick && !wasDragging;
    const clickedAlarm = !wasDragging ? alarmFromDayStackPointer(e.clientX, e.clientY) : null;
    let selectedItem = null;
    let clickedBody = null;
    let clickedBodyItem = null;
    if (shouldSelect) {
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      if (hit && hit.closest) {
        const head = hit.closest(".dayStackHead");
        const item = head ? head.closest(".dayStackItem") : null;
        if (item && dayStackLayer.contains(item)) {
          selectedItem = item;
        } else {
          const body = hit.closest(".dayStackBody");
          const bodyItem = body ? body.closest(".dayStackItem.expanded") : null;
          if (body && bodyItem && dayStackLayer.contains(bodyItem)) {
            clickedBody = body;
            clickedBodyItem = bodyItem;
          }
        }
      }
    }
    endDrag(e.pointerId);
    suppressClick = false;
    if (wasSpreadDragging) {
      clearSelectionState();
      return;
    }
    if (clickedMonthRail) {
      clearSelectionState();
      return;
    }
    if (clickedBundle) {
      clearSelectionState();
      dayStackAlarmBundleOpenKey =
        dayStackAlarmBundleOpenKey === clickedBundle.bundleKey ? "" : clickedBundle.bundleKey;
      renderDayStackAlarms();
      return;
    }
    if (clickedAlarm) {
      clearSelectionState();
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      const alarmEl = hit && hit.closest ? hit.closest(".dayStackAlarmLine") : null;
      const alarmBody = alarmEl ? alarmEl.closest(".dayStackBody") : null;
      const alarmItem = alarmBody ? alarmBody.closest(".dayStackItem.expanded") : null;
      if (alarmBody && alarmItem && dayStackLayer.contains(alarmItem)) {
        openDayStackInlineAlarmView(alarmItem, alarmBody, clickedAlarm);
        focusDayStackAlarmEntry(clickedAlarm);
        return;
      }
      if (handleGoogleCalendarEvent(clickedAlarm)) {
        return;
      }
      return;
    }
    if (selectedItem) {
      const selectedDate = parseItemDate(selectedItem);
      const selectedKey = selectedItem.dataset && typeof selectedItem.dataset.date === "string"
        ? selectedItem.dataset.date
        : "";
      const shouldEnterTodayFocus =
        dayStackViewMode === DAY_STACK_VIEW_MODE_MONTH_DAY &&
        selectedDate instanceof Date &&
        selectedKey &&
        dayStackExpandedDate === selectedKey;
      if (shouldEnterTodayFocus) {
        clearSelectionState();
        enterTodayFocusMode(selectedDate);
        return;
      }
      if (collapseDayStackZoomAtPoint(e.clientX, e.clientY)) {
        clearSelectionState();
        return;
      }
      toggleSelectedDay(selectedItem);
      return;
    }
    if (clickedBody && clickedBodyItem) {
      clearSelectionState();
      return;
    }
    clearSelectionState();
    if (!wasDragging) return;
  });

  dayStackLayer.addEventListener(
    "wheel",
    (e) => {
      if (!dayStackOpen) return;
      if (selecting || pressed) return;
      if (isPointerOnVerticalScrollbar(dayStackLayer, e.clientX)) return;
      if (!Number.isFinite(e.deltaY) || e.deltaY === 0) return;
      const maxScroll = Math.max(0, dayStackLayer.scrollHeight - dayStackLayer.clientHeight);
      if (maxScroll <= 0) return;

      e.preventDefault();
      stopInertia();
      const wheelDelta = e.deltaY < 0 ? -DAY_STACK_WHEEL_STEP_PX : DAY_STACK_WHEEL_STEP_PX;
      const prev = dayStackLayer.scrollTop;
      let next = Math.max(0, Math.min(maxScroll, prev + wheelDelta));
      dayStackLayer.scrollTop = next;
      if (next === prev) {
        maybeShiftDayStackWindow(e.deltaY < 0 ? -1 : 1);
        const shiftedMax = Math.max(0, dayStackLayer.scrollHeight - dayStackLayer.clientHeight);
        if (shiftedMax > 0) {
          next = Math.max(0, Math.min(shiftedMax, dayStackLayer.scrollTop + wheelDelta));
          dayStackLayer.scrollTop = next;
        }
      }
      collapseExpandedDayStackItemIfBoundaryReached(dayStackLayer.scrollTop - prev);
    },
    { passive: false }
  );

  dayStackLayer.addEventListener("keydown", (e) => {
    if (!dayStackOpen) return;
    if (e.key !== "Enter" && e.key !== " ") return;
    const rail = e.target && e.target.closest ? e.target.closest(".dayStackMonthRail") : null;
    const monthGroup = rail ? rail.closest(".dayStackMonthGroup[data-month]") : null;
    if (rail && monthGroup && dayStackLayer.contains(monthGroup)) {
      const monthKey =
        monthGroup.dataset && typeof monthGroup.dataset.month === "string"
          ? monthGroup.dataset.month
          : "";
      if (monthKey && !dayStackYearListMode && dayStackViewMode === DAY_STACK_VIEW_MODE_MONTH_DAY) {
        e.preventDefault();
        setDayStackRailFocus(`month:${monthKey}`);
        toggleMonthRailExpand({ rail, group: monthGroup, monthKey });
        return;
      }
    }
    const head = e.target && e.target.closest ? e.target.closest(".dayStackHead") : null;
    if (!head) return;
    const item = head.closest(".dayStackItem");
    if (!item || !dayStackLayer.contains(item)) return;
    e.preventDefault();
    toggleSelectedDay(item);
  });

  dayStackLayer.addEventListener("input", (e) => {
    handleInlineEditorInputEvent(e.target);
  });

  dayStackLayer.addEventListener("change", (e) => {
    handleInlineEditorChangeEvent(e.target);
  });

  dayStackLayer.addEventListener("click", (e) => {
    const rail = e.target && e.target.closest ? e.target.closest(".dayStackMonthRail") : null;
    const monthGroup = rail ? rail.closest(".dayStackMonthGroup[data-month]") : null;
    if (rail && monthGroup && dayStackLayer.contains(monthGroup)) {
      const monthKey =
        monthGroup.dataset && typeof monthGroup.dataset.month === "string"
          ? monthGroup.dataset.month
          : "";
      if (monthKey && !dayStackYearListMode && dayStackViewMode === DAY_STACK_VIEW_MODE_MONTH_DAY) {
        e.preventDefault();
        e.stopPropagation();
        setDayStackRailFocus(`month:${monthKey}`);
        scheduleMonthRailToggle({ rail, group: monthGroup, monthKey });
        return;
      }
    }
    const handled = handleInlineEditorClickEvent(e.target);
    if (handled) {
      e.stopPropagation();
      return;
    }
  });

  dayStackLayer.addEventListener("pointercancel", (e) => {
    e.stopPropagation();
    hideHoverOverlay();
    stopInertia();
    clearSelectionState();
    endDrag(e.pointerId);
    suppressClick = false;
  });

  dayStackLayer.addEventListener("lostpointercapture", () => {
    hideHoverOverlay();
    clearSelectionState();
    suppressClick = false;
    if (pressed || dragging) {
      endDrag();
    }
  });

  dayStackLayer.addEventListener("oneul:stack-close", () => {
    clearMonthRailClickTimer();
    if (dayStackShiftRaf) {
      cancelAnimationFrame(dayStackShiftRaf);
      dayStackShiftRaf = 0;
    }
    dayStackShiftIntent = 0;
    dayStackShiftCooldownUntil = 0;
    dayStackLastScrollTop = 0;
    clearDayStackCenterTimer();
    stopInertia();
    clearHoverOverlay();
    pressed = false;
    dragging = false;
    spreadDragging = false;
    suppressClick = false;
    clearSelectionState();
    dayStackLayer.classList.remove("real-head-sticky");
    dayStackMonthListMode = false;
    dayStackYearListMode = false;
    clearDayStackMonthModeTimers();
    resetDayStackMonthModeClasses();
    dayStackLayer.classList.remove("year-list-mode");
    dayStackLayer.classList.remove("dragging");
  });

  dayStackLayer.addEventListener("dblclick", (e) => {
    if (!dayStackOpen) return;
    if (isPointerOnVerticalScrollbar(dayStackLayer, e.clientX)) return;
    const clickedMonthRail = monthRailFromDayStackPointer(e.clientX, e.clientY);
    if (clickedMonthRail) {
      clearMonthRailClickTimer();
      toggleMonthRailExpand(clickedMonthRail);
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    const inlineEditorSlot =
      e.target && e.target.closest ? e.target.closest(".dayStackInlineEditorSlot") : null;
    if (inlineEditorSlot) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    const body = hit && hit.closest ? hit.closest(".dayStackBody") : null;
    const item = body ? body.closest(".dayStackItem.expanded") : null;
    if (!body || !item || !dayStackLayer.contains(item)) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    const anchor = dateTimeFromBodyPointer(item, body, e.clientY);
    if (anchor) {
      const target = nextDblClickZoomMinutePx(minutePx);
      animateMinutePx(target, anchor, e.clientY);
    }
    e.preventDefault();
    e.stopPropagation();
  });

  dayStackLayer.addEventListener("pointerleave", (e) => {
    hideHoverOverlay();
    if (!pressed) return;
    clearPressTimer();
    if (selecting) {
      clearSelectionState();
      suppressClick = false;
    }
    if (typeof e.pointerId === "number" && dayStackLayer.hasPointerCapture(e.pointerId)) {
      try {
        dayStackLayer.releasePointerCapture(e.pointerId);
      } catch (_) {
        // Ignore release failures.
      }
    }
    endDrag();
    suppressClick = false;
  });

  dayStackLayer.addEventListener("scroll", () => {
    if (!dayStackOpen) return;
    const currentTop = dayStackLayer.scrollTop;
    const delta = currentTop - dayStackLastScrollTop;
    dayStackLastScrollTop = currentTop;
    let intent = 0;
    if (delta <= -0.5) {
      intent = -1;
    } else if (delta >= 0.5) {
      intent = 1;
    }
    scheduleDayStackWindowShift(intent);
    updateStickyDay();
    updateDayStackMonthRailLabelPositions();
    if (dayStackMonthListMode) {
      updateDayStackYearHead();
    }
  });
}

function installHoverGuideInteractions() {
  if (!timelineWrap) return;

  timelineWrap.addEventListener("pointermove", (e) => {
    if (e.pointerType && e.pointerType !== "mouse") return;
    if (pointerActive) {
      hoverPointerInside = false;
      hideHoverGuide();
      return;
    }
    if (todayFocusMode && e.target && e.target.closest && e.target.closest(".dayStackInlineEditorSlot")) {
      hoverPointerInside = false;
      hideHoverGuide();
      return;
    }
    if (isPointerOnVerticalScrollbar(timelineWrap, e.clientX)) {
      hoverPointerInside = false;
      hideHoverGuide();
      return;
    }
    hoverPointerInside = true;
    hoverPointerClientX = e.clientX;
    hoverPointerClientY = e.clientY;
    updateHoverGuideFromClientY(e.clientY, e.clientX);
  });

  timelineWrap.addEventListener("pointerleave", () => {
    hoverPointerInside = false;
    hideHoverGuide();
  });

  timelineWrap.addEventListener("pointercancel", () => {
    hoverPointerInside = false;
    hideHoverGuide();
  });
}

function installTodayFocusInlineInteractions() {
  if (!timelineWrap) return;

  timelineWrap.addEventListener("input", (e) => {
    if (!todayFocusMode) return;
    handleInlineEditorInputEvent(e.target);
  });

  timelineWrap.addEventListener("change", (e) => {
    if (!todayFocusMode) return;
    handleInlineEditorChangeEvent(e.target);
  });

  timelineWrap.addEventListener("click", (e) => {
    if (!todayFocusMode) return;
    if (todayFocusSuppressNextInlineClick) {
      todayFocusSuppressNextInlineClick = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    const handled = handleInlineEditorClickEvent(e.target);
    if (!handled) return;
    e.stopPropagation();
  });
}

function installContextBack() {
  let lastHandledAt = 0;
  let lastHandledX = NaN;
  let lastHandledY = NaN;

  const isRepeatedContextBack = (clientX, clientY) => {
    const now = performance.now();
    const recent = now - lastHandledAt <= CONTEXT_BACK_REPEAT_SUPPRESS_MS;
    const dx = Number.isFinite(clientX) && Number.isFinite(lastHandledX)
      ? clientX - lastHandledX
      : Number.POSITIVE_INFINITY;
    const dy = Number.isFinite(clientY) && Number.isFinite(lastHandledY)
      ? clientY - lastHandledY
      : Number.POSITIVE_INFINITY;
    return recent && Math.hypot(dx, dy) <= CONTEXT_BACK_REPEAT_SUPPRESS_PX;
  };

  const rememberHandledContextBack = (clientX, clientY) => {
    lastHandledAt = performance.now();
    lastHandledX = Number.isFinite(clientX) ? clientX : NaN;
    lastHandledY = Number.isFinite(clientY) ? clientY : NaN;
  };

  const onContextBack = (e) => {
    const clientX = Number(e.clientX);
    const clientY = Number(e.clientY);
    if (isRepeatedContextBack(clientX, clientY)) {
      e.preventDefault();
      return;
    }
    const handled = viewActionRuntime.handleContextBack({
      target: e.target,
      clientX,
      clientY,
    });
    if (!handled) return;
    rememberHandledContextBack(clientX, clientY);
    e.preventDefault();
  };
  document.addEventListener("contextmenu", onContextBack);
}

function setMenuOpen(nextOpen) {
  menuOpen = Boolean(nextOpen);
  if (menuBar) {
    menuBar.classList.toggle("open", menuOpen);
    menuBar.setAttribute("aria-hidden", menuOpen ? "false" : "true");
  }
  if (menuOpen) {
    menuCalendarViewDate = menuCalendarMonthStart(menuCalendarFocusDate());
    renderMenuCalendar();
  } else {
    menuCalendarViewDate = null;
  }
  if (statusBar) {
    statusBar.setAttribute("aria-expanded", menuOpen ? "true" : "false");
  }
}

function setWeatherDrawerOpen(nextOpen, options = {}) {
  return statusRuntime.setWeatherDrawerOpen(nextOpen, options);
  const shouldOpen = Boolean(nextOpen);
  const animate = shouldOpen && options.animate !== false;
  weatherDrawerOpen = shouldOpen;
  if (weatherDrawer) {
    if (!animate) {
      weatherDrawer.classList.add("no-motion");
      void weatherDrawer.offsetHeight;
    } else {
      weatherDrawer.classList.remove("no-motion");
    }
    weatherDrawer.classList.toggle("open", weatherDrawerOpen);
    weatherDrawer.setAttribute("aria-hidden", weatherDrawerOpen ? "false" : "true");
    if (!animate) {
      requestAnimationFrame(() => {
        if (weatherDrawer) {
          weatherDrawer.classList.remove("no-motion");
        }
      });
    }
  }
  if (statusWeatherTicker) {
    statusWeatherTicker.setAttribute("aria-expanded", weatherDrawerOpen ? "true" : "false");
  }
}

function installStatusMenu() {
  const triggerGoogleCalendarAction = () => {
    return viewActionRuntime.triggerGoogleCalendarAction();
  };
  let statusNowBtnClickTimer = 0;

  const triggerStatusNowBtnAction = (clientY, forceExpand = false) => {
    return viewActionRuntime.triggerStatusNowAction(clientY, { forceExpand });
  };

  if (statusNowBtn) {
    statusNowBtn.addEventListener("pointerdown", (e) => {
      statusNowBtnPointerClientY = Number.isFinite(e.clientY) ? e.clientY : null;
      e.stopPropagation();
    });
    statusNowBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (e.detail > 1) return;
      if (statusNowBtnClickTimer) {
        clearTimeout(statusNowBtnClickTimer);
        statusNowBtnClickTimer = 0;
      }
      const anchorClientY = Number.isFinite(e.clientY) ? e.clientY : statusNowBtnPointerClientY;
      statusNowBtnClickTimer = window.setTimeout(() => {
        statusNowBtnClickTimer = 0;
        triggerStatusNowBtnAction(anchorClientY, false);
      }, 220);
    });
    statusNowBtn.addEventListener("dblclick", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (statusNowBtnClickTimer) {
        clearTimeout(statusNowBtnClickTimer);
        statusNowBtnClickTimer = 0;
      }
      const anchorClientY = Number.isFinite(e.clientY) ? e.clientY : statusNowBtnPointerClientY;
      triggerStatusNowBtnAction(anchorClientY, true);
    });
    statusNowBtn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.stopPropagation();
      }
    });
  }
  if (statusTodayFeatureBtn) {
    statusTodayFeatureBtn.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
    });
    statusTodayFeatureBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      viewActionRuntime.toggleTodayFeature();
    });
    statusTodayFeatureBtn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.stopPropagation();
      }
    });
  }
  if (statusBar) {
    statusBar.addEventListener("click", () => {
      viewActionRuntime.toggleStatusBarMenu();
    });
    statusBar.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        viewActionRuntime.toggleStatusBarMenu();
      }
    });
  }
  if (statusWeatherTicker) {
    statusWeatherTicker.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
    });
    statusWeatherTicker.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      viewActionRuntime.toggleWeatherDrawer();
    });
    statusWeatherTicker.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.stopPropagation();
    });
  }
  if (statusWakeTimeBtn) {
    statusWakeTimeBtn.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
    });
    statusWakeTimeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      viewActionRuntime.openWakeTimePreferences();
    });
    statusWakeTimeBtn.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.stopPropagation();
    });
  }
  if (statusGoogleBtn) {
    statusGoogleBtn.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
    });
    statusGoogleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      setMenuOpen(false);
      setWeatherDrawerOpen(false);
      triggerGoogleCalendarAction();
    });
  }
  if (timelineWrap) {
    timelineWrap.addEventListener("pointerdown", (e) => {
      if (isPointerOnVerticalScrollbar(timelineWrap, e.clientX)) return;
      if (menuOpen) setMenuOpen(false);
      if (weatherDrawerOpen) setWeatherDrawerOpen(false);
    });
  }
  document.addEventListener("pointerdown", (e) => {
    const target = e.target;
    if (!(target instanceof Node)) return;
    if (statusWeatherTicker && statusWeatherTicker.contains(target)) return;
    if (statusBar && statusBar.contains(target)) return;
    if (weatherDrawer && weatherDrawer.contains(target)) return;
    if (weatherDrawerOpen) {
      setWeatherDrawerOpen(false);
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    viewActionRuntime.handleEscapeKey();
  });
}

function minutesForY(y) {
  if (y <= 0) return 0;
  if (todayFocusMode) {
    return todayFocusBaseYFromRenderedY(y) / minutePx;
  }
  const block = dayBlockHeight;
  const dayIndex = Math.floor(y / block);
  const within = y - dayIndex * block;
  const dayHeaderHeight = timelineDayHeaderHeight();
  if (within <= dayHeaderHeight) return dayIndex * DAY_MINUTES;
  return dayIndex * DAY_MINUTES + (within - dayHeaderHeight) / minutePx;
}

function dateTimeFromClientPoint(clientX, clientY) {
  if (!timelineWrap || !timeline) return new Date();
  const rect = timelineWrap.getBoundingClientRect();
  const timelineOffset = timeline.offsetTop;
  const y = clientY - rect.top + timelineWrap.scrollTop - timelineOffset;
  const timelineY = Math.max(0, y);
  const totalMinutes = minutesForY(timelineY);
  let dayIndex = Math.floor(totalMinutes / DAY_MINUTES);
  let minuteOfDay = totalMinutes - dayIndex * DAY_MINUTES;
  if (minuteOfDay < 0) minuteOfDay = 0;
  let hour = Math.floor(minuteOfDay / 60);
  let minute = Math.floor(minuteOfDay - hour * 60);
  let second = Math.round((minuteOfDay - hour * 60 - minute) * 60);

  if (second === 60) {
    second = 0;
    minute += 1;
  }
  if (minute === 60) {
    minute = 0;
    hour += 1;
  }
  if (hour === 24) {
    hour = 0;
    dayIndex += 1;
  }

  const date = addDays(startDate, dayIndex);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hour,
    minute,
    second,
    0
  );
}

function dayStackDateTimeFromClientPoint(clientX, clientY) {
  if (!dayStackLayer || !dayStackOpen) return null;
  const hit = document.elementFromPoint(clientX, clientY);
  let body = hit && hit.closest ? hit.closest(".dayStackBody") : null;
  let item = body ? body.closest(".dayStackItem.expanded") : null;
  if (!item || !body) {
    item = dayStackLayer.querySelector(".dayStackItem.expanded");
    body = item ? item.querySelector(".dayStackBody") : null;
  }
  if (!item || !body) return null;

  const raw = item.dataset.date || "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const baseDate = new Date(year, month - 1, day);
  if (
    baseDate.getFullYear() !== year ||
    baseDate.getMonth() !== month - 1 ||
    baseDate.getDate() !== day
  ) {
    return null;
  }

  const rect = body.getBoundingClientRect();
  const maxY = DAY_MINUTES * minutePx;
  const y = Math.max(0, Math.min(maxY, clientY - rect.top));
  const totalMinutes = y / minutePx;
  let hour = Math.floor(totalMinutes / 60);
  let minute = Math.floor(totalMinutes - hour * 60);
  let second = Math.round((totalMinutes - hour * 60 - minute) * 60);

  if (second === 60) {
    second = 0;
    minute += 1;
  }
  if (minute === 60) {
    minute = 0;
    hour += 1;
  }
  if (hour >= 24) {
    hour = 23;
    minute = 59;
    second = 59;
  }

  return new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    hour,
    minute,
    second,
    0
  );
}

function currentDayIndex(offset) {
  const probe = timelineWrap.scrollTop + offset;
  const minutes = minutesForY(probe);
  const idx = Math.floor(minutes / DAY_MINUTES);
  return Math.max(0, Math.min(timelineVisibleDayCount() - 1, idx));
}

function maybeShiftWindow() {
  if (!INFINITE_SCROLL_ENABLED) return;
  if (dayStackOpen) return;
  if (todayFocusMode) return;
  if (shifting) return;
  const threshold = dayBlockHeight * SHIFT_THRESHOLD_DAYS;
  const maxScroll = Math.max(0, timelineVisibleDayCount() * dayBlockHeight - timelineWrap.clientHeight);
  if (timelineWrap.scrollTop <= threshold) {
    shifting = true;
    startDate = addDays(startDate, -1);
    timelineWrap.scrollTop += dayBlockHeight;
    renderDayBars();
    updateStickyDay();
    updateTime();
    shifting = false;
  } else if (timelineWrap.scrollTop >= maxScroll - threshold) {
    shifting = true;
    startDate = addDays(startDate, 1);
    timelineWrap.scrollTop -= dayBlockHeight;
    renderDayBars();
    updateStickyDay();
    updateTime();
    shifting = false;
  }
}

function installWheel() {
  let todayFocusHourWheelDelta = 0;
  let todayFocusHourWheelResetTimer = 0;

  const resetTodayFocusHourWheelDelta = () => {
    todayFocusHourWheelDelta = 0;
    if (!todayFocusHourWheelResetTimer) return;
    clearTimeout(todayFocusHourWheelResetTimer);
    todayFocusHourWheelResetTimer = 0;
  };

  const scheduleTodayFocusHourWheelReset = () => {
    if (todayFocusHourWheelResetTimer) {
      clearTimeout(todayFocusHourWheelResetTimer);
    }
    todayFocusHourWheelResetTimer = window.setTimeout(() => {
      todayFocusHourWheelResetTimer = 0;
      todayFocusHourWheelDelta = 0;
    }, TODAY_FOCUS_HOUR_WHEEL_RESET_MS);
  };

  timelineWrap.addEventListener(
    "wheel",
    (e) => {
      if (dayStackOpen) return;
      if (todayFocusMode) {
        if (!todayFocusHourMode) {
          resetTodayFocusHourWheelDelta();
          return;
        }
        if (!Number.isFinite(e.deltaY) || e.deltaY === 0) return;
        if (isPointerOnVerticalScrollbar(timelineWrap, e.clientX)) return;
        e.preventDefault();
        todayFocusHourWheelDelta += e.deltaY;
        scheduleTodayFocusHourWheelReset();
        if (Math.abs(todayFocusHourWheelDelta) < TODAY_FOCUS_HOUR_WHEEL_THRESHOLD) return;
        const direction = todayFocusHourWheelDelta > 0 ? 1 : -1;
        resetTodayFocusHourWheelDelta();
        shiftTodayFocusHour(direction);
        return;
      }
      resetTodayFocusHourWheelDelta();
      if (todayFocusMode) return;
      if (!INFINITE_SCROLL_ENABLED) return;
      if (e.deltaY < 0 && timelineWrap.scrollTop <= 2) {
        maybeShiftWindow();
        e.preventDefault();
      }
    },
    { passive: false }
  );
}

function scrollToNow() {
  const today = startOfDay(new Date());
  startDate = todayFocusMode ? today : defaultTimelineStartDate(today);
  buildTimeline();
  if (todayFocusMode) {
    timelineWrap.scrollTop = 0;
    updateStickyDay();
    updateTime();
    return;
  }
  const now = new Date();
  const dayIndex = diffDays(today, startDate);
  const minutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const y =
    dayIndex * dayBlockHeight +
    timelineDayHeaderHeight() +
    minutes * minutePx;
  timelineWrap.scrollTop = Math.max(0, y - timelineNowOffset());
  updateStickyDay();
  updateNowLine(now);
}

function scrollToTodayOverview() {
  const today = startOfDay(new Date());
  startDate = todayFocusMode ? today : defaultTimelineStartDate(today);
  buildTimeline();
  if (todayFocusMode) {
    timelineWrap.scrollTop = 0;
    updateStickyDay();
    updateTime();
    return;
  }
  const dayIndex = diffDays(today, startDate);
  const dayTop = dayIndex * dayBlockHeight;
  timelineWrap.scrollTop = Math.max(0, dayTop);
  updateStickyDay();
  updateTime();
}

function setDayStackScrollTop(nextTop) {
  if (!dayStackLayer) return;
  const maxScroll = Math.max(0, dayStackLayer.scrollHeight - dayStackLayer.clientHeight);
  const clamped = Math.max(0, Math.min(maxScroll, nextTop));
  dayStackLayer.scrollTop = clamped;
  dayStackLastScrollTop = clamped;
}

function dayStackOffsetForClientY(clientY, fallback = 0) {
  if (!dayStackLayer) return Math.max(0, fallback);
  const rect = dayStackLayer.getBoundingClientRect();
  const maxOffset = Math.max(0, dayStackLayer.clientHeight - 1);
  const raw = Number.isFinite(clientY) ? clientY - rect.top : fallback;
  return Math.max(0, Math.min(maxOffset, raw));
}

function isDayStackItemVisible(item) {
  if (!dayStackLayer || !item || !item.isConnected) return false;
  const layerRect = dayStackLayer.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();
  return itemRect.bottom > layerRect.top && itemRect.top < layerRect.bottom;
}

function focusDateInDayStack(targetDate, { expand = true } = {}) {
  if (!dayStackLayer || !(targetDate instanceof Date) || !Number.isFinite(targetDate.getTime())) {
    return false;
  }

  const focusDate = clampDayStackDate(startOfDay(targetDate));
  const targetKey = dateKeyFromDate(focusDate);

  hideHoverGuide();
  clearDayStackCenterTimer();
  clearDayStackInlineDraft();
  dayStackBackAnchorDate = new Date(focusDate.getTime());
  dayStackExpandedMonthKey = "";
  dayStackAlarmBundleOpenKey = "";
  dayStackMonthListMode = false;
  dayStackYearListMode = false;
  dayStackViewMode = DAY_STACK_VIEW_MODE_MONTH_DAY;
  dayStackSpread = 0;

  if (!dayStackOpen) {
    setDayStackOpen(true);
  }

  ensureDayStackWindow(focusDate);
  setDayStackReturnFocus("");
  setDayStackRailFocus(dayStackRailFocusKeyForDate(focusDate, DAY_STACK_VIEW_MODE_MONTH_DAY));
  dayStackExpandedDate = expand ? targetKey : null;
  renderDayStack();

  const targetItem =
    (expand ? expandedDayStackItem() : null) ||
    dayStackLayer.querySelector(`.dayStackItem[data-date="${targetKey}"]`);
  if (!targetItem) return false;

  const nextTop = expand
    ? scrollTopForCenteredExpandedDayStackItem(targetItem)
    : scrollTopForCenteredDayStackItem(targetItem);
  setDayStackScrollTop(nextTop);
  dayStackLastScrollTop = nextTop;
  if (expand) {
    scheduleCenteredExpandedDayStackItem(targetItem, targetKey);
  }
  updateDayStackNowLines(new Date());
  renderMenuCalendar();
  return true;
}

function focusTodayInDayStack(clientY, { forceExpand = false } = {}) {
  const now = new Date();
  const today = startOfDay(now);
  const todayKey = dateKeyFromDate(today);
  const currentYearDate = new Date(today.getFullYear(), 0, 1);
  const currentYearKey = dateKeyFromDate(currentYearDate);
  const currentMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const currentMonthKey = dateKeyFromDate(currentMonthDate);
  const openedFromClosed = !dayStackOpen;
  dayStackBackAnchorDate = new Date(today.getTime());
  clearDayStackInlineDraft();

  if (openedFromClosed) {
    setDayStackOpen(true);
  }

  if (forceExpand) {
    ensureDayStackWindow(today);
    setDayStackReturnFocus("");
    setDayStackRailFocus(dayStackRailFocusKeyForDate(today, DAY_STACK_VIEW_MODE_MONTH_DAY));
    dayStackExpandedDate = todayKey;
    dayStackSpread = 0;
    dayStackYearListMode = false;
    dayStackViewMode = DAY_STACK_VIEW_MODE_MONTH_DAY;
    renderDayStack();
    const targetItem =
      expandedDayStackItem() || dayStackLayer.querySelector(`.dayStackItem[data-date="${todayKey}"]`);
    if (!targetItem) return;
    setDayStackScrollTop(scrollTopForCenteredExpandedDayStackItem(targetItem));
    scheduleCenteredExpandedDayStackItem(targetItem, todayKey);
    updateDayStackNowLines(now);
    return;
  }

  if (dayStackYearListMode) {
    const currentYearItem = dayStackLayer.querySelector(`.dayStackItem[data-date="${currentYearKey}"]`);
    if (dayStackReturnFocusKey === currentYearKey && currentYearItem && !isDayStackItemVisible(currentYearItem)) {
      setDayStackScrollTop(scrollTopForCenteredDayStackItem(currentYearItem));
      return;
    }
    dayStackExpandedDate = null;
    dayStackSpread = 0;
    dayStackViewMode = DAY_STACK_VIEW_MODE_YEAR_MONTH;
    dayStackBaseDate = startOfDay(new Date(DAY_STACK_RANGE_START));
    dayStackEndDate = startOfDay(new Date(DAY_STACK_RANGE_END));
    if (dayStackReturnFocusKey === currentYearKey) {
      dayStackYearListMode = false;
      setDayStackReturnFocus(currentMonthKey);
      dayStackRailFocusKey = dayStackRailFocusKeyForDate(today, DAY_STACK_VIEW_MODE_YEAR_MONTH);
      renderDayStack();
      const targetMonthItem = dayStackLayer.querySelector(`.dayStackItem[data-date="${currentMonthKey}"]`);
      if (targetMonthItem) {
        setDayStackScrollTop(scrollTopForCenteredDayStackItem(targetMonthItem));
      }
      return;
    }
    setDayStackReturnFocus(currentYearKey);
    dayStackRailFocusKey = dayStackRailFocusKeyForDate(today, DAY_STACK_VIEW_MODE_YEAR_MONTH);
    renderDayStack();
    const targetItem = dayStackLayer.querySelector(`.dayStackItem[data-date="${currentYearKey}"]`);
    if (targetItem) {
      setDayStackScrollTop(scrollTopForCenteredDayStackItem(targetItem));
    }
    return;
  }

  if (dayStackViewMode === DAY_STACK_VIEW_MODE_YEAR_MONTH) {
    const currentMonthItem = dayStackLayer.querySelector(`.dayStackItem[data-date="${currentMonthKey}"]`);
    if (
      dayStackReturnFocusKey === currentMonthKey &&
      currentMonthItem &&
      !isDayStackItemVisible(currentMonthItem)
    ) {
      setDayStackScrollTop(scrollTopForCenteredDayStackItem(currentMonthItem));
      return;
    }
    dayStackExpandedDate = null;
    dayStackSpread = 0;
    dayStackBaseDate = startOfDay(new Date(DAY_STACK_RANGE_START));
    dayStackEndDate = startOfDay(new Date(DAY_STACK_RANGE_END));
    if (dayStackReturnFocusKey === currentMonthKey) {
      ensureDayStackWindow(today);
      setDayStackReturnFocus(todayKey);
      setDayStackRailFocus(dayStackRailFocusKeyForDate(today, DAY_STACK_VIEW_MODE_MONTH_DAY));
      dayStackExpandedDate = null;
      dayStackViewMode = DAY_STACK_VIEW_MODE_MONTH_DAY;
      renderDayStack();
      const targetDayItem = dayStackLayer.querySelector(`.dayStackItem[data-date="${todayKey}"]`);
      if (targetDayItem) {
        setDayStackScrollTop(scrollTopForCenteredDayStackItem(targetDayItem));
      }
      return;
    }
    setDayStackReturnFocus(currentMonthKey);
    dayStackRailFocusKey = dayStackRailFocusKeyForDate(today, DAY_STACK_VIEW_MODE_YEAR_MONTH);
    renderDayStack();
    const targetItem = dayStackLayer.querySelector(`.dayStackItem[data-date="${currentMonthKey}"]`);
    if (targetItem) {
      setDayStackScrollTop(scrollTopForCenteredDayStackItem(targetItem));
    }
    return;
  }

  ensureDayStackWindow(today);
  setDayStackRailFocus(dayStackRailFocusKeyForDate(today, DAY_STACK_VIEW_MODE_MONTH_DAY));
  dayStackSpread = 0;
  if (openedFromClosed) {
    updateDayStackNowLines(now);
    return;
  }
  if (dayStackExpandedDate === todayKey) {
    enterTodayFocusMode(today);
    return;
  }
  if (dayStackReturnFocusKey === todayKey) {
    const currentDayItem = dayStackLayer.querySelector(`.dayStackItem[data-date="${todayKey}"]`);
    if (currentDayItem && !isDayStackItemVisible(currentDayItem)) {
      setDayStackScrollTop(scrollTopForCenteredDayStackItem(currentDayItem));
      return;
    }
    setDayStackReturnFocus("");
    dayStackExpandedDate = todayKey;
    renderDayStack();
    const expandedToday =
      expandedDayStackItem() || dayStackLayer.querySelector(`.dayStackItem[data-date="${todayKey}"]`);
    if (!expandedToday) return;
    setDayStackScrollTop(scrollTopForCenteredExpandedDayStackItem(expandedToday));
    scheduleCenteredExpandedDayStackItem(expandedToday, todayKey);
    updateDayStackNowLines(now);
    return;
  }
  setDayStackReturnFocus(todayKey);
  dayStackExpandedDate = null;
  renderDayStack();
  const targetItem = dayStackLayer.querySelector(`.dayStackItem[data-date="${todayKey}"]`);
  if (!targetItem) return;
  setDayStackScrollTop(scrollTopForCenteredDayStackItem(targetItem));
}

function installDragScroll() {
  let pressed = false;
  let dragging = false;
  let selecting = false;
  let longPressConsumed = false;
  let startY = 0;
  let startScroll = 0;
  let velocity = 0;
  let lastY = 0;
  let lastTime = 0;
  let inertiaId = null;
  let pressTimer = null;
  let wobbleTimer = null;
  let opacityDelayTimer = null;
  let opacityInterval = null;
  let opacityIdleTimer = null;
  let pressX = 0;
  let pressY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let todayFocusHourDragDelta = 0;

  function clearTimer() {
    if (!pressTimer) return;
    clearTimeout(pressTimer);
    pressTimer = null;
  }

  function dateTimeFromPointer(clientX, clientY) {
    const rect = timelineWrap.getBoundingClientRect();
    const timelineOffset = timeline.offsetTop;
    const x = clientX - rect.left;
    const y = clientY - rect.top + timelineWrap.scrollTop - timelineOffset;
    const timelineY = Math.max(0, y);
    const totalMinutes = minutesForY(timelineY);
    let dayIndex = Math.floor(totalMinutes / DAY_MINUTES);
    let minuteOfDay = totalMinutes - dayIndex * DAY_MINUTES;
    if (minuteOfDay < 0) minuteOfDay = 0;
    let hour = Math.floor(minuteOfDay / 60);
    let minuteFloat = minuteOfDay - hour * 60;
    let minute = Math.floor(minuteFloat);
    let second = Math.round((minuteFloat - minute) * 60);

    if (second == 60) {
      second = 0;
      minute += 1;
    }
    if (minute == 60) {
      minute = 0;
      hour += 1;
    }
    if (hour == 24) {
      hour = 0;
      dayIndex += 1;
    }

    const date = addDays(startDate, dayIndex);
    const selected = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hour,
      minute,
      second,
      0
    );
    return { dateTime: selected, x: Math.max(8, x) };
  }

  function updateSelectionFromPointer(clientX, clientY) {
    const result = dateTimeFromPointer(clientX, clientY);
    selectedDateTime = result.dateTime;
    selectedX = result.x;
    updateSelectionMarker();
  }

  function updateSelectionFromAnchor(clientX, clientY) {
    if (!selectAnchorTime) return;
    const rect = timelineWrap.getBoundingClientRect();
    const dy = clientY - selectAnchorY;
    const deltaSeconds = Math.round((dy / minutePx) * 60);
    selectedDateTime = new Date(selectAnchorTime.getTime() + deltaSeconds * 1000);
    selectedX = Math.max(8, clientX - rect.left);
    updateSelectionMarker();
  }

  function clearWobble() {
    if (wobbleTimer) {
      clearTimeout(wobbleTimer);
      wobbleTimer = null;
    }
    if (selectionLine) {
      selectionLine.classList.remove("wobble");
    }
  }

  function triggerWobble() {
    if (!selectionLine) return;
    selectionLine.classList.add("wobble");
    if (wobbleTimer) clearTimeout(wobbleTimer);
    wobbleTimer = setTimeout(() => {
      if (selectionLine) selectionLine.classList.remove("wobble");
      wobbleTimer = null;
    }, 120);
  }

  function clearOpacityJitter() {
    if (opacityDelayTimer) {
      clearTimeout(opacityDelayTimer);
      opacityDelayTimer = null;
    }
    if (opacityInterval) {
      clearInterval(opacityInterval);
      opacityInterval = null;
    }
    if (opacityIdleTimer) {
      clearTimeout(opacityIdleTimer);
      opacityIdleTimer = null;
    }
    if (selectionLine) selectionLine.style.opacity = "";
  }

  function setLineOpacity(value) {
    if (!selectionLine) return;
    selectionLine.style.opacity = value;
  }

  function applyRandomOpacity() {
    if (!selectionLine) return;
    const value =
      OPACITY_JITTER_MIN + Math.random() * (OPACITY_JITTER_MAX - OPACITY_JITTER_MIN);
    selectionLine.style.opacity = value.toFixed(2);
  }

  function startOpacityJitter() {
    if (opacityInterval) return;
    applyRandomOpacity();
    opacityInterval = setInterval(applyRandomOpacity, OPACITY_JITTER_MS);
  }

  function stopOpacityJitter() {
    if (opacityInterval) {
      clearInterval(opacityInterval);
      opacityInterval = null;
    }
    setLineOpacity("0.5");
  }

  function noteOpacityActivity() {
    if (!opacityDelayTimer && !opacityInterval) {
      opacityDelayTimer = setTimeout(() => {
        opacityDelayTimer = null;
        startOpacityJitter();
      }, SELECTION_SPREAD_MS);
    } else if (!opacityInterval && !opacityDelayTimer) {
      startOpacityJitter();
    }
    if (opacityIdleTimer) clearTimeout(opacityIdleTimer);
    opacityIdleTimer = setTimeout(() => {
      opacityIdleTimer = null;
      stopOpacityJitter();
    }, OPACITY_IDLE_MS);
  }

  function maybeShiftDuringDrag(clientY) {
    const beforeScroll = timelineWrap.scrollTop;
    const beforeDate = startDate;
    maybeShiftWindow();
    if (timelineWrap.scrollTop !== beforeScroll || startDate !== beforeDate) {
      startScroll = timelineWrap.scrollTop;
      startY = clientY;
    }
  }

  function alarmFromPointer(clientX, clientY) {
    const hit = document.elementFromPoint(clientX, clientY);
    if (!hit || !hit.closest) return null;
    const alarmEl = hit.closest(".alarm-line, .dayStackAlarmLine");
    if (!alarmEl) return null;
    if (alarmEl.classList.contains("bundle")) return null;
    const source = alarmEl.dataset.source || LOCAL_EVENT_SOURCE;
    if (source === GOOGLE_EVENT_SOURCE) {
      const eventId = alarmEl.dataset.eventId || "";
      const event = googleEventsById.get(eventId);
      const eventTime = event ? googleEventDateTimeValue(event) : null;
      if (event && eventTime instanceof Date && Number.isFinite(eventTime.getTime())) {
        return {
          source: GOOGLE_EVENT_SOURCE,
          time: new Date(eventTime.getTime()),
          title: googleEventDisplayTitle(event),
          htmlLink: typeof event.htmlLink === "string" ? event.htmlLink : "",
          allDay: Boolean(event.allDay),
          eventId: event.id,
        };
      }
    }
    const alarmIndexRaw = Number(alarmEl.dataset.alarmIndex || "");
    const alarmIndex = Number.isFinite(alarmIndexRaw) ? Math.trunc(alarmIndexRaw) : -1;
    if (alarmIndex >= 0 && alarmIndex < alarms.length) {
      const source = alarms[alarmIndex];
      const sourceTimeRaw = source instanceof Date ? source : source ? source.time : null;
      const sourceTime =
        sourceTimeRaw instanceof Date
          ? sourceTimeRaw
          : sourceTimeRaw !== null && sourceTimeRaw !== undefined
            ? new Date(sourceTimeRaw)
            : null;
      if (sourceTime instanceof Date && Number.isFinite(sourceTime.getTime())) {
        return {
          source: LOCAL_EVENT_SOURCE,
          time: new Date(sourceTime.getTime()),
          title:
            source && !(source instanceof Date) && typeof source.title === "string"
              ? source.title
              : "",
          remind:
            source && !(source instanceof Date) && typeof source.remind === "string"
              ? source.remind
              : "none",
          repeat:
            source && !(source instanceof Date) && typeof source.repeat === "string"
              ? source.repeat
              : "none",
          remindEnabled: Boolean(source && !(source instanceof Date) && source.remindEnabled),
          repeatEnabled: Boolean(source && !(source instanceof Date) && source.repeatEnabled),
          alarmIndex,
        };
      }
    }
    const stamp = alarmEl.dataset.timestamp;
    if (!stamp) return null;
    const ts = Number(stamp);
    if (!Number.isFinite(ts)) return null;
    const title = alarmEl.dataset.title || "";
    return { source: LOCAL_EVENT_SOURCE, time: new Date(ts), title };
  }

  function bundleFromPointer(clientX, clientY) {
    const hit = document.elementFromPoint(clientX, clientY);
    if (!hit || !hit.closest) return null;
    const bundleEl = hit.closest(".dayStackAlarmLine.bundle");
    if (!bundleEl) return null;
    const bundleKey = typeof bundleEl.dataset.bundleKey === "string" ? bundleEl.dataset.bundleKey : "";
    if (!bundleKey) return null;
    return { bundleKey };
  }

  timelineWrap.addEventListener("pointerdown", (e) => {
    if (dayStackOpen) return;
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    if (isPointerOnVerticalScrollbar(timelineWrap, e.clientX)) return;
    if (inertiaId) {
      cancelAnimationFrame(inertiaId);
      inertiaId = null;
    }
    const inlineEditorCard =
      e.target && e.target.closest ? e.target.closest(".dayStackInlineEditorCard") : null;
    const inlineEditorSlot =
      e.target && e.target.closest ? e.target.closest(".dayStackInlineEditorSlot") : null;
    if (todayFocusMode && (dayStackInlineDraft || dayStackInlineAlarmView) && !inlineEditorCard) {
      clearDayStackInlineDraft();
      if (inlineEditorSlot) {
        hideHoverGuide();
        return;
      }
    }
    if (todayFocusMode && inlineEditorCard) {
      hideHoverGuide();
      return;
    }
    pointerActive = true;
    pressed = true;
    dragging = false;
    selecting = false;
    startY = e.clientY;
    startScroll = timelineWrap.scrollTop;
    lastY = e.clientY;
    lastTime = performance.now();
    velocity = 0;
    pressX = e.clientX;
    pressY = e.clientY;
    pointerX = e.clientX;
    pointerY = e.clientY;
    todayFocusHourDragDelta = 0;
    todayFocusSuppressNextInlineClick = false;
    longPressConsumed = false;
    clearTimer();
    pressTimer = setTimeout(() => {
      if (!pressed) return;
      const drift = Math.hypot(pointerX - pressX, pointerY - pressY);
      if (drift > DRAG_START_THRESHOLD_PX) return;
      const result = dateTimeFromPointer(pressX, pressY);
      if (isPastSelection(result.dateTime)) {
        showAlert("\uD604\uC7AC \uC2DC\uAC04 \uC774\uD6C4\uBD80\uD130 \uC124\uC815\uD560 \uC218 \uC788\uC5B4\uC694.");
        selecting = false;
        dragging = false;
        hideSelectionElements();
        return;
      }
      if (todayFocusMode) {
        selectedDateTime = result.dateTime;
        selectedX = result.x;
        updateSelectionMarker();
        promptAlarmCreation(result.dateTime, {
          onFinish: hideSelectionElements,
          guardPointerMs: 220,
        });
        longPressConsumed = true;
        dragging = false;
        selecting = false;
        return;
      }
      selecting = true;
      dragging = false;
      selectAnchorTime = result.dateTime;
      selectAnchorY = pressY;
      selectAnchorX = result.x;
      selectedDateTime = result.dateTime;
      selectedX = result.x;
      if (!todayFocusMode && minutePx < ZOOM_MINUTE_PX - MINUTE_PX_EPSILON) {
        animateMinutePx(ZOOM_MINUTE_PX, selectAnchorTime, pressY);
      }
      updateSelectionMarker();
    }, todayFocusMode ? DAY_STACK_INLINE_EDITOR_LONG_PRESS_MS : LONG_PRESS_SELECT_MS);
    timelineWrap.setPointerCapture(e.pointerId);
  });

  timelineWrap.addEventListener("pointermove", (e) => {
    if (!pressed) return;
    pointerX = e.clientX;
    pointerY = e.clientY;
    if (longPressConsumed) {
      e.preventDefault();
      return;
    }
    if (selecting) {
      updateSelectionFromAnchor(e.clientX, e.clientY);
      triggerWobble();
      noteOpacityActivity();
      return;
    }
    if (pressTimer) {
      const dx = e.clientX - pressX;
      const dyPress = e.clientY - pressY;
      if (Math.hypot(dx, dyPress) > DRAG_START_THRESHOLD_PX) {
        clearTimer();
        dragging = true;
      }
    }
    if (!dragging) return;
    if (todayFocusMode && todayFocusHourMode) {
      const dyInst = e.clientY - lastY;
      todayFocusHourDragDelta += dyInst;
      lastY = e.clientY;
      lastTime = performance.now();
      while (todayFocusHourDragDelta <= -TODAY_FOCUS_HOUR_DRAG_STEP_PX) {
        if (!shiftTodayFocusHour(1)) {
          todayFocusHourDragDelta = 0;
          break;
        }
        todayFocusHourDragDelta += TODAY_FOCUS_HOUR_DRAG_STEP_PX;
      }
      while (todayFocusHourDragDelta >= TODAY_FOCUS_HOUR_DRAG_STEP_PX) {
        if (!shiftTodayFocusHour(-1)) {
          todayFocusHourDragDelta = 0;
          break;
        }
        todayFocusHourDragDelta -= TODAY_FOCUS_HOUR_DRAG_STEP_PX;
      }
      e.preventDefault();
      return;
    }
    const dy = e.clientY - startY;
    timelineWrap.scrollTop = Math.max(0, startScroll - dy);
    const now = performance.now();
    const dt = Math.max(1, now - lastTime);
    const dyInst = e.clientY - lastY;
    velocity = velocity * 0.6 + (-dyInst / dt) * 0.4;
    lastY = e.clientY;
    lastTime = now;
    maybeShiftDuringDrag(e.clientY);
  });

  timelineWrap.addEventListener("pointerup", (e) => {
    if (!pressed) return;
    pressed = false;
    pointerActive = false;
    clearTimer();
    timelineWrap.releasePointerCapture(e.pointerId);
    if (longPressConsumed) {
      longPressConsumed = false;
      return;
    }
    if (selecting) {
      selecting = false;
      selectAnchorTime = null;
      clearWobble();
      clearOpacityJitter();
      if (selectedDateTime) {
        const alarmTime = new Date(selectedDateTime.getTime());
        if (todayFocusMode) {
          if (isPastSelection(alarmTime)) {
            showAlert("\uD604\uC7AC \uC2DC\uAC04 \uC774\uD6C4\uBD80\uD130 \uC124\uC815\uD560 \uC218 \uC788\uC5B4\uC694.");
            hideSelectionElements();
            return;
          }
          promptAlarmCreation(alarmTime, {
            onFinish: hideSelectionElements,
          });
          return;
        }
        if (isPastSelection(alarmTime)) {
          showAlert("\uD604\uC7AC \uC2DC\uAC04 \uC774\uD6C4\uBD80\uD130 \uC124\uC815\uD560 \uC218 \uC788\uC5B4\uC694.");
          hideSelectionElements();
        } else {
          promptAlarmCreation(alarmTime, {
            onFinish: hideSelectionElements,
          });
        }
      }
      return;
    }
    if (dragging && todayFocusMode && todayFocusHourMode) return;
    const bundle = todayFocusMode ? bundleFromPointer(e.clientX, e.clientY) : null;
    if (bundle) {
      dayStackAlarmBundleOpenKey =
        dayStackAlarmBundleOpenKey === bundle.bundleKey ? "" : bundle.bundleKey;
      renderAllAlarmViews();
      return;
    }
    const alarm = alarmFromPointer(e.clientX, e.clientY);
    if (alarm) {
      if (todayFocusMode) {
        showTodayFocusAlarmDetails(alarm);
        return;
      }
      if (!todayFocusMode && revealScheduleEntryInDayStack(alarm)) {
        return;
      }
      if (handleGoogleCalendarEvent(alarm)) {
        return;
      }
      showAlert(`\uC608\uC57D \uD655\uC778: ${formatAlarmInfo(alarm)}`);
      return;
    }
    if (!dragging) return;
    if (todayFocusMode && todayFocusHourMode) return;
    if (Math.abs(velocity) < 0.02) return;
    if (timelineWrap.scrollTop <= 2) {
      maybeShiftWindow();
    }
    const start = performance.now();
    const decay = 0.0028;
    const step = (t) => {
      const dt = t - start;
      const v = velocity > 0 ? Math.max(0, velocity - decay * dt) : Math.min(0, velocity + decay * dt);
      if (Math.abs(v) < 0.02) return;
      timelineWrap.scrollTop += v * 16;
      inertiaId = requestAnimationFrame(step);
    };
    inertiaId = requestAnimationFrame(step);
  });

  timelineWrap.addEventListener("dblclick", (e) => {
    if (selecting) return;
    if (isPointerOnVerticalScrollbar(timelineWrap, e.clientX)) return;
    const result = dateTimeFromPointer(e.clientX, e.clientY);
    const currentZoomValue =
      todayFocusMode && todayFocusHourMode ? MAX_ZOOM_MINUTE_PX : minutePx;
    if (todayFocusMode && todayFocusHourMode) {
      exitTodayFocusHourMode();
    }
    const target = nextDblClickZoomMinutePx(currentZoomValue);
    animateMinutePx(target, result.dateTime, e.clientY);
    e.preventDefault();
  });

  timelineWrap.addEventListener("pointerleave", (e) => {
    if (!pressed) return;
    pressed = false;
    pointerActive = false;
    clearTimer();
    if (longPressConsumed) {
      longPressConsumed = false;
      return;
    }
    if (selecting) {
      selecting = false;
      selectAnchorTime = null;
      clearWobble();
      clearOpacityJitter();
      return;
    }
    timelineWrap.releasePointerCapture(e.pointerId);
  });
}





function menuCalendarMonthLabel(date) {
  return `${date.getMonth() + 1}\uC6D4`;
}

function renderMenuCalendar() {
  if (!menuCalendar) return;

  const focusDate = menuCalendarFocusDate();
  const monthStart = menuCalendarVisibleMonthDate();
  const gridStart = addDays(monthStart, -monthStart.getDay());
  const todayKey = dateKeyFromDate(startOfDay(new Date()));
  const selectedKey = dateKeyFromDate(focusDate);
  const renderSignature = `${dateKeyFromDate(monthStart)}|${selectedKey}|${todayKey}`;
  if (menuCalendar.dataset.renderSignature === renderSignature) {
    return;
  }

  const header = document.createElement("div");
  header.className = "menuCalendarHeader";

  const yearLabel = document.createElement("div");
  yearLabel.className = "menuCalendarYearLabel";
  yearLabel.textContent = String(monthStart.getFullYear());
  header.appendChild(yearLabel);

  const nav = document.createElement("div");
  nav.className = "menuCalendarNav";

  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.className = "menuCalendarNavBtn";
  prevBtn.textContent = "<";
  prevBtn.setAttribute("aria-label", "\uC774\uC804\uB2EC \uBCF4\uAE30");
  prevBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    menuCalendarViewDate = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1);
    renderMenuCalendar();
  });
  nav.appendChild(prevBtn);

  const monthLabel = document.createElement("div");
  monthLabel.className = "menuCalendarMonthLabel";
  monthLabel.textContent = menuCalendarMonthLabel(monthStart);
  nav.appendChild(monthLabel);

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "menuCalendarNavBtn";
  nextBtn.textContent = ">";
  nextBtn.setAttribute("aria-label", "\uB2E4\uC74C\uB2EC \uBCF4\uAE30");
  nextBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    menuCalendarViewDate = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
    renderMenuCalendar();
  });
  nav.appendChild(nextBtn);

  header.appendChild(nav);

  const weekdayRow = document.createElement("div");
  weekdayRow.className = "menuCalendarWeekdays";
  WEEKDAY_KR.forEach((weekday) => {
    const cell = document.createElement("div");
    cell.className = "menuCalendarWeekday";
    cell.textContent = weekday;
    weekdayRow.appendChild(cell);
  });

  const grid = document.createElement("div");
  grid.className = "menuCalendarGrid";

  for (let index = 0; index < 42; index += 1) {
    const date = addDays(gridStart, index);
    const key = dateKeyFromDate(date);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "menuCalendarDay";
    button.textContent = String(date.getDate());
    button.dataset.date = key;
    button.setAttribute(
      "aria-label",
      `${date.getMonth() + 1}\uC6D4 ${date.getDate()}\uC77C\uB85C \uC774\uB3D9`
    );
    button.classList.toggle("is-outside", date.getMonth() !== monthStart.getMonth());
    button.classList.toggle("is-weekend", date.getDay() === 0 || date.getDay() === 6);
    button.classList.toggle("is-today", key === todayKey);
    button.classList.toggle("is-selected", key === selectedKey);
    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      menuCalendarViewDate = new Date(date.getFullYear(), date.getMonth(), 1);
      setWeatherDrawerOpen(false);
      focusDateInDayStack(date, { expand: true });
    });
    grid.appendChild(button);
  }

  menuCalendar.replaceChildren(header, weekdayRow, grid);
  menuCalendar.dataset.renderSignature = renderSignature;
}

function shiftMenuCalendarMonth(direction) {
  if (!menuCalendar || !menuOpen) return;
  const step = Number(direction) < 0 ? -1 : 1;
  const baseMonth = menuCalendarVisibleMonthDate();
  menuCalendarViewDate = new Date(baseMonth.getFullYear(), baseMonth.getMonth() + step, 1);
  renderMenuCalendar();
}

function installMenuCalendarWheel() {
  if (!menuCalendar) return;

  menuCalendar.addEventListener(
    "wheel",
    (e) => {
      if (!menuOpen) return;
      if (!Number.isFinite(e.deltaY) || e.deltaY === 0) return;

      e.preventDefault();
      e.stopPropagation();

      const threshold = e.deltaMode === 1 ? 1 : 80;
      menuCalendarWheelDelta += e.deltaY;

      if (menuCalendarWheelResetTimer) {
        clearTimeout(menuCalendarWheelResetTimer);
      }
      menuCalendarWheelResetTimer = window.setTimeout(() => {
        menuCalendarWheelDelta = 0;
        menuCalendarWheelResetTimer = 0;
      }, 140);

      if (Math.abs(menuCalendarWheelDelta) < threshold) return;
      const direction = menuCalendarWheelDelta > 0 ? 1 : -1;
      menuCalendarWheelDelta = 0;
      shiftMenuCalendarMonth(direction);
    },
    { passive: false }
  );
}

function handleViewportResize() {
  if (!todayFocusMode || dayStackOpen || !timelineWrap || !timeline) return;
  const previousScrollTop = Math.max(0, timelineWrap.scrollTop);
  const beforeMinutePx = minutePx;
  recalcSizes();
  if (Math.abs(minutePx - beforeMinutePx) < MINUTE_PX_EPSILON) {
    if (todayFocusHourMode) {
      timelineWrap.scrollTop = clampTodayFocusScrollTop(previousScrollTop);
    } else {
      const maxScroll = Math.max(0, timeline.scrollHeight - timelineWrap.clientHeight);
      timelineWrap.scrollTop = Math.min(previousScrollTop, maxScroll);
    }
    updateTodayFocusRailLayout();
    return;
  }
  buildTimeline();
  if (todayFocusHourMode) {
    timelineWrap.scrollTop = clampTodayFocusScrollTop(previousScrollTop);
  } else {
    const maxScroll = Math.max(0, timeline.scrollHeight - timelineWrap.clientHeight);
    timelineWrap.scrollTop = Math.min(previousScrollTop, maxScroll);
  }
  updateTodayFocusRailLayout();
  updateStickyDay();
  updateTime();
}

function init() {
  userWakeTimePreference = loadPersistedWakeTimePreference();
  userSleepDurationMinutes = loadPersistedSleepDurationPreference();
  updateWakeTimeButton();
  const persistedRefreshView = restorePersistedRefreshViewState();
  buildTimeline();
  void ensureLocalAlarmStoreReady().catch(() => null);
  if (persistedRefreshView && timelineWrap) {
    if (todayFocusHourMode) {
      timelineWrap.scrollTop = clampTodayFocusScrollTop(persistedRefreshView.timelineScrollTop);
    } else {
      const maxScroll = Math.max(0, timeline.scrollHeight - timelineWrap.clientHeight);
      timelineWrap.scrollTop = Math.max(
        0,
        Math.min(maxScroll, persistedRefreshView.timelineScrollTop || 0)
      );
    }
  }
  updateTime();
  setHoverGuideEnabled(true);
  initWeatherStatus();
  initGoogleCalendar();
  updateStickyDay();
  installStatusMenu();
  updateWakeTimeButton();
  setMenuOpen(false);
  installMenuCalendarWheel();
  installDayStackLayerInteractions();
  installTodayFocusInlineInteractions();
  installHoverGuideInteractions();
  installContextBack();
  installDragScroll();
  installWheel();
  if (!persistedRefreshView) {
    previousViewState = null;
    setTodayFocusMode(true, { rebuildTimeline: false });
    setTodayFocusHourMode(false);
    startDate = startOfDay(new Date());
    buildTimeline();
    if (timelineWrap) {
      timelineWrap.scrollTop = 0;
    }
    updateStickyDay();
    updateTime();
    updateTodayFocusRailLayout();
    persistRefreshViewState();
  } else {
    updateTodayFocusRailLayout();
    persistRefreshViewState();
  }
  maybeOpenWakeTimePreferencePromptOnInit();
  dateLabel.addEventListener("click", scrollToNow);
  window.addEventListener("resize", handleViewportResize);
  window.addEventListener("pagehide", persistRefreshViewState);

  timelineWrap.addEventListener("scroll", () => {
    if (todayFocusMode && todayFocusHourMode && !dayStackOpen) {
      enforceTodayFocusScrollBounds();
    }
    if (!dayStackOpen && !pointerActive) {
      maybeShiftWindow();
    }
    if (todayFocusMode) {
      updateTodayFocusRailLayout();
      updateNowLine(new Date());
    }
    if (!dayStackOpen) {
      updateStickyDay();
    }
    if (hoverGuideEnabled && hoverPointerInside) {
      updateHoverGuideFromClientY(hoverPointerClientY);
    } else if (dayStackOpen) {
      hideHoverGuide();
    }
  });

  setInterval(updateTime, 1000);
}

init();
