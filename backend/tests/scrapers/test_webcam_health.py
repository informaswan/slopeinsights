# tests/scrapers/test_webcam_health.py
import io
from datetime import datetime, timedelta, timezone
from email.utils import format_datetime

import pytest
import httpx
import respx
from PIL import Image, ImageDraw
from app.scrapers.webcam_health import WebcamHealthChecker
from app.models.resort import Resort
from app.models.webcam import Webcam


def _jpeg(icon=None):
    """An OpenSnow-style 800x600 frame; `icon` paints the connection icon in the header bar."""
    im = Image.new("RGB", (800, 600), (20, 20, 20))
    if icon:
        ImageDraw.Draw(im).rectangle((503, 12, 523, 30), fill=icon)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=95)
    return buf.getvalue()


OFFLINE_RED = (220, 40, 40)
ONLINE_WHITE = (255, 255, 255)


def _modified(hours_ago):
    return format_datetime(datetime.now(timezone.utc) - timedelta(hours=hours_ago), usegmt=True)


async def _check_jpeg(db, cam, response):
    async with respx.mock(using="httpx") as respx_mock:
        respx_mock.head("https://cams.vail.com/summit.m3u8").mock(return_value=httpx.Response(200))
        route = respx_mock.get(url__startswith="https://cams.vail.com/base.jpg").mock(return_value=response)
        await WebcamHealthChecker(db).check_all()
    db.refresh(cam)
    return route


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
        respx_mock.get(url__startswith="https://cams.vail.com/base.jpg").mock(
            return_value=httpx.Response(200, content=_jpeg())
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
        respx_mock.get(url__startswith="https://cams.vail.com/base.jpg").mock(
            return_value=httpx.Response(404)
        )
        checker = WebcamHealthChecker(db)
        await checker.check_all()
    db.refresh(cam_dead)
    assert cam_dead.is_alive is False


@pytest.mark.asyncio
async def test_offline_icon_marks_cam_dead_even_with_a_fresh_timestamp(db, setup):
    # OpenSnow keeps re-stamping the clock on the last photo of a camera that lost its feed.
    _, cam = setup
    await _check_jpeg(db, cam, httpx.Response(
        200, content=_jpeg(OFFLINE_RED), headers={"last-modified": _modified(0.1)}))
    assert cam.is_alive is False


@pytest.mark.asyncio
async def test_online_icon_and_fresh_timestamp_is_alive(db, setup):
    _, cam = setup
    await _check_jpeg(db, cam, httpx.Response(
        200, content=_jpeg(ONLINE_WHITE), headers={"last-modified": _modified(0.1)}))
    assert cam.is_alive is True


@pytest.mark.asyncio
async def test_frozen_picture_with_no_icon_is_dead(db, setup):
    # e.g. the Big Boulder / Jack Frost cams: no offline icon, but untouched for weeks.
    _, cam = setup
    await _check_jpeg(db, cam, httpx.Response(
        200, content=_jpeg(), headers={"last-modified": _modified(24 * 75)}))
    assert cam.is_alive is False


@pytest.mark.asyncio
async def test_missing_last_modified_does_not_kill_a_cam(db, setup):
    _, cam = setup
    await _check_jpeg(db, cam, httpx.Response(200, content=_jpeg()))
    assert cam.is_alive is True


@pytest.mark.asyncio
async def test_a_cam_that_recovers_is_marked_alive_again(db, setup):
    _, cam = setup
    cam.is_alive = False
    db.commit()
    await _check_jpeg(db, cam, httpx.Response(
        200, content=_jpeg(), headers={"last-modified": _modified(0.1)}))
    assert cam.is_alive is True


@pytest.mark.asyncio
async def test_non_image_response_is_dead(db, setup):
    _, cam = setup
    await _check_jpeg(db, cam, httpx.Response(200, content=b"<html>blocked</html>"))
    assert cam.is_alive is False


@pytest.mark.asyncio
async def test_check_bypasses_the_upstream_edge_cache(db, setup):
    _, cam = setup
    route = await _check_jpeg(db, cam, httpx.Response(200, content=_jpeg()))
    request = route.calls.last.request
    assert "t=" in str(request.url.query, "utf-8")
    assert "no-cache" in request.headers.get("cache-control", "")
