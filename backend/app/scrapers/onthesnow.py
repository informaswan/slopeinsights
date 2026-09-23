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
_FLIGHT_CHUNK = re.compile(r"self\.__next_f\.push\(\[(\d+),(.*?)\]\)</script>", re.DOTALL)
_FULL_RESORT_MARKER = '"fullResort":'


def _cm_to_in(cm: float | None) -> float | None:
    return round(cm * _CM_TO_IN, 1) if cm is not None else None


class OnTheSnowScraper(BaseScraper):
    name = "onthesnow"

    def _extract_full_resort(self, html: str) -> dict | None:
        # OnTheSnow uses the Next.js App Router: page data is streamed as
        # self.__next_f.push([1, "<json string>"]) chunks (there is no __NEXT_DATA__).
        # A JSON value can be split across chunks, so join them before searching.
        try:
            payload = "".join(
                json.loads(body) for kind, body in _FLIGHT_CHUNK.findall(html) if kind == "1"
            )
            start = payload.find(_FULL_RESORT_MARKER)
            if start == -1:
                return None
            full_resort, _ = json.JSONDecoder().raw_decode(payload, start + len(_FULL_RESORT_MARKER))
        except json.JSONDecodeError:
            return None
        return full_resort if isinstance(full_resort, dict) else None

    def _parse_resort_data(self, fr: dict) -> dict | None:
        snow = fr.get("snow") or {}
        lifts = fr.get("lifts") or {}
        runs = fr.get("runs") or {}
        return {
            "base_in": _cm_to_in(snow.get("base")),
            "new_24h_in": _cm_to_in(snow.get("last24")),
            "new_48h_in": _cm_to_in(snow.get("last48")),
            "new_7d_in": _cm_to_in(snow.get("last72")),  # closest available field
            "surface": str(fr.get("surfaceType")) if fr.get("surfaceType") is not None else None,
            "trails_open": runs.get("open"),
            "trails_total": runs.get("total"),
        }

    async def scrape_resort(self, resort: Resort) -> None:
        if self.is_circuit_open():
            self.decrement_skip()
            return
        url = f"{BASE_URL}/{resort.onthesnow_slug}/skireport"
        try:
            html = await self._fetch_html(url)
            full_resort = self._extract_full_resort(html)
            if not full_resort:
                raise ScraperError(f"No resort data found in page for {resort.name}")
            parsed = self._parse_resort_data(full_resort)
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

    async def scrape_all(self, skip_resort_ids: set[str] | frozenset[str] = frozenset()) -> None:
        """skip_resort_ids: resorts already updated from their own feed (see app/scrapers/snow)."""
        from app.scrapers.base import run_concurrently
        resorts = [r for r in self.db.query(Resort).all() if r.id not in skip_resort_ids]
        await run_concurrently([lambda r=r: self.scrape_resort(r) for r in resorts], concurrency=3)
        await self.close()
