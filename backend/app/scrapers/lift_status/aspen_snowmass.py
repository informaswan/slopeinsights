# app/scrapers/lift_status/aspen_snowmass.py
"""
Aspen Snowmass's own lift-status feed, one call per base area.
SOURCE: https://www.aspensnowmass.com/aspensnowmass/liftstatus/feed?mountain={area}
Public JSON, no API key. We treat "aspen-snowmass" as one resort covering all
four base areas (Aspen Mountain, Snowmass, Aspen Highlands, Buttermilk), so
their lifts are merged into a single resort_id's lift list.
"""
from app.scrapers.lift_status.base import BaseFeedLiftScraper

API_URL = "https://www.aspensnowmass.com/aspensnowmass/liftstatus/feed"

MOUNTAIN_AREAS = ["AspenMountain", "Snowmass", "AspenHighlands", "Buttermilk"]

RESORT_FEED_IDS = {"aspen-snowmass": MOUNTAIN_AREAS}


class AspenSnowmassScraper(BaseFeedLiftScraper):
    name = "lift_status_aspen_snowmass"
    resort_feed_ids = RESORT_FEED_IDS

    async def _fetch_lifts(self, mountain_areas: list[str]) -> list[tuple[str, str | None]]:
        lifts: list[tuple[str, str | None]] = []
        for area in mountain_areas:
            data = await self._fetch_json(f"{API_URL}?mountain={area}")
            for lift in data.get("liftStatuses") or []:
                lifts.append((f"{lift['liftName']} ({lift.get('area') or area})", lift.get("status")))
        return lifts
