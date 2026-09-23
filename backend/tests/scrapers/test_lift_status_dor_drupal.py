# tests/scrapers/test_lift_status_dor_drupal.py
import pytest
import httpx
import respx
from app.scrapers.lift_status.dor_drupal import DorDrupalScraper
from app.models.lift import LiftStatus

SNOWBIRD_FEED = [
    {"name": "Aerial Tram", "status": "closed"},
    {"name": "Peruvian", "status": "open"},
]


@pytest.mark.asyncio
async def test_parses_name_and_status_per_resort_host(db):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get("https://api.coppercolorado.com/api/v1/dor/drupal/lifts").mock(
            return_value=httpx.Response(200, json=[{"name": "Super Bee", "status": "hold"}])
        )
        respx_mock.get("https://api.snowbird.com/api/v1/dor/drupal/lifts").mock(
            return_value=httpx.Response(200, json=SNOWBIRD_FEED)
        )
        respx_mock.get("https://api.mtbachelor.com/api/v1/dor/drupal/lifts").mock(
            return_value=httpx.Response(200, json=[{"name": "Pine Marten", "status": "open"}])
        )
        scraper = DorDrupalScraper(db)
        await scraper.scrape_all()

        copper = {r.lift_name: r.status for r in db.query(LiftStatus).filter_by(resort_id="copper-mountain").all()}
        snowbird = {r.lift_name: r.status for r in db.query(LiftStatus).filter_by(resort_id="snowbird").all()}
        assert copper == {"Super Bee": "on_hold"}
        assert snowbird == {"Aerial Tram": "closed", "Peruvian": "open"}
        bachelor = {r.lift_name: r.status for r in db.query(LiftStatus).filter_by(resort_id="mt-bachelor").all()}
        assert bachelor == {"Pine Marten": "open"}
