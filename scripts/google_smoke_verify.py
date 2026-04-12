from __future__ import annotations

import json
import os
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
from http.cookiejar import CookieJar
from pathlib import Path
from typing import Any

from verify_artifacts import write_named_json_report

ROOT_DIR = Path(__file__).resolve().parents[1]
RUNTIME_PYTHON = ROOT_DIR / ".venv_runtime" / "Scripts" / "python.exe"
APP_URL = "http://127.0.0.1:9999"
TEMP_PORT = 9998


def wait_http(url: str, timeout: float = 20.0) -> tuple[int, str]:
    deadline = time.time() + timeout
    last_error: Exception | None = None
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=2) as response:
                return response.status, response.read().decode("utf-8", errors="replace")
        except Exception as exc:  # pragma: no cover - startup polling
            last_error = exc
            time.sleep(0.25)
    raise last_error or RuntimeError("timeout")


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):  # type: ignore[override]
        return None


def open_json(url: str, *, method: str = "GET", data: dict[str, Any] | None = None) -> dict[str, Any]:
    payload = None
    headers: dict[str, str] = {}
    if data is not None:
        payload = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    request = urllib.request.Request(url, data=payload, headers=headers, method=method)
    with urllib.request.urlopen(request, timeout=10) as response:
        decoded = response.read().decode("utf-8", errors="replace")
    body = json.loads(decoded)
    return body if isinstance(body, dict) else {}


def configured_checks() -> dict[str, Any]:
    opener_no_redirect = urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor(CookieJar()),
        NoRedirect(),
    )

    configured_status = open_json(f"{APP_URL}/api/google/status")

    try:
        opener_no_redirect.open(f"{APP_URL}/auth/google/start", timeout=10)
        redirect_location = None
    except urllib.error.HTTPError as exc:
        redirect_location = exc.headers.get("Location")

    try:
        opener_no_redirect.open(f"{APP_URL}/auth/google/callback", timeout=10)
        callback_redirect = None
    except urllib.error.HTTPError as exc:
        callback_redirect = exc.headers.get("Location")

    events_error: dict[str, Any] | None = None
    try:
        urllib.request.urlopen(
            f"{APP_URL}/api/google/events?start=2026-04-11T00:00:00Z&end=2026-04-12T00:00:00Z",
            timeout=10,
        )
    except urllib.error.HTTPError as exc:
        events_error = {
            "status": exc.code,
            "body": exc.read().decode("utf-8", errors="replace"),
        }

    create_error: dict[str, Any] | None = None
    create_request = urllib.request.Request(
        f"{APP_URL}/api/google/events",
        data=json.dumps(
            {
                "title": "probe",
                "start": "2026-04-11T01:00:00Z",
                "end": "2026-04-11T02:00:00Z",
            }
        ).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        urllib.request.urlopen(create_request, timeout=10)
    except urllib.error.HTTPError as exc:
        create_error = {
            "status": exc.code,
            "body": exc.read().decode("utf-8", errors="replace"),
        }

    disconnect_request = urllib.request.Request(
        f"{APP_URL}/api/google/disconnect",
        data=b"{}",
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(disconnect_request, timeout=10) as response:
        disconnect_payload = json.loads(response.read().decode("utf-8", errors="replace"))

    query_keys = (
        sorted(urllib.parse.parse_qs(urllib.parse.urlparse(redirect_location).query).keys())
        if redirect_location
        else []
    )
    return {
        "configured_status": configured_status,
        "auth_start_has_redirect": bool(redirect_location),
        "auth_start_redirect_prefix": redirect_location[:160] if redirect_location else None,
        "auth_start_query_keys": query_keys,
        "callback_missing_params_redirect": callback_redirect,
        "events_when_disconnected": events_error,
        "create_when_disconnected": create_error,
        "disconnect_payload": disconnect_payload,
    }


def unconfigured_checks() -> dict[str, Any]:
    env = os.environ.copy()
    for key in ("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI", "GOOGLE_CALENDAR_ID"):
        env[key] = ""
    env["ONEUL_SESSION_SECRET"] = "step8-temp-secret"

    process = subprocess.Popen(
        [
            str(RUNTIME_PYTHON),
            "-m",
            "uvicorn",
            "backend.main:app",
            "--host",
            "127.0.0.1",
            "--port",
            str(TEMP_PORT),
        ],
        cwd=str(ROOT_DIR),
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        wait_http(f"http://127.0.0.1:{TEMP_PORT}/api/google/status")
        unconfigured_status = open_json(f"http://127.0.0.1:{TEMP_PORT}/api/google/status")
        try:
            urllib.request.urlopen(f"http://127.0.0.1:{TEMP_PORT}/auth/google/start", timeout=10)
            start_result = {"status": 200}
        except urllib.error.HTTPError as exc:
            start_result = {
                "status": exc.code,
                "body": exc.read().decode("utf-8", errors="replace"),
            }
        return {
            "unconfigured_status": unconfigured_status,
            "unconfigured_start": start_result,
        }
    finally:
        try:
            process.terminate()
            process.wait(timeout=5)
        except Exception:
            try:
                process.kill()
            except Exception:
                pass


def main() -> int:
    summary = {}
    summary.update(configured_checks())
    summary.update(unconfigured_checks())
    write_named_json_report("google_smoke_verify", summary)
    print(json.dumps(summary, ensure_ascii=True, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
