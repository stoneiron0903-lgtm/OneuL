const BASE_MINUTE_PX = 0.5;
const ZOOM_MINUTE_PX = 4.0;
const DAY_BAR_HEIGHT = 24;
const DAYS_BEFORE = 1;
const DAYS_AFTER = 1;
const TOTAL_DAYS = DAYS_BEFORE + DAYS_AFTER + 1;
const DAY_MINUTES = 24 * 60;
const NOW_OFFSET = DAY_BAR_HEIGHT + 17;
const SELECTION_SPREAD_MS = 200;
const OPACITY_JITTER_MS = 90;
const OPACITY_IDLE_MS = 140;
const OPACITY_JITTER_MIN = 0.5;
const OPACITY_JITTER_MAX = 0.8;

let minutePx = BASE_MINUTE_PX;
let dayBlockHeight = DAY_BAR_HEIGHT + DAY_MINUTES * minutePx;
let hourHeight = 60 * minutePx;

const timelineWrap = document.getElementById("timelineWrap");
const timeline = document.getElementById("timeline");
const dateLabel = document.getElementById("dateLabel");
const timeLabel = document.getElementById("timeLabel");
const stickyDay = document.getElementById("stickyDay");
const nowLine = document.getElementById("nowLine");
const nowText = nowLine.querySelector(".timeText");

let startDate = addDays(startOfDay(new Date()), -DAYS_BEFORE);
let shifting = false;
let lastScrollTop = 0;
let selectedDateTime = null;
let selectedX = 0;
let selectionMarker = null;
let selectionBar = null;
let selectionLine = null;
let selectAnchorTime = null;
let selectAnchorY = 0;
let selectAnchorX = 0;
const alarms = [];
let zoomAnimToken = 0;
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

function recalcSizes() {
  dayBlockHeight = DAY_BAR_HEIGHT + DAY_MINUTES * minutePx;
  hourHeight = 60 * minutePx;
}

function setMinutePx(value, anchorDateTime, anchorClientY) {
  if (minutePx === value) return;
  const rect = timelineWrap.getBoundingClientRect();
  const timelineOffset = timeline.offsetTop;
  const anchorOffset =
    typeof anchorClientY === "number"
      ? anchorClientY - rect.top
      : timelineWrap.clientHeight / 2;
  const anchor = anchorDateTime || selectedDateTime || new Date();
  minutePx = value;
  recalcSizes();
  buildTimeline();
  const dayIndex = diffDays(startOfDay(anchor), startDate);
  const minutes = anchor.getHours() * 60 + anchor.getMinutes() + anchor.getSeconds() / 60;
  const y =
    dayIndex * dayBlockHeight +
    DAY_BAR_HEIGHT +
    minutes * minutePx;
  timelineWrap.scrollTop = Math.max(0, timelineOffset + y - anchorOffset);
  updateStickyDay();
  updateTime();
}

function animateMinutePx(value, anchorDateTime, anchorClientY) {
  if (minutePx === value) return;
  const from = minutePx;
  const to = value;
  if (from === to) {
    timelineWrap.classList.toggle("zooming", value === ZOOM_MINUTE_PX);
    return;
  }
  const start = performance.now();
  const zoomingIn = to > from;
  const duration = zoomingIn ? 90 : 0;
  zoomAnimToken += 1;
  const token = zoomAnimToken;
  timelineWrap.classList.toggle("zooming", zoomingIn);

  const step = (now) => {
    if (token !== zoomAnimToken) return;
    const t = Math.min(1, (now - start) / duration);
    const eased = t * t * (3 - 2 * t);
    const next = from + (to - from) * eased;
    setMinutePx(next, anchorDateTime, anchorClientY);
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      if (!zoomingIn) {
        timelineWrap.classList.remove("zooming");
      }
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

function formatDateParts(date) {
  return {
    date: `${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`,
    weekday: WEEKDAY_KR[date.getDay()],
  };
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
    const cb = modalOnConfirm;
    const value =
      modalInput && modalInput.style.display !== "none" ? modalInput.value : null;
    hideModal();
    if (cb) cb(value);
  });
  modalCancelBtn.addEventListener("click", () => {
    const cb = modalOnCancel;
    hideModal();
    if (cb) cb();
  });
  modalOverlay.addEventListener("click", (e) => {
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
}

function showConfirm(message, onConfirm, onCancel) {
  showModal({
    title: "\uC608\uC57D \uD655\uC778",
    message,
    confirmText: "\uD655\uC778",
    cancelText: "\uCDE8\uC18C",
    showCancel: true,
    onConfirm,
    onCancel,
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
  if (dayIndex < 0 || dayIndex >= TOTAL_DAYS) {
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
  const y =
    dayIndex * dayBlockHeight +
    DAY_BAR_HEIGHT +
    minutes * minutePx;
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

function renderAlarms() {
  timeline.querySelectorAll(".alarm-line").forEach((line) => line.remove());
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
    label.textContent = title ? `${timeText} \u00b7 ${title}` : timeText;
    line.appendChild(label);
    timeline.appendChild(line);
  });
}


function buildTimeline() {
  timeline.style.height = `${TOTAL_DAYS * dayBlockHeight}px`;
  timeline.innerHTML = "";
  timeline.appendChild(nowLine);
  buildHourLines();
  buildDayBars();
  renderAlarms();
}

function buildHourLines() {
  const totalHours = TOTAL_DAYS * 24;
  for (let h = 0; h <= totalHours; h += 1) {
    const dayIndex = Math.floor(h / 24);
    const hourInDay = h % 24;
    const y = dayIndex * dayBlockHeight + DAY_BAR_HEIGHT + hourInDay * 60 * minutePx;

    const label = document.createElement("div");
    label.className = "hour-label";
    label.style.top = `${y}px`;
    label.textContent = `${pad2(hourInDay)}:00`;
    timeline.appendChild(label);

    const line = document.createElement("div");
    line.className = "hour-line";
    line.style.top = `${y}px`;
    timeline.appendChild(line);

    if (h !== 0 && h !== totalHours) {
      const half = document.createElement("div");
      half.className = "half-line";
      half.style.top = `${y + 30 * minutePx}px`;
      timeline.appendChild(half);
    }
  }
}

function buildDayBars() {
  for (let i = 0; i < TOTAL_DAYS; i += 1) {
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
}

function updateStickyDay() {
  const scrollTop = timelineWrap.scrollTop;
  const probeOffset = 0;
  const dayIndex = currentDayIndex(probeOffset);
  let displayIndex = dayIndex;
  const barTop = DAY_BAR_HEIGHT + dayIndex * dayBlockHeight - scrollTop;
  if (barTop >= 0 && barTop <= DAY_BAR_HEIGHT) {
    displayIndex = Math.min(dayIndex + 1, TOTAL_DAYS - 1);
  }
  const date = addDays(startDate, displayIndex);
  const parts = formatDateParts(date);
  stickyDay.innerHTML = `<span class="date">${parts.date}</span><span class="weekday"> ${parts.weekday}</span>`;
  stickyDay.classList.add("special-day");
  stickyDay.style.transform = "translateY(0)";
  stickyDay.style.display = "flex";
  stickyDay.style.visibility = "visible";

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

  const bars = timeline.querySelectorAll(".day-bar");
  bars.forEach((bar) => {
    bar.style.opacity = "1";
  });
  updateSelectionMarker();
  renderAlarms();
  lastScrollTop = scrollTop;
}

function updateTime() {
  const now = new Date();
  if (timeLabel) {
    timeLabel.textContent = formatTime(now);
  }
  updateNowLine(now);
}

function updateNowLine(now) {
  const today = startOfDay(now);
  const dayIndex = diffDays(today, startDate);
  if (dayIndex < 0 || dayIndex >= TOTAL_DAYS) {
    nowLine.style.display = "none";
    return;
  }
  nowLine.style.display = "block";
  const minutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const y =
    dayIndex * dayBlockHeight +
    DAY_BAR_HEIGHT +
    minutes * minutePx;
  nowLine.style.top = `${y}px`;
  nowText.textContent = now.toTimeString().slice(0, 8);
}

function minutesForY(y) {
  if (y <= 0) return 0;
  const block = dayBlockHeight;
  const dayIndex = Math.floor(y / block);
  const within = y - dayIndex * block;
  if (within <= DAY_BAR_HEIGHT) return dayIndex * DAY_MINUTES;
  return dayIndex * DAY_MINUTES + (within - DAY_BAR_HEIGHT) / minutePx;
}

function currentDayIndex(offset) {
  const probe = timelineWrap.scrollTop + offset;
  const minutes = minutesForY(probe);
  const idx = Math.floor(minutes / DAY_MINUTES);
  return Math.max(0, Math.min(TOTAL_DAYS - 1, idx));
}

function maybeShiftWindow() {
  if (shifting) return;
  const bottomProbe = timelineWrap.scrollTop + timelineWrap.clientHeight - 1;
  const bottomIdx = Math.floor(minutesForY(bottomProbe) / DAY_MINUTES);
  if (timelineWrap.scrollTop <= 2) {
    shifting = true;
    startDate = addDays(startDate, -1);
    timelineWrap.scrollTop += dayBlockHeight;
    renderDayBars();
    updateStickyDay();
    updateTime();
    shifting = false;
  } else if (bottomIdx >= TOTAL_DAYS - 1) {
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
  timelineWrap.addEventListener(
    "wheel",
    (e) => {
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
  startDate = addDays(today, -DAYS_BEFORE);
  renderDayBars();
  const now = new Date();
  const dayIndex = diffDays(today, startDate);
  const minutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const y =
    dayIndex * dayBlockHeight +
    DAY_BAR_HEIGHT +
    minutes * minutePx;
  timelineWrap.scrollTop = Math.max(0, y - NOW_OFFSET);
  updateStickyDay();
  updateNowLine(now);
}

function installDragScroll() {
  let pressed = false;
  let dragging = false;
  let selecting = false;
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
    const alarmEl = hit.closest(".alarm-line");
    if (!alarmEl) return null;
    const stamp = alarmEl.dataset.timestamp;
    if (!stamp) return null;
    const ts = Number(stamp);
    if (!Number.isFinite(ts)) return null;
    const title = alarmEl.dataset.title || "";
    return { time: new Date(ts), title };
  }

  timelineWrap.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    if (inertiaId) {
      cancelAnimationFrame(inertiaId);
      inertiaId = null;
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
    clearTimer();
    pressTimer = setTimeout(() => {
      if (!pressed) return;
      const result = dateTimeFromPointer(pressX, pressY);
      if (isPastSelection(result.dateTime)) {
        showAlert("\uD604\uC7AC \uC2DC\uAC04 \uC774\uD6C4\uBD80\uD130 \uC124\uC815\uD560 \uC218 \uC788\uC5B4\uC694.");
        selecting = false;
        dragging = false;
        hideSelectionElements();
        return;
      }
      selecting = true;
      dragging = false;
      selectAnchorTime = result.dateTime;
      selectAnchorY = pressY;
      selectAnchorX = result.x;
      selectedDateTime = result.dateTime;
      selectedX = result.x;
      animateMinutePx(ZOOM_MINUTE_PX, selectAnchorTime, pressY);
      updateSelectionMarker();
    }, 300);
    timelineWrap.setPointerCapture(e.pointerId);
  });

  timelineWrap.addEventListener("pointermove", (e) => {
    if (!pressed) return;
    if (selecting) {
      updateSelectionFromAnchor(e.clientX, e.clientY);
      triggerWobble();
      noteOpacityActivity();
      return;
    }
    if (pressTimer) {
      const dx = e.clientX - pressX;
      const dyPress = e.clientY - pressY;
      if (Math.hypot(dx, dyPress) > 6) {
        clearTimer();
        dragging = true;
      }
    }
    if (!dragging) return;
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
    if (selecting) {
      selecting = false;
      selectAnchorTime = null;
      clearWobble();
      clearOpacityJitter();
      if (selectedDateTime) {
        const alarmTime = new Date(selectedDateTime.getTime());
        const label = formatDateTimeKorean(
          alarmTime,
          alarmTime.getHours(),
          alarmTime.getMinutes(),
          alarmTime.getSeconds()
        );
        if (isPastSelection(alarmTime)) {
          showAlert("\uD604\uC7AC \uC2DC\uAC04 \uC774\uD6C4\uBD80\uD130 \uC124\uC815\uD560 \uC218 \uC788\uC5B4\uC694.");
          hideSelectionElements();
        } else {
          showConfirm(
            `${label}\uC5D0 \uC54C\uB78C\uC744 \uB9CC\uB4E4\uAE4C\uC694?`,
            () => {
              showPrompt(
                "\uC81C\uBAA9\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.",
                (value) => {
                  const title = typeof value === "string" ? value.trim() : "";
                  alarms.push({ time: new Date(alarmTime.getTime()), title });
                  renderAlarms();
                  hideSelectionElements();
                },
                {
                  onCancel: hideSelectionElements,
                }
              );
            },
            hideSelectionElements
          );
        }
      }
      return;
    }
    const alarm = alarmFromPointer(e.clientX, e.clientY);
    if (alarm) {
      showAlert(`\uC608\uC57D \uD655\uC778: ${formatAlarmInfo(alarm)}`);
      return;
    }
    if (!dragging) return;
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
    const result = dateTimeFromPointer(e.clientX, e.clientY);
    const isZoomed = Math.abs(minutePx - ZOOM_MINUTE_PX) < 0.001;
    const target = isZoomed ? BASE_MINUTE_PX : ZOOM_MINUTE_PX;
    animateMinutePx(target, result.dateTime, e.clientY);
    e.preventDefault();
  });

  timelineWrap.addEventListener("pointerleave", (e) => {
    if (!pressed) return;
    pressed = false;
    pointerActive = false;
    clearTimer();
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





function init() {
  buildTimeline();
  updateTime();
  updateStickyDay();
  installDragScroll();
  installWheel();
  dateLabel.addEventListener("click", scrollToNow);

  timelineWrap.addEventListener("scroll", () => {
    if (!pointerActive) {
      maybeShiftWindow();
    }
    updateStickyDay();
  });

  setInterval(updateTime, 1000);
}

init();
