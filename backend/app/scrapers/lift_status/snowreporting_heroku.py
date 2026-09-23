# app/scrapers/lift_status/snowreporting_heroku.py
"""
snowreporting.herokuapp.com — same feed shape as mtnpowder.com (same underlying
vendor, deployed separately), used by Winter Park, Blue Mountain, and Tremblant.
SOURCE: https://snowreporting.herokuapp.com/feed/{feed_id}/lifts — public JSON.
"""
from app.scrapers.lift_status.base import BaseFeedLiftScraper

BASE_URL = "https://snowreporting.herokuapp.com/feed"

RESORT_FEED_IDS = {
    "winter-park": 5,
    "blue-mountain": 3,
    "tremblant": 4,
}


class SnowReportingHerokuScraper(BaseFeedLiftScraper):
    name = "lift_status_snowreporting_heroku"
    resort_feed_ids = RESORT_FEED_IDS

    async def _fetch_lifts(self, feed_id: int) -> list[tuple[str, str | None]]:
        data = await self._fetch_json(f"{BASE_URL}/{feed_id}/lifts")
        return [(lift["Name"], lift.get("StatusEnglish") or lift.get("Status")) for lift in data]
