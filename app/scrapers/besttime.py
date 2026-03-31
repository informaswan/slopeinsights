# app/scrapers/besttime.py
"""
Crowd pattern scraper.

When a BestTime.app API key is configured, fetches real crowd data.
When no key is set (dev/local), seeds synthetic but realistic ski resort
crowd patterns so the UI has something to render.

Synthetic pattern: 10 hourly buckets, 08:00–17:00, intensity 0-4.
  0 = not busy, 4 = very busy.
"""
import json
import logging

from app.config import settings
from app.models.resort import Resort
from app.models.crowd import CrowdData
from app.scrapers.base import BaseScraper

logger = logging.getLogger(__name__)

API_URL = "https://besttime.app/api/v1/forecasts"
OPERATING_START_HOUR = 8
OPERATING_END_HOUR = 17

# Synthetic patterns per day-of-week (Python convention: 0=Monday, 6=Sunday).
# 10 values: 8am, 9am, 10am, 11am, 12pm, 1pm, 2pm, 3pm, 4pm, 5pm
_SYNTHETIC_PATTERNS = {
    0: [1, 2, 2, 2, 1, 1, 1, 0, 0, 0],  # Monday   — quiet
    1: [1, 2, 2, 2, 1, 1, 1, 0, 0, 0],  # Tuesday  — quiet
    2: [1, 2, 3, 2, 2, 1, 1, 0, 0, 0],  # Wednesday — moderate
    3: [2, 3, 3, 2, 2, 1, 1, 0, 0, 0],  # Thursday  — moderate+
    4: [2, 3, 4, 3, 2, 2, 1, 1, 0, 0],  # Friday    — busy (day-trippers)
    5: [3, 4, 4, 4, 3, 2, 2, 1, 1, 0],  # Saturday  — very busy
    6: [3, 4, 4, 3, 2, 2, 1, 1, 0, 0],  # Sunday    — busy
}


def _seed_synthetic(db, resort_id: str) -> None:
    for day_of_week, hourly in _SYNTHETIC_PATTERNS.items():
        existing = db.query(CrowdData).filter_by(
            resort_id=resort_id, day_of_week=day_of_week
        ).first()
        if existing:
            existing.hourly_json = json.dumps(hourly)
        else:
            db.add(CrowdData(
                resort_id=resort_id,
                day_of_week=day_of_week,
                hourly_json=json.dumps(hourly),
            ))
    db.commit()


class BestTimeScraper(BaseScraper):
    name = "besttime"

    async def scrape_resort(self, resort: Resort) -> None:
        if self.is_circuit_open():
            self.decrement_skip()
            return

        if not settings.besttime_api_key:
            _seed_synthetic(self.db, resort.id)
            return

        try:
            resp = await self.client.post(
                API_URL,
                json={
                    "api_key_public": settings.besttime_api_key,
                    "venue_name": resort.name,
                    "venue_address": f"{resort.state}, {resort.country}",
                },
            )
            resp.raise_for_status()
            data = resp.json()
        except Exception as exc:
            self._record_failure(str(exc))
            logger.warning("BestTime scrape failed for %s: %s", resort.name, exc)
            return

        week_raw = data.get("analysis", {}).get("week_raw", [])
        for day_data in week_raw:
            day_of_week = day_data["day_int"]
            hour_map = {h["hour"]: h["intensity_nr"] for h in day_data.get("hour_analysis", [])}
            hourly = [
                hour_map.get(hour, 0)
                for hour in range(OPERATING_START_HOUR, OPERATING_END_HOUR + 1)
            ]
            existing = self.db.query(CrowdData).filter_by(
                resort_id=resort.id, day_of_week=day_of_week
            ).first()
            if existing:
                existing.hourly_json = json.dumps(hourly)
            else:
                self.db.add(CrowdData(
                    resort_id=resort.id,
                    day_of_week=day_of_week,
                    hourly_json=json.dumps(hourly),
                ))
        self.db.commit()
        self._record_success()

    async def scrape_all(self) -> None:
        from app.scrapers.base import run_concurrently
        resorts = self.db.query(Resort).all()
        await run_concurrently([lambda r=r: self.scrape_resort(r) for r in resorts], concurrency=10)
        await self.close()
