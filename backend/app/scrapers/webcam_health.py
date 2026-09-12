# app/scrapers/webcam_health.py
import logging
from app.models.webcam import Webcam
from app.scrapers.base import BaseScraper

logger = logging.getLogger(__name__)


class WebcamHealthChecker(BaseScraper):
    name = "webcam_health"

    async def check_all(self) -> None:
        cams = self.db.query(Webcam).all()
        for cam in cams:
            try:
                resp = await self.client.head(cam.url, timeout=10.0)
                cam.is_alive = resp.status_code < 400
            except Exception:
                cam.is_alive = False
        self.db.commit()
        await self.close()
