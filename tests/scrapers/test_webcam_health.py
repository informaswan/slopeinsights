# tests/scrapers/test_webcam_health.py
import pytest
import httpx
import respx
from app.scrapers.webcam_health import WebcamHealthChecker
from app.models.resort import Resort
from app.models.webcam import Webcam


@pytest.fixture
def setup(db):
    r = Resort(id="vail", name="Vail", pass_type="epic", region="Colorado",
               state="CO", country="US", latitude=39.6, longitude=-106.3,
               timezone="America/Denver", liftie_id="vail",
               onthesnow_slug="colorado/vail-ski-resort")
    db.add(r)
    db.flush()
    cam_alive = Webcam(resort_id="vail", label="Summit", cam_type="hls",
                       url="https://cams.vail.com/summit.m3u8", is_alive=True)
    cam_dead = Webcam(resort_id="vail", label="Base", cam_type="jpeg",
                      url="https://cams.vail.com/base.jpg", is_alive=True)
    db.add_all([cam_alive, cam_dead])
    db.commit()
    return cam_alive, cam_dead


@pytest.mark.asyncio
async def test_marks_alive_cam_as_alive(db, setup):
    cam_alive, cam_dead = setup
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.head("https://cams.vail.com/summit.m3u8").mock(
            return_value=httpx.Response(200)
        )
        respx_mock.head("https://cams.vail.com/base.jpg").mock(
            return_value=httpx.Response(200)
        )
        checker = WebcamHealthChecker(db)
        await checker.check_all()
    db.refresh(cam_alive)
    assert cam_alive.is_alive is True


@pytest.mark.asyncio
async def test_marks_dead_cam_as_not_alive(db, setup):
    cam_alive, cam_dead = setup
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.head("https://cams.vail.com/summit.m3u8").mock(
            return_value=httpx.Response(200)
        )
        respx_mock.head("https://cams.vail.com/base.jpg").mock(
            return_value=httpx.Response(404)
        )
        checker = WebcamHealthChecker(db)
        await checker.check_all()
    db.refresh(cam_dead)
    assert cam_dead.is_alive is False
