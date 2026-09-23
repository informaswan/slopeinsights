# app/scrapers/lift_status/dor_drupal.py
"""
Powdr Corp's shared "dor/drupal" lift-status API.
SOURCE: https://api.{resort-domain}/api/v1/dor/drupal/lifts — public JSON, no API key.
NOTE: Killington runs the same platform per liftie.info's descriptor, but
api.killington.com's TLS certificate doesn't cover that hostname (confirmed via
a direct handshake, not just a timeout) — leaving it out until that's fixed on
their end; re-check before adding it back.
"""
from app.scrapers.lift_status.base import BaseFeedLiftScraper

RESORT_HOSTS = {
    "copper-mountain": "api.coppercolorado.com",
    "snowbird": "api.snowbird.com",
    "mt-bachelor": "api.mtbachelor.com",
}


class DorDrupalScraper(BaseFeedLiftScraper):
    name = "lift_status_dor_drupal"
    resort_feed_ids = RESORT_HOSTS

    async def _fetch_lifts(self, host: str) -> list[tuple[str, str | None]]:
        data = await self._fetch_json(f"https://{host}/api/v1/dor/drupal/lifts")
        return [(lift["name"], lift.get("status")) for lift in data]
