# app/scheduler.py
"""
Scraping schedule (all times are approximate — APScheduler may drift slightly):

  Every 15 min : Liftie lift status + parking (9 resorts)
  Every 30 min : OnTheSnow snow + trails  ← also triggers cache refresh
  Every 1 hr   : NOAA weather forecasts + cache invalidation (current_pct changes hourly)
  Every 2 hrs  : Webcam health check
  Daily 3am    : BestTime.app crowd patterns

Each job creates a fresh DB session and fresh scraper instance per invocation.
Circuit breakers and health logging are handled inside each scraper.
"""
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from app.database import SessionLocal
from app.cache import invalidate_cache

logger = logging.getLogger(__name__)


async def _job_lift_status() -> None:
    from app.scrapers.liftie import LiftieScraper
    db = SessionLocal()
    try:
        scraper = LiftieScraper(db)
        await scraper.scrape_all()
    except Exception as exc:
        logger.error("Lift status job failed: %s", exc)
    finally:
        db.close()


async def _job_snow_conditions() -> None:
    from app.scrapers.onthesnow import OnTheSnowScraper
    db = SessionLocal()
    try:
        scraper = OnTheSnowScraper(db)
        await scraper.scrape_all()
        invalidate_cache()  # triggers home screen cache rebuild on next request
    except Exception as exc:
        logger.error("Snow conditions job failed: %s", exc)
    finally:
        db.close()


async def _job_weather() -> None:
    from app.scrapers.noaa import NOAAScraper
    db = SessionLocal()
    try:
        scraper = NOAAScraper(db)
        await scraper.scrape_all()
        # Invalidate cache so current_pct (which changes each operating hour) stays fresh.
        invalidate_cache()
    except Exception as exc:
        logger.error("Weather job failed: %s", exc)
    finally:
        db.close()


async def _job_parking() -> None:
    from app.scrapers.parking import run_parking_scrapers
    db = SessionLocal()
    try:
        await run_parking_scrapers(db)
    except Exception as exc:
        logger.error("Parking job failed: %s", exc)
    finally:
        db.close()


async def _job_webcam_health() -> None:
    from app.scrapers.webcam_health import WebcamHealthChecker
    db = SessionLocal()
    try:
        checker = WebcamHealthChecker(db)
        await checker.check_all()
    except Exception as exc:
        logger.error("Webcam health job failed: %s", exc)
    finally:
        db.close()


async def _job_crowd_patterns() -> None:
    from app.scrapers.besttime import BestTimeScraper
    db = SessionLocal()
    try:
        scraper = BestTimeScraper(db)
        await scraper.scrape_all()
    except Exception as exc:
        logger.error("Crowd patterns job failed: %s", exc)
    finally:
        db.close()


def create_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler()
    scheduler.add_job(_job_lift_status, IntervalTrigger(minutes=15), id="lift_status")
    scheduler.add_job(_job_parking, IntervalTrigger(minutes=15), id="parking")
    scheduler.add_job(_job_snow_conditions, IntervalTrigger(minutes=30), id="snow_conditions")
    scheduler.add_job(_job_weather, IntervalTrigger(hours=1), id="weather")
    scheduler.add_job(_job_webcam_health, IntervalTrigger(hours=2), id="webcam_health")
    scheduler.add_job(_job_crowd_patterns, CronTrigger(hour=3, minute=0), id="crowd_patterns")
    return scheduler
