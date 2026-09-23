# tests/scrapers/test_lift_status_jackson_hole.py
import pytest
import httpx
import respx
from app.scrapers.lift_status.jackson_hole import JacksonHoleScraper, API_URL
from app.models.lift import LiftStatus

ALL_JSON = {
    "lifts": {
        "aerialTram": {"id": "6057", "openingStatus": "CLOSED", "name": "Aerial Tram"},
        "sweetwaterGondola": {"id": "6054", "openingStatus": "OPEN", "name": "Sweetwater Gondola"},
        "noName": {"id": "6099", "openingStatus": "OPEN"},  # should be skipped
    },
}


@pytest.mark.asyncio
async def test_reads_lifts_dict_out_of_the_site_wide_payload(db):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get(API_URL).mock(return_value=httpx.Response(200, json=ALL_JSON))
        scraper = JacksonHoleScraper(db)
        await scraper.scrape_all()
        rows = {r.lift_name: r.status for r in db.query(LiftStatus).filter_by(resort_id="jackson-hole").all()}
        assert rows == {"Aerial Tram": "closed", "Sweetwater Gondola": "open"}
