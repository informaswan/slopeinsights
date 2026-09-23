# app/scheduler.py
"""
Scraping schedule (all times are approximate — APScheduler may drift slightly):

  Every 5 min  : Lift status (20 resorts, direct per-platform feeds)
  Every 30 min : Snow + trails (resort feeds, OnTheSnow only as fallback)  ← also triggers cache refresh
  Every 1 hr   : NOAA weather forecasts + cache invalidation (current_pct changes hourly)
  Every 2 hrs  : Webcam health check
  Daily 4am    : Live traffic-cam lists (Ontario 511, DriveBC) — only the camera URLs
                 are refreshed here; the images themselves are always fetched live by
                 the frontend, so this doesn't need to run often.

Lift status no longer goes through liftie.info: it now sits behind a Cloudflare
Managed Challenge that blocks plain HTTP scraping outright (confirmed via a
direct request returning a 403 "Just a moment..." interstitial, not a rate
limit). liftie.info was open source, though, and its resort descriptors pointed
at each resort's *own* real data source — many of which are still live public
JSON/XML feeds we can call directly. app/scrapers/lift_status/ does that for the
20 resorts whose feed we could confirm working; the rest (mostly the Vail
Resorts network, which WAF-blocks scraping entirely) have no accessible source
and are left without live lift data rather than a fragile HTML scraper.

Each job creates a fresh DB session and fresh scraper instance per invocation.
Circuit breakers and health logging are handled inside each scraper.
"""
import logging

from datetime import datetime, timedelta, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from app.database import SessionLocal
from app.cache import invalidate_cache

logger = logging.getLogger(__name__)


async def _job_lift_status() -> None:
    from app.scrapers.lift_status import run_lift_status_scrapers
    db = SessionLocal()
    try:
        await run_lift_status_scrapers(db)
        invalidate_cache()  # the list's lift open/total counts just changed
    except Exception as exc:
        logger.error("Lift status job failed: %s", exc, exc_info=True)
    finally:
        db.close()


async def _job_snow_conditions() -> None:
    from app.scrapers.snow import run_snow_scrapers
    db = SessionLocal()
    try:
        await run_snow_scrapers(db)
        invalidate_cache()  # triggers home screen cache rebuild on next request
    except Exception as exc:
        logger.error("Snow conditions job failed: %s", exc, exc_info=True)
    finally:
        db.close()


async def _job_weather() -> None:
    from app.scrapers.noaa import NOAAScraper
    db = SessionLocal()
    scraper = None
    try:
        scraper = NOAAScraper(db)
        await scraper.scrape_all()
        # Invalidate cache so current_pct (which changes each operating hour) stays fresh.
        invalidate_cache()
    except Exception as exc:
        logger.error("Weather job failed: %s", exc, exc_info=True)
    finally:
        if scraper is not None:
            await scraper.close()
        db.close()


async def _job_traffic_cams() -> None:
    from app.scrapers.traffic_cams import run_traffic_cam_scrapers
    db = SessionLocal()
    try:
        await run_traffic_cam_scrapers(db)
    except Exception as exc:
        logger.error("Traffic cams job failed: %s", exc, exc_info=True)
    finally:
        db.close()


async def _job_webcam_health() -> None:
    from app.scrapers.webcam_health import WebcamHealthChecker
    db = SessionLocal()
    checker = None
    try:
        checker = WebcamHealthChecker(db)
        await checker.check_all()
    except Exception as exc:
        logger.error("Webcam health job failed: %s", exc, exc_info=True)
    finally:
        if checker is not None:
            await checker.close()
        db.close()


def create_scheduler() -> AsyncIOScheduler:
    now = datetime.now(timezone.utc)
    # Stagger startup so jobs don't all fire at once and get marked "missed".
    # misfire_grace_time=300 gives each job 5 minutes to start before being skipped.
    scheduler = AsyncIOScheduler(job_defaults={"misfire_grace_time": 300})
    scheduler.add_job(_job_traffic_cams,    CronTrigger(hour=4, minute=0),   id="traffic_cams",    next_run_time=now + timedelta(seconds=30))
    scheduler.add_job(_job_lift_status,     IntervalTrigger(minutes=5),       id="lift_status",     next_run_time=now + timedelta(seconds=5))
    scheduler.add_job(_job_snow_conditions, IntervalTrigger(minutes=30),      id="snow_conditions", next_run_time=now + timedelta(seconds=15))
    scheduler.add_job(_job_weather,         IntervalTrigger(hours=1),         id="weather",         next_run_time=now + timedelta(seconds=20))
    scheduler.add_job(_job_webcam_health,   IntervalTrigger(hours=2),         id="webcam_health",   next_run_time=now + timedelta(seconds=25))
    return scheduler
