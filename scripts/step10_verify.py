from __future__ import annotations

import json

from step7_verify import wait_until
from verify_artifacts import proof_path, write_named_json_report
from verify_cdp_support import APP_URL, attach_new_page, open_browser_connection, wait_for_app_ready

def install_page(session) -> None:
    wait_for_app_ready(
        session,
        required_ids=("statusBar", "timelineWrap", "dayStackLayer"),
        timeout=30.0,
    )


def main() -> int:
    with open_browser_connection() as (_, browser_session):
        session = attach_new_page(browser_session, APP_URL)
        install_page(session)

        results: dict[str, object] = {
            "pass": False,
            "issues": [],
            "proof_files": [],
        }

        refresh_shot = proof_path("verify-step10-refresh-view.png")
        inline_shot = proof_path("verify-step10-inline-editor.png")
        keyboard_shot = proof_path("verify-step10-keyboard-month-rail.png")
        zoom_shot = proof_path("verify-step10-zoom-backflow.png")
        dblclick_readable_shot = proof_path("verify-step10-dblclick-readable-zoom.png")
        time_axis_shot = proof_path("verify-step10-time-axis.png")

        refresh_state_before = session.evaluate(
            """
            (() => {
              setDayStackOpen(false);
              setTodayFocusMode(true, { rebuildTimeline: false });
              const anchorY = timelineWrap.getBoundingClientRect().top + timelineWrap.clientHeight / 2;
              setMinutePx(ZOOM_MINUTE_PX, null, anchorY);
              timelineWrap.scrollTop = 123;
              persistRefreshViewState();
              return {
                todayFocusMode,
                dayStackOpen,
                minutePx,
                scrollTop: timelineWrap.scrollTop
              };
            })()
            """
        )
        session.call_session("Page.reload", {"ignoreCache": True}, timeout=20.0)
        install_page(session)
        refresh_ok = wait_until(
            session,
            """
            (() => Boolean(
              todayFocusMode &&
              !dayStackOpen &&
              Math.abs(minutePx - ZOOM_MINUTE_PX) < 0.01 &&
              timelineWrap &&
              timelineWrap.scrollTop > 0
            ))()
            """,
            timeout=10.0,
            interval=0.1,
        )
        refresh_state_after = session.evaluate(
            """
            (() => ({
              todayFocusMode,
              dayStackOpen,
              minutePx,
              scrollTop: timelineWrap ? timelineWrap.scrollTop : 0
            }))()
            """
        )
        session.screenshot(refresh_shot)
        results["proof_files"].append(refresh_shot.name)
        if not refresh_ok:
            results["issues"].append("refresh_view_restore_failed")

        time_axis_state = session.evaluate(
            """
            (async () => {
              const approxEqual = (a, b, tolerance = 0.01) =>
                Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tolerance;
              const readTimelineRows = () => {
                const labels = Array.from(document.querySelectorAll("#timeline > .hour-label"));
                const lines = Array.from(document.querySelectorAll("#timeline > .hour-line"));
                return ["00:00", "01:00", "24:00"].map((text) => {
                  const label = labels.find((node) => (node.textContent || "").trim() === text);
                  const labelTop = label ? Number.parseFloat(label.style.top || "") : NaN;
                  const line = lines.find((node) => {
                    const lineTop = Number.parseFloat(node.style.top || "");
                    return approxEqual(lineTop, labelTop);
                  });
                  return {
                    text,
                    labelTop,
                    lineTop: line ? Number.parseFloat(line.style.top || "") : NaN,
                    aligned: Boolean(line),
                  };
                });
              };
              const rowsOk = (rows) =>
                rows.length === 3 &&
                rows.every((row) => row.aligned !== false && Number.isFinite(row.labelTop)) &&
                approxEqual(rows[0].labelTop, dayTimeAxisPadding()) &&
                approxEqual(rows[2].labelTop - rows[0].labelTop, DAY_MINUTES * minutePx);

              setDayStackOpen(false);
              setTodayFocusMode(true, { rebuildTimeline: false });
              setTodayFocusHourMode(false);
              buildTimeline();
              const timelineRows = readTimelineRows();
              const timelineBottomSpace = dayBlockHeight - timelineRows[2].labelTop;
              const timelineOk = rowsOk(timelineRows) && approxEqual(timelineBottomSpace, dayTimeAxisPadding());

              focusDateInDayStack(startOfDay(new Date()), { expand: true });
              await new Promise((resolve) => setTimeout(resolve, 700));
              const body = document.querySelector(".dayStackItem.expanded .dayStackBody");
              const bodyHeight = body ? Number.parseFloat(getComputedStyle(body).height || "") : NaN;
              const stackRows = Array.from(
                document.querySelectorAll(".dayStackItem.expanded .dayStackHourLabel")
              )
                .map((label) => {
                  const text = (label.textContent || "").trim();
                  if (!["00:00", "01:00", "24:00"].includes(text)) return null;
                  return { text, labelTop: Number.parseFloat(label.style.top || "") };
                })
                .filter(Boolean);
              const stackBottomSpace =
                stackRows.length >= 3 && Number.isFinite(bodyHeight)
                  ? bodyHeight - stackRows[2].labelTop
                  : NaN;
              const stackOk =
                stackRows.length === 3 &&
                approxEqual(stackRows[0].labelTop, dayTimeAxisPadding()) &&
                approxEqual(stackRows[2].labelTop - stackRows[0].labelTop, DAY_MINUTES * minutePx) &&
                approxEqual(stackBottomSpace, dayTimeAxisPadding());
              return {
                timeline: {
                  rows: timelineRows,
                  bottomSpace: timelineBottomSpace,
                  ok: timelineOk,
                },
                dayStack: {
                  rows: stackRows,
                  bodyHeight,
                  bottomSpace: stackBottomSpace,
                  ok: stackOk,
                },
                minutePx,
                dayTimeAxisPadding: dayTimeAxisPadding(),
                ok: timelineOk && stackOk,
              };
            })()
            """,
            timeout=20.0,
        )
        session.screenshot(time_axis_shot)
        results["proof_files"].append(time_axis_shot.name)
        if not time_axis_state or not time_axis_state.get("ok"):
            results["issues"].append("time_axis_alignment_failed")

        inline_state = session.evaluate(
            """
            (() => {
              const now = new Date();
              const today = startOfDay(now);
              const todayKey = dateKeyFromDate(today);
              const draftTime = new Date(now.getTime());
              draftTime.setHours(Math.min(23, now.getHours() + 1), 25, 0, 0);
              focusDateInDayStack(today, { expand: true });
              openInlineEditorForDateKey(todayKey, draftTime);
              return {
                todayKey,
                draftTime: draftTime.toISOString(),
                cardVisible: Boolean(document.querySelector(".dayStackInlineEditorCard"))
              };
            })()
            """
        )
        inline_card_ok = wait_until(
            session,
            '(() => Boolean(document.querySelector(".dayStackInlineEditorCard .dayStackInlineEditorTitle")))()',
            timeout=10.0,
            interval=0.1,
        )
        inline_step_advanced = session.evaluate(
            """
            (() => {
              const input = document.querySelector(".dayStackInlineEditorTitle");
              if (!(input instanceof HTMLInputElement)) return false;
              input.focus();
              input.value = "Step10 Inline";
              input.dispatchEvent(new Event("input", { bubbles: true }));
              const confirmBtn = document.querySelector('[data-inline-editor-action="confirm"]');
              if (!(confirmBtn instanceof HTMLButtonElement)) return false;
              confirmBtn.click();
              return true;
            })()
            """
        )
        step_ok = wait_until(
            session,
            "(() => typeof dayStackInlineEditorStep === 'function' && dayStackInlineEditorStep() === 1)()",
            timeout=10.0,
            interval=0.1,
        )
        session.screenshot(inline_shot)
        results["proof_files"].append(inline_shot.name)
        inline_cancel_ok = session.evaluate(
            """
            (async () => {
              const cancelBtn = document.querySelector('[data-inline-editor-action="cancel"]');
              if (!(cancelBtn instanceof HTMLButtonElement)) return false;
              cancelBtn.click();
              await new Promise((resolve) => setTimeout(resolve, 250));
              return !document.querySelector(".dayStackInlineEditorCard");
            })()
            """,
            timeout=20.0,
        )
        if not inline_card_ok or not inline_step_advanced or not step_ok or not inline_cancel_ok:
            results["issues"].append("inline_editor_flow_failed")

        keyboard_state = session.evaluate(
            """
            (() => {
              focusDateInDayStack(startOfDay(new Date()), { expand: true });
              const rail = document.querySelector(".dayStackMonthRail");
              const monthGroup = rail ? rail.closest(".dayStackMonthGroup[data-month]") : null;
              const monthKey =
                monthGroup && monthGroup.dataset && typeof monthGroup.dataset.month === "string"
                  ? monthGroup.dataset.month
                  : "";
              if (!(rail instanceof HTMLElement) || !monthKey) return { exists: false };
              rail.focus();
              return {
                exists: true,
                monthKey,
                expanded: rail.getAttribute("aria-expanded") || null,
              };
            })()
            """
        )
        keyboard_target_month = str(keyboard_state.get("monthKey") or "")
        keyboard_open_triggered = False
        keyboard_open_state = {"expanded": None, "month": ""}
        keyboard_close_triggered = False
        keyboard_close_state = {"expanded": None, "month": ""}
        if keyboard_target_month:
            keyboard_target_literal = json.dumps(keyboard_target_month)
            keyboard_open_triggered = bool(
                session.evaluate(
                    f"""
                    (() => {{
                      const monthKey = {keyboard_target_literal};
                      const rail = document.querySelector(`.dayStackMonthGroup[data-month="${{monthKey}}"] .dayStackMonthRail`);
                      if (!(rail instanceof HTMLElement)) return false;
                      rail.focus();
                      rail.dispatchEvent(new KeyboardEvent("keydown", {{ key: "Enter", bubbles: true, cancelable: true }}));
                      return true;
                    }})()
                    """
                )
            )
            keyboard_open_ok = wait_until(
                session,
                f"""
                (() => {{
                  const monthKey = {keyboard_target_literal};
                  const rail = document.querySelector(`.dayStackMonthGroup[data-month="${{monthKey}}"] .dayStackMonthRail`);
                  return Boolean(
                    rail &&
                    rail.getAttribute("aria-expanded") === "true" &&
                    dayStackExpandedMonthKey === monthKey
                  );
                }})()
                """,
                timeout=10.0,
                interval=0.1,
            )
            keyboard_open_state = session.evaluate(
                f"""
                (() => {{
                  const monthKey = {keyboard_target_literal};
                  const rail = document.querySelector(`.dayStackMonthGroup[data-month="${{monthKey}}"] .dayStackMonthRail`);
                  return {{
                    expanded: rail ? rail.getAttribute("aria-expanded") || null : null,
                    month: dayStackExpandedMonthKey || ""
                  }};
                }})()
                """
            )
            keyboard_close_triggered = bool(
                session.evaluate(
                    f"""
                    (() => {{
                      const monthKey = {keyboard_target_literal};
                      const rail = document.querySelector(`.dayStackMonthGroup[data-month="${{monthKey}}"] .dayStackMonthRail`);
                      if (!(rail instanceof HTMLElement)) return false;
                      rail.focus();
                      rail.dispatchEvent(
                        new KeyboardEvent("keydown", {{
                          key: " ",
                          code: "Space",
                          bubbles: true,
                          cancelable: true
                        }})
                      );
                      return true;
                    }})()
                    """
                )
            )
            keyboard_close_ok = wait_until(
                session,
                f"""
                (() => {{
                  const monthKey = {keyboard_target_literal};
                  const rail = document.querySelector(`.dayStackMonthGroup[data-month="${{monthKey}}"] .dayStackMonthRail`);
                  return Boolean(
                    rail &&
                    rail.getAttribute("aria-expanded") === "false" &&
                    !dayStackExpandedMonthKey
                  );
                }})()
                """,
                timeout=10.0,
                interval=0.1,
            )
            keyboard_close_state = session.evaluate(
                f"""
                (() => {{
                  const monthKey = {keyboard_target_literal};
                  const rail = document.querySelector(`.dayStackMonthGroup[data-month="${{monthKey}}"] .dayStackMonthRail`);
                  return {{
                    expanded: rail ? rail.getAttribute("aria-expanded") || null : null,
                    month: dayStackExpandedMonthKey || ""
                  }};
                }})()
                """
            )
        else:
            keyboard_open_ok = False
            keyboard_close_ok = False
        session.screenshot(keyboard_shot)
        results["proof_files"].append(keyboard_shot.name)
        if (
            not keyboard_state.get("exists")
            or not keyboard_open_triggered
            or not keyboard_close_triggered
            or not keyboard_open_ok
            or not keyboard_close_ok
        ):
            results["issues"].append("keyboard_month_rail_failed")

        zoom_prepare = session.evaluate(
            """
            (() => {
              focusDateInDayStack(startOfDay(new Date()), { expand: true });
              const anchorY = dayStackLayer.getBoundingClientRect().top + dayStackLayer.clientHeight / 2;
              setMinutePx(MAX_ZOOM_MINUTE_PX, null, anchorY);
              return {
                minutePx,
                zoom: MAX_ZOOM_MINUTE_PX,
                base: BASE_MINUTE_PX,
                half: ZOOM_MINUTE_PX,
                todayFocusMode,
                dayStackOpen
              };
            })()
            """
        )
        zoom_step1 = session.evaluate(
            """
            (() => {
              const wrap = document.getElementById("dayStackLayer");
              const rect = wrap.getBoundingClientRect();
              const ev = new MouseEvent("contextmenu", {
                bubbles: true,
                cancelable: true,
                button: 2,
                buttons: 2,
                clientX: rect.left + rect.width * 0.5,
                clientY: rect.top + rect.height * 0.5,
              });
              wrap.dispatchEvent(ev);
              return true;
            })()
            """
        )
        zoom_half_ok = wait_until(
            session,
            """
            (() => Math.abs(minutePx - ZOOM_MINUTE_PX) < 0.01 && dayStackOpen)()
            """,
            timeout=10.0,
            interval=0.1,
        )
        session.evaluate(
            """
            (async () => {
              await new Promise((resolve) => setTimeout(resolve, 430));
              return true;
            })()
            """,
            timeout=10.0,
        )
        session.evaluate(
            """
            (() => {
              const wrap = document.getElementById("dayStackLayer");
              const rect = wrap.getBoundingClientRect();
              const ev = new MouseEvent("contextmenu", {
                bubbles: true,
                cancelable: true,
                button: 2,
                buttons: 2,
                clientX: rect.left + rect.width * 0.5,
                clientY: rect.top + rect.height * 0.5,
              });
              wrap.dispatchEvent(ev);
              return true;
            })()
            """
        )
        zoom_base_ok = wait_until(
            session,
            """
            (() => Math.abs(minutePx - BASE_MINUTE_PX) < 0.01 && dayStackOpen)()
            """,
            timeout=10.0,
            interval=0.1,
        )
        context_double_right_click_state = session.evaluate(
            """
            (async () => {
              await new Promise((resolve) => setTimeout(resolve, 430));
              focusDateInDayStack(startOfDay(new Date()), { expand: true });
              const anchorY = dayStackLayer.getBoundingClientRect().top + dayStackLayer.clientHeight / 2;
              setMinutePx(MAX_ZOOM_MINUTE_PX, null, anchorY);
              await new Promise((resolve) => setTimeout(resolve, 80));
              const before = minutePx;
              const wrap = document.getElementById("dayStackLayer");
              const rect = wrap.getBoundingClientRect();
              const eventInit = {
                bubbles: true,
                cancelable: true,
                button: 2,
                buttons: 2,
                clientX: rect.left + rect.width * 0.5,
                clientY: rect.top + rect.height * 0.5,
              };
              wrap.dispatchEvent(new MouseEvent("contextmenu", eventInit));
              wrap.dispatchEvent(new MouseEvent("contextmenu", eventInit));
              await new Promise((resolve) => setTimeout(resolve, 250));
              return {
                before,
                after: minutePx,
                expected: ZOOM_MINUTE_PX,
                ok: Math.abs(minutePx - ZOOM_MINUTE_PX) < 0.01 && dayStackOpen,
              };
            })()
            """,
            timeout=20.0,
        )
        zoom_render_budget_state = session.evaluate(
            """
            (async () => {
              await new Promise((resolve) => setTimeout(resolve, 430));
              focusDateInDayStack(startOfDay(new Date()), { expand: true });
              const anchorY = dayStackLayer.getBoundingClientRect().top + dayStackLayer.clientHeight / 2;
              setMinutePx(BASE_MINUTE_PX, null, anchorY);
              await new Promise((resolve) => setTimeout(resolve, 80));

              const originalBuildTimeline = buildTimeline;
              const originalRenderDayStack = renderDayStack;
              let buildTimelineCount = 0;
              let renderDayStackCount = 0;
              buildTimeline = function (...args) {
                buildTimelineCount += 1;
                return originalBuildTimeline.apply(this, args);
              };
              renderDayStack = function (...args) {
                renderDayStackCount += 1;
                return originalRenderDayStack.apply(this, args);
              };
              const startedAt = performance.now();
              try {
                animateMinutePx(MAX_ZOOM_MINUTE_PX, new Date(), anchorY);
                for (let attempt = 0; attempt < 40; attempt += 1) {
                  if (Math.abs(minutePx - MAX_ZOOM_MINUTE_PX) < 0.01) break;
                  await new Promise((resolve) => setTimeout(resolve, 25));
                }
              } finally {
                buildTimeline = originalBuildTimeline;
                renderDayStack = originalRenderDayStack;
              }
              const elapsedMs = performance.now() - startedAt;
              return {
                buildTimelineCount,
                renderDayStackCount,
                elapsedMs,
                renderStepBudget: ZOOM_ANIMATION_RENDER_STEPS,
                singleRenderBudget: ZOOM_ANIMATION_RENDER_STEPS === 1,
                fastStackRefresh: buildTimelineCount === 0 && renderDayStackCount === 0,
                minutePx,
                ok:
                  Math.abs(minutePx - MAX_ZOOM_MINUTE_PX) < 0.01 &&
                  ZOOM_ANIMATION_RENDER_STEPS === 1 &&
                  buildTimelineCount === 0 &&
                  renderDayStackCount === 0,
              };
            })()
            """,
            timeout=20.0,
        )
        today_focus_render_budget_state = session.evaluate(
            """
            (async () => {
              setDayStackOpen(false);
              setTodayFocusMode(true);
              const anchorY = timelineWrap.getBoundingClientRect().top + timelineWrap.clientHeight / 2;
              setMinutePx(BASE_MINUTE_PX, null, anchorY);
              buildTimeline();
              await new Promise((resolve) => setTimeout(resolve, 80));

              const originalBuildTimeline = buildTimeline;
              const originalRenderDayStack = renderDayStack;
              const originalBuildHourLines = buildHourLines;
              const originalRenderAlarms = renderAlarms;
              let buildTimelineCount = 0;
              let renderDayStackCount = 0;
              let buildHourLinesCount = 0;
              let renderAlarmsCount = 0;
              buildTimeline = function (...args) {
                buildTimelineCount += 1;
                return originalBuildTimeline.apply(this, args);
              };
              renderDayStack = function (...args) {
                renderDayStackCount += 1;
                return originalRenderDayStack.apply(this, args);
              };
              buildHourLines = function (...args) {
                buildHourLinesCount += 1;
                return originalBuildHourLines.apply(this, args);
              };
              renderAlarms = function (...args) {
                renderAlarmsCount += 1;
                return originalRenderAlarms.apply(this, args);
              };
              const startedAt = performance.now();
              try {
                animateMinutePx(ZOOM_MINUTE_PX, new Date(), anchorY);
                for (let attempt = 0; attempt < 40; attempt += 1) {
                  if (Math.abs(minutePx - ZOOM_MINUTE_PX) < 0.01) break;
                  await new Promise((resolve) => setTimeout(resolve, 25));
                }
              } finally {
                buildTimeline = originalBuildTimeline;
                renderDayStack = originalRenderDayStack;
                buildHourLines = originalBuildHourLines;
                renderAlarms = originalRenderAlarms;
              }
              const elapsedMs = performance.now() - startedAt;
              return {
                buildTimelineCount,
                renderDayStackCount,
                buildHourLinesCount,
                renderAlarmsCount,
                elapsedMs,
                fastTodayFocusRefresh:
                  buildTimelineCount === 0 &&
                  renderDayStackCount === 0 &&
                  buildHourLinesCount <= ZOOM_ANIMATION_RENDER_STEPS &&
                  renderAlarmsCount <= ZOOM_ANIMATION_RENDER_STEPS,
                minutePx,
                ok:
                  todayFocusMode &&
                  !dayStackOpen &&
                  Math.abs(minutePx - ZOOM_MINUTE_PX) < 0.01 &&
                  buildTimelineCount === 0 &&
                  renderDayStackCount === 0 &&
                  buildHourLinesCount <= ZOOM_ANIMATION_RENDER_STEPS &&
                  renderAlarmsCount <= ZOOM_ANIMATION_RENDER_STEPS,
              };
            })()
            """,
            timeout=20.0,
        )
        alarm_node_reuse_state = session.evaluate(
            """
            (async () => {
              const title = "Step10 Node Reuse";
              const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
              const removeTestAlarms = () => {
                for (let index = alarms.length - 1; index >= 0; index -= 1) {
                  const alarm = alarms[index];
                  if (alarm && !(alarm instanceof Date) && alarm.title === title) {
                    alarms.splice(index, 1);
                  }
                }
              };
              const waitForMinutePx = async (target) => {
                for (let attempt = 0; attempt < 40; attempt += 1) {
                  if (Math.abs(minutePx - target) < 0.01) return true;
                  await delay(25);
                }
                return Math.abs(minutePx - target) < 0.01;
              };

              removeTestAlarms();
              const today = startOfDay(new Date());
              const alarmTime = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate(),
                9,
                45,
                0,
                0
              );
              alarms.push({ time: alarmTime, title });

              focusDateInDayStack(today, { expand: true });
              let stackRect = dayStackLayer.getBoundingClientRect();
              setMinutePx(BASE_MINUTE_PX, null, stackRect.top + stackRect.height / 2);
              renderDayStackAlarms();
              await delay(80);
              const dayBefore = document.querySelector(
                `#dayStackLayer .dayStackAlarmLine[data-title="${title}"]`
              );
              animateMinutePx(ZOOM_MINUTE_PX, alarmTime, stackRect.top + stackRect.height / 2);
              const dayZoomed = await waitForMinutePx(ZOOM_MINUTE_PX);
              const dayAfter = document.querySelector(
                `#dayStackLayer .dayStackAlarmLine[data-title="${title}"]`
              );

              setDayStackOpen(false);
              setTodayFocusMode(true);
              const wrapRect = timelineWrap.getBoundingClientRect();
              setMinutePx(BASE_MINUTE_PX, null, wrapRect.top + wrapRect.height / 2);
              buildTimeline();
              renderAlarms();
              await delay(80);
              const todayBefore = document.querySelector(
                `#timeline > .dayStackAlarmLine[data-title="${title}"]`
              );
              animateMinutePx(ZOOM_MINUTE_PX, alarmTime, wrapRect.top + wrapRect.height / 2);
              const todayZoomed = await waitForMinutePx(ZOOM_MINUTE_PX);
              const todayAfter = document.querySelector(
                `#timeline > .dayStackAlarmLine[data-title="${title}"]`
              );

              const state = {
                day: {
                  zoomed: dayZoomed,
                  beforeKey: dayBefore ? dayBefore.dataset.reuseKey || "" : "",
                  afterKey: dayAfter ? dayAfter.dataset.reuseKey || "" : "",
                  sameNode: Boolean(dayBefore && dayAfter && dayBefore === dayAfter),
                  compact: Boolean(dayAfter && dayAfter.classList.contains("compact")),
                  text: dayAfter ? (dayAfter.textContent || "").trim() : "",
                },
                todayFocus: {
                  zoomed: todayZoomed,
                  beforeKey: todayBefore ? todayBefore.dataset.reuseKey || "" : "",
                  afterKey: todayAfter ? todayAfter.dataset.reuseKey || "" : "",
                  sameNode: Boolean(todayBefore && todayAfter && todayBefore === todayAfter),
                  compact: Boolean(todayAfter && todayAfter.classList.contains("compact")),
                  text: todayAfter ? (todayAfter.textContent || "").trim() : "",
                },
              };
              state.ok = Boolean(
                state.day.zoomed &&
                state.day.sameNode &&
                state.day.compact &&
                state.day.text.includes(title) &&
                state.todayFocus.zoomed &&
                state.todayFocus.sameNode &&
                state.todayFocus.compact &&
                state.todayFocus.text.includes(title)
              );
              removeTestAlarms();
              renderAlarms();
              return state;
            })()
            """,
            timeout=20.0,
        )
        session.screenshot(zoom_shot)
        results["proof_files"].append(zoom_shot.name)
        if (
            not zoom_prepare
            or not zoom_step1
            or not zoom_half_ok
            or not zoom_base_ok
            or not context_double_right_click_state
            or not context_double_right_click_state.get("ok")
            or not zoom_render_budget_state
            or not zoom_render_budget_state.get("ok")
            or not today_focus_render_budget_state
            or not today_focus_render_budget_state.get("ok")
            or not alarm_node_reuse_state
            or not alarm_node_reuse_state.get("ok")
        ):
            results["issues"].append("zoom_backflow_failed")

        dblclick_readable_state = session.evaluate(
            """
            (async () => {
              const title = "Step10 Dblclick Readable";
              const anchorMinutes = 10 * 60;
              const anchorTolerancePx = 2.5;
              const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
              const removeTestAlarms = () => {
                for (let index = alarms.length - 1; index >= 0; index -= 1) {
                  const alarm = alarms[index];
                  if (alarm && !(alarm instanceof Date) && alarm.title === title) {
                    alarms.splice(index, 1);
                  }
                }
              };
              const readLineState = (selector) => {
                const line = document.querySelector(selector);
                if (!(line instanceof HTMLElement)) {
                  return { exists: false };
                }
                const label = line.querySelector(".dayStackAlarmLine__label, .alarm-line__label");
                const labelStyle = label ? getComputedStyle(label) : null;
                const rect = line.getBoundingClientRect();
                return {
                  exists: true,
                  className: line.className,
                  compact: line.classList.contains("compact"),
                  expanded: line.classList.contains("expanded"),
                  height: rect.height,
                  text: (line.textContent || "").trim(),
                  opacity: labelStyle ? Number(labelStyle.opacity) : null,
                  labelDisplay: labelStyle ? labelStyle.display : "",
                };
              };
              const dispatchDblClick = (element, clientX, clientY) => {
                element.dispatchEvent(
                  new MouseEvent("dblclick", {
                    bubbles: true,
                    cancelable: true,
                    clientX,
                    clientY,
                  })
                );
              };
              const readZoomPreview = () => {
                const style = getComputedStyle(timelineWrap);
                const scale = Number(style.getPropertyValue("--zoom-preview-scale"));
                const origin = style.getPropertyValue("--zoom-preview-origin-y");
                return {
                  active: timelineWrap.classList.contains("zoom-preview"),
                  scale,
                  origin,
                };
              };
              const previewOk = (state) => Boolean(
                state &&
                state.active &&
                Number.isFinite(state.scale) &&
                Math.abs(state.scale - 1) >= 0.01 &&
                String(state.origin || "").trim().endsWith("px")
              );
              const dayStackMinuteClientY = (itemDateKey, minutes) => {
                const item = dayStackLayer.querySelector(`.dayStackItem[data-date="${itemDateKey}"]`);
                const body = item ? item.querySelector(".dayStackBody") : null;
                if (!(body instanceof HTMLElement)) return NaN;
                return (
                  body.getBoundingClientRect().top +
                  dayStackRenderedYForItem(minutes * minutePx, itemDateKey)
                );
              };
              const scrollDayStackMinuteToClientY = async (itemDateKey, minutes, targetClientY) => {
                const before = dayStackMinuteClientY(itemDateKey, minutes);
                if (!Number.isFinite(before)) return NaN;
                setDayStackScrollTop(dayStackLayer.scrollTop + before - targetClientY);
                await delay(80);
                return dayStackMinuteClientY(itemDateKey, minutes);
              };
              const todayFocusMinuteClientY = (minutes) => {
                if (!timeline) return NaN;
                return (
                  timeline.getBoundingClientRect().top +
                  todayFocusRenderedYForBaseY(minutes * minutePx)
                );
              };
              const scrollTodayFocusMinuteToClientY = async (minutes, targetClientY) => {
                const before = todayFocusMinuteClientY(minutes);
                if (!Number.isFinite(before)) return NaN;
                const maxScroll = Math.max(0, timeline.scrollHeight - timelineWrap.clientHeight);
                timelineWrap.scrollTop = Math.max(
                  0,
                  Math.min(maxScroll, timelineWrap.scrollTop + before - targetClientY)
                );
                await delay(80);
                return todayFocusMinuteClientY(minutes);
              };
              const waitForMinutePx = async (target) => {
                for (let attempt = 0; attempt < 20; attempt += 1) {
                  if (Math.abs(minutePx - target) < 0.01) return true;
                  await delay(50);
                }
                return Math.abs(minutePx - target) < 0.01;
              };
              const isReadableCompact = (state) => Boolean(
                state &&
                state.exists &&
                state.compact &&
                !state.expanded &&
                Number(state.height) >= ALARM_ZOOMED_HEIGHT_PX - 0.5 &&
                Number(state.opacity) >= 0.95 &&
                String(state.text || "").includes(title)
              );
              const heightGrew = (before, after) => Boolean(
                before &&
                after &&
                Number(after.height) >= Number(before.height) + 4
              );
              const anchorKept = (before, after) => Boolean(
                Number.isFinite(before) &&
                Number.isFinite(after) &&
                Math.abs(after - before) <= anchorTolerancePx
              );

              if (typeof hideModal === "function") {
                hideModal();
              }
              removeTestAlarms();
              const today = startOfDay(new Date());
              const todayKey = dateKeyFromDate(today);
              const alarmTime = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate(),
                9,
                30,
                0,
                0
              );
              alarms.push({ time: alarmTime, title });

              focusDateInDayStack(today, { expand: true });
              let stackRect = dayStackLayer.getBoundingClientRect();
              setMinutePx(BASE_MINUTE_PX, null, stackRect.top + stackRect.height / 2);
              renderDayStackAlarms();
              await delay(80);
              const dayBefore = readLineState(
                `#dayStackLayer .dayStackAlarmLine[data-title="${title}"]`
              );
              const body = document.querySelector("#dayStackLayer .dayStackItem.expanded .dayStackBody");
              let dayTriggered = false;
              let dayHit = null;
              let dayZoomed = false;
              let dayAnchorBefore = NaN;
              let dayAnchorAfter = NaN;
              let dayPreview = null;
              if (body instanceof HTMLElement) {
                stackRect = dayStackLayer.getBoundingClientRect();
                const targetClientY = stackRect.top + stackRect.height * 0.45;
                dayAnchorBefore = await scrollDayStackMinuteToClientY(
                  todayKey,
                  anchorMinutes,
                  targetClientY
                );
                const bodyRect = body.getBoundingClientRect();
                const clientX = bodyRect.left + bodyRect.width * 0.5;
                const clientY = dayAnchorBefore;
                const hit = document.elementFromPoint(clientX, clientY);
                dayHit = hit ? { tag: hit.tagName, className: hit.className || "" } : null;
                dispatchDblClick(
                  body,
                  clientX,
                  clientY
                );
                dayPreview = readZoomPreview();
                dayTriggered = true;
                dayZoomed = await waitForMinutePx(ZOOM_MINUTE_PX);
                dayAnchorAfter = dayStackMinuteClientY(todayKey, anchorMinutes);
              }
              const dayAfter = readLineState(
                `#dayStackLayer .dayStackAlarmLine[data-title="${title}"]`
              );

              setDayStackOpen(false);
              setTodayFocusMode(true);
              const wrapRect = timelineWrap.getBoundingClientRect();
              setMinutePx(BASE_MINUTE_PX, null, wrapRect.top + wrapRect.height / 2);
              buildTimeline();
              await delay(80);
              const todayFocusTargetY = wrapRect.top + wrapRect.height * 0.45;
              const todayAnchorBefore = await scrollTodayFocusMinuteToClientY(
                anchorMinutes,
                todayFocusTargetY
              );
              const todayBefore = readLineState(
                `#timeline > .dayStackAlarmLine[data-title="${title}"]`
              );
              const nextWrapRect = timelineWrap.getBoundingClientRect();
              dispatchDblClick(
                timelineWrap,
                nextWrapRect.left + nextWrapRect.width * 0.5,
                todayAnchorBefore
              );
              const todayPreview = readZoomPreview();
              const todayZoomed = await waitForMinutePx(ZOOM_MINUTE_PX);
              const todayAnchorAfter = todayFocusMinuteClientY(anchorMinutes);
              const todayAfter = readLineState(
                `#timeline > .dayStackAlarmLine[data-title="${title}"]`
              );

              return {
                title,
                day: {
                  triggered: dayTriggered,
                  hit: dayHit,
                  zoomed: dayZoomed,
                  preview: dayPreview,
                  before: dayBefore,
                  after: dayAfter,
                  anchorBefore: dayAnchorBefore,
                  anchorAfter: dayAnchorAfter,
                  anchorDelta: Number.isFinite(dayAnchorBefore) && Number.isFinite(dayAnchorAfter)
                    ? dayAnchorAfter - dayAnchorBefore
                    : null,
                  anchorKept: anchorKept(dayAnchorBefore, dayAnchorAfter),
                  heightGrew: heightGrew(dayBefore, dayAfter),
                  ok:
                    dayTriggered &&
                    previewOk(dayPreview) &&
                    dayZoomed &&
                    anchorKept(dayAnchorBefore, dayAnchorAfter) &&
                    heightGrew(dayBefore, dayAfter) &&
                    isReadableCompact(dayAfter),
                },
                todayFocus: {
                  zoomed: todayZoomed,
                  preview: todayPreview,
                  before: todayBefore,
                  after: todayAfter,
                  anchorBefore: todayAnchorBefore,
                  anchorAfter: todayAnchorAfter,
                  anchorDelta: Number.isFinite(todayAnchorBefore) && Number.isFinite(todayAnchorAfter)
                    ? todayAnchorAfter - todayAnchorBefore
                    : null,
                  anchorKept: anchorKept(todayAnchorBefore, todayAnchorAfter),
                  heightGrew: heightGrew(todayBefore, todayAfter),
                  ok:
                    todayZoomed &&
                    previewOk(todayPreview) &&
                    anchorKept(todayAnchorBefore, todayAnchorAfter) &&
                    heightGrew(todayBefore, todayAfter) &&
                    isReadableCompact(todayAfter),
                },
                minutePx,
                expectedZoomHeight: ALARM_ZOOMED_HEIGHT_PX,
              };
            })()
            """,
            timeout=20.0,
        )
        session.screenshot(dblclick_readable_shot)
        results["proof_files"].append(dblclick_readable_shot.name)
        if (
            not dblclick_readable_state
            or not dblclick_readable_state.get("day", {}).get("ok")
            or not dblclick_readable_state.get("todayFocus", {}).get("ok")
        ):
            results["issues"].append("dblclick_readable_zoom_failed")

        results["summary"] = {
            "refresh_before": refresh_state_before,
            "refresh_after": refresh_state_after,
            "inline": {
                "opened": inline_state,
                "step_ok": step_ok,
                "cancelled": inline_cancel_ok,
            },
            "time_axis": time_axis_state,
            "keyboard": {
                "state": keyboard_state,
                "target_month": keyboard_target_month,
                "open_triggered": keyboard_open_triggered,
                "open_state": keyboard_open_state,
                "close_triggered": keyboard_close_triggered,
                "close_state": keyboard_close_state,
                "open_ok": keyboard_open_ok,
                "close_ok": keyboard_close_ok,
            },
            "zoom": {
                "prepare": zoom_prepare,
                "half_ok": zoom_half_ok,
                "base_ok": zoom_base_ok,
                "double_right_click": context_double_right_click_state,
                "render_budget": zoom_render_budget_state,
                "today_focus_render_budget": today_focus_render_budget_state,
                "alarm_node_reuse": alarm_node_reuse_state,
            },
            "dblclick_readable": dblclick_readable_state,
        }
        results["pass"] = len(results["issues"]) == 0
        write_named_json_report("step10_verify", results)
        print(json.dumps(results, ensure_ascii=True, indent=2))
        return 0 if results["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
