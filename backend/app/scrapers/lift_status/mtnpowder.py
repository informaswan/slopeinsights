# app/scrapers/lift_status/mtnpowder.py
"""
mtnpowder.com lift-status feed — shared platform used by several Alterra-family
resorts (and Stratton/Sugarbush/Crystal, on the same white-label backend).
SOURCE: https://mtnpowder.com/feed/{feed_id}/lifts — public JSON, no API key.
Feed ids found via liftie.info's open-source resort descriptors and confirmed live.
"""
from app.scrapers.lift_status.base import BaseFeedLiftScraper

BASE_URL = "https://mtnpowder.com/feed"

RESORT_FEED_IDS = {
    "mammoth": 60,
    "steamboat": 6,
    "deer-valley": 49,
    "solitude": 65,
    "palisades-tahoe": 61,
    "stratton": 1,
    "sugarbush": 70,
    "crystal-mountain": 80,
}


class MtnPowderScraper(BaseFeedLiftScraper):
    name = "lift_status_mtnpowder"
    resort_feed_ids = RESORT_FEED_IDS

    async def _fetch_lifts(self, feed_id: int) -> list[tuple[str, str | None]]:
        data = await self._fetch_json(f"{BASE_URL}/{feed_id}/lifts")
        return [(lift["Name"], lift.get("StatusEnglish") or lift.get("Status")) for lift in data]
