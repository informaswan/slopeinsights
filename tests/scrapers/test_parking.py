# tests/scrapers/test_parking.py
import pytest
import httpx
import respx
from app.scrapers.parking.vail import VailParkingScraper
from app.scrapers.parking import run_parking_scrapers
from app.models.resort import Resort
from app.models.parking import ParkingLot


VAIL_PARKING_HTML = """
<html><body>
<div class="parking-status">
  <div class="lot" data-lot="Structure 1" data-status="open" data-pct="45"></div>
  <div class="lot" data-lot="Structure 2" data-status="full" data-pct="100"></div>
  <div class="lot" data-lot="Lionshead" data-status="limited" data-pct="78"></div>
</div>
</body></html>
"""


@pytest.fixture
def vail_resort(db):
    r = Resort(id="vail", name="Vail", pass_type="epic", region="Colorado",
               state="CO", country="US", latitude=39.6, longitude=-106.3,
               timezone="America/Denver", liftie_id="vail",
               onthesnow_slug="colorado/vail-ski-resort")
    db.add(r)
    db.commit()
    return r


@pytest.mark.asyncio
async def test_vail_scraper_creates_live_lot_rows(db, vail_resort):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get("https://www.vail.com/the-mountain/mountain-conditions/parking.aspx").mock(
            return_value=httpx.Response(200, text=VAIL_PARKING_HTML)
        )
        scraper = VailParkingScraper(db)
        await scraper._scrape_impl()
        lots = db.query(ParkingLot).filter_by(resort_id="vail", is_live=True).all()
        assert len(lots) == 3
        statuses = {l.lot_name: l.status for l in lots}
        assert statuses["Structure 1"] == "open"
        assert statuses["Structure 2"] == "full"
        assert statuses["Lionshead"] == "limited"


@pytest.mark.asyncio
async def test_vail_scraper_updates_existing_rows(db, vail_resort):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get("https://www.vail.com/the-mountain/mountain-conditions/parking.aspx").mock(
            return_value=httpx.Response(200, text=VAIL_PARKING_HTML)
        )
        scraper = VailParkingScraper(db)
        await scraper._scrape_impl()
        await scraper._scrape_impl()
        count = db.query(ParkingLot).filter_by(resort_id="vail", is_live=True).count()
        assert count == 3


@pytest.mark.asyncio
async def test_run_parking_scrapers_calls_each(db, monkeypatch):
    called = []

    class FakeScraper:
        def __init__(self, db): pass
        async def scrape(self): called.append(True)
        async def close(self): pass

    import app.scrapers.parking as parking_mod
    monkeypatch.setattr(parking_mod, "LIVE_SCRAPERS", [FakeScraper, FakeScraper])
    await run_parking_scrapers(db)
    assert len(called) == 2
