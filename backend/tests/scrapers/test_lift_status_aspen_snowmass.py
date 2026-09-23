# tests/scrapers/test_lift_status_aspen_snowmass.py
import pytest
import httpx
import respx
from app.scrapers.lift_status.aspen_snowmass import AspenSnowmassScraper, API_URL
from app.models.lift import LiftStatus


@pytest.mark.asyncio
async def test_merges_all_four_base_areas_into_one_resort(db):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get(f"{API_URL}?mountain=AspenMountain").mock(
            return_value=httpx.Response(200, json={"liftStatuses": [{"liftName": "Hero's", "area": "Hero's", "status": "Open"}]})
        )
        respx_mock.get(f"{API_URL}?mountain=Snowmass").mock(
            return_value=httpx.Response(200, json={"liftStatuses": [{"liftName": "Elk Camp", "area": "Elk Camp", "status": "Closed"}]})
        )
        respx_mock.get(f"{API_URL}?mountain=AspenHighlands").mock(return_value=httpx.Response(200, json={"liftStatuses": []}))
        respx_mock.get(f"{API_URL}?mountain=Buttermilk").mock(return_value=httpx.Response(200, json={"liftStatuses": []}))
        scraper = AspenSnowmassScraper(db)
        await scraper.scrape_all()

        rows = {r.lift_name: r.status for r in db.query(LiftStatus).filter_by(resort_id="aspen-snowmass").all()}
        assert rows == {
            "Hero's (Hero's)": "open",
            "Elk Camp (Elk Camp)": "closed",
        }
