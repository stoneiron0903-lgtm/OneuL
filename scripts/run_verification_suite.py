from __future__ import annotations

import json
import os
import socket
import subprocess
import sys
from pathlib import Path

from verify_artifacts import write_named_json_report


ROOT_DIR = Path(__file__).resolve().parents[1]
CDP_PORT = int(os.getenv("ONEUL_CDP_PORT", "9224"))


def cdp_available(port: int) -> bool:
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=1.0):
            return True
    except OSError:
        return False


def run_script(script_name: str) -> dict[str, object]:
    command = [sys.executable, str(Path(__file__).resolve().parent / script_name)]
    completed = subprocess.run(
        command,
        cwd=str(ROOT_DIR),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    return {
        "script": script_name,
        "returncode": completed.returncode,
        "stdout": completed.stdout,
        "stderr": completed.stderr,
        "passed": completed.returncode == 0,
    }


def main() -> int:
    summary: dict[str, object] = {
        "pass": False,
        "cdp_port": CDP_PORT,
        "runs": [],
        "skipped": [],
    }

    runs: list[dict[str, object]] = []
    runs.append(run_script("api_smoke_verify.py"))
    runs.append(run_script("google_smoke_verify.py"))

    cdp_ready = cdp_available(CDP_PORT)
    if cdp_ready:
        runs.append(run_script("step7_verify.py"))
        if os.getenv("ONEUL_RUN_STEP8", "").strip() in {"1", "true", "True"}:
            runs.append(run_script("step8_verify.py"))
        else:
            cast_skipped = summary["skipped"]
            assert isinstance(cast_skipped, list)
            cast_skipped.append(
                {
                    "script": "step8_verify.py",
                    "reason": "requires a connected Google OAuth session and ends with disconnect",
                }
            )
        runs.append(run_script("step9_verify.py"))
        runs.append(run_script("step10_verify.py"))
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
    summary["pass"] = all(bool(item.get("passed")) for item in runs)
    write_named_json_report("verification_suite", summary)
    print(json.dumps(summary, ensure_ascii=True, indent=2))
    return 0 if summary["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
