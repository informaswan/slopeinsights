# tests/scrapers/test_base.py
import pytest
import httpx
import respx
import json
from datetime import datetime, timezone
from app.scrapers.base import BaseScraper, ScraperError
from app.models.scraper_health import ScraperHealth


class ConcreteScraper(BaseScraper):
    name = "test_scraper"


@pytest.fixture
async def scraper(db):
    s = ConcreteScraper(db)
    yield s
    await s.close()


@pytest.mark.asyncio
async def test_fetch_json_success(scraper):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get("https://example.com/data").mock(
            return_value=httpx.Response(200, text=json.dumps({"key": "value"}))
        )
        result = await scraper._fetch_json("https://example.com/data")
        assert result == {"key": "value"}


@pytest.mark.asyncio
async def test_fetch_html_success(scraper):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get("https://example.com/page").mock(
            return_value=httpx.Response(200, text="<html>hello</html>")
        )
        result = await scraper._fetch_html("https://example.com/page")
        assert "hello" in result


@pytest.mark.asyncio
async def test_retry_on_network_error(scraper):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get("https://example.com/retry").mock(
            side_effect=[
                httpx.NetworkError("connection reset"),
                httpx.NetworkError("connection reset"),
                httpx.Response(200, text=json.dumps({"ok": True})),
            ]
        )
        result = await scraper._fetch_json("https://example.com/retry")
        assert result == {"ok": True}


@pytest.mark.asyncio
async def test_raises_scraper_error_after_max_retries(scraper):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get("https://example.com/fail").mock(
            side_effect=httpx.NetworkError("always fails")
        )
        with pytest.raises(ScraperError):
            await scraper._fetch_json("https://example.com/fail")


def test_record_success_resets_failures(scraper, db):
    health = ScraperHealth(scraper_name="test_scraper", consecutive_failures=3,
                           status="degraded", skip_until_run=0)
    db.add(health)
    db.commit()
    scraper._record_success()
    h = db.query(ScraperHealth).filter_by(scraper_name="test_scraper").first()
    assert h.consecutive_failures == 0
    assert h.status == "ok"


def test_record_failure_increments_count(scraper, db):
    scraper._record_failure("something went wrong")
    h = db.query(ScraperHealth).filter_by(scraper_name="test_scraper").first()
    assert h.consecutive_failures == 1
    assert h.status == "degraded"
    assert "something went wrong" in h.last_error


def test_circuit_breaker_skips_after_5_failures(scraper, db):
    health = ScraperHealth(scraper_name="test_scraper", consecutive_failures=5,
                           status="degraded", skip_until_run=6)
    db.add(health)
    db.commit()
    assert scraper.is_circuit_open() is True


def test_circuit_breaker_closed_when_skip_is_zero(scraper, db):
    health = ScraperHealth(scraper_name="test_scraper", consecutive_failures=5,
                           status="degraded", skip_until_run=0)
    db.add(health)
    db.commit()
    assert scraper.is_circuit_open() is False


def test_decrement_skip_reduces_count(scraper, db):
    health = ScraperHealth(scraper_name="test_scraper", consecutive_failures=5,
                           status="degraded", skip_until_run=3)
    db.add(health)
    db.commit()
    scraper.decrement_skip()
    h = db.query(ScraperHealth).filter_by(scraper_name="test_scraper").first()
    assert h.skip_until_run == 2
