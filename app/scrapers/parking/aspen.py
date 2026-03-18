"""
Aspen Snowmass live parking scraper.
SOURCE URL: https://www.aspensnowmass.com/mountain/mountain-conditions/parking
Verify this URL before deploying. Update selector in _scrape() to match live page.
"""
from bs4 import BeautifulSoup
from app.scrapers.parking.base import BaseParkingScraper

PARKING_URL = "https://www.aspensnowmass.com/mountain/mountain-conditions/parking"


class AspenParkingScraper(BaseParkingScraper):
    name = "parking_aspen"
    resort_id = "aspen-snowmass"
    parking_url = PARKING_URL

    async def _scrape(self) -> list[dict]:
        # TODO: verify selector matches live page structure
        html = await self._fetch_html(self.parking_url)
        soup = BeautifulSoup(html, "lxml")
        lots = []
        for el in soup.select(".lot[data-lot]"):
            lots.append({
                "lot_name": el.get("data-lot", "Unknown"),
                "status": (el.get("data-status") or "open").lower(),
                "capacity_pct": None,
            })
        return lots
