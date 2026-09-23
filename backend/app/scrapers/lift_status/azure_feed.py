# app/scrapers/lift_status/azure_feed.py
"""
A shared Azure API Management feed used by several Boyne-family resorts.
SOURCE: https://apim-marketing-001.azure-api.net/FeedService/v1/Feed/Facilities/Areas/Lifts/All?resortName={code}
Public JSON, no API key.
"""
from app.scrapers.lift_status.base import BaseFeedLiftScraper

BASE_URL = "https://apim-marketing-001.azure-api.net/FeedService/v1/Feed/Facilities/Areas/Lifts/All"

RESORT_CODES = {
    "big-sky": "bs",
    "loon-mountain": "lm",
    "sunday-river": "sr",
    "sugarloaf": "sl",
}


class AzureFeedScraper(BaseFeedLiftScraper):
    name = "lift_status_azure_feed"
    resort_feed_ids = RESORT_CODES

    async def _fetch_lifts(self, code: str) -> list[tuple[str, str | None]]:
        data = await self._fetch_json(f"{BASE_URL}?resortName={code}")
        return [(lift["name"], lift.get("statusIcon") or lift.get("status")) for lift in data]
