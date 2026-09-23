from sqlalchemy.orm import Session
from app.scrapers.traffic_cams.ontario511 import Ontario511Scraper
from app.scrapers.traffic_cams.drivebc import DriveBCScraper

SCRAPERS = [Ontario511Scraper, DriveBCScraper]


async def run_traffic_cam_scrapers(db: Session) -> None:
    for scraper_cls in SCRAPERS:
        scraper = scraper_cls(db)
        await scraper.scrape_all()
        await scraper.close()
