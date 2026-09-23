# app/routers/resorts.py
"""
All /api/resorts/* endpoints.
Heavy data assembly is delegated to app/routers/_helpers.py.
"""
import json
import logging
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Security
from fastapi.responses import Response
from fastapi.security.api_key import APIKeyHeader
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.cache import (
    get_cached_resort_list, set_cached_resort_list,
    get_cached_resort_detail, set_cached_resort_detail, CACHE_TTL_SECONDS,
)
from app.scoring import rank_resorts
from app.models.resort import Resort
from app.models.lift import LiftStatus
from app.models.weather import WeatherForecast
from app.models.webcam import Webcam
from app.models.parking import ParkingLot
from app.models.snow import SnowCondition
from app.models.snow_forecast import SnowForecast
from app.routers._helpers import (
    build_resort_summary, is_stale,
    STALE_LIFT_SECONDS, STALE_SNOW_SECONDS, STALE_WEATHER_SECONDS, STALE_PARKING_SECONDS,
)
from app.schemas.resort import (
    ResortSummary, ResortDetail, BestResortResponse, RoadCameraResponse,
    SnowDetail, LiftDetail, LiftItem, WeatherDetail, WeatherPeriod,
    WebcamItem, ParkingDetail, LiveLot, StaticLot, TrailSummary,
)
from app.schemas.errors import ErrorResponse
from app.traffic_cams import road_camera_groups, traffic_cams_for, traffic_cams_note
from app.traffic_cams import COMING_SOON_NOTE

logger = logging.getLogger(__name__)
def _merge_forecast_by_date(rows: list[WeatherForecast]) -> list[dict]:
    """NOAA gives a separate day and night period per date; serve one entry per date.

    High comes from the day period and low from the night period. Precipitation and
    wind take the worst of the two, and snow is flagged if either period mentions it.
    snow_amount_in is a daily total the scraper already computed and stored on both
    periods for that date, so it's taken once rather than summed.
    """
    days: dict[str, dict] = {}
    for w in rows:
        day = days.setdefault(w.forecast_date, {
            "date": w.forecast_date, "high_f": None, "low_f": None,
            "precip_pct": None, "snow_in_forecast": False, "wind_mph": None,
            "snow_amount_in": None,
        })
        if w.high_f is not None and day["high_f"] is None:
            day["high_f"] = w.high_f
        if w.low_f is not None and day["low_f"] is None:
            day["low_f"] = w.low_f
        if w.precip_pct is not None:
            day["precip_pct"] = max(day["precip_pct"] or 0, w.precip_pct)
        if w.wind_mph is not None:
            day["wind_mph"] = max(day["wind_mph"] or 0, w.wind_mph)
        day["snow_in_forecast"] = day["snow_in_forecast"] or bool(w.snow_in_forecast)
        if w.snow_amount_in is not None and day["snow_amount_in"] is None:
            day["snow_amount_in"] = w.snow_amount_in
    return list(days.values())


router = APIRouter()

_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def _require_api_key(api_key: str = Security(_api_key_header)):
    # Skip auth entirely in development (when api_key is empty or env is development)
    if settings.environment == "development" or not settings.api_key:
        return api_key
    if api_key != settings.api_key:
        raise HTTPException(status_code=401, detail=ErrorResponse(error="Unauthorized", code=401).model_dump())
    return api_key


# /resorts/best MUST be declared before /resorts/{resort_id} to avoid FastAPI
# matching the literal string "best" as a resort_id path parameter.

@router.get("/road-cameras", response_model=RoadCameraResponse)
def get_road_cameras(_: str = Depends(_require_api_key)):
    return {"groups": road_camera_groups(), "note": COMING_SOON_NOTE}


@router.get("/resorts/best", response_model=BestResortResponse)
def get_best_resorts(db: Session = Depends(get_db), _: str = Depends(_require_api_key)):
    cached = get_cached_resort_list()
    if cached is None:
        resorts = db.query(Resort).all()
        cached = [build_resort_summary(r, db) for r in resorts]
        set_cached_resort_list(cached)  # populate cache so /api/resorts benefits too
    top = rank_resorts(cached, n=5)
    return {"resorts": top, "generated_at": datetime.now(timezone.utc).isoformat()}


@router.get("/resorts", response_model=list[ResortSummary])
def get_resorts(response: Response, db: Session = Depends(get_db), _: str = Depends(_require_api_key)):
    response.headers["Cache-Control"] = f"public, max-age={CACHE_TTL_SECONDS}"
    cached = get_cached_resort_list()
    if cached is not None:
        return cached
    resorts = db.query(Resort).all()
    result = [build_resort_summary(r, db) for r in resorts]
    set_cached_resort_list(result)
    return result


@router.get("/resorts/{resort_id}", response_model=ResortDetail)
def get_resort_detail(resort_id: str, response: Response, db: Session = Depends(get_db), _: str = Depends(_require_api_key)):
    response.headers["Cache-Control"] = f"public, max-age={CACHE_TTL_SECONDS}"
    cached = get_cached_resort_detail(resort_id)
    if cached is not None:
        return cached

    resort = db.query(Resort).filter_by(id=resort_id).first()
    if not resort:
        raise HTTPException(status_code=404, detail=ErrorResponse(error="Resort not found", code=404).model_dump())

    snow = db.query(SnowCondition).filter_by(resort_id=resort_id).first()
    snow_forecast_row = db.query(SnowForecast).filter_by(resort_id=resort_id).first()
    lifts = db.query(LiftStatus).filter_by(resort_id=resort_id).all()
    weather_rows = (
        db.query(WeatherForecast).filter_by(resort_id=resort_id)
        .order_by(WeatherForecast.forecast_date, WeatherForecast.id).all()
    )
    webcams = db.query(Webcam).filter_by(resort_id=resort_id, category="mountain").all()
    live_traffic_cams = db.query(Webcam).filter_by(resort_id=resort_id, category="traffic").all()
    parking_live = db.query(ParkingLot).filter_by(resort_id=resort_id, is_live=True).all()
    parking_static = db.query(ParkingLot).filter_by(resort_id=resort_id, is_live=False).all()

    snow_detail = None
    if snow:
        snow_detail = {
            "base_in": snow.base_in, "new_24h_in": snow.new_24h_in,
            "new_48h_in": snow.new_48h_in, "new_7d_in": snow.new_7d_in,
            "surface": snow.surface,
            "scraped_at": snow.scraped_at.isoformat() if snow.scraped_at else None,
            "is_stale": is_stale(snow.scraped_at, STALE_SNOW_SECONDS),
        }

    snow_forecast_detail = None
    if snow_forecast_row:
        snow_forecast_detail = {
            "next_24h_in": snow_forecast_row.next_24h_in,
            "next_48h_in": snow_forecast_row.next_48h_in,
            "next_72h_in": snow_forecast_row.next_72h_in,
            "scraped_at": snow_forecast_row.scraped_at.isoformat() if snow_forecast_row.scraped_at else None,
            "is_stale": is_stale(snow_forecast_row.scraped_at, STALE_WEATHER_SECONDS),
        }

    lift_detail = None
    if lifts:
        open_lifts = [l for l in lifts if l.status == "open"]
        lift_detail = {
            "open": len(open_lifts), "total": len(lifts),
            "scraped_at": lifts[0].scraped_at.isoformat() if lifts[0].scraped_at else None,
            "is_stale": is_stale(lifts[0].scraped_at, STALE_LIFT_SECONDS),
            "items": [{"name": l.lift_name, "status": l.status} for l in lifts],
        }

    trail_summary = None
    if snow:
        trail_summary = {"open": snow.trails_open, "total": snow.trails_total}

    weather_detail = None
    if weather_rows:
        weather_detail = {
            "scraped_at": weather_rows[0].scraped_at.isoformat() if weather_rows[0].scraped_at else None,
            "is_stale": is_stale(weather_rows[0].scraped_at, STALE_WEATHER_SECONDS),
            "forecast": _merge_forecast_by_date(weather_rows),
        }

    has_live = len(parking_live) > 0
    parking_scraped_at = parking_live[0].scraped_at if parking_live else None
    parking_detail = {
        "has_live_data": has_live,
        "scraped_at": parking_scraped_at.isoformat() if parking_scraped_at else None,
        "is_stale": is_stale(parking_scraped_at, STALE_PARKING_SECONDS) if has_live else False,
        "live_lots": [
            {"name": p.lot_name, "status": p.status, "capacity_pct": p.capacity_pct}
            for p in parking_live
        ],
        "static_lots": [
            {"name": p.lot_name, "distance_ft": p.distance_ft,
             "cost": p.cost, "directions_url": p.directions_url}
            for p in parking_static
        ],
    }

    result = {
        "id": resort.id, "name": resort.name, "pass_type": resort.pass_type,
        "region": resort.region, "state": resort.state, "country": resort.country,
        "summit_elevation_ft": resort.summit_elevation_ft,
        "vertical_drop_ft": resort.vertical_drop_ft,
        "website": resort.website,
        "latitude": resort.latitude,
        "longitude": resort.longitude,
        "snow": snow_detail, "snow_forecast": snow_forecast_detail, "lifts": lift_detail, "trails": trail_summary,
        "weather": weather_detail,
        "webcams": [{"label": w.label, "cam_type": w.cam_type, "url": w.url, "is_alive": w.is_alive} for w in webcams],
        "parking": parking_detail,
        "traffic_cams": traffic_cams_for(resort.id, resort.state),
        "traffic_cams_note": traffic_cams_note(resort.id),
        "live_traffic_cams": [
            {"label": w.label, "cam_type": w.cam_type, "url": w.url, "is_alive": w.is_alive}
            for w in live_traffic_cams
        ],
    }
    set_cached_resort_detail(resort_id, result)
    return result


@router.get("/resorts/{resort_id}/lifts")
def get_resort_lifts(resort_id: str, db: Session = Depends(get_db), _: str = Depends(_require_api_key)):
    resort = db.query(Resort).filter_by(id=resort_id).first()
    if not resort:
        raise HTTPException(status_code=404, detail=ErrorResponse(error="Resort not found", code=404).model_dump())
    lifts = db.query(LiftStatus).filter_by(resort_id=resort_id).all()
    open_lifts = [l for l in lifts if l.status == "open"]
    stale = is_stale(lifts[0].scraped_at if lifts else None, STALE_LIFT_SECONDS)
    return {
        "resort_id": resort_id,
        "open": len(open_lifts), "total": len(lifts),
        "scraped_at": lifts[0].scraped_at.isoformat() if lifts else None,
        "is_stale": stale,
        "items": [{"name": l.lift_name, "status": l.status} for l in lifts],
    }


@router.get("/resorts/{resort_id}/webcams")
def get_resort_webcams(resort_id: str, db: Session = Depends(get_db), _: str = Depends(_require_api_key)):
    resort = db.query(Resort).filter_by(id=resort_id).first()
    if not resort:
        raise HTTPException(status_code=404, detail=ErrorResponse(error="Resort not found", code=404).model_dump())
    webcams = db.query(Webcam).filter_by(resort_id=resort_id, category="mountain").all()
    return {
        "resort_id": resort_id,
        "items": [{"label": w.label, "cam_type": w.cam_type, "url": w.url, "is_alive": w.is_alive} for w in webcams],
    }


@router.get("/webcam-proxy")
async def webcam_proxy(url: str = Query(...)):
    """Proxy webcam JPEG images to avoid cross-origin hotlink blocks."""
    allowed_hosts = {
        "webcams.opensnow.com", "media.mammothresorts.com", "backend.roundshot.com",
        "511on.ca", "www.drivebc.ca",
    }
    from urllib.parse import urlparse
    host = urlparse(url).hostname or ""
    if host not in allowed_hosts:
        raise HTTPException(status_code=400, detail="Disallowed webcam host")
    async with httpx.AsyncClient(follow_redirects=True) as client:
        try:
            r = await client.get(url, timeout=8.0, headers={"User-Agent": "Mozilla/5.0"})
            r.raise_for_status()
        except Exception:
            raise HTTPException(status_code=502, detail="Upstream webcam unavailable")
    return Response(content=r.content, media_type=r.headers.get("content-type", "image/jpeg"),
                    headers={"Cache-Control": "public, max-age=30"})


@router.get("/resorts/{resort_id}/parking")
def get_resort_parking(resort_id: str, db: Session = Depends(get_db), _: str = Depends(_require_api_key)):
    resort = db.query(Resort).filter_by(id=resort_id).first()
    if not resort:
        raise HTTPException(status_code=404, detail=ErrorResponse(error="Resort not found", code=404).model_dump())
    live = db.query(ParkingLot).filter_by(resort_id=resort_id, is_live=True).all()
    static = db.query(ParkingLot).filter_by(resort_id=resort_id, is_live=False).all()
    scraped_at = live[0].scraped_at if live else None
    return {
        "resort_id": resort_id,
        "has_live_data": len(live) > 0,
        "scraped_at": scraped_at.isoformat() if scraped_at else None,
        "is_stale": is_stale(scraped_at, STALE_PARKING_SECONDS) if live else False,
        "live_lots": [{"name": p.lot_name, "status": p.status, "capacity_pct": p.capacity_pct} for p in live],
        "static_lots": [{"name": p.lot_name, "distance_ft": p.distance_ft, "cost": p.cost, "directions_url": p.directions_url} for p in static],
    }
