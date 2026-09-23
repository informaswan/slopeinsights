# tests/scrapers/test_lift_status_snowreporting_heroku.py
import pytest
import httpx
import respx
from app.scrapers.lift_status.snowreporting_heroku import SnowReportingHerokuScraper
from app.models.lift import LiftStatus


@pytest.mark.asyncio
async def test_parses_each_mapped_resorts_feed(db):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.get("https://snowreporting.herokuapp.com/feed/5/lifts").mock(
            return_value=httpx.Response(200, json=[{"Name": "Arrow", "StatusEnglish": "open"}])
        )
        respx_mock.get("https://snowreporting.herokuapp.com/feed/3/lifts").mock(
            return_value=httpx.Response(200, json=[{"Name": "Easy Rider", "StatusEnglish": "closed"}])
        )
        respx_mock.get("https://snowreporting.herokuapp.com/feed/4/lifts").mock(
            return_value=httpx.Response(200, json=[{"Name": "Télécabine", "StatusEnglish": "closed_for_season"}])
        )
        scraper = SnowReportingHerokuScraper(db)
        await scraper.scrape_all()

        assert db.query(LiftStatus).filter_by(resort_id="winter-park", lift_name="Arrow").first().status == "open"
        assert db.query(LiftStatus).filter_by(resort_id="blue-mountain", lift_name="Easy Rider").first().status == "closed"
        assert db.query(LiftStatus).filter_by(resort_id="tremblant", lift_name="Télécabine").first().status == "closed"
