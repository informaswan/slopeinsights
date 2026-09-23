# tests/scrapers/test_drivebc.py
import pytest
import httpx
import respx
from app.scrapers.traffic_cams.drivebc import DriveBCScraper, API_URL
from app.models.resort import Resort
from app.models.webcam import Webcam


def _cam(cam_id, name, lng, lat, **extra):
    return {"id": cam_id, "name": name, "location": {"type": "Point", "coordinates": [lng, lat]},
            "is_on": True, "should_appear": True, "marked_stale": False, **extra}


# Whistler Blackcomb is ~50.1163, -122.9574. Revelstoke is ~51.0592, -118.1773.
CAMERAS = [
    _cam(519, "Whistler Village Gate - N", -122.9592, 50.1160),
    _cam(1, "Vancouver Downtown", -123.1207, 49.2827),               # far from both resorts
    _cam(700, "Hwy 1 at Hwy 23 - N", -118.2260, 51.0032),
    _cam(701, "Stale cam", -118.2260, 51.0032, marked_stale=True),   # excluded
    _cam(702, "Off cam", -118.2260, 51.0032, is_on=False),           # excluded
    {"id": 703, "name": "No location"},                                # excluded
]


@pytest.fixture
def resorts(db):
    whistler = Resort(id="whistler-blackcomb", name="Whistler Blackcomb", pass_type="epic",
                       region="British Columbia", state="BC", country="CA",
                       latitude=50.1163, longitude=-122.9574, timezone="America/Vancouver",
                       liftie_id="whistler-blackcomb", onthesnow_slug="british-columbia/whistler-blackcomb")
    revelstoke = Resort(id="revelstoke", name="Revelstoke Mountain", pass_type="ikon",
                         region="British Columbia", state="BC", country="CA",
                         latitude=51.0592, longitude=-118.1773, timezone="America/Vancouver",
                         liftie_id="revelstoke", onthesnow_slug="british-columbia/revelstoke-mountain")
    db.add_all([whistler, revelstoke])
    db.commit()
    return whistler, revelstoke


@pytest.mark.asyncio
async def test_creates_traffic_cam_rows_for_each_mapped_resort(db, resorts):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get(API_URL).mock(return_value=httpx.Response(200, json=CAMERAS))
        await DriveBCScraper(db).scrape_all()
        whistler = db.query(Webcam).filter_by(resort_id="whistler-blackcomb", category="traffic").all()
        revelstoke = db.query(Webcam).filter_by(resort_id="revelstoke", category="traffic").all()
        assert [c.url for c in whistler] == ["https://www.drivebc.ca/images/519.jpg"]
        assert [c.url for c in revelstoke] == ["https://www.drivebc.ca/images/700.jpg"]
        assert whistler[0].cam_type == "jpeg"
        assert whistler[0].label == "Whistler Village Gate - N"


@pytest.mark.asyncio
async def test_skips_stale_off_and_locationless_cameras_and_far_away_ones(db, resorts):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get(API_URL).mock(return_value=httpx.Response(200, json=CAMERAS))
        await DriveBCScraper(db).scrape_all()
        urls = {w.url for w in db.query(Webcam).filter_by(category="traffic").all()}
        assert urls == {"https://www.drivebc.ca/images/519.jpg", "https://www.drivebc.ca/images/700.jpg"}


@pytest.mark.asyncio
async def test_rescrape_replaces_rather_than_duplicates(db, resorts):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get(API_URL).mock(return_value=httpx.Response(200, json=CAMERAS))
        scraper = DriveBCScraper(db)
        await scraper.scrape_all()
        await scraper.scrape_all()
        assert db.query(Webcam).filter_by(resort_id="whistler-blackcomb", category="traffic").count() == 1


@pytest.mark.asyncio
async def test_no_usable_cameras_records_failure_without_raising(db, resorts):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get(API_URL).mock(return_value=httpx.Response(200, json=[]))
        await DriveBCScraper(db).scrape_all()  # should not raise
        assert db.query(Webcam).filter_by(category="traffic").count() == 0
