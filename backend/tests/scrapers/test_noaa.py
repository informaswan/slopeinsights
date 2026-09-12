# tests/scrapers/test_noaa.py
import pytest
import httpx
import respx
from datetime import datetime, timezone
from app.scrapers.noaa import NOAAScraper
from app.models.resort import Resort
from app.models.weather import WeatherForecast

POINTS_RESPONSE = {
    "properties": {
        "forecast": "https://api.weather.gov/gridpoints/BOU/72,65/forecast"
    }
}

FORECAST_RESPONSE = {
    "properties": {
        "periods": [
            {
                "name": "Tonight",
                "startTime": "2026-03-16T18:00:00-07:00",
                "isDaytime": False,
                "temperature": 14,
                "temperatureUnit": "F",
                "windSpeed": "20 mph",
                "shortForecast": "Snow Likely",
                "probabilityOfPrecipitation": {"value": 80},
            },
            {
                "name": "Monday",
                "startTime": "2026-03-17T06:00:00-07:00",
                "isDaytime": True,
                "temperature": 28,
                "temperatureUnit": "F",
                "windSpeed": "15 mph",
                "shortForecast": "Partly Cloudy",
                "probabilityOfPrecipitation": {"value": 20},
            },
        ]
    }
}


@pytest.fixture
def resort(db):
    r = Resort(id="vail", name="Vail", pass_type="epic", region="Colorado",
               state="CO", country="US", latitude=39.6061, longitude=-106.3550,
               timezone="America/Denver", liftie_id="vail",
               onthesnow_slug="colorado/vail-ski-resort")
    db.add(r)
    db.commit()
    return r


@pytest.mark.asyncio
async def test_scrape_fetches_two_step(db, resort):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get("https://api.weather.gov/points/39.6061,-106.355").mock(
            return_value=httpx.Response(200, json=POINTS_RESPONSE)
        )
        respx_mock.get("https://api.weather.gov/gridpoints/BOU/72,65/forecast").mock(
            return_value=httpx.Response(200, json=FORECAST_RESPONSE)
        )
        scraper = NOAAScraper(db)
        await scraper.scrape_resort(resort)
        rows = db.query(WeatherForecast).filter_by(resort_id="vail").all()
        assert len(rows) == 2


@pytest.mark.asyncio
async def test_caches_grid_url(db, resort):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get("https://api.weather.gov/points/39.6061,-106.355").mock(
            return_value=httpx.Response(200, json=POINTS_RESPONSE)
        )
        respx_mock.get("https://api.weather.gov/gridpoints/BOU/72,65/forecast").mock(
            return_value=httpx.Response(200, json=FORECAST_RESPONSE)
        )
        scraper = NOAAScraper(db)
        await scraper.scrape_resort(resort)
        db.refresh(resort)
        assert resort.noaa_grid_url == "https://api.weather.gov/gridpoints/BOU/72,65/forecast"


@pytest.mark.asyncio
async def test_uses_cached_grid_url(db, resort):
    resort.noaa_grid_url = "https://api.weather.gov/gridpoints/BOU/72,65/forecast"
    db.commit()
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get("https://api.weather.gov/gridpoints/BOU/72,65/forecast").mock(
            return_value=httpx.Response(200, json=FORECAST_RESPONSE)
        )
        scraper = NOAAScraper(db)
        await scraper.scrape_resort(resort)
        rows = db.query(WeatherForecast).filter_by(resort_id="vail").all()
        assert len(rows) == 2


@pytest.mark.asyncio
async def test_snow_in_forecast_detected(db, resort):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get("https://api.weather.gov/points/39.6061,-106.355").mock(
            return_value=httpx.Response(200, json=POINTS_RESPONSE)
        )
        respx_mock.get("https://api.weather.gov/gridpoints/BOU/72,65/forecast").mock(
            return_value=httpx.Response(200, json=FORECAST_RESPONSE)
        )
        scraper = NOAAScraper(db)
        await scraper.scrape_resort(resort)
        rows = db.query(WeatherForecast).filter_by(resort_id="vail").all()
        snow_rows = [r for r in rows if r.snow_in_forecast]
        assert len(snow_rows) >= 1
        clear_rows = [r for r in rows if not r.snow_in_forecast]
        assert len(clear_rows) >= 1
