from app.webcam_streams import LIVE_STREAMS, stream_url_for


def test_known_cam_gets_a_youtube_embed():
    cam_id, video = next((k, v) for k, v in LIVE_STREAMS.items() if not v.startswith("https://"))
    url = stream_url_for(f"https://webcams.opensnow.com/current/{cam_id}.jpg")
    assert url.startswith(f"https://www.youtube-nocookie.com/embed/{video}?")


def test_cam_without_a_stream_gets_none():
    assert stream_url_for("https://webcams.opensnow.com/current/999999999.jpg") is None


def test_non_opensnow_url_gets_none():
    assert stream_url_for("https://media.mammothresorts.com/cam.jpg") is None


def test_every_stream_is_on_a_trusted_host():
    for cam_id in LIVE_STREAMS:
        url = stream_url_for(f"https://webcams.opensnow.com/current/{cam_id}.jpg")
        assert url.startswith(("https://www.youtube-nocookie.com/embed/", "https://relay.ozolio.com/pub.api?cmd=embed&oid=")), cam_id
