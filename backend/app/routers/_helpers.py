# app/routers/_helpers.py
"""
Helpers shared by the resorts router.
Contains: staleness check, crowd busyness computation, resort summary builder.
Not part of the public API — prefixed with underscore to indicate internal use.
"""
import json
import logging
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.models.resort import Resort
from app.models.snow import SnowCondition
from app.models.lift import LiftStatus
from app.models.crowd import CrowdData

logger = logging.getLogger(__name__)

STALE_SNOW_SECONDS = 7200    # 2 hours
STALE_LIFT_SECONDS = 1800    # 30 minutes
STALE_WEATHER_SECONDS = 7200
STALE_PARKING_SECONDS = 1800

OPERATING_START_HOUR = 8
OPERATING_END_HOUR = 17


def is_stale(scraped_at: datetime | None, threshold_seconds: int) -> bool:
    if scraped_at is None:
        return True
    now = datetime.now(timezone.utc)
    if scraped_at.tzinfo is None:
        scraped_at = scraped_at.replace(tzinfo=timezone.utc)
    return (now - scraped_at).total_seconds() > threshold_seconds


def crowd_current(hourly: list[int], resort_tz: str) -> tuple[int | None, str | None]:
    """Return (current_pct, level) for right now in resort local time."""
    try:
        tz = ZoneInfo(resort_tz)
        local_hour = datetime.now(tz).hour
    except Exception:
        return None, None
    if local_hour < OPERATING_START_HOUR or local_hour > OPERATING_END_HOUR:
        return None, "closed"
    idx = local_hour - OPERATING_START_HOUR
    idx = max(0, min(idx, len(hourly) - 1))
    pct = hourly[idx]
    level = "low" if pct < 33 else ("medium" if pct < 66 else "high")
    return pct, level


def crowd_label(hourly: list[int], day_of_week: int) -> str:
    DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    day_name = DAY_NAMES[day_of_week % 7]
    peak_hours = [i for i, v in enumerate(hourly) if v >= 70]
    if not peak_hours:
        return f"Typically quiet on {day_name}s"
    start_h = OPERATING_START_HOUR + peak_hours[0]
    end_h = OPERATING_START_HOUR + peak_hours[-1]
    fmt = lambda h: f"{h % 12 or 12}{'am' if h < 12 else 'pm'}"
    return f"Typically busiest {fmt(start_h)}–{fmt(end_h)} on {day_name}s"


def build_resort_summary(resort: Resort, db: Session) -> dict:
    snow = db.query(SnowCondition).filter_by(resort_id=resort.id).first()
    lifts = db.query(LiftStatus).filter_by(resort_id=resort.id).all()
    open_lifts = [l for l in lifts if l.status == "open"]
    try:
        today_dow = datetime.now(ZoneInfo(resort.timezone)).weekday()
    except Exception:
        today_dow = datetime.now(timezone.utc).weekday()
    crowd_row = db.query(CrowdData).filter_by(resort_id=resort.id, day_of_week=today_dow).first()

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

    crowd_summary = None
    if crowd_row:
        hourly = json.loads(crowd_row.hourly_json)
        pct, level = crowd_current(hourly, resort.timezone)
        crowd_summary = {"current_level": level, "current_pct": pct, "source": "historical_pattern"}

    return {
        "id": resort.id,
        "name": resort.name,
        "pass_type": resort.pass_type,
        "region": resort.region,
        "state": resort.state,
        "snow": snow_summary,
        "lifts": lift_summary,
        "trails": trail_summary,
        "crowd": crowd_summary,
    }
