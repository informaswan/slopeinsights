# app/scrapers/parking/__init__.py
from sqlalchemy.orm import Session
from app.scrapers.parking.vail import VailParkingScraper
from app.scrapers.parking.breckenridge import BreckenridgeParkingScraper
from app.scrapers.parking.park_city import ParkCityParkingScraper
from app.scrapers.parking.mammoth import MammothParkingScraper
from app.scrapers.parking.palisades_tahoe import PalisadesTahoeParkingScraper
from app.scrapers.parking.whistler import WhistlerParkingScraper
from app.scrapers.parking.steamboat import SteamboatParkingScraper
from app.scrapers.parking.aspen import AspenParkingScraper
from app.scrapers.parking.jackson_hole import JacksonHoleParkingScraper

LIVE_SCRAPERS = [
    VailParkingScraper,
    BreckenridgeParkingScraper,
    ParkCityParkingScraper,
    MammothParkingScraper,
    PalisadesTahoeParkingScraper,
    WhistlerParkingScraper,
    SteamboatParkingScraper,
    AspenParkingScraper,
    JacksonHoleParkingScraper,
]


async def run_parking_scrapers(db: Session) -> None:
    for scraper_cls in LIVE_SCRAPERS:
        scraper = scraper_cls(db)
        await scraper.scrape()
        await scraper.close()
