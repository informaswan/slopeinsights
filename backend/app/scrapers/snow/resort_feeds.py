# app/scrapers/snow/resort_feeds.py
"""
Snow depth / new snowfall / trail counts straight from each resort's own feed.

These are the same resort-reported numbers OnTheSnow relays (resorts measure at a
snow stake and publish; OnTheSnow reads the resort's report), so going to the
source drops the middleman and the HTML scraping.

Six feed shapes cover 19 resorts:
  - mtnpowder.com / snowreporting.herokuapp.com: GET /feed?resortId={id} — one JSON
    document with SnowReport (Base/MidMountain/Summit areas, 24/48/72h, trails).
  - jacksonhole.com/api/all.json: its own site-wide payload.
  - Boyne resorts' own sites (Big Sky, Loon, Sunday River, Sugarloaf):
    GET {site}/api/reportpal?resortName={code}&useReportPal=true.
  - skitaos.com/api/conditions?season=winter.
  - Powdr resorts (Copper, Snowbird, Mt. Bachelor): api.{site}/api/v1/dor/drupal/snow-reports
    (latest report has base depth and 24/48/72h totals) plus /trails for open/total counts.
  - Mt. Hood Meadows: skihood.com/api/weather/overview.
All public, no API key. Feed ids match app/scrapers/lift_status.
"""
import logging
from datetime import datetime, timedelta, timezone

from app.models.snow import SnowCondition
from app.scrapers.base import BaseScraper, ScraperError
from app.scrapers.lift_status.mtnpowder import RESORT_FEED_IDS as MTNPOWDER_IDS
from app.scrapers.lift_status.snowreporting_heroku import RESORT_FEED_IDS as HEROKU_IDS

logger = logging.getLogger(__name__)

JACKSON_HOLE_URL = "https://www.jacksonhole.com/api/all.json"

# Off-season feeds keep serving the last report of the winter (e.g. Winter Park's May
# numbers: 39" base, 8" in 48h) as if it were current. A report older than this is
# treated as "no current reading": numbers are blanked and scraped_at is the report's
# own date, so the UI shows how old it really is instead of "just now".
STALE_REPORT_AFTER = timedelta(days=14)


def _num(value) -> float | None:
    """Feeds use "--", "", or missing for "no reading"; anything else is a number
    (sometimes as a string)."""
    if isinstance(value, dict):  # Jackson Hole: {"unit": "INCH", "value": "40"}
        value = value.get("value")
    try:
        return float(str(value).replace(",", ""))
    except (TypeError, ValueError):
        return None


def _when(value: str | None, *formats: str) -> datetime | None:
    """Parse a feed timestamp; naive times are taken as UTC. None if unparseable."""
    if not value:
        return None
    text = str(value).replace("\u202f", " ").strip()
    for fmt in formats:
        try:
            parsed = datetime.strptime(text, fmt)
            return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    try:
        parsed = datetime.fromisoformat(text)
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def parse_mtnpowder_feed(data: dict) -> dict:
    report = data.get("SnowReport") or {}
    areas = [report.get(k) or {} for k in ("BaseArea", "MidMountainArea", "SummitArea")]

    def first(field: str) -> float | None:
        for area in areas:
            val = _num(area.get(field))
            if val is not None:
                return val
        return None

    conditions = report.get("BaseConditions")
    return {
        "base_in": first("BaseIn"),
        "new_24h_in": first("Last24HoursIn"),
        "new_48h_in": first("Last48HoursIn"),
        "new_7d_in": first("Last72HoursIn"),  # column name is historical; holds the 72-hour total
        "surface": conditions if conditions and conditions != "--" else None,
        "trails_open": report.get("TotalOpenTrails"),
        "trails_total": report.get("TotalTrails"),
        "reported_at": _when(report.get("LastUpdate"), "%Y-%m-%dT%H:%M:%S%z"),
    }


def parse_jackson_hole(data: dict) -> dict:
    snow = data.get("snow") or {}
    areas = [snow.get(k) or {} for k in ("midMountain", "tramSummit", "base")]

    def first(field: str) -> float | None:
        for area in areas:
            val = _num(area.get(field))
            if val is not None:
                return val
        return None

    trails = data.get("trailStatus") or {}
    return {
        "base_in": first("totalSnowDepth"),
        "new_24h_in": first("newSnowLast24H"),
        "new_48h_in": first("newSnowLast48H"),
        "new_7d_in": first("newSnowLast72H"),
        "surface": None,
        "trails_open": trails.get("openTrails"),
        "trails_total": trails.get("totalTrails"),
        "reported_at": _when(snow.get("lastModified"), "%m/%d/%y, %I:%M %p"),
    }


def parse_reportpal(data: dict) -> dict:
    """Boyne resorts' ReportPal payload: per-location snow (inches as strings) plus
    resort-wide trail counts. Uses the first location (the main mountain)."""
    conditions = data.get("currentConditions") or {}
    loc = ((conditions.get("resortLocations") or {}).get("location") or [{}])[0]
    wide = conditions.get("resortwide") or {}

    def inches(field: str) -> float | None:
        return _num((loc.get(field) or {}).get("inches"))

    return {
        "base_in": inches("base"),
        "new_24h_in": inches("snow24Hours"),
        "new_48h_in": inches("snow48Hours"),
        "new_7d_in": inches("snow72Hours"),
        "surface": None,
        "trails_open": wide.get("numTrailsOpen"),
        "trails_total": wide.get("numTrailsTotal"),
        "reported_at": _when(data.get("updated")),
    }


def parse_taos(data: dict) -> dict:
    snow = data.get("snowData") or {}
    return {
        "base_in": _num(snow.get("base")),
        "new_24h_in": _num(snow.get("last24Hours")),
        "new_48h_in": _num(snow.get("last48Hours")),
        "new_7d_in": _num(snow.get("last72Hours")),
        "surface": None,
        "trails_open": data.get("trailsOpen"),
        "trails_total": data.get("trailsTotal"),
    }


CM_PER_IN = 2.54


def parse_powdr(payloads: list) -> dict:
    """payloads = [snow-reports (newest first), trails]. The report carries numeric base
    depth and computed 24/48/72-hour totals; trail counts come from the trails list."""
    reports = payloads[0]
    latest = reports[0] if isinstance(reports, list) and reports else {}
    computed = latest.get("computed") or {}
    scale = 1 / CM_PER_IN if (latest.get("unit_of_measurement") or "in").lower().startswith("cm") else 1

    def inches(value) -> float | None:
        n = _num(value)
        return None if n is None else round(n * scale, 1)

    trails = payloads[1] if len(payloads) > 1 and isinstance(payloads[1], list) else []
    winter = [t for t in trails if (t.get("season") or "").lower() != "summer"]
    return {
        "base_in": inches(latest.get("base_depth")),
        "new_24h_in": inches(computed.get("24_hour")),
        "new_48h_in": inches(computed.get("48_hour")),
        "new_7d_in": inches(computed.get("72_hour")),
        "surface": None,
        "trails_open": sum(1 for t in winter if t.get("status") == "open") if winter else None,
        "trails_total": len(winter) if winter else None,
        "reported_at": _when(latest.get("date"), "%Y-%m-%d %H:%M:%S"),
    }


def parse_hood(data: dict) -> dict:
    def inch(field: dict | None) -> float | None:
        field = field or {}
        return _num(field.get("countryValue")) if field.get("countryUnit") == "INCH" else None

    zone = (data.get("snow") or [{}])[0]
    return {
        "base_in": inch(zone.get("snowTotalDepth")),
        "new_24h_in": inch(zone.get("freshSnowFallDepth24H")),
        "new_48h_in": inch(zone.get("freshSnowFallDepth48H")),
        "new_7d_in": inch(zone.get("freshSnowFallDepth72H")),
        "surface": None,
        "trails_open": None,
        "trails_total": None,
    }


POWDR_HOSTS = {
    "copper-mountain": "api.coppercolorado.com",
    "snowbird": "api.snowbird.com",
    "mt-bachelor": "api.mtbachelor.com",
}

REPORTPAL_SITES = {
    "big-sky": ("www.bigskyresort.com", "bs"),
    "loon-mountain": ("www.loonmtn.com", "lm"),
    "sunday-river": ("www.sundayriver.com", "sr"),
    "sugarloaf": ("www.sugarloaf.com", "sl"),
}


def _single(parse):
    return lambda payloads: parse(payloads[0])


def _sources() -> dict[str, tuple[list[str], callable]]:
    """resort_id -> (urls to fetch, parse(list of JSON payloads in that order))."""
    sources = {}
    for resort_id, feed_id in MTNPOWDER_IDS.items():
        sources[resort_id] = ([f"https://mtnpowder.com/feed?resortId={feed_id}"], _single(parse_mtnpowder_feed))
    for resort_id, feed_id in HEROKU_IDS.items():
        sources[resort_id] = ([f"https://snowreporting.herokuapp.com/feed?resortId={feed_id}"], _single(parse_mtnpowder_feed))
    sources["jackson-hole"] = ([JACKSON_HOLE_URL], _single(parse_jackson_hole))
    for resort_id, (host, code) in REPORTPAL_SITES.items():
        sources[resort_id] = ([f"https://{host}/api/reportpal?resortName={code}&useReportPal=true"], _single(parse_reportpal))
    sources["taos"] = (["https://www.skitaos.com/api/conditions?season=winter"], _single(parse_taos))
    for resort_id, host in POWDR_HOSTS.items():
        base = f"https://{host}/api/v1/dor/drupal"
        sources[resort_id] = ([f"{base}/snow-reports?sort=date&direction=desc", f"{base}/trails"], parse_powdr)
    sources["mt-hood-meadows"] = (
        ["https://www.skihood.com/api/weather/overview?weatherZone=Base%20Area"], _single(parse_hood))
    return sources


SOURCES = _sources()


class ResortFeedSnowScraper(BaseScraper):
    name = "snow_resort_feeds"

    async def _scrape_one(self, resort_id: str, urls: list[str], parse) -> bool:
        if self.is_circuit_open():
            self.decrement_skip()
            return False
        try:
            payloads = []
            for url in urls:
                try:
                    payloads.append(await self._fetch_json(url))
                except ScraperError:
                    if url is urls[0]:
                        raise
                    payloads.append(None)  # companion feed (e.g. trail counts) is best-effort
            parsed = parse(payloads)
        except (ScraperError, KeyError, TypeError, ValueError, AttributeError) as exc:
            self._record_failure(str(exc))
            logger.warning("Resort snow feed failed for %s: %s", resort_id, exc)
            return False

        now = datetime.now(timezone.utc)
        reported_at = parsed.pop("reported_at", None)
        if reported_at and now - reported_at > STALE_REPORT_AFTER:
            for field in ("base_in", "new_24h_in", "new_48h_in", "new_7d_in", "surface"):
                parsed[field] = None
        stamp = reported_at or now
        row = self.db.query(SnowCondition).filter_by(resort_id=resort_id).first()
        if row:
            for k, v in parsed.items():
                setattr(row, k, v)
            row.scraped_at, row.is_stale = stamp, False
        else:
            self.db.add(SnowCondition(resort_id=resort_id, scraped_at=stamp, is_stale=False, **parsed))
        self.db.commit()
        self._record_success()
        return True

    async def scrape_all(self) -> set[str]:
        """Returns the resort ids that were updated from their own feed this run."""
        covered: set[str] = set()
        for resort_id, (urls, parse) in SOURCES.items():
            if await self._scrape_one(resort_id, urls, parse):
                covered.add(resort_id)
        return covered
