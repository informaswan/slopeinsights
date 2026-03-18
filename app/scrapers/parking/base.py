# app/scrapers/parking/base.py
import logging
from abc import abstractmethod
from datetime import datetime, timezone

from app.models.parking import ParkingLot
from app.scrapers.base import BaseScraper, ScraperError

logger = logging.getLogger(__name__)


class BaseParkingScraper(BaseScraper):
    resort_id: str
    parking_url: str

    @abstractmethod
    async def _scrape(self) -> list[dict]:
        """Return list of {"lot_name": str, "status": str, "capacity_pct": int|None}."""

    async def scrape(self) -> None:
        if self.is_circuit_open():
            self.decrement_skip()
            return
        try:
            lots_data = await self._scrape()
        except ScraperError as exc:
            self._record_failure(str(exc))
            logger.warning("Parking scrape failed for %s: %s", self.resort_id, exc)
            self.db.query(ParkingLot).filter_by(resort_id=self.resort_id, is_live=True).update(
                {"is_stale": True}
            )
            self.db.commit()
            return

        now = datetime.now(timezone.utc)
        existing = {
            row.lot_name: row
            for row in self.db.query(ParkingLot).filter_by(resort_id=self.resort_id, is_live=True).all()
        }
        for lot in lots_data:
            lot_name = lot["lot_name"]
            if lot_name in existing:
                row = existing[lot_name]
                row.status = lot["status"]
                row.capacity_pct = lot.get("capacity_pct")
                row.is_stale = False
                row.scraped_at = now
            else:
                self.db.add(ParkingLot(
                    resort_id=self.resort_id,
                    lot_name=lot_name,
                    is_live=True,
                    status=lot["status"],
                    capacity_pct=lot.get("capacity_pct"),
                    scraped_at=now,
                    is_stale=False,
                ))
        self.db.commit()
        self._record_success()
