from __future__ import annotations

import json
import os
import socket
import subprocess
import sys
import time
from pathlib import Path

from verify_artifacts import write_named_json_report


ROOT_DIR = Path(__file__).resolve().parents[1]
CDP_PORT = int(os.getenv("ONEUL_CDP_PORT", "9224"))
REQUIRE_CDP = os.getenv("ONEUL_REQUIRE_CDP", "").strip() in {"1", "true", "True"}
TRANSIENT_BROWSER_RETRY_COUNT = 1
TRANSIENT_BROWSER_RETRY_DELAY_SEC = 1.0
BROWSER_VERIFY_SCRIPTS = {
    "step7_verify.py",
    "step8_verify.py",
    "step9_verify.py",
    "step10_verify.py",
}


def cdp_available(port: int) -> bool:
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=1.0):
            return True
    except OSError:
        return False


def is_transient_cdp_timeout(result: dict[str, object]) -> bool:
    stderr = str(result.get("stderr") or "").lower()
    stdout = str(result.get("stdout") or "").lower()
    combined = f"{stdout}\n{stderr}"
    return "timed out" in combined and "runtime.evaluate" in combined


def run_script(script_name: str, *, retries: int = 0) -> dict[str, object]:
    command = [sys.executable, str(Path(__file__).resolve().parent / script_name)]
    attempt = 0
    result: dict[str, object] | None = None
    env = os.environ.copy()
    if script_name in BROWSER_VERIFY_SCRIPTS:
        env["ONEUL_CDP_PORT"] = str(CDP_PORT)
        env.setdefault("ONEUL_CDP_EXISTING", "1")

    while attempt <= retries:
        attempt += 1
        completed = subprocess.run(
            command,
            cwd=str(ROOT_DIR),
            env=env,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        result = {
            "script": script_name,
            "returncode": completed.returncode,
            "stdout": completed.stdout,
            "stderr": completed.stderr,
            "passed": completed.returncode == 0,
            "attempts": attempt,
        }
        if completed.returncode == 0:
            return result
        if attempt > retries or not is_transient_cdp_timeout(result):
            return result
        time.sleep(TRANSIENT_BROWSER_RETRY_DELAY_SEC)

    assert result is not None
    return result


def main() -> int:
    summary: dict[str, object] = {
        "pass": False,
        "cdp_port": CDP_PORT,
        "cdp_required": REQUIRE_CDP,
        "runs": [],
        "skipped": [],
    }

    runs: list[dict[str, object]] = []
    runs.append(run_script("api_smoke_verify.py"))
    runs.append(run_script("google_smoke_verify.py"))

    cdp_ready = cdp_available(CDP_PORT)
    if cdp_ready:
        runs.append(run_script("step7_verify.py", retries=TRANSIENT_BROWSER_RETRY_COUNT))
        if os.getenv("ONEUL_RUN_STEP8", "").strip() in {"1", "true", "True"}:
            runs.append(run_script("step8_verify.py", retries=TRANSIENT_BROWSER_RETRY_COUNT))
        else:
            cast_skipped = summary["skipped"]
            assert isinstance(cast_skipped, list)
            cast_skipped.append(
                {
                    "script": "step8_verify.py",
                    "reason": "requires a connected Google OAuth session and ends with disconnect",
                }
            )
        runs.append(run_script("step9_verify.py", retries=TRANSIENT_BROWSER_RETRY_COUNT))
        runs.append(run_script("step10_verify.py", retries=TRANSIENT_BROWSER_RETRY_COUNT))
    else:
        cast_skipped = summary["skipped"]
        assert isinstance(cast_skipped, list)
        cast_skipped.extend(
            [
                {
                    "script": "step7_verify.py",
                    "reason": f"CDP browser target not available on port {CDP_PORT}",
                },
                {
                    "script": "step8_verify.py",
                    "reason": f"CDP browser target not available on port {CDP_PORT}",
                },
                {
                    "script": "step9_verify.py",
                    "reason": f"CDP browser target not available on port {CDP_PORT}",
                },
                {
                    "script": "step10_verify.py",
                    "reason": f"CDP browser target not available on port {CDP_PORT}",
                },
            ]
        )

    summary["runs"] = runs
    summary["pass"] = all(bool(item.get("passed")) for item in runs) and (
        cdp_ready or not REQUIRE_CDP
    )
    write_named_json_report("verification_suite", summary)
    print(json.dumps(summary, ensure_ascii=True, indent=2))
    return 0 if summary["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
