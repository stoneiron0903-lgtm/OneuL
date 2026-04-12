from __future__ import annotations

from pathlib import Path

from fastapi import Body, FastAPI, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from .google_calendar import (
    CONFIG,
    build_google_auth_url,
    complete_google_auth,
    google_create_event,
    disconnect_google,
    google_events,
    google_status,
)
from .local_alarm_store import list_alarms, normalize_alarm_items, replace_alarms
from .weather_service import weather_status


ROOT_DIR = Path(__file__).resolve().parents[1]
WEB_DIR = ROOT_DIR / "web"

app = FastAPI(title="Oneul Web", version="0.1.0")
app.add_middleware(
    SessionMiddleware,
    secret_key=CONFIG.session_secret,
    same_site="lax",
    https_only=False,
)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(127\.0\.0\.1|localhost)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/google/status")
async def google_status_endpoint(request: Request) -> dict[str, object]:
    return google_status(request)


@app.get("/api/weather/status")
async def weather_status_endpoint(
    latitude: float = Query(...),
    longitude: float = Query(...),
) -> dict[str, object]:
    return await weather_status(latitude=latitude, longitude=longitude)


@app.get("/api/alarms")
async def list_local_alarms_endpoint() -> dict[str, object]:
    return {"items": list_alarms()}


@app.put("/api/alarms")
async def replace_local_alarms_endpoint(
    payload: dict[str, object] = Body(...),
) -> dict[str, object]:
    try:
        items = normalize_alarm_items(payload.get("items"))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"items": replace_alarms(items)}


@app.get("/auth/google/start")
async def google_auth_start(request: Request) -> RedirectResponse:
    return RedirectResponse(build_google_auth_url(request), status_code=302)


@app.get("/auth/google/callback", name="google_auth_callback")
async def google_auth_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
) -> RedirectResponse:
    if error:
        return RedirectResponse("/?google=error", status_code=302)
    if not code or not state:
        return RedirectResponse("/?google=error", status_code=302)
    await complete_google_auth(request, code=code, state=state)
    return RedirectResponse("/?google=connected", status_code=302)


@app.get("/api/google/events")
async def google_events_endpoint(
    request: Request,
    start: str = Query(...),
    end: str = Query(...),
    force: bool = Query(False),
) -> dict[str, object]:
    return await google_events(request, start=start, end=end, force=force)


@app.post("/api/google/events")
async def google_create_event_endpoint(
    request: Request,
    payload: dict[str, object] = Body(...),
) -> dict[str, object]:
    return await google_create_event(request, payload)


@app.post("/api/google/disconnect")
async def google_disconnect_endpoint(request: Request) -> dict[str, object]:
    return disconnect_google(request)


app.mount("/", StaticFiles(directory=str(WEB_DIR), html=True), name="web")
