# app/scrapers/lift_status/jackson_hole.py
"""
Jackson Hole's own site-wide data feed (covers snow, weather, lifts, trails,
webcams all in one payload).
SOURCE: https://www.jacksonhole.com/api/all.json — public JSON, no API key.
"""
from app.scrapers.lift_status.base import BaseFeedLiftScraper

API_URL = "https://www.jacksonhole.com/api/all.json"

RESORT_FEED_IDS = {"jackson-hole": API_URL}


class JacksonHoleScraper(BaseFeedLiftScraper):
    name = "lift_status_jackson_hole"
    resort_feed_ids = RESORT_FEED_IDS

    async def _fetch_lifts(self, url: str) -> list[tuple[str, str | None]]:
        data = await self._fetch_json(url)
        lifts = data.get("lifts") or {}
        return [(lift["name"], lift.get("openingStatus")) for lift in lifts.values() if lift.get("name")]
