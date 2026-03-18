# app/routers/resorts.py
"""
All /api/resorts/* endpoints.
Heavy data assembly is delegated to app/routers/_helpers.py.
"""
import json
import logging
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security.api_key import APIKeyHeader
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.cache import get_cached_resort_list, set_cached_resort_list
from app.scoring import rank_resorts
from app.models.resort import Resort
from app.models.lift import LiftStatus
from app.models.weather import WeatherForecast
from app.models.webcam import Webcam
from app.models.parking import ParkingLot
from app.models.snow import SnowCondition
from app.models.crowd import CrowdData
from app.routers._helpers import (
    build_resort_summary, crowd_current, crowd_label, is_stale,
    STALE_LIFT_SECONDS, STALE_SNOW_SECONDS, STALE_WEATHER_SECONDS, STALE_PARKING_SECONDS,
)
from app.schemas.resort import (
    ResortSummary, ResortDetail, BestResortResponse,
    SnowDetail, LiftDetail, LiftItem, WeatherDetail, WeatherPeriod,
    CrowdDetail, WebcamItem, ParkingDetail, LiveLot, StaticLot, TrailSummary,
)
from app.schemas.errors import ErrorResponse

logger = logging.getLogger(__name__)
router = APIRouter()

_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def _require_api_key(api_key: str = Security(_api_key_header)):
    if api_key != settings.api_key:
        raise HTTPException(status_code=401, detail=ErrorResponse(error="Unauthorized", code=401).model_dump())
    return api_key


# /resorts/best MUST be declared before /resorts/{resort_id} to avoid FastAPI
# matching the literal string "best" as a resort_id path parameter.

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
def get_resorts(db: Session = Depends(get_db), _: str = Depends(_require_api_key)):
    cached = get_cached_resort_list()
    if cached is not None:
        return cached
    resorts = db.query(Resort).all()
    result = [build_resort_summary(r, db) for r in resorts]
    set_cached_resort_list(result)
    return result


@router.get("/resorts/{resort_id}", response_model=ResortDetail)
def get_resort_detail(resort_id: str, db: Session = Depends(get_db), _: str = Depends(_require_api_key)):
    resort = db.query(Resort).filter_by(id=resort_id).first()
    if not resort:
        raise HTTPException(status_code=404, detail=ErrorResponse(error="Resort not found", code=404).model_dump())

    snow = db.query(SnowCondition).filter_by(resort_id=resort_id).first()
    lifts = db.query(LiftStatus).filter_by(resort_id=resort_id).all()
    today_dow = datetime.now(ZoneInfo(resort.timezone)).weekday()
    crowd_row = db.query(CrowdData).filter_by(resort_id=resort_id, day_of_week=today_dow).first()
    weather_rows = db.query(WeatherForecast).filter_by(resort_id=resort_id).all()
    webcams = db.query(Webcam).filter_by(resort_id=resort_id).all()
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

    crowd_detail = None
    if crowd_row:
        hourly = json.loads(crowd_row.hourly_json)
        pct, level = crowd_current(hourly, resort.timezone)
        label = crowd_label(hourly, today_dow)
        crowd_detail = {
            "current_level": level, "current_pct": pct,
            "source": "historical_pattern", "label": label,
            "hourly_start": "08:00", "hourly": hourly,
        }

    weather_detail = None
    if weather_rows:
        weather_detail = {
            "scraped_at": weather_rows[0].scraped_at.isoformat() if weather_rows[0].scraped_at else None,
            "is_stale": is_stale(weather_rows[0].scraped_at, STALE_WEATHER_SECONDS),
            "forecast": [
                {
                    "date": w.forecast_date,
                    "high_f": w.high_f, "low_f": w.low_f,
                    "precip_pct": w.precip_pct,
                    "snow_in_forecast": w.snow_in_forecast or False,
                    "wind_mph": w.wind_mph,
                }
                for w in weather_rows
            ],
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

    return {
        "id": resort.id, "name": resort.name, "pass_type": resort.pass_type,
        "region": resort.region, "state": resort.state, "country": resort.country,
        "summit_elevation_ft": resort.summit_elevation_ft,
        "vertical_drop_ft": resort.vertical_drop_ft,
        "website": resort.website,
        "snow": snow_detail, "lifts": lift_detail, "trails": trail_summary,
        "crowd": crowd_detail, "weather": weather_detail,
        "webcams": [{"label": w.label, "cam_type": w.cam_type, "url": w.url, "is_alive": w.is_alive} for w in webcams],
        "parking": parking_detail,
    }


@router.get("/resorts/{resort_id}/lifts")
def get_resort_lifts(resort_id: str, db: Session = Depends(get_db), _: str = Depends(_require_api_key)):
    resort = db.query(Resort).filter_by(id=resort_id).first()
    if not resort:
        raise HTTPException(status_code=404, detail={"error": "Resort not found", "code": 404})
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
        raise HTTPException(status_code=404, detail={"error": "Resort not found", "code": 404})
    webcams = db.query(Webcam).filter_by(resort_id=resort_id).all()
    return {
        "resort_id": resort_id,
        "items": [{"label": w.label, "cam_type": w.cam_type, "url": w.url, "is_alive": w.is_alive} for w in webcams],
    }


@router.get("/resorts/{resort_id}/parking")
def get_resort_parking(resort_id: str, db: Session = Depends(get_db), _: str = Depends(_require_api_key)):
    resort = db.query(Resort).filter_by(id=resort_id).first()
    if not resort:
        raise HTTPException(status_code=404, detail={"error": "Resort not found", "code": 404})
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
