# app/scrapers/lift_status/base.py
"""
Shared base for lift-status scrapers that pull from one feed per resort, where
several resorts run on the very same platform (mtnpowder.com, a shared
dor/drupal API, etc). A subclass just maps resort_id -> that platform's feed
identifier and implements _fetch_lifts(feed_id).
"""
import logging
from abc import abstractmethod
from datetime import datetime, timezone

from app.models.lift import LiftStatus
from app.scrapers.base import BaseScraper, ScraperError
from app.scrapers.lift_status._status import normalize_status

logger = logging.getLogger(__name__)


class BaseFeedLiftScraper(BaseScraper):
    resort_feed_ids: dict = {}  # resort_id -> feed identifier; subclasses set this

    @abstractmethod
    async def _fetch_lifts(self, feed_id) -> list[tuple[str, str | None]]:
        """Return [(lift_name, raw_status), ...] for one resort's feed."""

    async def _scrape_one(self, resort_id: str, feed_id) -> None:
        if self.is_circuit_open():
            self.decrement_skip()
            return
        try:
            lifts = await self._fetch_lifts(feed_id)
        except ScraperError as exc:
            self._record_failure(str(exc))
            logger.warning("%s lift scrape failed for %s: %s", self.name, resort_id, exc)
            self.db.query(LiftStatus).filter_by(resort_id=resort_id).update({"is_stale": True})
            self.db.commit()
            return

        now = datetime.now(timezone.utc)
        self.db.query(LiftStatus).filter_by(resort_id=resort_id).delete()
        for lift_name, raw_status in lifts:
            self.db.add(LiftStatus(
                resort_id=resort_id, lift_name=lift_name,
                status=normalize_status(raw_status), scraped_at=now, is_stale=False,
            ))
        self.db.commit()
        self._record_success()

    async def scrape_all(self) -> None:
        for resort_id, feed_id in self.resort_feed_ids.items():
            await self._scrape_one(resort_id, feed_id)
