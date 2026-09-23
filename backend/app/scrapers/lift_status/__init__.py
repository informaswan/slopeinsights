from sqlalchemy.orm import Session
from app.scrapers.lift_status.mtnpowder import MtnPowderScraper
from app.scrapers.lift_status.dor_drupal import DorDrupalScraper
from app.scrapers.lift_status.snowreporting_heroku import SnowReportingHerokuScraper
from app.scrapers.lift_status.azure_feed import AzureFeedScraper
from app.scrapers.lift_status.jackson_hole import JacksonHoleScraper
from app.scrapers.lift_status.aspen_snowmass import AspenSnowmassScraper
from app.scrapers.lift_status.whistler_blackcomb import WhistlerBlackcombScraper

SCRAPERS = [
    MtnPowderScraper,
    DorDrupalScraper,
    SnowReportingHerokuScraper,
    AzureFeedScraper,
    JacksonHoleScraper,
    AspenSnowmassScraper,
    WhistlerBlackcombScraper,
]


async def run_lift_status_scrapers(db: Session) -> None:
    for scraper_cls in SCRAPERS:
        scraper = scraper_cls(db)
        await scraper.scrape_all()
        await scraper.close()
