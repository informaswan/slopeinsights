# app/scrapers/noaa.py
import logging
import re
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.models.resort import Resort
from app.models.weather import WeatherForecast
from app.models.snow_forecast import SnowForecast
from app.scrapers.base import BaseScraper, ScraperError

logger = logging.getLogger(__name__)

NOAA_HEADERS = {
    "User-Agent": "SlopeInsights/1.0 (ski conditions app; contact: admin@slopeinsights.com)",
    "Accept": "application/geo+json",
}

_SNOW_KEYWORDS = {"snow", "blizzard", "flurr", "wintry mix", "sleet", "freezing"}
_MM_TO_IN = 0.0393701
FORECAST_DAYS = 3  # today + the next 2 days, i.e. a 72-hour-forward window
SNOW_WINDOWS_HOURS = (24, 48, 72)


def _has_snow(forecast_text: str) -> bool:
    text = forecast_text.lower()
    return any(kw in text for kw in _SNOW_KEYWORDS)


def _parse_wind_mph(wind_speed_str: str) -> float | None:
    match = re.search(r"(\d+)", wind_speed_str or "")
    return float(match.group(1)) if match else None


def _first_n_days(periods: list[dict], num_days: int) -> list[dict]:
    """NWS gives a day + night period per date (sometimes a single partial period for
    "today"). Keep every period for the first `num_days` distinct dates that appear,
    rather than a fixed period count, so the window is a true N days regardless of
    how the periods line up."""
    by_date: dict[str, list[dict]] = {}
    for period in periods:
        by_date.setdefault(period["startTime"][:10], []).append(period)
    selected_dates = list(by_date)[:num_days]
    return [p for d in selected_dates for p in by_date[d]]


_DURATION = re.compile(r"^P(?:(\d+)D)?(?:T(?:(\d+)H)?)?$")


def _snowfall_in_next_hours(grid_data: dict, now: datetime, hours: int) -> float | None:
    """Expected snowfall (inches) over the next `hours` from `now`, rolling — not by
    calendar day. NWS gives snowfallAmount as mm over intervals ("start/PT6H"); an
    interval that straddles the window edge counts only for its overlapping share.
    None if the grid has no snowfallAmount layer at all."""
    values = ((grid_data.get("properties") or {}).get("snowfallAmount") or {}).get("values")
    if values is None:
        return None
    window_end = now + timedelta(hours=hours)
    total_mm = 0.0
    for entry in values:
        value, valid_time = entry.get("value"), entry.get("validTime")
        if value is None or not valid_time or "/" not in valid_time:
            continue
        start_text, duration_text = valid_time.split("/", 1)
        match = _DURATION.match(duration_text)
        if not match:
            continue
        span = timedelta(days=int(match.group(1) or 0), hours=int(match.group(2) or 0))
        if span <= timedelta(0):
            continue
        try:
            start = datetime.fromisoformat(start_text)
        except ValueError:
            continue
        end = start + span
        overlap = min(end, window_end) - max(start, now)
        if overlap > timedelta(0):
            total_mm += value * (overlap / span)
    return round(total_mm * _MM_TO_IN, 1)


def _snowfall_in_by_date(grid_data: dict, tz_name: str | None, now: datetime, num_days: int) -> dict[str, float]:
    """Sum NWS's quantitative snowfallAmount (mm, a time series of short intervals)
    into inches, bucketed by local calendar date, for today plus the next `num_days - 1`
    days. Returns {} if the grid has no snowfallAmount layer or nothing parses."""
    values = (grid_data.get("properties") or {}).get("snowfallAmount", {}).get("values") or []
    tz = ZoneInfo(tz_name) if tz_name else timezone.utc
    local_today = now.astimezone(tz).date()
    last_date = local_today + timedelta(days=num_days - 1)
    totals: dict[str, float] = {}
    for entry in values:
        value = entry.get("value")
        valid_time = entry.get("validTime")
        if value is None or not valid_time:
            continue
        try:
            start = datetime.fromisoformat(valid_time.split("/")[0]).astimezone(tz)
        except ValueError:
            continue
        bucket_date = start.date()
        if bucket_date < local_today or bucket_date > last_date:
            continue
        key = bucket_date.isoformat()
        totals[key] = totals.get(key, 0.0) + value * _MM_TO_IN
    return {k: round(v, 1) for k, v in totals.items()}


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
        if resort.country != "US":
            return  # NOAA only covers the United States
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
        selected_periods = _first_n_days(periods, FORECAST_DAYS)

        # Quantitative snow accumulation isn't in the plain /forecast endpoint — it's on
        # the raw gridpoint (same URL, minus "/forecast") as a snowfallAmount time series.
        # Best-effort: a failure here shouldn't fail the whole scrape or mark it stale,
        # it just leaves snow_amount_in unset for this run.
        snow_by_date: dict[str, float] = {}
        rolling: dict[int, float | None] = {}
        try:
            grid_data = await self._fetch_json(forecast_url.removesuffix("/forecast"), headers=NOAA_HEADERS)
            snow_by_date = _snowfall_in_by_date(grid_data, resort.timezone, now, FORECAST_DAYS)
            rolling = {h: _snowfall_in_next_hours(grid_data, now, h) for h in SNOW_WINDOWS_HOURS}
        except (ScraperError, KeyError) as exc:
            logger.warning("NOAA snowfall-amount fetch failed for %s: %s", resort.name, exc)

        forecast_row = self.db.query(SnowForecast).filter_by(resort_id=resort.id).first()
        if any(v is not None for v in rolling.values()):
            fields = {f"next_{h}h_in": rolling.get(h) for h in SNOW_WINDOWS_HOURS}
            if forecast_row:
                for k, v in fields.items():
                    setattr(forecast_row, k, v)
                forecast_row.scraped_at, forecast_row.is_stale = now, False
            else:
                self.db.add(SnowForecast(resort_id=resort.id, scraped_at=now, is_stale=False, **fields))
        elif forecast_row:
            forecast_row.is_stale = True

        self.db.query(WeatherForecast).filter_by(resort_id=resort.id).delete()
        for period in selected_periods:
            date_str = period["startTime"][:10]
            self.db.add(WeatherForecast(
                resort_id=resort.id,
                forecast_date=date_str,
                high_f=float(period["temperature"]) if period.get("isDaytime") else None,
                low_f=float(period["temperature"]) if not period.get("isDaytime") else None,
                precip_pct=period.get("probabilityOfPrecipitation", {}).get("value"),
                snow_in_forecast=_has_snow(period.get("shortForecast", "")),
                snow_amount_in=snow_by_date.get(date_str),
                wind_mph=_parse_wind_mph(period.get("windSpeed")),
                scraped_at=now,
                is_stale=False,
            ))
        self.db.commit()
        self._record_success()

    async def scrape_all(self) -> None:
        from app.scrapers.base import run_concurrently
        resorts = self.db.query(Resort).all()
        await run_concurrently([lambda r=r: self.scrape_resort(r) for r in resorts], concurrency=5)
        await self.close()
