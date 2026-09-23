from sqlalchemy.orm import Session
from app.scrapers.onthesnow import OnTheSnowScraper
from app.scrapers.snow.resort_feeds import ResortFeedSnowScraper


async def run_snow_scrapers(db: Session) -> None:
    """Resort-reported snow straight from each resort's own feed where one exists;
    OnTheSnow (a middleman that relays the same resort reports by scraping a page)
    only for resorts the direct pass couldn't cover this run."""
    direct = ResortFeedSnowScraper(db)
    covered = await direct.scrape_all()
    await direct.close()

    fallback = OnTheSnowScraper(db)
    await fallback.scrape_all(skip_resort_ids=covered)
