# tests/scrapers/test_liftie.py
import pytest
import httpx
import respx
from app.scrapers.liftie import LiftieScraper
from app.models.resort import Resort
from app.models.lift import LiftStatus


SAMPLE_LIFTIE_RESPONSE = {
    "id": "vail",
    "name": "Vail",
    "lifts": {
        "Eagle Bahn Gondola": "open",
        "Highline": "open",
        "Thunder Express": "closed",
        "Sun Down Bowl Express": "on hold",
    }
}


@pytest.fixture
def resort(db):
    r = Resort(id="vail", name="Vail", pass_type="epic", region="Colorado",
               state="CO", country="US", latitude=39.6, longitude=-106.3,
               timezone="America/Denver", liftie_id="vail",
               onthesnow_slug="colorado/vail-ski-resort")
    db.add(r)
    db.commit()
    return r


@pytest.mark.asyncio
async def test_scrape_creates_lift_rows(db, resort):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get("https://liftie.info/api/resort/vail").mock(
            return_value=httpx.Response(200, json=SAMPLE_LIFTIE_RESPONSE)
        )
        scraper = LiftieScraper(db)
        await scraper.scrape_resort(resort)
        lifts = db.query(LiftStatus).filter_by(resort_id="vail").all()
        assert len(lifts) == 4
        statuses = {l.lift_name: l.status for l in lifts}
        assert statuses["Eagle Bahn Gondola"] == "open"
        assert statuses["Thunder Express"] == "closed"
        assert statuses["Sun Down Bowl Express"] == "on_hold"


@pytest.mark.asyncio
async def test_scrape_replaces_previous_rows(db, resort):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get("https://liftie.info/api/resort/vail").mock(
            return_value=httpx.Response(200, json=SAMPLE_LIFTIE_RESPONSE)
        )
        scraper = LiftieScraper(db)
        await scraper.scrape_resort(resort)
        updated = {"id": "vail", "lifts": {"Eagle Bahn Gondola": "open"}}
        respx_mock.get("https://liftie.info/api/resort/vail").mock(
            return_value=httpx.Response(200, json=updated)
        )
        await scraper.scrape_resort(resort)
        lifts = db.query(LiftStatus).filter_by(resort_id="vail").all()
        assert len(lifts) == 1


@pytest.mark.asyncio
async def test_open_lift_count(db, resort):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get("https://liftie.info/api/resort/vail").mock(
            return_value=httpx.Response(200, json=SAMPLE_LIFTIE_RESPONSE)
        )
        scraper = LiftieScraper(db)
        await scraper.scrape_resort(resort)
        open_count = db.query(LiftStatus).filter_by(resort_id="vail", status="open").count()
        assert open_count == 2
