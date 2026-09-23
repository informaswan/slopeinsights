# app/routers/_helpers.py
"""
Helpers shared by the resorts router.
Contains: staleness check and the resort summary builder.
Not part of the public API — prefixed with underscore to indicate internal use.
"""
import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.resort import Resort
from app.models.snow import SnowCondition
from app.models.lift import LiftStatus

logger = logging.getLogger(__name__)

STALE_SNOW_SECONDS = 7200    # 2 hours
STALE_LIFT_SECONDS = 1800    # 30 minutes
STALE_WEATHER_SECONDS = 7200
STALE_PARKING_SECONDS = 1800


def is_stale(scraped_at: datetime | None, threshold_seconds: int) -> bool:
    if scraped_at is None:
        return True
    now = datetime.now(timezone.utc)
    if scraped_at.tzinfo is None:
        scraped_at = scraped_at.replace(tzinfo=timezone.utc)
    return (now - scraped_at).total_seconds() > threshold_seconds


def build_resort_summary(resort: Resort, db: Session) -> dict:
    snow = db.query(SnowCondition).filter_by(resort_id=resort.id).first()
    lifts = db.query(LiftStatus).filter_by(resort_id=resort.id).all()
    open_lifts = [l for l in lifts if l.status == "open"]

    snow_summary = None
    if snow:
        snow_summary = {
            "base_in": snow.base_in,
            "new_24h_in": snow.new_24h_in,
            "scraped_at": snow.scraped_at.isoformat() if snow.scraped_at else None,
            "is_stale": is_stale(snow.scraped_at, STALE_SNOW_SECONDS),
        }

    lift_summary = None
    if lifts:
        lift_summary = {"open": len(open_lifts), "total": len(lifts)}

    trail_summary = None
    if snow:
        trail_summary = {"open": snow.trails_open, "total": snow.trails_total}

    return {
        "id": resort.id,
        "name": resort.name,
        "pass_type": resort.pass_type,
        "region": resort.region,
        "state": resort.state,
        "snow": snow_summary,
        "lifts": lift_summary,
        "trails": trail_summary,
    }
