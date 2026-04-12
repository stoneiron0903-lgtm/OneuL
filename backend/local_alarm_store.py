from __future__ import annotations

from datetime import datetime
from pathlib import Path
import sqlite3
from typing import Any


ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"
DB_PATH = DATA_DIR / "oneul.sqlite3"


def _normalized_alarm_time(value: Any) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError("alarm time is required")
    raw = value.strip()
    candidate = f"{raw[:-1]}+00:00" if raw.endswith("Z") else raw
    try:
        datetime.fromisoformat(candidate)
    except ValueError as exc:
        raise ValueError("alarm time must be an ISO datetime string") from exc
    return raw


def normalize_alarm_items(raw_items: Any) -> list[dict[str, Any]]:
    if not isinstance(raw_items, list):
        raise ValueError("items must be a list")
    normalized: list[dict[str, Any]] = []
    for position, raw in enumerate(raw_items):
        if not isinstance(raw, dict):
            raise ValueError("each alarm item must be an object")
        normalized.append(
            {
                "position": position,
                "time": _normalized_alarm_time(raw.get("time")),
                "title": str(raw.get("title") or "").strip(),
                "category": str(raw.get("category") or "").strip(),
                "remind": str(raw.get("remind") or "none").strip() or "none",
                "repeat": str(raw.get("repeat") or "none").strip() or "none",
                "remind_enabled": 1 if bool(raw.get("remindEnabled")) else 0,
                "repeat_enabled": 1 if bool(raw.get("repeatEnabled")) else 0,
            }
        )
    return normalized


def _connect() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA journal_mode = WAL")
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS local_alarms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            position INTEGER NOT NULL,
            time TEXT NOT NULL,
            title TEXT NOT NULL DEFAULT '',
            category TEXT NOT NULL DEFAULT '',
            remind TEXT NOT NULL DEFAULT 'none',
            repeat TEXT NOT NULL DEFAULT 'none',
            remind_enabled INTEGER NOT NULL DEFAULT 0,
            repeat_enabled INTEGER NOT NULL DEFAULT 0
        )
        """
    )
    return connection


def _row_to_alarm(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "time": row["time"],
        "title": row["title"],
        "category": row["category"],
        "remind": row["remind"],
        "repeat": row["repeat"],
        "remindEnabled": bool(row["remind_enabled"]),
        "repeatEnabled": bool(row["repeat_enabled"]),
    }


def list_alarms() -> list[dict[str, Any]]:
    with _connect() as connection:
        rows = connection.execute(
            """
            SELECT time, title, category, remind, repeat, remind_enabled, repeat_enabled
            FROM local_alarms
            ORDER BY position ASC, id ASC
            """
        ).fetchall()
    return [_row_to_alarm(row) for row in rows]


def replace_alarms(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    with _connect() as connection:
        with connection:
            connection.execute("DELETE FROM local_alarms")
            connection.executemany(
                """
                INSERT INTO local_alarms (
                    position,
                    time,
                    title,
                    category,
                    remind,
                    repeat,
                    remind_enabled,
                    repeat_enabled
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        item["position"],
                        item["time"],
                        item["title"],
                        item["category"],
                        item["remind"],
                        item["repeat"],
                        item["remind_enabled"],
                        item["repeat_enabled"],
                    )
                    for item in items
                ],
            )
        rows = connection.execute(
            """
            SELECT time, title, category, remind, repeat, remind_enabled, repeat_enabled
            FROM local_alarms
            ORDER BY position ASC, id ASC
            """
        ).fetchall()
    return [_row_to_alarm(row) for row in rows]
