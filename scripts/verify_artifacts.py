from __future__ import annotations

import json
from pathlib import Path
from typing import Any


ROOT_DIR = Path(__file__).resolve().parents[1]
ARTIFACTS_DIR = ROOT_DIR / "artifacts"
PROOF_DIR = ARTIFACTS_DIR / "proof"
REPORT_DIR = ARTIFACTS_DIR / "reports"


def ensure_artifact_dirs() -> None:
    PROOF_DIR.mkdir(parents=True, exist_ok=True)
    REPORT_DIR.mkdir(parents=True, exist_ok=True)


def proof_path(name: str) -> Path:
    ensure_artifact_dirs()
    return PROOF_DIR / name


def report_path(name: str) -> Path:
    ensure_artifact_dirs()
    filename = name if name.endswith(".json") else f"{name}.json"
    return REPORT_DIR / filename


def write_json_report(name: str, payload: Any) -> Path:
    path = report_path(name)
    path.write_text(
        json.dumps(payload, ensure_ascii=True, indent=2) + "\n",
        encoding="utf-8",
    )
    return path


def write_named_json_report(name: str, payload: dict[str, Any]) -> Path:
    payload["report_file"] = report_path(name).name
    return write_json_report(name, payload)
