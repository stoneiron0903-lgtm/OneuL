from __future__ import annotations

import json
import urllib.request
from typing import Any

from verify_artifacts import write_named_json_report

APP_URL = "http://127.0.0.1:9999"


def http_text(url: str, *, method: str = "GET", data: dict[str, Any] | None = None) -> tuple[int, str]:
    payload = None
    headers: dict[str, str] = {}
    if data is not None:
        payload = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    request = urllib.request.Request(url, data=payload, method=method, headers=headers)
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.status, response.read().decode("utf-8", errors="replace")


def http_json(url: str, *, method: str = "GET", data: dict[str, Any] | None = None) -> tuple[int, dict[str, Any]]:
    status, text = http_text(url, method=method, data=data)
    payload = json.loads(text)
    return status, payload if isinstance(payload, dict) else {}


def main() -> int:
    checks: list[dict[str, Any]] = []

    root_status, root_text = http_text(f"{APP_URL}/")
    checks.append(
        {
            "name": "root_html",
            "status": root_status,
            "has_statusBar": 'id="statusBar"' in root_text,
            "has_timelineWrap": 'id="timelineWrap"' in root_text,
        }
    )

    _, alarms_before_payload = http_json(f"{APP_URL}/api/alarms")
    alarms_before = alarms_before_payload.get("items")
    if not isinstance(alarms_before, list):
        raise RuntimeError("invalid alarms payload")

    probe_item = {
        "time": "2026-04-11T07:45:00.000Z",
        "title": "API Probe Alarm",
        "category": "",
        "remind": "none",
        "repeat": "none",
        "remindEnabled": False,
        "repeatEnabled": False,
    }
    _, alarms_after_put_payload = http_json(
        f"{APP_URL}/api/alarms",
        method="PUT",
        data={"items": alarms_before + [probe_item]},
    )
    alarms_after_put = alarms_after_put_payload.get("items")
    _, alarms_after_get_payload = http_json(f"{APP_URL}/api/alarms")
    alarms_after_get = alarms_after_get_payload.get("items")
    http_json(f"{APP_URL}/api/alarms", method="PUT", data={"items": alarms_before})

    checks.append(
        {
            "name": "alarms_roundtrip",
            "before": len(alarms_before),
            "after_put": len(alarms_after_put) if isinstance(alarms_after_put, list) else None,
            "after_get": len(alarms_after_get) if isinstance(alarms_after_get, list) else None,
            "probe_saved": isinstance(alarms_after_get, list)
            and any(item.get("title") == "API Probe Alarm" for item in alarms_after_get if isinstance(item, dict)),
        }
    )

    google_status, google_payload = http_json(f"{APP_URL}/api/google/status")
    checks.append(
        {
            "name": "google_status",
            "status": google_status,
            "configured": bool(google_payload.get("configured")),
            "connected": bool(google_payload.get("connected")),
            "writable": bool(google_payload.get("writable")),
            "calendarId": google_payload.get("calendarId"),
        }
    )

    weather_status, weather_payload = http_json(
        f"{APP_URL}/api/weather/status?latitude=37.5665&longitude=126.9780"
    )
    checks.append(
        {
            "name": "weather_status",
            "status": weather_status,
            "line_present": bool(weather_payload.get("line")),
            "provider": weather_payload.get("provider"),
        }
    )

    payload: dict[str, Any] = {
        "checks": checks,
    }
    write_named_json_report("api_smoke_verify", payload)
    print(json.dumps(payload, ensure_ascii=True, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
