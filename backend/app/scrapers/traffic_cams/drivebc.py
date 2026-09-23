"""
DriveBC (BC Ministry of Transportation) highway cameras.
SOURCE: https://www.drivebc.ca/api/webcams/ — the JSON API DriveBC's own site uses,
public, no API key. Images are served from https://www.drivebc.ca/images/{id}.jpg.

We used to read the BC Data Catalogue CSV instead, whose image links point at
images.drivebc.ca — that host resets TLS connections from most networks (server- and
browser-side alike) so the images never loaded. The drivebc.ca image path works.

Cameras aren't tagged by resort, so we pick the closest ones to each resort's own
coordinates, same as ontario511.py.
"""
import logging

from app.models.resort import Resort
from app.models.webcam import Webcam
from app.scrapers.base import BaseScraper, ScraperError
from app.scrapers.traffic_cams._geo import haversine_miles

logger = logging.getLogger(__name__)

API_URL = "https://www.drivebc.ca/api/webcams/"
IMAGE_URL = "https://www.drivebc.ca/images/{id}.jpg"
MAX_DISTANCE_MI = 10
MAX_CAMS_PER_RESORT = 4

# Resorts we have a mapped BC road/resort_id for (see app/traffic_cams.py).
RESORT_IDS = ["whistler-blackcomb", "revelstoke"]


def _usable_cameras(cameras: list[dict]) -> list[dict]:
    usable = []
    for cam in cameras:
        coords = (cam.get("location") or {}).get("coordinates")
        if not coords or len(coords) < 2 or cam.get("id") is None:
            continue
        if cam.get("is_on") is False or cam.get("should_appear") is False or cam.get("marked_stale"):
            continue
        usable.append({**cam, "_lat": float(coords[1]), "_lng": float(coords[0])})
    return usable


def _nearby(cameras: list[dict], lat: float, lng: float, max_mi: float, limit: int) -> list[dict]:
    scored = [(haversine_miles(lat, lng, c["_lat"], c["_lng"]), c) for c in cameras]
    scored = [(dist, c) for dist, c in scored if dist <= max_mi]
    scored.sort(key=lambda t: t[0])
    return [c for _, c in scored[:limit]]


class DriveBCScraper(BaseScraper):
    name = "traffic_cams_drivebc"

    async def scrape_all(self) -> None:
        if self.is_circuit_open():
            self.decrement_skip()
            return
        try:
            cameras = _usable_cameras(await self._fetch_json(API_URL))
        except ScraperError as exc:
            self._record_failure(str(exc))
            logger.warning("DriveBC traffic-cam scrape failed: %s", exc)
            return
        if not cameras:
            self._record_failure("No usable cameras in the DriveBC API response")
            logger.warning("DriveBC traffic-cam scrape found no usable cameras")
            return

        for resort_id in RESORT_IDS:
            resort = self.db.query(Resort).filter_by(id=resort_id).first()
            if not resort:
                continue
            picks = _nearby(cameras, resort.latitude, resort.longitude, MAX_DISTANCE_MI, MAX_CAMS_PER_RESORT)
            self.db.query(Webcam).filter_by(resort_id=resort_id, category="traffic").delete()
            for cam in picks:
                self.db.add(Webcam(
                    resort_id=resort_id, label=cam.get("name") or "DriveBC camera", cam_type="jpeg",
                    url=IMAGE_URL.format(id=cam["id"]), is_alive=True, category="traffic",
                ))
        self.db.commit()
        self._record_success()
