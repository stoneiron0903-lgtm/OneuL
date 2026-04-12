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
        session.screenshot(zoom_shot)
        results["proof_files"].append(zoom_shot.name)
        if not zoom_prepare or not zoom_step1 or not zoom_half_ok or not zoom_base_ok:
            results["issues"].append("zoom_backflow_failed")

        results["summary"] = {
            "refresh_before": refresh_state_before,
            "refresh_after": refresh_state_after,
            "inline": {
                "opened": inline_state,
                "step_ok": step_ok,
                "cancelled": inline_cancel_ok,
            },
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
            },
        }
        results["pass"] = len(results["issues"]) == 0
        write_named_json_report("step10_verify", results)
        print(json.dumps(results, ensure_ascii=True, indent=2))
        return 0 if results["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
