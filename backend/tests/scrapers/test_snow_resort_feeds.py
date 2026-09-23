# tests/scrapers/test_snow_resort_feeds.py
import pytest
import httpx
import respx
from datetime import datetime, timedelta, timezone
from app.scrapers.snow.resort_feeds import (
    ResortFeedSnowScraper, SOURCES, parse_mtnpowder_feed, parse_jackson_hole, parse_reportpal, parse_taos, parse_powdr, parse_hood,
)
from app.models.snow import SnowCondition

MTNPOWDER = {
    "SnowReport": {
        "BaseConditions": "Packed Powder", "TotalOpenTrails": 12, "TotalTrails": 184,
        "BaseArea": {"BaseIn": "16", "Last24HoursIn": "0", "Last48HoursIn": "2", "Last72HoursIn": "13"},
        "MidMountainArea": {"BaseIn": "20"},
        "SummitArea": {"BaseIn": "50"},
    }
}

JH = {
    "snow": {
        "midMountain": {
            "totalSnowDepth": {"value": "40"}, "newSnowLast24H": {"value": "1"},
            "newSnowLast48H": {"value": "3"}, "newSnowLast72H": {},
        },
        "tramSummit": {"totalSnowDepth": {"value": "74"}},
    },
    "trailStatus": {"openTrails": 5, "totalTrails": 130},
}


def _no_time(parsed: dict) -> dict:
    return {k: v for k, v in parsed.items() if k != "reported_at"}


def test_mtnpowder_shape_is_parsed_in_inches():
    assert _no_time(parse_mtnpowder_feed(MTNPOWDER)) == {
        "base_in": 16.0, "new_24h_in": 0.0, "new_48h_in": 2.0, "new_7d_in": 13.0,
        "surface": "Packed Powder", "trails_open": 12, "trails_total": 184,
    }


def test_placeholder_readings_become_none_and_fall_back_to_other_areas():
    data = {"SnowReport": {
        "BaseConditions": "--",
        "BaseArea": {"BaseIn": "--", "Last24HoursIn": "--"},
        "SummitArea": {"BaseIn": "50", "Last24HoursIn": "4"},
    }}
    parsed = parse_mtnpowder_feed(data)
    assert parsed["base_in"] == 50.0 and parsed["new_24h_in"] == 4.0
    assert parsed["surface"] is None and parsed["new_48h_in"] is None


def test_jackson_hole_shape_reads_nested_unit_values():
    parsed = parse_jackson_hole(JH)
    assert (parsed["base_in"], parsed["new_24h_in"], parsed["new_48h_in"]) == (40.0, 1.0, 3.0)
    assert parsed["new_7d_in"] is None
    assert (parsed["trails_open"], parsed["trails_total"]) == (5, 130)


def test_reportpal_shape_reads_the_first_location_and_resortwide_trails():
    data = {"currentConditions": {
        "resortLocations": {"location": [
            {"base": {"inches": "20"}, "snow24Hours": {"inches": "1"}, "snow48Hours": {"inches": "3"},
             "snow72Hours": {"inches": "5"}},
            {"base": {"inches": "99"}},
        ]},
        "resortwide": {"numTrailsOpen": 7, "numTrailsTotal": 144},
    }}
    assert _no_time(parse_reportpal(data)) == {
        "base_in": 20.0, "new_24h_in": 1.0, "new_48h_in": 3.0, "new_7d_in": 5.0,
        "surface": None, "trails_open": 7, "trails_total": 144,
    }


def test_taos_shape():
    data = {"snowData": {"base": 30, "last24Hours": 2, "last48Hours": 4, "last72Hours": 6},
            "trailsOpen": 10, "trailsTotal": 120}
    assert _no_time(parse_taos(data)) == {
        "base_in": 30.0, "new_24h_in": 2.0, "new_48h_in": 4.0, "new_7d_in": 6.0,
        "surface": None, "trails_open": 10, "trails_total": 120,
    }


def test_powdr_shape_uses_the_latest_report_and_counts_winter_trails():
    reports = [
        {"base_depth": 40, "unit_of_measurement": "in",
         "computed": {"24_hour": 1, "48_hour": 3, "72_hour": 5}},
        {"base_depth": 1, "computed": {"24_hour": 99}},   # older report, ignored
    ]
    trails = [
        {"status": "open", "season": "winter"}, {"status": "closed", "season": "winter"},
        {"status": "open", "season": "summer"},            # summer trails don't count
    ]
    assert _no_time(parse_powdr([reports, trails])) == {
        "base_in": 40.0, "new_24h_in": 1.0, "new_48h_in": 3.0, "new_7d_in": 5.0,
        "surface": None, "trails_open": 1, "trails_total": 2,
    }


def test_powdr_converts_centimeters_and_tolerates_a_missing_trails_feed():
    reports = [{"base_depth": 254, "unit_of_measurement": "cm", "computed": {"24_hour": 25.4}}]
    parsed = parse_powdr([reports, None])
    assert parsed["base_in"] == 100.0 and parsed["new_24h_in"] == 10.0
    assert parsed["trails_open"] is None and parsed["trails_total"] is None


def test_hood_shape_reads_the_inch_values():
    inch = lambda n: {"value": n * 2.54, "unit": "CENTIMETER", "countryValue": n, "countryUnit": "INCH"}
    data = {"snow": [{"snowTotalDepth": inch(30), "freshSnowFallDepth24H": inch(2),
                      "freshSnowFallDepth48H": inch(4), "freshSnowFallDepth72H": inch(6)}]}
    parsed = parse_hood(data)
    assert (parsed["base_in"], parsed["new_24h_in"], parsed["new_48h_in"], parsed["new_7d_in"]) == (30.0, 2.0, 4.0, 6.0)


def test_sources_cover_the_expected_twenty_one_resorts():
    assert len(SOURCES) == 21
    assert {"jackson-hole", "steamboat", "big-sky", "taos", "copper-mountain", "mt-bachelor", "mt-hood-meadows"} <= set(SOURCES)


def _mock_feeds(respx_mock, bodies: dict | None = None, default=None):
    """Mock every feed url; `bodies` overrides the JSON body per resort_id."""
    default = {"SnowReport": {}} if default is None else default
    for resort_id, (urls, _) in SOURCES.items():
        for url in urls:
            respx_mock.get(url).mock(return_value=httpx.Response(200, json=(bodies or {}).get(resort_id, default)))


@pytest.mark.asyncio
async def test_scrape_all_writes_rows_and_reports_which_resorts_were_covered(db):
    async with respx.mock(using="httpx") as respx_mock:
        _mock_feeds(respx_mock, {"steamboat": MTNPOWDER, "jackson-hole": JH})
        covered = await ResortFeedSnowScraper(db).scrape_all()
        assert covered == set(SOURCES)
        row = db.query(SnowCondition).filter_by(resort_id="steamboat").first()
        assert (row.base_in, row.new_48h_in, row.trails_total) == (16.0, 2.0, 184)
        assert db.query(SnowCondition).filter_by(resort_id="jackson-hole").first().base_in == 40.0


@pytest.mark.asyncio
async def test_a_bad_payload_leaves_that_resort_uncovered_so_onthesnow_can_fall_back(db):
    async with respx.mock(using="httpx") as respx_mock:
        _mock_feeds(respx_mock, {"steamboat": ["not", "a", "dict"]})
        covered = await ResortFeedSnowScraper(db).scrape_all()
        assert "steamboat" not in covered and len(covered) == len(SOURCES) - 1


@pytest.mark.asyncio
async def test_rescrape_updates_the_same_row(db):
    async with respx.mock(using="httpx") as respx_mock:
        _mock_feeds(respx_mock, {"steamboat": MTNPOWDER})
        scraper = ResortFeedSnowScraper(db)
        await scraper.scrape_all()
        await scraper.scrape_all()
        assert db.query(SnowCondition).filter_by(resort_id="steamboat").count() == 1


def _feed_reported(days_ago: int) -> dict:
    when = (datetime.now(timezone.utc) - timedelta(days=days_ago)).strftime("%Y-%m-%dT%H:%M:%S%z")
    return {"SnowReport": {**MTNPOWDER["SnowReport"], "LastUpdate": when}}


def test_report_timestamps_are_parsed_from_each_feed_shape():
    assert parse_mtnpowder_feed({"SnowReport": {"LastUpdate": "2026-05-19T15:04:53-0600"}})["reported_at"] == \
        datetime(2026, 5, 19, 21, 4, 53, tzinfo=timezone.utc)
    assert parse_jackson_hole({"snow": {"lastModified": "4/12/26, 6:14\u202fAM"}})["reported_at"] == \
        datetime(2026, 4, 12, 6, 14, tzinfo=timezone.utc)
    assert parse_reportpal({"updated": "2026-09-22T19:48:39Z"})["reported_at"] == \
        datetime(2026, 9, 22, 19, 48, 39, tzinfo=timezone.utc)
    assert parse_mtnpowder_feed({"SnowReport": {}})["reported_at"] is None


@pytest.mark.asyncio
async def test_an_old_report_is_blanked_and_dated_by_its_own_timestamp(db):
    """Off-season feeds keep serving the last winter report; it must not read as current."""
    async with respx.mock(using="httpx") as respx_mock:
        _mock_feeds(respx_mock, {"steamboat": _feed_reported(days_ago=120)})
        await ResortFeedSnowScraper(db).scrape_all()
        row = db.query(SnowCondition).filter_by(resort_id="steamboat").first()
        assert (row.base_in, row.new_24h_in, row.new_48h_in, row.new_7d_in, row.surface) == (None,) * 5
        assert row.trails_total == 184  # not snow depth; still shown
        age = datetime.now(timezone.utc) - row.scraped_at.replace(tzinfo=timezone.utc)
        assert timedelta(days=119) < age < timedelta(days=121)


@pytest.mark.asyncio
async def test_a_recent_report_keeps_its_numbers(db):
    async with respx.mock(using="httpx") as respx_mock:
        _mock_feeds(respx_mock, {"steamboat": _feed_reported(days_ago=1)})
        await ResortFeedSnowScraper(db).scrape_all()
        row = db.query(SnowCondition).filter_by(resort_id="steamboat").first()
        assert (row.base_in, row.new_48h_in) == (16.0, 2.0)
