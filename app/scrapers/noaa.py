# app/scrapers/noaa.py
import logging
import re
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.resort import Resort
from app.models.weather import WeatherForecast
from app.scrapers.base import BaseScraper, ScraperError

logger = logging.getLogger(__name__)

NOAA_HEADERS = {
    "User-Agent": "PowderPass/1.0 (ski conditions app; contact: admin@powderpass.app)",
    "Accept": "application/geo+json",
}

_SNOW_KEYWORDS = {"snow", "blizzard", "flurr", "wintry mix", "sleet", "freezing"}


def _has_snow(forecast_text: str) -> bool:
    text = forecast_text.lower()
    return any(kw in text for kw in _SNOW_KEYWORDS)


def _parse_wind_mph(wind_speed_str: str) -> float | None:
    match = re.search(r"(\d+)", wind_speed_str or "")
    return float(match.group(1)) if match else None


class NOAAScraper(BaseScraper):
    name = "noaa"

    async def _get_forecast_url(self, resort: Resort) -> str:
        if resort.noaa_grid_url:
            return resort.noaa_grid_url
        points_url = f"https://api.weather.gov/points/{resort.latitude},{resort.longitude}"
        data = await self._fetch_json(points_url, headers=NOAA_HEADERS)
        forecast_url = data["properties"]["forecast"]
        resort.noaa_grid_url = forecast_url
        self.db.commit()
        return forecast_url

    async def scrape_resort(self, resort: Resort) -> None:
        if self.is_circuit_open():
            self.decrement_skip()
            return
        try:
            forecast_url = await self._get_forecast_url(resort)
            data = await self._fetch_json(forecast_url, headers=NOAA_HEADERS)
            periods = data["properties"]["periods"]
        except (ScraperError, KeyError) as exc:
            self._record_failure(str(exc))
            logger.warning("NOAA scrape failed for %s: %s", resort.name, exc)
            self.db.query(WeatherForecast).filter_by(resort_id=resort.id).update({"is_stale": True})
            self.db.commit()
            return

        now = datetime.now(timezone.utc)
        self.db.query(WeatherForecast).filter_by(resort_id=resort.id).delete()
        for period in periods[:6]:
            date_str = period["startTime"][:10]
            self.db.add(WeatherForecast(
                resort_id=resort.id,
                forecast_date=date_str,
                high_f=float(period["temperature"]) if period.get("isDaytime") else None,
                low_f=float(period["temperature"]) if not period.get("isDaytime") else None,
                precip_pct=period.get("probabilityOfPrecipitation", {}).get("value"),
                snow_in_forecast=_has_snow(period.get("shortForecast", "")),
                wind_mph=_parse_wind_mph(period.get("windSpeed")),
                scraped_at=now,
                is_stale=False,
            ))
        self.db.commit()
        self._record_success()

    async def scrape_all(self) -> None:
        resorts = self.db.query(Resort).all()
        for resort in resorts:
            await self.scrape_resort(resort)
        await self.close()
