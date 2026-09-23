# tests/scrapers/test_ontario511.py
import pytest
import httpx
import respx
from app.scrapers.traffic_cams.ontario511 import Ontario511Scraper, API_URL
from app.models.resort import Resort
from app.models.webcam import Webcam

# Blue Mountain is ~44.5018, -80.3172.
CAMERAS_RESPONSE = [
    {
        "Id": 102, "Location": "Highway 26 at Collingwood Road",
        "Latitude": 44.5255, "Longitude": -80.3251,
        "Views": [{"Id": 1, "Url": "https://511on.ca/map/Cctv/102", "Status": "Enabled", "Description": "Looking East"}],
    },
    {
        "Id": 5000, "Location": "Highway 401 at Yonge Street",  # far from Blue Mountain
        "Latitude": 43.7615, "Longitude": -79.4111,
        "Views": [{"Id": 2, "Url": "https://511on.ca/map/Cctv/5000", "Status": "Enabled", "Description": "Looking North"}],
    },
    {
        "Id": 103, "Location": "Highway 26 at Poplar Side Road",
        "Latitude": 44.4870, "Longitude": -80.1734,
        "Views": [
            {"Id": 3, "Url": "https://511on.ca/map/Cctv/103", "Status": "Disabled", "Description": "Broken"},
        ],
    },
]


@pytest.fixture
def blue_mountain(db):
    r = Resort(id="blue-mountain", name="Blue Mountain", pass_type="ikon", region="Ontario",
               state="ON", country="CA", latitude=44.5018, longitude=-80.3172,
               timezone="America/Toronto", liftie_id="blue-mountain",
               onthesnow_slug="ontario/blue-mountain")
    db.add(r)
    db.commit()
    return r


@pytest.mark.asyncio
async def test_creates_traffic_cam_rows_for_the_nearest_enabled_view(db, blue_mountain):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get(API_URL).mock(return_value=httpx.Response(200, json=CAMERAS_RESPONSE))
        scraper = Ontario511Scraper(db)
        await scraper.scrape_all()
        cams = db.query(Webcam).filter_by(resort_id="blue-mountain", category="traffic").all()
        assert len(cams) == 1
        assert cams[0].url == "https://511on.ca/map/Cctv/102"
        assert cams[0].cam_type == "jpeg"
        assert "Highway 26 at Collingwood Road" in cams[0].label


@pytest.mark.asyncio
async def test_ignores_disabled_views_and_cameras_outside_the_radius(db, blue_mountain):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get(API_URL).mock(return_value=httpx.Response(200, json=CAMERAS_RESPONSE))
        scraper = Ontario511Scraper(db)
        await scraper.scrape_all()
        urls = {w.url for w in db.query(Webcam).filter_by(resort_id="blue-mountain").all()}
        assert "https://511on.ca/map/Cctv/5000" not in urls  # too far
        assert "https://511on.ca/map/Cctv/103" not in urls   # disabled


@pytest.mark.asyncio
async def test_does_not_touch_mountain_webcams(db, blue_mountain):
    db.add(Webcam(resort_id="blue-mountain", label="Village Cam", cam_type="jpeg",
                   url="https://example.com/village.jpg", category="mountain"))
    db.commit()
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get(API_URL).mock(return_value=httpx.Response(200, json=CAMERAS_RESPONSE))
        scraper = Ontario511Scraper(db)
        await scraper.scrape_all()
        mountain_cams = db.query(Webcam).filter_by(resort_id="blue-mountain", category="mountain").all()
        assert len(mountain_cams) == 1


@pytest.mark.asyncio
async def test_rescrape_replaces_rather_than_duplicates(db, blue_mountain):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get(API_URL).mock(return_value=httpx.Response(200, json=CAMERAS_RESPONSE))
        scraper = Ontario511Scraper(db)
        await scraper.scrape_all()
        await scraper.scrape_all()
        cams = db.query(Webcam).filter_by(resort_id="blue-mountain", category="traffic").all()
        assert len(cams) == 1
