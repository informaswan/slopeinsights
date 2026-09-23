# app/scrapers/traffic_cams/ontario511.py
"""
Ontario 511 traffic cameras.
SOURCE: https://511on.ca/api/v2/get/cameras — public JSON, no API key or registration
required (confirmed against the live endpoint). Each camera can have multiple "Views"
(angles), each a direct, unauthenticated JPEG URL.

Cameras aren't tagged by resort, so we pick the closest enabled views to each resort's
own coordinates, the same distance-based approach as the rest of this package.
"""
import logging

from app.models.resort import Resort
from app.models.webcam import Webcam
from app.scrapers.base import BaseScraper, ScraperError
from app.scrapers.traffic_cams._geo import haversine_miles

logger = logging.getLogger(__name__)

API_URL = "https://511on.ca/api/v2/get/cameras"
MAX_DISTANCE_MI = 10
MAX_CAMS_PER_RESORT = 4

# Resorts we have a mapped Ontario road/resort_id for (see app/traffic_cams.py).
RESORT_IDS = ["blue-mountain"]


def _nearby_views(cameras: list[dict], lat: float, lng: float, max_mi: float, limit: int) -> list[tuple[dict, dict]]:
    candidates: list[tuple[float, dict, dict]] = []
    for cam in cameras:
        clat, clng = cam.get("Latitude"), cam.get("Longitude")
        if clat is None or clng is None:
            continue
        dist = haversine_miles(lat, lng, clat, clng)
        if dist > max_mi:
            continue
        for view in cam.get("Views") or []:
            if view.get("Status") != "Enabled" or not view.get("Url"):
                continue
            candidates.append((dist, cam, view))
    candidates.sort(key=lambda t: t[0])
    return [(cam, view) for _, cam, view in candidates[:limit]]


def _label_for(cam: dict, view: dict) -> str:
    location = cam.get("Location") or cam.get("Roadway") or "Ontario 511 camera"
    return f"{location} — {view['Description']}" if view.get("Description") else location


class Ontario511Scraper(BaseScraper):
    name = "traffic_cams_ontario511"

    async def scrape_all(self) -> None:
        if self.is_circuit_open():
            self.decrement_skip()
            return
        try:
            cameras = await self._fetch_json(API_URL)
        except ScraperError as exc:
            self._record_failure(str(exc))
            logger.warning("Ontario 511 traffic-cam scrape failed: %s", exc)
            return

        for resort_id in RESORT_IDS:
            resort = self.db.query(Resort).filter_by(id=resort_id).first()
            if not resort:
                continue
            picks = _nearby_views(cameras, resort.latitude, resort.longitude, MAX_DISTANCE_MI, MAX_CAMS_PER_RESORT)
            self.db.query(Webcam).filter_by(resort_id=resort_id, category="traffic").delete()
            for cam, view in picks:
                self.db.add(Webcam(
                    resort_id=resort_id, label=_label_for(cam, view), cam_type="jpeg",
                    url=view["Url"], is_alive=True, category="traffic",
                ))
        self.db.commit()
        self._record_success()
