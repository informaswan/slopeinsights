# app/scrapers/lift_status/whistler_blackcomb.py
"""
Whistler Blackcomb's own live lift-status feed (XML, not JSON — this predates
Vail Resorts' acquisition of the mountain and still runs on its original
infrastructure, unlike the rest of the Vail Resorts network which is now
bot-blocked).
SOURCE: https://secure.whistlerblackcomb.com/ls/lifts.aspx — public, no API key.
"""
from xml.etree import ElementTree

from app.scrapers.lift_status.base import BaseFeedLiftScraper
from app.scrapers.base import ScraperError

API_URL = "https://secure.whistlerblackcomb.com/ls/lifts.aspx"

RESORT_FEED_IDS = {"whistler-blackcomb": API_URL}


class WhistlerBlackcombScraper(BaseFeedLiftScraper):
    name = "lift_status_whistler_blackcomb"
    resort_feed_ids = RESORT_FEED_IDS

    async def _fetch_lifts(self, url: str) -> list[tuple[str, str | None]]:
        xml_text = await self._fetch_html(url)
        try:
            root = ElementTree.fromstring(xml_text)
        except ElementTree.ParseError as exc:
            raise ScraperError(f"Could not parse Whistler Blackcomb lift XML: {exc}") from exc
        return [
            (f"{lift.get('name', '').title()} ({lift.get('mountain')})", lift.get("status"))
            for lift in root.findall("Lift")
        ]
