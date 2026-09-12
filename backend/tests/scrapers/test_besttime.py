# tests/scrapers/test_besttime.py
import pytest
import httpx
import respx
import json
from app.scrapers.besttime import BestTimeScraper
from app.models.resort import Resort
from app.models.crowd import CrowdData

SAMPLE_BESTTIME = {
    "status": "OK",
    "venue_info": {"venue_name": "Vail Mountain"},
    "analysis": {
        "week_raw": [
            {"day_int": 0, "hour_analysis": [
                {"hour": 8, "intensity_nr": 10},
                {"hour": 9, "intensity_nr": 15},
                {"hour": 10, "intensity_nr": 40},
                {"hour": 11, "intensity_nr": 70},
                {"hour": 12, "intensity_nr": 90},
                {"hour": 13, "intensity_nr": 85},
                {"hour": 14, "intensity_nr": 70},
                {"hour": 15, "intensity_nr": 50},
                {"hour": 16, "intensity_nr": 30},
                {"hour": 17, "intensity_nr": 10},
            ]},
        ]
    }
}


@pytest.fixture
def resort(db):
    r = Resort(id="vail", name="Vail", pass_type="epic", region="Colorado",
               state="CO", country="US", latitude=39.6, longitude=-106.3,
               timezone="America/Denver", liftie_id="vail",
               onthesnow_slug="colorado/vail-ski-resort",
               website="https://www.vail.com")
    db.add(r)
    db.commit()
    return r


@pytest.fixture(autouse=True)
def set_besttime_key(monkeypatch):
    import app.scrapers.besttime as bt_module
    monkeypatch.setattr(bt_module.settings, "besttime_api_key", "test-key")


@pytest.mark.asyncio
async def test_scrape_creates_crowd_row(db, resort):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.post("https://besttime.app/api/v1/forecasts").mock(
            return_value=httpx.Response(200, json=SAMPLE_BESTTIME)
        )
        scraper = BestTimeScraper(db)
        await scraper.scrape_resort(resort)
        row = db.query(CrowdData).filter_by(resort_id="vail", day_of_week=0).first()
        assert row is not None
        hourly = json.loads(row.hourly_json)
        assert len(hourly) == 10
        assert hourly[4] == 90  # noon = index 4 (8am=0, 12pm=4)


@pytest.mark.asyncio
async def test_scrape_upserts_existing_row(db, resort):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.post("https://besttime.app/api/v1/forecasts").mock(
            return_value=httpx.Response(200, json=SAMPLE_BESTTIME)
        )
        scraper = BestTimeScraper(db)
        await scraper.scrape_resort(resort)
        await scraper.scrape_resort(resort)
        count = db.query(CrowdData).filter_by(resort_id="vail", day_of_week=0).count()
        assert count == 1
