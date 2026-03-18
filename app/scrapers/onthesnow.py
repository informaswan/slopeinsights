# app/scrapers/onthesnow.py
import json
import logging
import re
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.resort import Resort
from app.models.snow import SnowCondition
from app.scrapers.base import BaseScraper, ScraperError

logger = logging.getLogger(__name__)

BASE_URL = "https://www.onthesnow.com"
_CM_TO_IN = 0.393701


def _cm_to_in(cm: float | None) -> float | None:
    return round(cm * _CM_TO_IN, 1) if cm is not None else None


class OnTheSnowScraper(BaseScraper):
    name = "onthesnow"

    def _extract_next_data(self, html: str) -> dict | None:
        match = re.search(
            r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL
        )
        if not match:
            return None
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            return None

    def _parse_resort_data(self, data: dict) -> dict | None:
        try:
            resort_data = data["props"]["pageProps"]["resort"]
        except (KeyError, TypeError):
            return None
        return {
            "base_in": _cm_to_in(resort_data.get("snowDepthBase")),
            "new_24h_in": _cm_to_in(resort_data.get("snowfall24Hours")),
            "new_48h_in": _cm_to_in(resort_data.get("snowfall48Hours")),
            "new_7d_in": _cm_to_in(resort_data.get("snowfall7Days")),
            "surface": resort_data.get("surfaceConditions"),
            "trails_open": resort_data.get("openTrails"),
            "trails_total": resort_data.get("totalTrails"),
        }

    async def scrape_resort(self, resort: Resort) -> None:
        if self.is_circuit_open():
            self.decrement_skip()
            return
        url = f"{BASE_URL}/{resort.onthesnow_slug}"
        try:
            html = await self._fetch_html(url)
            next_data = self._extract_next_data(html)
            if not next_data:
                raise ScraperError(f"No __NEXT_DATA__ found for {resort.name}")
            parsed = self._parse_resort_data(next_data)
            if not parsed:
                raise ScraperError(f"Could not parse resort data for {resort.name}")
        except ScraperError as exc:
            self._record_failure(str(exc))
            logger.warning("OnTheSnow scrape failed for %s: %s", resort.name, exc)
            existing = self.db.query(SnowCondition).filter_by(resort_id=resort.id).first()
            if existing:
                existing.is_stale = True
                self.db.commit()
            return

        now = datetime.now(timezone.utc)
        existing = self.db.query(SnowCondition).filter_by(resort_id=resort.id).first()
        if existing:
            for k, v in parsed.items():
                setattr(existing, k, v)
            existing.scraped_at = now
            existing.is_stale = False
        else:
            self.db.add(SnowCondition(resort_id=resort.id, scraped_at=now, is_stale=False, **parsed))
        self.db.commit()
        self._record_success()

    async def scrape_all(self) -> None:
        resorts = self.db.query(Resort).all()
        for resort in resorts:
            await self.scrape_resort(resort)
        await self.close()
