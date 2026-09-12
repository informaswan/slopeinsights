# app/scrapers/parking/vail.py
"""
Vail live parking scraper.
SOURCE URL: https://www.vail.com/the-mountain/mountain-conditions/parking.aspx
Verify this URL is still valid before deploying.
"""
from bs4 import BeautifulSoup
from app.scrapers.parking.base import BaseParkingScraper

PARKING_URL = "https://www.vail.com/the-mountain/mountain-conditions/parking.aspx"

_STATUS_MAP = {"open": "open", "full": "full", "limited": "limited", "closed": "full"}


class VailParkingScraper(BaseParkingScraper):
    name = "parking_vail"
    resort_id = "vail"
    parking_url = PARKING_URL

    async def _scrape(self) -> list[dict]:
        html = await self._fetch_html(self.parking_url)
        soup = BeautifulSoup(html, "lxml")
        lots = []
        for el in soup.select(".lot[data-lot]"):
            raw_status = (el.get("data-status") or "").lower()
            raw_pct = el.get("data-pct")
            lots.append({
                "lot_name": el["data-lot"],
                "status": _STATUS_MAP.get(raw_status, "open"),
                "capacity_pct": int(raw_pct) if raw_pct and raw_pct.isdigit() else None,
            })
        return lots
