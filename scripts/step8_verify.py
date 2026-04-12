from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone

from verify_artifacts import proof_path, write_named_json_report
from verify_cdp_support import APP_URL, attach_new_page, open_browser_connection, wait_for_app_ready

def oauth_tabs(browser_session) -> list[dict[str, str]]:
    result = browser_session.call("Target.getTargets", timeout=10.0)
    items = []
    for target in result.get("targetInfos", []):
        if not isinstance(target, dict) or target.get("type") != "page":
            continue
        url = str(target.get("url") or "")
        if not url.startswith("https://accounts.google.com/"):
            continue
        items.append(
            {
                "title": str(target.get("title") or ""),
                "url": url,
            }
        )
    return items


def main() -> int:
    with open_browser_connection() as (_, browser_session):
        page_session = attach_new_page(browser_session, APP_URL)
        wait_for_app_ready(
            page_session,
            required_ids=("statusGoogleBtn", "timelineWrap"),
            timeout=30.0,
        )

        result: dict[str, object] = {
            "pass": False,
            "issues": [],
            "proof_files": [],
        }

        status_shot = proof_path("verify-step8-google-status.png")
        connected_shot = proof_path("verify-step8-google-connected.png")
        create_shot = proof_path("verify-step8-google-create.png")
        disconnect_shot = proof_path("verify-step8-google-disconnect.png")

        initial_state = page_session.evaluate(
            """
            (async () => {
              await refreshGoogleCalendarStatus({ sync: false });
              const btn = document.getElementById("statusGoogleBtn");
              return {
                href: location.href,
                configured: Boolean(googleCalendarConfigured),
                connected: Boolean(googleCalendarConnected),
                syncing: Boolean(googleCalendarSyncing),
                buttonActive: Boolean(btn && btn.classList.contains("is-active")),
                buttonBusy: Boolean(btn && btn.classList.contains("is-busy")),
                ariaLabel: btn ? btn.getAttribute("aria-label") || "" : "",
                googleEvents: Array.isArray(googleEvents) ? googleEvents.length : -1,
              };
            })()
            """,
            timeout=30.0,
        )
        page_session.screenshot(status_shot)
        result["proof_files"].append(status_shot.name)

        if not bool(initial_state.get("configured")):
            result["issues"].append("google_not_configured")
            result["summary"] = {
                "initial": initial_state,
                "oauth_tabs": oauth_tabs(browser_session),
            }
            print(json.dumps(result, ensure_ascii=True, indent=2))
            return 1

        if not bool(initial_state.get("connected")):
            result["issues"].append("google_not_connected")
            result["summary"] = {
                "initial": initial_state,
                "oauth_tabs": oauth_tabs(browser_session),
            }
            print(json.dumps(result, ensure_ascii=True, indent=2))
            return 1

        fetch_start = (datetime.now(timezone.utc) - timedelta(days=2)).replace(microsecond=0)
        fetch_end = (datetime.now(timezone.utc) + timedelta(days=30)).replace(microsecond=0)
        create_start = (datetime.now(timezone.utc) + timedelta(minutes=20)).replace(second=0, microsecond=0)
        create_end = create_start + timedelta(minutes=20)
        create_title = f"Oneul Step8 Smoke {datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}"
        create_description = "Oneul Step8 Google roundtrip verification"

        fetch_start_literal = json.dumps(fetch_start.isoformat().replace("+00:00", "Z"))
        fetch_end_literal = json.dumps(fetch_end.isoformat().replace("+00:00", "Z"))
        create_start_literal = json.dumps(create_start.isoformat())
        create_end_literal = json.dumps(create_end.isoformat())
        create_title_literal = json.dumps(create_title)
        create_description_literal = json.dumps(create_description)

        fetch_state = page_session.evaluate(
            f"""
            (async () => {{
              const btn = document.getElementById("statusGoogleBtn");
              await refreshGoogleCalendarStatus({{ sync: true, forceSync: true }});
              const url = new URL("/api/google/events", window.location.origin);
              url.searchParams.set("start", {fetch_start_literal});
              url.searchParams.set("end", {fetch_end_literal});
              url.searchParams.set("force", "1");
              const response = await fetch(url.toString(), {{
                credentials: "same-origin",
                cache: "no-store",
              }});
              let payload = {{}};
              try {{
                payload = await response.json();
              }} catch (_) {{}}
              return {{
                status: response.status,
                connected: Boolean(googleCalendarConnected),
                buttonActive: Boolean(btn && btn.classList.contains("is-active")),
                buttonBusy: Boolean(btn && btn.classList.contains("is-busy")),
                googleEvents: Array.isArray(googleEvents) ? googleEvents.length : -1,
                payloadCount: Array.isArray(payload.items) ? payload.items.length : -1,
                cached: payload && Object.prototype.hasOwnProperty.call(payload, "cached") ? Boolean(payload.cached) : null,
                lastSync: payload && typeof payload.lastSync === "string" ? payload.lastSync : "",
                ariaLabel: btn ? btn.getAttribute("aria-label") || "" : "",
              }};
            }})()
            """,
            timeout=60.0,
        )
        page_session.screenshot(connected_shot)
        result["proof_files"].append(connected_shot.name)

        create_state = page_session.evaluate(
            f"""
            (async () => {{
              const payload = {{
                title: {create_title_literal},
                description: {create_description_literal},
                start: {create_start_literal},
                end: {create_end_literal},
                timeZone: "Asia/Seoul"
              }};
              const response = await fetch("/api/google/events", {{
                method: "POST",
                credentials: "same-origin",
                headers: {{
                  "Content-Type": "application/json"
                }},
                body: JSON.stringify(payload)
              }});
              let body = {{}};
              try {{
                body = await response.json();
              }} catch (_) {{}}
              const created = body && typeof body === "object" ? body.item || null : null;
              const createdId = created && typeof created.id === "string" ? created.id : "";
              await refreshGoogleCalendarStatus({{ sync: true, forceSync: true }});
              const createdStart = created && typeof created.start === "string" ? new Date(created.start) : new Date({create_start_literal});
              if (createdStart instanceof Date && Number.isFinite(createdStart.getTime())) {{
                setDayStackOpen(false);
                setTodayFocusMode(true, {{ rebuildTimeline: false }});
                setTodayFocusHourMode(false);
                startDate = startOfDay(createdStart);
                buildTimeline();
                const anchorY = timelineWrap.getBoundingClientRect().top + timelineWrap.clientHeight / 2;
                setMinutePx(MAX_ZOOM_MINUTE_PX, null, anchorY);
                alignTimelineToDateTime(createdStart, anchorY);
                renderAllAlarmViews();
                await new Promise((resolve) => setTimeout(resolve, 250));
              }}
              const inState = Boolean(createdId && googleEventsById && googleEventsById.has(createdId));
              const visibility = (() => {{
                const directInDom = Array.from(
                  document.querySelectorAll(".alarm-line.google-event, .dayStackAlarmLine.google-event")
                ).some((node) => node instanceof HTMLElement && node.dataset.eventId === createdId);
                const itemDateKey =
                  createdStart instanceof Date && Number.isFinite(createdStart.getTime())
                    ? dateKeyFromDate(createdStart)
                    : "";
                const visibleEntries =
                  itemDateKey && typeof dayStackVisibleAlarmEntriesForKey === "function"
                    ? dayStackVisibleAlarmEntriesForKey(itemDateKey)
                    : [];
                const layoutItems =
                  itemDateKey && typeof dayStackAlarmLayoutItemsForKey === "function"
                    ? dayStackAlarmLayoutItemsForKey(itemDateKey, visibleEntries)
                    : [];
                let layoutKind = "";
                layoutItems.some((item) => {{
                  if (item && item.kind === "alarm" && item.entry && item.entry.eventId === createdId) {{
                    layoutKind = "alarm";
                    return true;
                  }}
                  if (
                    item &&
                    item.kind === "bundle" &&
                    Array.isArray(item.bundleEntries) &&
                    item.bundleEntries.some((entry) => entry && entry.eventId === createdId)
                  ) {{
                    layoutKind = "bundle";
                    return true;
                  }}
                  return false;
                }});
                return {{
                  directInDom,
                  layoutKind,
                  visibleInUi: directInDom || Boolean(layoutKind),
                  visibleEntryCount: Array.isArray(visibleEntries) ? visibleEntries.length : -1,
                  visibleLayoutCount: Array.isArray(layoutItems) ? layoutItems.length : -1,
                }};
              }})();
              return {{
                status: response.status,
                lastSync: body && typeof body.lastSync === "string" ? body.lastSync : "",
                created: created
                  ? {{
                      id: typeof created.id === "string" ? created.id : "",
                      title: typeof created.title === "string" ? created.title : "",
                      start: typeof created.start === "string" ? created.start : "",
                      end: typeof created.end === "string" ? created.end : "",
                      htmlLink: typeof created.htmlLink === "string" ? created.htmlLink : "",
                    }}
                  : null,
                inState,
                inDom: visibility.directInDom,
                layoutKind: visibility.layoutKind,
                inUi: visibility.visibleInUi,
                visibleEntryCount: visibility.visibleEntryCount,
                visibleLayoutCount: visibility.visibleLayoutCount,
                googleEvents: Array.isArray(googleEvents) ? googleEvents.length : -1,
              }};
            }})()
            """,
            timeout=90.0,
        )
        page_session.screenshot(create_shot)
        result["proof_files"].append(create_shot.name)

        disconnect_state = page_session.evaluate(
            """
            (async () => {
              const response = await fetch("/api/google/disconnect", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                  "Content-Type": "application/json"
                }
              });
              let payload = {};
              try {
                payload = await response.json();
              } catch (_) {}
              await refreshGoogleCalendarStatus({ sync: false });
              const btn = document.getElementById("statusGoogleBtn");
              return {
                status: response.status,
                payload,
                connected: Boolean(googleCalendarConnected),
                buttonActive: Boolean(btn && btn.classList.contains("is-active")),
                ariaLabel: btn ? btn.getAttribute("aria-label") || "" : "",
                googleEvents: Array.isArray(googleEvents) ? googleEvents.length : -1,
              };
            })()
            """,
            timeout=30.0,
        )
        page_session.screenshot(disconnect_shot)
        result["proof_files"].append(disconnect_shot.name)

        if int(fetch_state.get("status") or 0) != 200:
            result["issues"].append("google_fetch_failed")
        if not bool(fetch_state.get("connected")) or not bool(fetch_state.get("buttonActive")):
            result["issues"].append("google_connected_ui_failed")
        if int(create_state.get("status") or 0) != 200:
            result["issues"].append("google_create_failed")
        if not bool(create_state.get("inState")):
            result["issues"].append("google_created_event_missing_from_state")
        if not bool(create_state.get("inUi")):
            result["issues"].append("google_created_event_not_visible")
        if int(disconnect_state.get("status") or 0) != 200:
            result["issues"].append("google_disconnect_failed")
        if bool(disconnect_state.get("connected")) or bool(disconnect_state.get("buttonActive")):
            result["issues"].append("google_disconnect_ui_failed")

        result["summary"] = {
            "initial": initial_state,
            "fetch": fetch_state,
            "create": create_state,
            "disconnect": disconnect_state,
            "oauth_tabs": oauth_tabs(browser_session),
        }
        result["pass"] = len(result["issues"]) == 0
        write_named_json_report("step8_verify", result)
        print(json.dumps(result, ensure_ascii=True, indent=2))
        return 0 if result["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
