# app/scrapers/webcam_health.py
"""Marks webcams dead when they aren't showing a live picture.

A 200 response is not enough: webcams.opensnow.com keeps serving a camera's last photo
forever after its feed drops (we saw a September frame in October), and re-stamps the clock
on some of them, so neither the status code nor Last-Modified can be trusted alone. A JPEG
cam is dead when any of these hold:
  - the request fails, or the response isn't an image;
  - OpenSnow's red "offline" icon is drawn in the header bar (the reliable signal; every
    flagged camera across all 222 seeded cams split cleanly 0 vs 53+ red pixels);
  - Last-Modified is older than MAX_PICTURE_AGE (catches cams that froze without the icon).
"""
import asyncio
import io
import logging
import time
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime

from PIL import Image, UnidentifiedImageError

from app.models.webcam import Webcam
from app.scrapers.base import BaseScraper

logger = logging.getLogger(__name__)

MAX_PICTURE_AGE = timedelta(hours=6)
CONCURRENCY = 10

# OpenSnow's 800px-wide frames carry a black header bar; the connection icon sits at
# x 503-523, y 12-30. Coordinates scale with the image width.
_BAR_HEIGHT = 40
_ICON_BOX = (490, 6, 535, 38)
_OFFLINE_MIN_RED_PIXELS = 20


def has_offline_icon(content: bytes) -> bool:
    """True if the image has OpenSnow's red crossed-out connection icon in its header bar."""
    try:
        im = Image.open(io.BytesIO(content)).convert("RGB")
    except (UnidentifiedImageError, OSError):
        return False
    scale = im.width / 800
    # Only look at images that really have the dark OpenSnow bar, so a red object near the
    # top of some other camera's photo can't be mistaken for the icon.
    bar = im.crop((0, 0, im.width, max(1, int(_BAR_HEIGHT * scale)))).convert("L").tobytes()
    if sorted(bar)[len(bar) // 2] > 50:
        return False
    x0, y0, x1, y1 = (int(v * scale) for v in _ICON_BOX)
    rgb = im.crop((x0, y0, x1, y1)).tobytes()
    red = sum(1 for i in range(0, len(rgb), 3) if rgb[i] > 150 and rgb[i + 1] < 90 and rgb[i + 2] < 90)
    return red > _OFFLINE_MIN_RED_PIXELS


def picture_is_live(content: bytes, last_modified: str | None, now: datetime | None = None) -> bool:
    try:
        Image.open(io.BytesIO(content)).verify()
    except (UnidentifiedImageError, OSError):
        return False
    if has_offline_icon(content):
        return False
    if last_modified:
        try:
            age = (now or datetime.now(timezone.utc)) - parsedate_to_datetime(last_modified)
            if age > MAX_PICTURE_AGE:
                return False
        except (TypeError, ValueError):
            pass  # unparseable header: don't kill a camera over it
    return True


class WebcamHealthChecker(BaseScraper):
    name = "webcam_health"

    async def check_all(self) -> None:
        cams = self.db.query(Webcam).all()
        gate = asyncio.Semaphore(CONCURRENCY)

        async def check(cam: Webcam) -> bool:
            async with gate:
                return await self._is_live(cam)

        results = await asyncio.gather(*(check(cam) for cam in cams))
        for cam, alive in zip(cams, results):
            cam.is_alive = alive
        self.db.commit()
        logger.info("Webcam health: %d/%d live", sum(results), len(cams))
        await self.close()

    async def _is_live(self, cam: Webcam) -> bool:
        try:
            if cam.cam_type != "jpeg":
                return (await self.client.head(cam.url, timeout=10.0)).status_code < 400
            # Bypass the upstream CDN's year-long cache, or we'd inspect the same stale copy.
            sep = "&" if "?" in cam.url else "?"
            resp = await self.client.get(
                f"{cam.url}{sep}t={int(time.time())}", timeout=15.0,
                headers={"Cache-Control": "no-cache"},
            )
            if resp.status_code >= 400:
                return False
            return picture_is_live(resp.content, resp.headers.get("last-modified"))
        except Exception:
            return False
