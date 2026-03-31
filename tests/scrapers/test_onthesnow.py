# tests/scrapers/test_onthesnow.py
import json
import pytest
import httpx
import respx
from datetime import datetime, timezone
from app.scrapers.onthesnow import OnTheSnowScraper
from app.models.resort import Resort
from app.models.snow import SnowCondition


SAMPLE_NEXT_DATA = {
    "props": {
        "pageProps": {
            "fullResort": {
                "snow": {
                    "base": 91.44,
                    "last24": 15.24,
                    "last48": 25.4,
                    "last72": 45.72,
                },
                "surfaceType": "Packed Powder",
                "runs": {
                    "open": 150,
                    "total": 195,
                },
                "lifts": {},
            }
        }
    }
}

SAMPLE_HTML = f"""
<html><body>
<script id="__NEXT_DATA__" type="application/json">{json.dumps(SAMPLE_NEXT_DATA)}</script>
</body></html>
"""


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
async def test_scrape_resort_creates_snow_condition(db, resort):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get("https://www.onthesnow.com/colorado/vail-ski-resort/skireport").mock(
            return_value=httpx.Response(200, text=SAMPLE_HTML)
        )
        scraper = OnTheSnowScraper(db)
        await scraper.scrape_resort(resort)
        snow = db.query(SnowCondition).filter_by(resort_id="vail").first()
        assert snow is not None
        assert snow.base_in == pytest.approx(36.0, abs=0.1)
        assert snow.new_24h_in == pytest.approx(6.0, abs=0.1)
        assert snow.trails_open == 150
        assert snow.trails_total == 195


@pytest.mark.asyncio
async def test_scrape_resort_updates_existing(db, resort):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get("https://www.onthesnow.com/colorado/vail-ski-resort/skireport").mock(
            return_value=httpx.Response(200, text=SAMPLE_HTML)
        )
        scraper = OnTheSnowScraper(db)
        await scraper.scrape_resort(resort)
        updated_data = json.loads(SAMPLE_HTML.split('application/json">')[1].split("</script>")[0])
        updated_data["props"]["pageProps"]["fullResort"]["snow"]["base"] = 101.6
        updated_html = f'<html><script id="__NEXT_DATA__" type="application/json">{json.dumps(updated_data)}</script></html>'
        respx_mock.get("https://www.onthesnow.com/colorado/vail-ski-resort/skireport").mock(
            return_value=httpx.Response(200, text=updated_html)
        )
        await scraper.scrape_resort(resort)
        count = db.query(SnowCondition).filter_by(resort_id="vail").count()
        assert count == 1
        snow = db.query(SnowCondition).filter_by(resort_id="vail").first()
        assert snow.base_in == pytest.approx(40.0, abs=0.1)


@pytest.mark.asyncio
async def test_scrape_all_resorts(db):
    r1 = Resort(id="vail", name="Vail", pass_type="epic", region="Colorado",
                state="CO", country="US", latitude=39.6, longitude=-106.3,
                timezone="America/Denver", liftie_id="vail",
                onthesnow_slug="colorado/vail-ski-resort")
    r2 = Resort(id="breckenridge", name="Breckenridge", pass_type="epic",
                region="Colorado", state="CO", country="US",
                latitude=39.4, longitude=-106.0, timezone="America/Denver",
                liftie_id="breckenridge", onthesnow_slug="colorado/breckenridge-ski-resort")
    db.add_all([r1, r2])
    db.commit()
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get(url__regex=r"https://www\.onthesnow\.com/.*").mock(
            return_value=httpx.Response(200, text=SAMPLE_HTML)
        )
        scraper = OnTheSnowScraper(db)
        await scraper.scrape_all()
        assert db.query(SnowCondition).count() == 2
