# app/scrapers/liftie.py
import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.resort import Resort
from app.models.lift import LiftStatus
from app.scrapers.base import BaseScraper, ScraperError

logger = logging.getLogger(__name__)

BASE_URL = "https://liftie.info/api/resort"

_STATUS_MAP = {
    "open": "open",
    "closed": "closed",
    "on hold": "on_hold",
    "hold": "on_hold",
    "scheduled": "closed",
}


class LiftieScraper(BaseScraper):
    name = "liftie"

    async def scrape_resort(self, resort: Resort) -> None:
        if self.is_circuit_open():
            self.decrement_skip()
            return
        url = f"{BASE_URL}/{resort.liftie_id}"
        try:
            data = await self._fetch_json(url)
        except ScraperError as exc:
            self._record_failure(str(exc))
            logger.warning("Liftie scrape failed for %s: %s", resort.name, exc)
            self.db.query(LiftStatus).filter_by(resort_id=resort.id).update({"is_stale": True})
            self.db.commit()
            await asyncio.sleep(5)
            return

        lifts_raw: dict = data.get("lifts", {})
        now = datetime.now(timezone.utc)
        self.db.query(LiftStatus).filter_by(resort_id=resort.id).delete()
        for lift_name, raw_status in lifts_raw.items():
            if isinstance(raw_status, dict):
                raw_status = raw_status.get("status", "closed")
            status = _STATUS_MAP.get(str(raw_status).lower(), "closed")
            self.db.add(LiftStatus(
                resort_id=resort.id,
                lift_name=lift_name,
                status=status,
                scraped_at=now,
                is_stale=False,
            ))
        self.db.commit()
        self._record_success()
        await asyncio.sleep(5)  # rate limit: hold semaphore slot for 5s → max ~12 req/min

    async def scrape_all(self) -> None:
        from app.scrapers.base import run_concurrently
        resorts = self.db.query(Resort).all()
        # concurrency=1 + 5s inter-request delay = ~12 requests/min, very conservative rate limit
        await run_concurrently([lambda r=r: self.scrape_resort(r) for r in resorts], concurrency=1)
        await self.close()
