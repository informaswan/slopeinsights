# tests/scrapers/test_noaa.py
import pytest
import httpx
import respx
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from app.scrapers.noaa import NOAAScraper, _first_n_days, _snowfall_in_by_date
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

# 25.4mm == 1.0in and 50.8mm == 2.0in exactly, chosen so the mm->in rounding is exact.
# Times are UTC; in America/Denver (UTC-6 in March) these land on 2026-03-16 and 2026-03-17.
GRID_RESPONSE = {
    "properties": {
        "snowfallAmount": {
            "uom": "wmoUnit:mm",
            "values": [
                {"validTime": "2026-03-17T00:00:00+00:00/PT6H", "value": 25.4},
                {"validTime": "2026-03-17T20:00:00+00:00/PT6H", "value": 50.8},
            ],
        }
    }
}

GRID_URL = "https://api.weather.gov/gridpoints/BOU/72,65"


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
        respx_mock.get(GRID_URL).mock(return_value=httpx.Response(200, json=GRID_RESPONSE))
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
        respx_mock.get(GRID_URL).mock(return_value=httpx.Response(200, json=GRID_RESPONSE))
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
        respx_mock.get(GRID_URL).mock(return_value=httpx.Response(200, json=GRID_RESPONSE))
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
        respx_mock.get(GRID_URL).mock(return_value=httpx.Response(200, json=GRID_RESPONSE))
        scraper = NOAAScraper(db)
        await scraper.scrape_resort(resort)
        rows = db.query(WeatherForecast).filter_by(resort_id="vail").all()
        snow_rows = [r for r in rows if r.snow_in_forecast]
        assert len(snow_rows) >= 1
        clear_rows = [r for r in rows if not r.snow_in_forecast]
        assert len(clear_rows) >= 1


@pytest.mark.asyncio
async def test_snow_amount_in_computed_from_gridpoint_data(db, resort):
    # Built from the real clock (not a fixed calendar date) so this test can't drift
    # outside _snowfall_in_by_date's real "now"-relative window as time passes.
    tz = ZoneInfo("America/Denver")
    today = datetime.now(timezone.utc).astimezone(tz).date()
    tomorrow = today + timedelta(days=1)

    def local(day, hour):
        return datetime.combine(day, datetime.min.time(), tzinfo=tz).replace(hour=hour)

    forecast_response = {
        "properties": {
            "periods": [
                {
                    "name": "Tonight", "startTime": local(today, 18).isoformat(),
                    "isDaytime": False, "temperature": 14, "windSpeed": "20 mph",
                    "shortForecast": "Snow Likely", "probabilityOfPrecipitation": {"value": 80},
                },
                {
                    "name": "Tomorrow", "startTime": local(tomorrow, 6).isoformat(),
                    "isDaytime": True, "temperature": 28, "windSpeed": "15 mph",
                    "shortForecast": "Partly Cloudy", "probabilityOfPrecipitation": {"value": 20},
                },
            ]
        }
    }
    grid_response = {
        "properties": {
            "snowfallAmount": {
                "uom": "wmoUnit:mm",
                "values": [
                    {"validTime": local(today, 12).astimezone(timezone.utc).isoformat() + "/PT6H", "value": 25.4},
                    {"validTime": local(tomorrow, 12).astimezone(timezone.utc).isoformat() + "/PT6H", "value": 50.8},
                ],
            }
        }
    }

    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get("https://api.weather.gov/points/39.6061,-106.355").mock(
            return_value=httpx.Response(200, json=POINTS_RESPONSE)
        )
        respx_mock.get("https://api.weather.gov/gridpoints/BOU/72,65/forecast").mock(
            return_value=httpx.Response(200, json=forecast_response)
        )
        respx_mock.get(GRID_URL).mock(return_value=httpx.Response(200, json=grid_response))
        scraper = NOAAScraper(db)
        await scraper.scrape_resort(resort)
        rows = {r.forecast_date: r for r in db.query(WeatherForecast).filter_by(resort_id="vail").all()}
        assert rows[today.isoformat()].snow_amount_in == 1.0
        assert rows[tomorrow.isoformat()].snow_amount_in == 2.0


@pytest.mark.asyncio
async def test_gridpoint_fetch_failure_does_not_fail_the_scrape(db, resort):
    """snow_amount_in is best-effort: losing the gridpoint endpoint shouldn't lose the
    rest of the forecast or mark it stale."""
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get("https://api.weather.gov/points/39.6061,-106.355").mock(
            return_value=httpx.Response(200, json=POINTS_RESPONSE)
        )
        respx_mock.get("https://api.weather.gov/gridpoints/BOU/72,65/forecast").mock(
            return_value=httpx.Response(200, json=FORECAST_RESPONSE)
        )
        respx_mock.get(GRID_URL).mock(return_value=httpx.Response(500))
        scraper = NOAAScraper(db)
        await scraper.scrape_resort(resort)
        rows = db.query(WeatherForecast).filter_by(resort_id="vail").all()
        assert len(rows) == 2
        assert all(r.snow_amount_in is None for r in rows)
        assert all(not r.is_stale for r in rows)


def test_first_n_days_keeps_every_period_for_the_first_n_dates():
    periods = [
        {"startTime": "2026-03-16T18:00:00-07:00"},
        {"startTime": "2026-03-17T06:00:00-07:00"},
        {"startTime": "2026-03-17T18:00:00-07:00"},
        {"startTime": "2026-03-18T06:00:00-07:00"},
        {"startTime": "2026-03-18T18:00:00-07:00"},
        {"startTime": "2026-03-19T06:00:00-07:00"},
    ]
    selected = _first_n_days(periods, 3)
    assert [p["startTime"][:10] for p in selected] == [
        "2026-03-16", "2026-03-17", "2026-03-17", "2026-03-18", "2026-03-18",
    ]


def test_snowfall_in_by_date_converts_mm_to_inches_and_buckets_by_local_date():
    now = datetime(2026, 3, 16, 12, 0, tzinfo=timezone.utc)  # 06:00 local (Denver, MDT)
    totals = _snowfall_in_by_date(GRID_RESPONSE, "America/Denver", now, num_days=3)
    assert totals == {"2026-03-16": 1.0, "2026-03-17": 2.0}


def test_snowfall_in_by_date_drops_entries_outside_the_window():
    now = datetime(2026, 3, 16, 12, 0, tzinfo=timezone.utc)
    far_future = {
        "properties": {
            "snowfallAmount": {
                "values": [{"validTime": "2026-03-25T00:00:00+00:00/PT6H", "value": 25.4}]
            }
        }
    }
    assert _snowfall_in_by_date(far_future, "America/Denver", now, num_days=3) == {}


def test_snowfall_in_by_date_handles_missing_layer():
    assert _snowfall_in_by_date({"properties": {}}, "America/Denver", datetime.now(timezone.utc), 3) == {}


def _grid(values):
    return {"properties": {"snowfallAmount": {"uom": "wmoUnit:mm", "values": values}}}


def test_rolling_snow_totals_prorate_intervals_that_straddle_the_window():
    from app.scrapers.noaa import _snowfall_in_next_hours
    now = datetime(2026, 1, 10, 12, 0, tzinfo=timezone.utc)
    grid = _grid([
        {"validTime": "2026-01-10T12:00:00+00:00/PT6H", "value": 25.4},   # fully inside 24h: 1.0in
        {"validTime": "2026-01-11T06:00:00+00:00/PT12H", "value": 50.8},  # half inside 24h (06-12 of 06-18): 1.0in
        {"validTime": "2026-01-12T00:00:00+00:00/PT6H", "value": 25.4},   # only in the 48h/72h windows: +1.0in
        {"validTime": "2026-01-09T00:00:00+00:00/PT6H", "value": 99.0},   # already past: ignored
        {"validTime": "2026-01-10T18:00:00+00:00/PT6H", "value": None},   # no reading
    ])
    assert _snowfall_in_next_hours(grid, now, 24) == 2.0
    assert _snowfall_in_next_hours(grid, now, 48) == 4.0   # 1.0 + the whole 2.0 interval + 1.0
    assert _snowfall_in_next_hours(grid, now, 72) == 4.0


def test_rolling_snow_total_understands_day_durations_and_missing_layers():
    from app.scrapers.noaa import _snowfall_in_next_hours
    now = datetime(2026, 1, 10, 12, 0, tzinfo=timezone.utc)
    assert _snowfall_in_next_hours(_grid([{"validTime": "2026-01-10T12:00:00+00:00/P1DT0H", "value": 25.4}]), now, 24) == 1.0
    assert _snowfall_in_next_hours({"properties": {}}, now, 24) is None
    assert _snowfall_in_next_hours(_grid([]), now, 24) == 0.0


@pytest.mark.asyncio
async def test_scrape_stores_rolling_snow_forecast_and_updates_it_in_place(db, resort):
    from app.models.snow_forecast import SnowForecast
    now = datetime.now(timezone.utc)
    grid = _grid([{"validTime": now.replace(microsecond=0).isoformat() + "/PT12H", "value": 25.4}])
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get("https://api.weather.gov/points/39.6061,-106.355").mock(return_value=httpx.Response(200, json=POINTS_RESPONSE))
        respx_mock.get("https://api.weather.gov/gridpoints/BOU/72,65/forecast").mock(return_value=httpx.Response(200, json=FORECAST_RESPONSE))
        respx_mock.get(GRID_URL).mock(return_value=httpx.Response(200, json=grid))
        scraper = NOAAScraper(db)
        await scraper.scrape_resort(resort)
        await scraper.scrape_resort(resort)
        rows = db.query(SnowForecast).filter_by(resort_id="vail").all()
        assert len(rows) == 1
        assert rows[0].next_24h_in == pytest.approx(1.0, abs=0.15)  # the window opens a moment after validTime starts
