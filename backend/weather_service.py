from __future__ import annotations

import logging
import math
import os
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import unquote_plus

import httpx
from fastapi import HTTPException

from .google_calendar import _load_env_file


_load_env_file()

logger = logging.getLogger(__name__)

KST = timezone(timedelta(hours=9))
SEOUL_COORDS = {"latitude": 37.5665, "longitude": 126.9780, "label": "서울"}
OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
OPEN_METEO_AIR_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
KMA_SERVICE_BASE_URL = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0"
AIRKOREA_MEASURE_URL = "https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty"
AIRKOREA_STATION_URL = "https://apis.data.go.kr/B552584/MsrstnInfoInqireSvc/getMsrstnList"
WEATHER_TIMEOUT_SECONDS = 8.0
AIR_STATION_CACHE_SECONDS = 12 * 60 * 60
FORECAST_RELEASE_HOURS = (2, 5, 8, 11, 14, 17, 20, 23)


@dataclass(frozen=True)
class WeatherConfig:
    kma_service_key: str
    airkorea_service_key: str

    @property
    def has_kma(self) -> bool:
        return bool(self.kma_service_key)

    @property
    def has_airkorea(self) -> bool:
        return bool(self.airkorea_service_key)


def _service_key_from_env(name: str) -> str:
    raw = os.getenv(name, "").strip()
    return unquote_plus(raw) if raw else ""


CONFIG = WeatherConfig(
    kma_service_key=_service_key_from_env("KMA_SERVICE_KEY"),
    airkorea_service_key=_service_key_from_env("AIRKOREA_SERVICE_KEY"),
)

_AIR_STATION_CACHE: dict[str, Any] = {
    "expires_at": 0.0,
    "stations": [],
}


async def weather_status(*, latitude: float, longitude: float) -> dict[str, Any]:
    coords = _normalized_coords(latitude=latitude, longitude=longitude)

    weather_source = "open-meteo"
    weather_data: dict[str, Any] | None = None
    if CONFIG.has_kma:
        try:
            weather_data = await _fetch_kma_weather(coords)
            weather_source = "kma"
        except Exception as exc:  # pragma: no cover - network-dependent fallback
            logger.warning("KMA weather fetch failed, falling back to Open-Meteo: %s", exc)

    if weather_data is None:
        try:
            weather_data = await _fetch_open_meteo_weather(coords)
        except Exception as exc:  # pragma: no cover - network-dependent fallback
            logger.warning("Open-Meteo weather fetch failed, using unavailable fallback: %s", exc)
            weather_source = "unavailable"
            weather_data = _fallback_weather_data()

    air_source = "open-meteo"
    air_data: dict[str, Any] | None = None
    if CONFIG.has_airkorea:
        try:
            air_data = await _fetch_airkorea_air(coords)
            air_source = "airkorea"
        except Exception as exc:  # pragma: no cover - network-dependent fallback
            logger.warning("AirKorea air fetch failed, falling back to Open-Meteo: %s", exc)

    if air_data is None:
        try:
            air_data = await _fetch_open_meteo_air(coords)
        except Exception as exc:  # pragma: no cover - network-dependent fallback
            logger.warning("Open-Meteo air fetch failed, using unavailable fallback: %s", exc)
            air_source = "unavailable"
            air_data = _fallback_air_data()

    line = _build_weather_status_line(weather_data, air_data)

    return {
        "line": line,
        "provider": {
            "weather": weather_source,
            "air": air_source,
        },
        "coords": coords,
        "weather": weather_data,
        "air": air_data,
    }


def _fallback_weather_data() -> dict[str, Any]:
    return {
        "condition_text": None,
        "temperature": None,
        "temp_min": None,
        "temp_max": None,
        "wind_speed": None,
        "wind_direction": None,
        "observed_at": "",
    }


def _fallback_air_data() -> dict[str, Any]:
    return {
        "pm10": None,
        "pm25": None,
        "station_name": "",
        "observed_at": "",
    }


def _build_weather_status_line(weather_data: dict[str, Any], air_data: dict[str, Any]) -> str:
    return " | ".join(
        [
            _weather_summary_text(weather_data),
            _air_summary_text(air_data),
            _wind_summary_text(weather_data),
        ]
    )


def _weather_summary_text(weather_data: dict[str, Any] | None) -> str:
    if not isinstance(weather_data, dict):
        return "\ub0a0\uc528 \uc815\ubcf4 \ud655\uc778 \ubd88\uac00"
    condition_text = weather_data.get("condition_text")
    temperature = _safe_float(weather_data.get("temperature"))
    temp_min = _safe_float(weather_data.get("temp_min"))
    temp_max = _safe_float(weather_data.get("temp_max"))
    has_condition = isinstance(condition_text, str) and bool(condition_text.strip())
    if has_condition or temperature is not None or temp_min is not None or temp_max is not None:
        return _weather_with_min_max_text(condition_text, temperature, temp_min, temp_max)
    return "\ub0a0\uc528 \uc815\ubcf4 \ud655\uc778 \ubd88\uac00"


def _air_summary_text(air_data: dict[str, Any] | None) -> str:
    if not isinstance(air_data, dict):
        return "\ubbf8\uc138\uba3c\uc9c0 \uc815\ubcf4 \ud655\uc778 \ubd88\uac00"
    pm25 = _safe_float(air_data.get("pm25"))
    pm10 = _safe_float(air_data.get("pm10"))
    if pm25 is None and pm10 is None:
        return "\ubbf8\uc138\uba3c\uc9c0 \uc815\ubcf4 \ud655\uc778 \ubd88\uac00"
    return _dust_summary(pm25, pm10)


def _wind_summary_text(weather_data: dict[str, Any] | None) -> str:
    if not isinstance(weather_data, dict):
        return "\ubc14\ub78c \uc815\ubcf4 \ud655\uc778 \ubd88\uac00"
    wind_speed = _safe_float(weather_data.get("wind_speed"))
    wind_direction = _safe_float(weather_data.get("wind_direction"))
    if wind_speed is None and wind_direction is None:
        return "\ubc14\ub78c \uc815\ubcf4 \ud655\uc778 \ubd88\uac00"
    return _wind_summary(wind_speed, wind_direction)


async def _fetch_kma_weather(coords: dict[str, float]) -> dict[str, Any]:
    now = datetime.now(KST)
    nx, ny = _lat_lon_to_kma_grid(coords["latitude"], coords["longitude"])
    forecast_items = await _fetch_kma_items(
        function_name="getVilageFcst",
        base_date=_latest_forecast_base_date(now),
        base_time=_latest_forecast_base_time(now),
        nx=nx,
        ny=ny,
        rows=1000,
    )
    nowcast_items = await _fetch_kma_items(
        function_name="getUltraSrtNcst",
        base_date=_latest_nowcast_base_date(now),
        base_time=_latest_nowcast_base_time(now),
        nx=nx,
        ny=ny,
        rows=60,
    )

    forecast_snapshot = _select_kma_forecast_snapshot(forecast_items, now)
    nowcast_snapshot = _select_kma_nowcast_snapshot(nowcast_items)
    target_date = now.strftime("%Y%m%d")
    daily_min = _first_kma_category_value(forecast_items, "TMN", target_date)
    daily_max = _first_kma_category_value(forecast_items, "TMX", target_date)

    condition_text = _kma_condition_text(
        pty_value=forecast_snapshot.get("PTY"),
        sky_value=forecast_snapshot.get("SKY"),
    )
    wind_speed = _safe_float(nowcast_snapshot.get("WSD"))
    if wind_speed is None:
        wind_speed = _safe_float(forecast_snapshot.get("WSD"))

    wind_direction = _safe_float(forecast_snapshot.get("VEC"))
    if wind_direction is None:
        wind_direction = _direction_from_components(
            u_component=_safe_float(nowcast_snapshot.get("UUU")),
            v_component=_safe_float(nowcast_snapshot.get("VVV")),
        )

    return {
        "condition_text": condition_text,
        "temperature": _safe_float(nowcast_snapshot.get("T1H")) or _safe_float(forecast_snapshot.get("TMP")),
        "temp_min": _safe_float(daily_min),
        "temp_max": _safe_float(daily_max),
        "wind_speed": wind_speed,
        "wind_direction": wind_direction,
        "observed_at": _kma_observed_at(now, nowcast_items),
        "grid": {"nx": nx, "ny": ny},
    }


async def _fetch_open_meteo_weather(coords: dict[str, float]) -> dict[str, Any]:
    weather_url = _build_open_meteo_forecast_url(coords)
    payload = await _fetch_json(weather_url)
    current = payload.get("current") if isinstance(payload, dict) else None
    daily = payload.get("daily") if isinstance(payload, dict) else None

    daily_min = _first_list_value(daily, "temperature_2m_min")
    daily_max = _first_list_value(daily, "temperature_2m_max")
    return {
        "condition_text": _open_meteo_weather_code_text(_safe_int(current.get("weather_code")) if isinstance(current, dict) else None),
        "temperature": _safe_float(current.get("temperature_2m")) if isinstance(current, dict) else None,
        "temp_min": daily_min,
        "temp_max": daily_max,
        "wind_speed": _safe_float(current.get("wind_speed_10m")) if isinstance(current, dict) else None,
        "wind_direction": _safe_float(current.get("wind_direction_10m")) if isinstance(current, dict) else None,
        "observed_at": current.get("time") if isinstance(current, dict) else "",
    }


async def _fetch_airkorea_air(coords: dict[str, float]) -> dict[str, Any]:
    stations = await _fetch_airkorea_stations()
    station = _nearest_station(coords["latitude"], coords["longitude"], stations)
    if station is None:
        raise HTTPException(status_code=502, detail="No AirKorea station found.")

    items = await _fetch_airkorea_measurements(station_name=station["stationName"])
    latest = _first_valid_air_measurement(items)
    if latest is None:
        raise HTTPException(status_code=502, detail="No AirKorea measurement found.")

    return {
        "pm10": _safe_float(latest.get("pm10Value")),
        "pm25": _safe_float(latest.get("pm25Value")),
        "station_name": station["stationName"],
        "observed_at": str(latest.get("dataTime") or ""),
    }


async def _fetch_open_meteo_air(coords: dict[str, float]) -> dict[str, Any]:
    air_url = _build_open_meteo_air_url(coords)
    payload = await _fetch_json(air_url)
    current = payload.get("current") if isinstance(payload, dict) else None
    return {
        "pm10": _safe_float(current.get("pm10")) if isinstance(current, dict) else None,
        "pm25": _safe_float(current.get("pm2_5")) if isinstance(current, dict) else None,
        "station_name": "",
        "observed_at": current.get("time") if isinstance(current, dict) else "",
    }


def _build_open_meteo_forecast_url(coords: dict[str, float]) -> str:
    url = httpx.URL(OPEN_METEO_FORECAST_URL)
    return str(
        url.copy_add_param("latitude", str(coords["latitude"]))
        .copy_add_param("longitude", str(coords["longitude"]))
        .copy_add_param("current", "temperature_2m,weather_code,wind_speed_10m,wind_direction_10m")
        .copy_add_param("daily", "temperature_2m_max,temperature_2m_min")
        .copy_add_param("forecast_days", "1")
        .copy_add_param("wind_speed_unit", "ms")
        .copy_add_param("timezone", "auto")
    )


def _build_open_meteo_air_url(coords: dict[str, float]) -> str:
    url = httpx.URL(OPEN_METEO_AIR_URL)
    return str(
        url.copy_add_param("latitude", str(coords["latitude"]))
        .copy_add_param("longitude", str(coords["longitude"]))
        .copy_add_param("current", "pm10,pm2_5")
        .copy_add_param("timezone", "auto")
    )


async def _fetch_kma_items(
    *,
    function_name: str,
    base_date: str,
    base_time: str,
    nx: int,
    ny: int,
    rows: int,
) -> list[dict[str, Any]]:
    payload = await _fetch_json(
        f"{KMA_SERVICE_BASE_URL}/{function_name}",
        params={
            "serviceKey": CONFIG.kma_service_key,
            "pageNo": "1",
            "numOfRows": str(rows),
            "dataType": "JSON",
            "base_date": base_date,
            "base_time": base_time,
            "nx": str(nx),
            "ny": str(ny),
        },
    )
    return _response_items(payload)


async def _fetch_airkorea_stations() -> list[dict[str, Any]]:
    now_ts = time.time()
    cached = _AIR_STATION_CACHE.get("stations")
    expires_at = float(_AIR_STATION_CACHE.get("expires_at") or 0.0)
    if isinstance(cached, list) and cached and expires_at > now_ts:
        return cached

    payload = await _fetch_json(
        AIRKOREA_STATION_URL,
        params={
            "serviceKey": CONFIG.airkorea_service_key,
            "pageNo": "1",
            "numOfRows": "1000",
            "returnType": "json",
        },
    )
    stations = [
        item
        for item in _response_items(payload)
        if _safe_float(item.get("dmX")) is not None and _safe_float(item.get("dmY")) is not None
    ]
    _AIR_STATION_CACHE["stations"] = stations
    _AIR_STATION_CACHE["expires_at"] = now_ts + AIR_STATION_CACHE_SECONDS
    return stations


async def _fetch_airkorea_measurements(*, station_name: str) -> list[dict[str, Any]]:
    last_error: Exception | None = None
    for version in ("1.3", "1.4", ""):
        params = {
            "serviceKey": CONFIG.airkorea_service_key,
            "pageNo": "1",
            "numOfRows": "10",
            "returnType": "json",
            "stationName": station_name,
            "dataTerm": "DAILY",
        }
        if version:
            params["ver"] = version
        try:
            payload = await _fetch_json(AIRKOREA_MEASURE_URL, params=params)
            return _response_items(payload)
        except Exception as exc:  # pragma: no cover - network-dependent fallback
            last_error = exc
    if last_error is not None:
        raise last_error
    return []


async def _fetch_json(url: str, params: dict[str, str] | None = None) -> dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=WEATHER_TIMEOUT_SECONDS) as client:
            response = await client.get(url, params=params, headers={"Accept": "application/json"})
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail="Weather provider unavailable.") from exc
    payload = _json_or_empty(response)
    if response.is_success:
        _raise_api_error_if_needed(payload)
        return payload
    raise HTTPException(status_code=502, detail=_extract_error_message(payload) or "Weather API request failed.")


def _raise_api_error_if_needed(payload: dict[str, Any]) -> None:
    response = payload.get("response")
    if not isinstance(response, dict):
        return
    header = response.get("header")
    if not isinstance(header, dict):
        return
    result_code = str(header.get("resultCode") or "")
    if result_code in {"00", "0", "INFO-000"}:
        return
    raise HTTPException(status_code=502, detail=str(header.get("resultMsg") or "Weather API request failed."))


def _extract_error_message(payload: dict[str, Any]) -> str:
    response = payload.get("response")
    if isinstance(response, dict):
        header = response.get("header")
        if isinstance(header, dict):
            message = header.get("resultMsg")
            if message:
                return str(message)
    return ""


def _response_items(payload: dict[str, Any]) -> list[dict[str, Any]]:
    response = payload.get("response")
    if not isinstance(response, dict):
        return []
    body = response.get("body")
    if not isinstance(body, dict):
        return []
    items_container = body.get("items")
    if not isinstance(items_container, dict):
        return []
    items = items_container.get("item")
    if isinstance(items, list):
        return [item for item in items if isinstance(item, dict)]
    if isinstance(items, dict):
        return [items]
    return []


def _select_kma_forecast_snapshot(items: list[dict[str, Any]], now: datetime) -> dict[str, str]:
    grouped: dict[datetime, dict[str, str]] = {}
    for item in items:
        forecast_dt = _forecast_item_datetime(item)
        if forecast_dt is None:
            continue
        grouped.setdefault(forecast_dt, {})[str(item.get("category") or "")] = str(item.get("fcstValue") or "")

    if not grouped:
        return {}

    target = now.replace(minute=0, second=0, microsecond=0)
    future_candidates = [dt for dt in grouped if dt >= target]
    if future_candidates:
        selected = min(future_candidates)
        return grouped[selected]

    selected = max(grouped)
    return grouped[selected]


def _select_kma_nowcast_snapshot(items: list[dict[str, Any]]) -> dict[str, str]:
    snapshot: dict[str, str] = {}
    for item in items:
        category = str(item.get("category") or "")
        value = str(item.get("obsrValue") or "")
        if category:
            snapshot[category] = value
    return snapshot


def _first_kma_category_value(items: list[dict[str, Any]], category: str, fcst_date: str) -> str | None:
    for item in items:
        if str(item.get("category") or "") != category:
            continue
        if str(item.get("fcstDate") or "") != fcst_date:
            continue
        value = item.get("fcstValue")
        return str(value) if value is not None else None
    return None


def _forecast_item_datetime(item: dict[str, Any]) -> datetime | None:
    fcst_date = str(item.get("fcstDate") or "").strip()
    fcst_time = str(item.get("fcstTime") or "").strip()
    if len(fcst_date) != 8 or len(fcst_time) != 4:
        return None
    try:
        return datetime.strptime(f"{fcst_date}{fcst_time}", "%Y%m%d%H%M").replace(tzinfo=KST)
    except ValueError:
        return None


def _first_valid_air_measurement(items: list[dict[str, Any]]) -> dict[str, Any] | None:
    for item in items:
        pm10 = _safe_float(item.get("pm10Value"))
        pm25 = _safe_float(item.get("pm25Value"))
        if pm10 is None and pm25 is None:
            continue
        return item
    return None


def _nearest_station(latitude: float, longitude: float, stations: list[dict[str, Any]]) -> dict[str, Any] | None:
    best_station: dict[str, Any] | None = None
    best_distance = float("inf")
    for station in stations:
        station_lat = _safe_float(station.get("dmY"))
        station_lon = _safe_float(station.get("dmX"))
        if station_lat is None or station_lon is None:
            continue
        distance = _haversine_km(latitude, longitude, station_lat, station_lon)
        if distance < best_distance:
            best_distance = distance
            best_station = station
    return best_station


def _normalized_coords(*, latitude: float, longitude: float) -> dict[str, float]:
    lat = latitude if math.isfinite(latitude) else SEOUL_COORDS["latitude"]
    lon = longitude if math.isfinite(longitude) else SEOUL_COORDS["longitude"]
    lat = max(-90.0, min(90.0, lat))
    lon = max(-180.0, min(180.0, lon))
    return {
        "latitude": lat,
        "longitude": lon,
    }


def _latest_forecast_base_date(now: datetime) -> str:
    return _latest_forecast_base_datetime(now).strftime("%Y%m%d")


def _latest_forecast_base_time(now: datetime) -> str:
    return _latest_forecast_base_datetime(now).strftime("%H00")


def _latest_forecast_base_datetime(now: datetime) -> datetime:
    current = now.astimezone(KST)
    for hour in reversed(FORECAST_RELEASE_HOURS):
        release_dt = current.replace(hour=hour, minute=10, second=0, microsecond=0)
        if current >= release_dt:
            return release_dt.replace(minute=0)
    previous_day = current - timedelta(days=1)
    return previous_day.replace(hour=FORECAST_RELEASE_HOURS[-1], minute=0, second=0, microsecond=0)


def _latest_nowcast_base_date(now: datetime) -> str:
    return _latest_nowcast_base_datetime(now).strftime("%Y%m%d")


def _latest_nowcast_base_time(now: datetime) -> str:
    return _latest_nowcast_base_datetime(now).strftime("%H00")


def _latest_nowcast_base_datetime(now: datetime) -> datetime:
    current = now.astimezone(KST)
    if current.minute < 40:
        current = current - timedelta(hours=1)
    return current.replace(minute=0, second=0, microsecond=0)


def _weather_with_min_max_text(
    condition_text: str | None,
    current_value: float | None,
    min_value: float | None,
    max_value: float | None,
) -> str:
    label = condition_text.strip() if isinstance(condition_text, str) and condition_text.strip() else "날씨"
    current_temp = _rounded_int(current_value)
    min_temp = _rounded_int(min_value)
    max_temp = _rounded_int(max_value)
    current_text = f" {current_temp}°" if current_temp is not None else ""
    min_text = f"{min_temp}°" if min_temp is not None else "-°"
    max_text = f"{max_temp}°" if max_temp is not None else "-°"
    return f"{label}{current_text} ( {min_text} / {max_text} )"


def _dust_summary(pm25: float | None, pm10: float | None) -> str:
    pm25_value = _rounded_int(pm25)
    pm10_value = _rounded_int(pm10)
    pm25_text = str(pm25_value) if pm25_value is not None else "-"
    pm10_text = str(pm10_value) if pm10_value is not None else "-"

    levels = ["좋음", "보통", "나쁨", "매우나쁨"]
    pm25_grade = _dust_grade_pm25(pm25_value)
    pm10_grade = _dust_grade_pm10(pm10_value)
    overall_index = max(
        levels.index(pm25_grade) if pm25_grade in levels else -1,
        levels.index(pm10_grade) if pm10_grade in levels else -1,
    )
    overall = levels[overall_index] if overall_index >= 0 else "미정"
    return f"{overall} ( {pm10_text} / {pm25_text} ) µg/m³"


def _dust_grade_pm25(value: int | None) -> str | None:
    if value is None:
        return None
    if value <= 15:
        return "좋음"
    if value <= 35:
        return "보통"
    if value <= 75:
        return "나쁨"
    return "매우나쁨"


def _dust_grade_pm10(value: int | None) -> str | None:
    if value is None:
        return None
    if value <= 30:
        return "좋음"
    if value <= 80:
        return "보통"
    if value <= 150:
        return "나쁨"
    return "매우나쁨"


def _wind_summary(speed: float | None, degrees: float | None) -> str:
    speed_text = f"{_rounded_int(speed)}m/s" if _rounded_int(speed) is not None else "-m/s"
    arrow = _wind_direction_arrow(degrees)
    if not arrow:
        return f"바람 {speed_text}"
    return f"바람 {arrow} {speed_text}"


def _wind_direction_arrow(degrees: float | None) -> str | None:
    if degrees is None:
        return None
    arrows = ("↑", "↗", "→", "↘", "↓", "↙", "←", "↖")
    normalized = (degrees % 360 + 360) % 360
    index = round(normalized / 45) % len(arrows)
    return arrows[index]


def _kma_condition_text(*, pty_value: str | None, sky_value: str | None) -> str:
    pty_code = _safe_int(pty_value)
    if pty_code in {1, 2, 3, 4, 5, 6, 7}:
        return {
            1: "비",
            2: "비/눈",
            3: "눈",
            4: "소나기",
            5: "빗방울",
            6: "빗방울/눈날림",
            7: "눈날림",
        }.get(pty_code, "날씨")

    sky_code = _safe_int(sky_value)
    return {
        1: "맑음",
        3: "구름많음",
        4: "흐림",
    }.get(sky_code, "날씨")


def _open_meteo_weather_code_text(code: int | None) -> str:
    return {
        0: "맑음",
        1: "대체로 맑음",
        2: "대체로 맑음",
        3: "흐림",
        45: "안개",
        48: "안개",
        51: "이슬비",
        53: "이슬비",
        55: "이슬비",
        56: "어는 이슬비",
        57: "어는 이슬비",
        61: "비",
        63: "비",
        65: "비",
        66: "어는 비",
        67: "어는 비",
        71: "눈",
        73: "눈",
        75: "눈",
        77: "진눈깨비",
        80: "소나기",
        81: "소나기",
        82: "소나기",
        85: "눈 소나기",
        86: "눈 소나기",
        95: "뇌우",
        96: "강한 뇌우",
        99: "강한 뇌우",
    }.get(code, "날씨")


def _kma_observed_at(now: datetime, items: list[dict[str, Any]]) -> str:
    if not items:
        return now.isoformat()
    first = items[0]
    base_date = str(first.get("baseDate") or "").strip()
    base_time = str(first.get("baseTime") or "").strip()
    if len(base_date) == 8 and len(base_time) == 4:
        try:
            observed = datetime.strptime(f"{base_date}{base_time}", "%Y%m%d%H%M").replace(tzinfo=KST)
            return observed.isoformat()
        except ValueError:
            return now.isoformat()
    return now.isoformat()


def _direction_from_components(*, u_component: float | None, v_component: float | None) -> float | None:
    if u_component is None or v_component is None:
        return None
    radians_value = math.atan2(-u_component, -v_component)
    return (math.degrees(radians_value) + 360.0) % 360.0


def _lat_lon_to_kma_grid(latitude: float, longitude: float) -> tuple[int, int]:
    re = 6371.00877
    grid = 5.0
    slat1 = 30.0
    slat2 = 60.0
    olon = 126.0
    olat = 38.0
    xo = 43.0
    yo = 136.0

    degrad = math.pi / 180.0
    re /= grid
    slat1 *= degrad
    slat2 *= degrad
    olon *= degrad
    olat *= degrad

    sn = math.tan(math.pi * 0.25 + slat2 * 0.5) / math.tan(math.pi * 0.25 + slat1 * 0.5)
    sn = math.log(math.cos(slat1) / math.cos(slat2)) / math.log(sn)
    sf = math.tan(math.pi * 0.25 + slat1 * 0.5)
    sf = math.pow(sf, sn) * math.cos(slat1) / sn
    ro = math.tan(math.pi * 0.25 + olat * 0.5)
    ro = re * sf / math.pow(ro, sn)

    ra = math.tan(math.pi * 0.25 + latitude * degrad * 0.5)
    ra = re * sf / math.pow(ra, sn)
    theta = longitude * degrad - olon
    if theta > math.pi:
        theta -= 2.0 * math.pi
    if theta < -math.pi:
        theta += 2.0 * math.pi
    theta *= sn

    x = math.floor(ra * math.sin(theta) + xo + 0.5)
    y = math.floor(ro - ra * math.cos(theta) + yo + 0.5)
    return int(x), int(y)


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_km = 6371.0
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius_km * c


def _first_list_value(container: Any, key: str) -> float | None:
    if not isinstance(container, dict):
        return None
    values = container.get(key)
    if not isinstance(values, list) or not values:
        return None
    return _safe_float(values[0])


def _safe_int(value: Any) -> int | None:
    try:
        if value in (None, "", "-", "null"):
            return None
        return int(float(value))
    except (TypeError, ValueError):
        return None


def _safe_float(value: Any) -> float | None:
    try:
        if value in (None, "", "-", "null"):
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _rounded_int(value: float | None) -> int | None:
    if value is None or not math.isfinite(value):
        return None
    return int(round(value))


def _json_or_empty(response: httpx.Response) -> dict[str, Any]:
    try:
        payload = response.json()
    except ValueError:
        return {}
    return payload if isinstance(payload, dict) else {}
