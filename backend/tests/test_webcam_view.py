from app.models.webcam import Webcam
from app.webcam_view import DIRECT_IMAGES, picture_url, present_webcams

OS = "https://webcams.opensnow.com/current/{}.jpg"


def cam(cam_id, label="Cam", url=None, cam_type="jpeg", alive=True):
    return Webcam(resort_id="vail", label=label, cam_type=cam_type, url=url or OS.format(cam_id), is_alive=alive)


def test_cam_with_a_verified_direct_image_uses_the_owners_picture():
    [item] = present_webcams([cam(2345, "High Rustler")])
    assert item["cam_type"] == "jpeg"
    assert item["url"] == DIRECT_IMAGES[2345][0]
    assert "opensnow" not in item["url"]
    assert item["source_name"] == "Alta"


def test_cams_without_a_direct_image_collapse_into_one_link_to_the_owner():
    items = present_webcams([cam(2452, "Snow Stake"), cam(608, "Blue Sky"), cam(3379, "China Bowl")])
    assert len(items) == 1
    assert items[0]["cam_type"] == "link"
    assert items[0]["label"] == "Live cams at Vail"
    assert items[0]["url"].startswith("https://www.vail.com/")


def test_different_owners_get_separate_links():
    items = present_webcams([cam(2452), cam(18)])  # Vail, Beaver Creek
    assert {i["label"] for i in items} == {"Live cams at Vail", "Live cams at Beaver Creek"}


def test_cam_opensnow_no_longer_lists_is_hidden():
    assert present_webcams([cam(1746, "Lionshead")]) == []


def test_no_opensnow_picture_address_is_ever_returned():
    items = present_webcams([cam(i) for i in (2452, 608, 18, 2345, 1746)])
    assert all("opensnow.com/current" not in i["url"] for i in items)


def test_cam_hosted_elsewhere_passes_through():
    [item] = present_webcams([cam(0, "Summit", url="https://media.mammothresorts.com/summit.jpg")])
    assert item["url"] == "https://media.mammothresorts.com/summit.jpg"
    assert item["cam_type"] == "jpeg"


def test_a_live_stream_is_kept_without_the_opensnow_picture():
    from app.webcam_streams import LIVE_STREAMS
    from app.webcam_sources import SOURCES
    cam_id = next(int(i) for i in LIVE_STREAMS if int(i) in SOURCES and int(i) not in DIRECT_IMAGES)
    [item] = present_webcams([cam(cam_id)])
    assert item["cam_type"] == "stream"
    assert item["stream_url"]
    assert "opensnow.com/current" not in item["url"]


def test_picture_url_never_fetches_from_opensnow():
    assert picture_url(cam(2452)) is None
    assert picture_url(cam(2345)) == DIRECT_IMAGES[2345][0]
    assert picture_url(cam(0, url="https://media.mammothresorts.com/s.jpg")) == "https://media.mammothresorts.com/s.jpg"
