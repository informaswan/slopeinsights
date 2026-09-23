# tests/scrapers/test_lift_status_mtnpowder.py
import pytest
import httpx
import respx
from app.scrapers.lift_status.mtnpowder import MtnPowderScraper
from app.models.lift import LiftStatus

MAMMOTH_FEED = [
    {"Name": "Broadway Express", "StatusEnglish": "open"},
    {"Name": "Chair 2", "StatusEnglish": "closed_for_season"},
    {"Name": "Panorama Gondola", "StatusEnglish": "hold"},
]


@pytest.mark.asyncio
async def test_creates_lift_rows_for_every_mapped_resort(db):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get("https://mtnpowder.com/feed/60/lifts").mock(return_value=httpx.Response(200, json=MAMMOTH_FEED))
        for feed_id in (6, 49, 65, 61, 1, 70, 80):
            respx_mock.get(f"https://mtnpowder.com/feed/{feed_id}/lifts").mock(return_value=httpx.Response(200, json=[]))
        scraper = MtnPowderScraper(db)
        await scraper.scrape_all()
        rows = db.query(LiftStatus).filter_by(resort_id="mammoth").all()
        statuses = {r.lift_name: r.status for r in rows}
        assert statuses == {
            "Broadway Express": "open",
            "Chair 2": "closed",
            "Panorama Gondola": "on_hold",
        }


@pytest.mark.asyncio
async def test_rescrape_replaces_rather_than_duplicates(db):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get("https://mtnpowder.com/feed/60/lifts").mock(return_value=httpx.Response(200, json=MAMMOTH_FEED))
        for feed_id in (6, 49, 65, 61, 1, 70, 80):
            respx_mock.get(f"https://mtnpowder.com/feed/{feed_id}/lifts").mock(return_value=httpx.Response(200, json=[]))
        scraper = MtnPowderScraper(db)
        await scraper.scrape_all()
        await scraper.scrape_all()
        rows = db.query(LiftStatus).filter_by(resort_id="mammoth").all()
        assert len(rows) == 3


@pytest.mark.asyncio
async def test_one_resorts_feed_failing_marks_it_stale_without_blocking_the_others(db):
    """A failing feed triggers the base scraper's real retry backoff, so this covers
    both the stale-marking and the failure-doesn't-block-the-rest behavior in one
    test rather than paying that delay twice.

    Health is tracked per scraper *class*, not per resort (matches onthesnow.py's
    same shared-health design), so a later resort's success can overwrite an
    earlier resort's failure in ScraperHealth — that's exercised generically in
    test_base.py already; this test only asserts what's specific to this package.
    """
    now = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
    db.add(LiftStatus(resort_id="mammoth", lift_name="Old Lift", status="open", scraped_at=now, is_stale=False))
    db.commit()
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get("https://mtnpowder.com/feed/60/lifts").mock(return_value=httpx.Response(500))
        respx_mock.get("https://mtnpowder.com/feed/6/lifts").mock(
            return_value=httpx.Response(200, json=[{"Name": "Gondola", "StatusEnglish": "open"}])
        )
        for feed_id in (49, 65, 61, 1, 70, 80):
            respx_mock.get(f"https://mtnpowder.com/feed/{feed_id}/lifts").mock(return_value=httpx.Response(200, json=[]))
        scraper = MtnPowderScraper(db)
        await scraper.scrape_all()

        mammoth_row = db.query(LiftStatus).filter_by(resort_id="mammoth").first()
        assert mammoth_row.is_stale is True
        assert db.query(LiftStatus).filter_by(resort_id="steamboat").count() == 1
