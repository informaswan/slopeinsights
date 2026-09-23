# tests/scrapers/test_lift_status_whistler_blackcomb.py
import pytest
import httpx
import respx
from app.scrapers.lift_status.whistler_blackcomb import WhistlerBlackcombScraper, API_URL
from app.models.lift import LiftStatus
from app.models.scraper_health import ScraperHealth

LIFTS_XML = """<?xml version="1.0" encoding="utf-8"?>
<Lifts updated="9/22/2026 8:57:01 PM" friendlyupdated="0 seconds ago">
  <Lift mountain="Blackcomb" LiftGUID="1" name="7TH HEAVEN EXPRESS" status="OPEN" waitstatus="Open" />
  <Lift mountain="Whistler" LiftGUID="2" name="CREEKSIDE GONDOLA" status="CLOSED" waitstatus="Closed" />
</Lifts>
"""


@pytest.mark.asyncio
async def test_parses_lift_elements_from_the_xml_feed(db):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get(API_URL).mock(return_value=httpx.Response(200, text=LIFTS_XML))
        scraper = WhistlerBlackcombScraper(db)
        await scraper.scrape_all()
        rows = {r.lift_name: r.status for r in db.query(LiftStatus).filter_by(resort_id="whistler-blackcomb").all()}
        assert rows == {
            "7Th Heaven Express (Blackcomb)": "open",
            "Creekside Gondola (Whistler)": "closed",
        }


@pytest.mark.asyncio
async def test_malformed_xml_records_a_failure_instead_of_raising(db):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get(API_URL).mock(return_value=httpx.Response(200, text="<not-valid-xml"))
        scraper = WhistlerBlackcombScraper(db)
        await scraper.scrape_all()  # should not raise
        health = db.query(ScraperHealth).filter_by(scraper_name="lift_status_whistler_blackcomb").first()
        assert health.status == "degraded"
