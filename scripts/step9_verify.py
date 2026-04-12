from __future__ import annotations

import json
import os

from verify_artifacts import proof_path, write_named_json_report
from verify_cdp_support import APP_URL, attach_new_page, open_browser_connection, wait_for_app_ready


EXPECTED_WEATHER_PROVIDER = os.getenv("ONEUL_EXPECT_WEATHER_PROVIDER", "open-meteo").strip() or "open-meteo"
EXPECTED_AIR_PROVIDER = os.getenv("ONEUL_EXPECT_AIR_PROVIDER", "open-meteo").strip() or "open-meteo"


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
              const response = await fetch("/api/weather/status?latitude=37.5665&longitude=126.9780", {
                cache: "no-store",
              });
              const payload = await response.json();
              const expectedLine = typeof payload.line === "string" ? payload.line.trim() : "";

              weatherCoords = { latitude: 37.5665, longitude: 126.9780, label: "Seoul" };
              await refreshWeatherStatus();

              for (let attempt = 0; attempt < 100; attempt += 1) {
                const tickerText = document.getElementById("statusWeatherTickerText")?.textContent || "";
                const drawerText = document.getElementById("weatherDrawerText")?.textContent || "";
                if (expectedLine && tickerText.trim() === expectedLine && drawerText.trim() === expectedLine) {
                  break;
                }
                await new Promise((resolve) => setTimeout(resolve, 100));
              }

              return {
                tickerText: document.getElementById("statusWeatherTickerText")?.textContent || "",
                drawerText: document.getElementById("weatherDrawerText")?.textContent || "",
                drawerOpen: Boolean(document.getElementById("weatherDrawer")?.classList.contains("open")),
                ariaExpanded: document.getElementById("statusWeatherTicker")?.getAttribute("aria-expanded") || "",
                provider: payload.provider || null,
                line: payload.line || "",
                expectedLine,
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

        expected_line = str(weather_state.get("expectedLine") or "").strip()
        ticker_text = str(weather_state.get("tickerText") or "").strip()
        drawer_text = str(weather_state.get("drawerText") or "").strip()
        provider = weather_state.get("provider")

        result = {
            "pass": bool(drawer_ok)
            and isinstance(weather_state, dict)
            and bool(expected_line)
            and ticker_text == expected_line
            and drawer_text == expected_line
            and isinstance(provider, dict)
            and provider.get("weather") == EXPECTED_WEATHER_PROVIDER
            and provider.get("air") == EXPECTED_AIR_PROVIDER,
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
                "expectedProvider": {
                    "weather": EXPECTED_WEATHER_PROVIDER,
                    "air": EXPECTED_AIR_PROVIDER,
                },
            },
        }
        if not drawer_ok:
            result["issues"].append("weather_drawer_open_failed")
        if not ticker_text:
            result["issues"].append("weather_ticker_empty")
        if not drawer_text:
            result["issues"].append("weather_drawer_text_empty")
        if not expected_line:
            result["issues"].append("weather_api_line_empty")
        if ticker_text != expected_line:
            result["issues"].append("weather_ticker_line_mismatch")
        if drawer_text != expected_line:
            result["issues"].append("weather_drawer_line_mismatch")
        if (
            not isinstance(provider, dict)
            or provider.get("weather") != EXPECTED_WEATHER_PROVIDER
            or provider.get("air") != EXPECTED_AIR_PROVIDER
        ):
            result["issues"].append("weather_fallback_provider_unexpected")

        write_named_json_report("step9_verify", result)
        print(json.dumps(result, ensure_ascii=True, indent=2))
        return 0 if result["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
