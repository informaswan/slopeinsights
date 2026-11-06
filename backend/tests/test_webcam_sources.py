from app.webcam_sources import SOURCES, source_for


def test_known_cam_has_its_real_source():
    name, url = source_for("https://webcams.opensnow.com/current/2452.jpg")
    assert name == "Vail"
    assert url.startswith("https://www.vail.com/")


def test_unknown_or_non_opensnow_cam_has_no_source():
    assert source_for("https://webcams.opensnow.com/current/999999999.jpg") is None
    assert source_for("https://media.mammothresorts.com/cam.jpg") is None


def test_no_source_points_back_at_opensnow():
    for cam_id, (name, url) in SOURCES.items():
        assert name and url.startswith("http"), cam_id
        assert "opensnow.com" not in url, cam_id
