# app/scrapers/besttime.py
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


class BestTimeScraper(BaseScraper):
    name = "besttime"

    async def scrape_resort(self, resort: Resort) -> None:
        if self.is_circuit_open():
            self.decrement_skip()
            return
        if not settings.besttime_api_key:
            logger.warning("BestTime.app API key not set — skipping crowd scrape")
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
        resorts = self.db.query(Resort).all()
        for resort in resorts:
            await self.scrape_resort(resort)
        await self.close()
