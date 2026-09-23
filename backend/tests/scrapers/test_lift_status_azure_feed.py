# tests/scrapers/test_lift_status_azure_feed.py
import pytest
import httpx
import respx
from app.scrapers.lift_status.azure_feed import AzureFeedScraper
from app.models.lift import LiftStatus

BASE_URL = "https://apim-marketing-001.azure-api.net/FeedService/v1/Feed/Facilities/Areas/Lifts/All"


@pytest.mark.asyncio
async def test_parses_name_and_status_icon_per_resort_code(db):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get(f"{BASE_URL}?resortName=bs").mock(
            return_value=httpx.Response(200, json=[{"name": "Cascade 3", "status": "Open", "statusIcon": "open"}])
        )
        respx_mock.get(f"{BASE_URL}?resortName=lm").mock(return_value=httpx.Response(200, json=[]))
        respx_mock.get(f"{BASE_URL}?resortName=sr").mock(return_value=httpx.Response(200, json=[]))
        respx_mock.get(f"{BASE_URL}?resortName=sl").mock(return_value=httpx.Response(200, json=[]))
        scraper = AzureFeedScraper(db)
        await scraper.scrape_all()
        row = db.query(LiftStatus).filter_by(resort_id="big-sky").first()
        assert row.lift_name == "Cascade 3"
        assert row.status == "open"
