from __future__ import annotations

import json

from verify_artifacts import proof_path, write_named_json_report
from verify_cdp_support import APP_URL, attach_new_page, open_browser_connection, wait_for_app_ready


def main() -> int:
    with open_browser_connection() as (_, browser_session):
        page_session = attach_new_page(browser_session, APP_URL)
        wait_for_app_ready(
            page_session,
            required_ids=("statusWeatherTicker", "weatherDrawer"),
            timeout=30.0,
        )

        weather_state = page_session.evaluate(
            """
            (async () => {
              weatherCoords = { latitude: 37.5665, longitude: 126.9780, label: "?쒖슱" };
              await refreshWeatherStatus();
              const response = await fetch("/api/weather/status?latitude=37.5665&longitude=126.9780", {
                cache: "no-store",
              });
              const payload = await response.json();
              return {
                tickerText: document.getElementById("statusWeatherTickerText")?.textContent || "",
                drawerText: document.getElementById("weatherDrawerText")?.textContent || "",
                drawerOpen: Boolean(document.getElementById("weatherDrawer")?.classList.contains("open")),
                ariaExpanded: document.getElementById("statusWeatherTicker")?.getAttribute("aria-expanded") || "",
                provider: payload.provider || null,
                line: payload.line || "",
              };
            })()
            """,
            timeout=30.0,
        )

        ticker_shot = proof_path("verify-step9-weather-ticker.png")
        drawer_shot = proof_path("verify-step9-weather-drawer.png")
        fallback_shot = proof_path("verify-step9-weather-fallback.png")
        page_session.screenshot(ticker_shot)

        page_session.evaluate(
            """
            (() => {
              const ticker = document.getElementById("statusWeatherTicker");
              if (ticker) ticker.click();
              return true;
            })()
            """
        )
        drawer_ok = page_session.evaluate(
            """
            (async () => {
              const drawer = document.getElementById("weatherDrawer");
              const ticker = document.getElementById("statusWeatherTicker");
              for (let attempt = 0; attempt < 100; attempt += 1) {
                if (
                  drawer &&
                  ticker &&
                  drawer.classList.contains("open") &&
                  ticker.getAttribute("aria-expanded") === "true"
                ) {
                  return true;
                }
                await new Promise((resolve) => setTimeout(resolve, 100));
              }
              return false;
            })()
            """,
            timeout=15.0,
        )
        page_session.screenshot(drawer_shot)

        fallback_state = page_session.evaluate(
            """
            (() => ({
              tickerText: document.getElementById("statusWeatherTickerText")?.textContent || "",
              drawerText: document.getElementById("weatherDrawerText")?.textContent || "",
              drawerOpen: Boolean(document.getElementById("weatherDrawer")?.classList.contains("open"))
            }))()
            """,
            timeout=10.0,
        )
        page_session.screenshot(fallback_shot)

        result = {
            "pass": bool(drawer_ok)
            and isinstance(weather_state, dict)
            and bool(str(weather_state.get("tickerText") or "").strip())
            and bool(str(weather_state.get("drawerText") or "").strip())
            and isinstance(weather_state.get("provider"), dict)
            and weather_state["provider"].get("weather") == "open-meteo"
            and weather_state["provider"].get("air") == "open-meteo",
            "issues": [],
            "proof_files": [
                ticker_shot.name,
                drawer_shot.name,
                fallback_shot.name,
            ],
            "summary": {
                "initial": weather_state,
                "drawer_ok": drawer_ok,
                "fallback": fallback_state,
            },
        }
        if not drawer_ok:
            result["issues"].append("weather_drawer_open_failed")
        if not str(weather_state.get("tickerText") or "").strip():
            result["issues"].append("weather_ticker_empty")
        if not str(weather_state.get("drawerText") or "").strip():
            result["issues"].append("weather_drawer_text_empty")
        provider = weather_state.get("provider")
        if not isinstance(provider, dict) or provider.get("weather") != "open-meteo" or provider.get("air") != "open-meteo":
            result["issues"].append("weather_fallback_provider_unexpected")

        write_named_json_report("step9_verify", result)
        print(json.dumps(result, ensure_ascii=True, indent=2))
        return 0 if result["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
