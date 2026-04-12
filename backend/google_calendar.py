from __future__ import annotations

import os
import secrets
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import quote, urlencode

import httpx
from fastapi import HTTPException, Request


GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/{calendar_id}/events"
GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events"
GOOGLE_CALENDAR_FULL_SCOPE = "https://www.googleapis.com/auth/calendar"
GOOGLE_TOKEN_REFRESH_SKEW_SECONDS = 60
GOOGLE_EVENTS_CACHE_TTL_SECONDS = 300


def _load_env_file() -> None:
    env_path = Path(__file__).resolve().parents[1] / ".env"
    if not env_path.is_file():
        return
    try:
        lines = env_path.read_text(encoding="utf-8").splitlines()
    except OSError:
        return
    for raw_line in lines:
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        if not key or key in os.environ:
            continue
        value = value.strip().strip("'").strip('"')
        os.environ[key] = value


_load_env_file()


@dataclass(frozen=True)
class GoogleCalendarConfig:
    client_id: str
    client_secret: str
    session_secret: str
    calendar_id: str
    redirect_uri: str

    @property
    def configured(self) -> bool:
        return bool(self.client_id and self.client_secret)


CONFIG = GoogleCalendarConfig(
    client_id=os.getenv("GOOGLE_CLIENT_ID", "").strip(),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET", "").strip(),
    session_secret=os.getenv("ONEUL_SESSION_SECRET", "").strip() or secrets.token_urlsafe(32),
    calendar_id=os.getenv("GOOGLE_CALENDAR_ID", "primary").strip() or "primary",
    redirect_uri=os.getenv("GOOGLE_REDIRECT_URI", "").strip(),
)

_GOOGLE_SESSION_STORE: dict[str, dict[str, Any]] = {}


def google_status(request: Request) -> dict[str, Any]:
    session_id = _session_id_from_request(request)
    entry = _GOOGLE_SESSION_STORE.get(session_id, {}) if session_id else {}
    tokens = entry.get("tokens") if isinstance(entry, dict) else None
    return {
        "configured": CONFIG.configured,
        "connected": bool(tokens),
        "writable": _tokens_allow_event_write(tokens) if isinstance(tokens, dict) else False,
        "calendarId": CONFIG.calendar_id,
        "redirectUri": _redirect_uri(request),
        "lastSync": entry.get("last_sync") if isinstance(entry, dict) else None,
    }


def build_google_auth_url(request: Request) -> str:
    _require_google_config()
    _ensure_session_id(request)
    state = secrets.token_urlsafe(24)
    request.session["google_oauth_state"] = state
    redirect_uri = _redirect_uri(request)
    params = {
        "client_id": CONFIG.client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": GOOGLE_CALENDAR_SCOPE,
        "access_type": "offline",
        "include_granted_scopes": "true",
        "prompt": "consent",
        "state": state,
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


async def complete_google_auth(request: Request, code: str, state: str) -> None:
    _require_google_config()
    expected_state = request.session.pop("google_oauth_state", None)
    if not expected_state or expected_state != state:
        raise HTTPException(status_code=400, detail="Google OAuth state mismatch.")

    redirect_uri = _redirect_uri(request)
    token_payload = await _exchange_code_for_tokens(code=code, redirect_uri=redirect_uri)
    entry = _session_entry(request, create=True)
    entry["tokens"] = _normalized_tokens(token_payload, previous_tokens=entry.get("tokens"))


async def google_events(request: Request, start: str, end: str, *, force: bool = False) -> dict[str, Any]:
    _require_google_config()
    start_dt = _validated_iso_datetime(start, label="start")
    end_dt = _validated_iso_datetime(end, label="end")
    if start_dt >= end_dt:
        raise HTTPException(status_code=400, detail="Invalid time range.")

    entry = _session_entry(request, create=False)
    if not entry or not entry.get("tokens"):
        raise HTTPException(status_code=401, detail="Google Calendar is not connected.")

    cached_items = _cached_events_for_request(entry, start=start, end=end, force=force)
    if cached_items is not None:
        return {
            "items": cached_items,
            "start": start,
            "end": end,
            "lastSync": entry.get("last_sync"),
            "cached": True,
        }

    access_token = await _ensure_access_token(entry)
    items = await _fetch_events(
        access_token=access_token,
        calendar_id=CONFIG.calendar_id,
        time_min=start,
        time_max=end,
    )
    entry["last_sync"] = datetime.utcnow().isoformat(timespec="seconds") + "Z"
    _store_events_cache(entry, start=start, end=end, items=items)
    return {
        "items": items,
        "start": start,
        "end": end,
        "lastSync": entry["last_sync"],
        "cached": False,
    }


async def google_create_event(request: Request, payload: dict[str, Any]) -> dict[str, Any]:
    _require_google_config()
    entry = _session_entry(request, create=False)
    if not entry or not entry.get("tokens"):
        raise HTTPException(status_code=401, detail="Google Calendar is not connected.")

    tokens = entry.get("tokens")
    if not isinstance(tokens, dict) or not _tokens_allow_event_write(tokens):
        raise HTTPException(status_code=403, detail="Google Calendar write access is not granted.")

    title = str(payload.get("title") or "").strip() or "Oneul 일정"
    description = str(payload.get("description") or "").strip()
    location = str(payload.get("location") or "").strip()
    time_zone = str(payload.get("timeZone") or "").strip()
    start_raw = str(payload.get("start") or "")
    end_raw = str(payload.get("end") or "")

    start_dt = _validated_iso_datetime(start_raw, label="start")
    end_dt = _validated_iso_datetime(end_raw, label="end")
    if start_dt >= end_dt:
        raise HTTPException(status_code=400, detail="Invalid event time range.")

    access_token = await _ensure_access_token(entry)
    item = await _create_event(
        access_token=access_token,
        calendar_id=CONFIG.calendar_id,
        title=title,
        description=description,
        location=location,
        time_zone=time_zone,
        start=start_dt,
        end=end_dt,
    )
    entry["last_sync"] = datetime.utcnow().isoformat(timespec="seconds") + "Z"
    entry.pop("events_cache", None)
    return {
        "item": item,
        "lastSync": entry["last_sync"],
    }


def disconnect_google(request: Request) -> dict[str, Any]:
    session_id = _session_id_from_request(request)
    if session_id:
        _GOOGLE_SESSION_STORE.pop(session_id, None)
    request.session.pop("google_oauth_state", None)
    return {
        "configured": CONFIG.configured,
        "connected": False,
        "writable": False,
        "calendarId": CONFIG.calendar_id,
        "lastSync": None,
    }


def _require_google_config() -> None:
    if CONFIG.configured:
        return
    raise HTTPException(status_code=503, detail="Google Calendar is not configured.")


def _redirect_uri(request: Request) -> str:
    return CONFIG.redirect_uri or str(request.url_for("google_auth_callback"))


def _session_id_from_request(request: Request) -> str | None:
    raw = request.session.get("oneul_session_id")
    return raw if isinstance(raw, str) and raw else None


def _ensure_session_id(request: Request) -> str:
    session_id = _session_id_from_request(request)
    if session_id:
        return session_id
    session_id = secrets.token_urlsafe(24)
    request.session["oneul_session_id"] = session_id
    return session_id


def _session_entry(request: Request, create: bool) -> dict[str, Any] | None:
    session_id = _ensure_session_id(request) if create else _session_id_from_request(request)
    if not session_id:
        return None
    entry = _GOOGLE_SESSION_STORE.get(session_id)
    if entry is None and create:
        entry = {}
        _GOOGLE_SESSION_STORE[session_id] = entry
    return entry


def _cached_events_for_request(
    entry: dict[str, Any], *, start: str, end: str, force: bool
) -> list[dict[str, Any]] | None:
    if force:
        return None
    cache = entry.get("events_cache")
    if not isinstance(cache, dict):
        return None
    cached_at = float(cache.get("cached_at") or 0)
    if cached_at <= 0 or time.time() - cached_at > GOOGLE_EVENTS_CACHE_TTL_SECONDS:
        entry.pop("events_cache", None)
        return None
    if cache.get("start") != start or cache.get("end") != end:
        return None
    items = cache.get("items")
    return items if isinstance(items, list) else None


def _store_events_cache(entry: dict[str, Any], *, start: str, end: str, items: list[dict[str, Any]]) -> None:
    entry["events_cache"] = {
        "start": start,
        "end": end,
        "items": items,
        "cached_at": time.time(),
    }


def _normalized_tokens(token_payload: dict[str, Any], previous_tokens: dict[str, Any] | None) -> dict[str, Any]:
    expires_in = int(token_payload.get("expires_in") or 3600)
    refresh_token = token_payload.get("refresh_token")
    if not refresh_token and isinstance(previous_tokens, dict):
        refresh_token = previous_tokens.get("refresh_token")
    scope = token_payload.get("scope")
    if not scope and isinstance(previous_tokens, dict):
        scope = previous_tokens.get("scope")
    return {
        "access_token": str(token_payload.get("access_token") or ""),
        "refresh_token": str(refresh_token or ""),
        "expires_at": time.time() + max(0, expires_in - GOOGLE_TOKEN_REFRESH_SKEW_SECONDS),
        "scope": str(scope or GOOGLE_CALENDAR_SCOPE),
        "token_type": str(token_payload.get("token_type") or "Bearer"),
    }


def _tokens_allow_event_write(tokens: dict[str, Any]) -> bool:
    scope_value = str(tokens.get("scope") or "").strip()
    if not scope_value:
        return False
    scopes = {scope for scope in scope_value.split() if scope}
    return GOOGLE_CALENDAR_SCOPE in scopes or GOOGLE_CALENDAR_FULL_SCOPE in scopes


def _token_is_expired(tokens: dict[str, Any]) -> bool:
    expires_at = float(tokens.get("expires_at") or 0)
    return expires_at <= time.time()


async def _ensure_access_token(entry: dict[str, Any]) -> str:
    tokens = entry.get("tokens")
    if not isinstance(tokens, dict):
        raise HTTPException(status_code=401, detail="Google Calendar is not connected.")
    access_token = str(tokens.get("access_token") or "")
    refresh_token = str(tokens.get("refresh_token") or "")
    if access_token and not _token_is_expired(tokens):
        return access_token
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Google Calendar connection expired.")
    refreshed = await _refresh_access_token(refresh_token)
    entry["tokens"] = _normalized_tokens(refreshed, previous_tokens=tokens)
    return str(entry["tokens"].get("access_token") or "")


async def _exchange_code_for_tokens(*, code: str, redirect_uri: str) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            GOOGLE_TOKEN_URL,
            headers={"Accept": "application/json"},
            data={
                "code": code,
                "client_id": CONFIG.client_id,
                "client_secret": CONFIG.client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
        )
    payload = _json_or_empty(response)
    if response.is_success:
        return payload
    raise HTTPException(
        status_code=502,
        detail=payload.get("error_description") or payload.get("error") or "Google token exchange failed.",
    )


async def _refresh_access_token(refresh_token: str) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            GOOGLE_TOKEN_URL,
            headers={"Accept": "application/json"},
            data={
                "client_id": CONFIG.client_id,
                "client_secret": CONFIG.client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
        )
    payload = _json_or_empty(response)
    if response.is_success:
        return payload
    raise HTTPException(
        status_code=401,
        detail=payload.get("error_description") or payload.get("error") or "Google token refresh failed.",
    )


async def _fetch_events(*, access_token: str, calendar_id: str, time_min: str, time_max: str) -> list[dict[str, Any]]:
    calendar_path = quote(calendar_id, safe="")
    url = GOOGLE_EVENTS_URL.format(calendar_id=calendar_path)
    params = {
        "singleEvents": "true",
        "orderBy": "startTime",
        "timeMin": time_min,
        "timeMax": time_max,
        "maxResults": "2500",
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(
            url,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json",
            },
            params=params,
        )
    payload = _json_or_empty(response)
    if not response.is_success:
        raise HTTPException(
            status_code=response.status_code,
            detail=payload.get("error", {}).get("message") or "Google Calendar request failed.",
        )
    items = payload.get("items")
    if not isinstance(items, list):
        return []
    return [event for event in (_normalized_event(item) for item in items) if event is not None]


async def _create_event(
    *,
    access_token: str,
    calendar_id: str,
    title: str,
    description: str,
    location: str,
    time_zone: str,
    start: datetime,
    end: datetime,
) -> dict[str, Any]:
    calendar_path = quote(calendar_id, safe="")
    url = GOOGLE_EVENTS_URL.format(calendar_id=calendar_path)
    body: dict[str, Any] = {
        "summary": title,
        "start": {
            "dateTime": start.isoformat(),
        },
        "end": {
            "dateTime": end.isoformat(),
        },
    }
    if time_zone:
        body["start"]["timeZone"] = time_zone
        body["end"]["timeZone"] = time_zone
    if description:
        body["description"] = description
    if location:
        body["location"] = location

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            url,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json",
            },
            params={
                "sendUpdates": "none",
            },
            json=body,
        )
    payload = _json_or_empty(response)
    if not response.is_success:
        raise HTTPException(
            status_code=response.status_code,
            detail=payload.get("error", {}).get("message") or "Google Calendar event creation failed.",
        )
    item = _normalized_event(payload)
    if item is None:
        raise HTTPException(status_code=502, detail="Google Calendar event creation returned invalid data.")
    return item


def _normalized_event(item: Any) -> dict[str, Any] | None:
    if not isinstance(item, dict):
        return None
    if item.get("status") == "cancelled":
        return None
    start = item.get("start") or {}
    end = item.get("end") or {}
    all_day = False
    start_value = start.get("dateTime")
    end_value = end.get("dateTime")
    if not start_value:
        start_value = start.get("date")
        end_value = end.get("date") or start_value
        all_day = True
    if not start_value:
        return None
    return {
        "id": str(item.get("id") or ""),
        "title": str(item.get("summary") or "").strip(),
        "start": str(start_value),
        "end": str(end_value or start_value),
        "allDay": all_day,
        "htmlLink": str(item.get("htmlLink") or ""),
        "status": str(item.get("status") or "confirmed"),
        "updated": str(item.get("updated") or ""),
    }


def _json_or_empty(response: httpx.Response) -> dict[str, Any]:
    try:
        payload = response.json()
    except ValueError:
        return {}
    return payload if isinstance(payload, dict) else {}


def _validated_iso_datetime(value: str, *, label: str) -> datetime:
    raw = (value or "").strip()
    if not raw:
        raise HTTPException(status_code=400, detail=f"Missing {label}.")
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid {label}.") from exc
