"""What the app shows for each stored webcam, without ever using OpenSnow's pictures.

Our webcam rows still hold OpenSnow cam URLs, but only as identifiers: that is how we know
which cam it is and who owns it (see webcam_sources.py). OpenSnow's terms don't allow copying
its content, so its pictures are never fetched or shown. Each OpenSnow-identified cam becomes:
  - a picture straight from the owner's own server, when we have a verified address (DIRECT_IMAGES);
  - else its YouTube live stream, when it has one (those are the resort's own public streams);
  - else part of one "Live cams at <owner>" link to the owner's own cam page;
  - else nothing: the owner is unknown, so there is nothing legitimate to show.
Cams that never came from OpenSnow (resort-hosted or road cameras) pass through unchanged.
"""
from urllib.parse import urlparse

from app.models.webcam import Webcam
from app.webcam_sources import cam_id, source_for
from app.webcam_streams import stream_url_for

_OPENSNOW_HOST = "webcams.opensnow.com"

_ALTA = ("Alta", "https://www.alta.com/weather#mountain-cams")
_ALTA_BUCKET = "https://alta-webcams.sfo3.cdn.digitaloceanspaces.com"

# OpenSnow cam id -> (the owner's own picture, the owner's credit). Add one only after checking,
# on the owner's own cam page, that the address is that cam and that the picture is kept fresh.
DIRECT_IMAGES: dict[int, tuple[str, tuple[str, str]]] = {
    2826: (f"{_ALTA_BUCKET}/Collins_Snow_Stake.jpg", _ALTA),  # Snow Stake
    2344: (f"{_ALTA_BUCKET}/Superior.jpg", _ALTA),  # Mount Superior
    2345: (f"{_ALTA_BUCKET}/Highrustler.jpg", _ALTA),  # High Rustler
    91: (f"{_ALTA_BUCKET}/sugar_peak.jpg", _ALTA),  # Sugarloaf Peak
    2346: (f"{_ALTA_BUCKET}/Greeley.jpg", _ALTA),  # East Greeley
}


def is_opensnow(url: str) -> bool:
    return urlparse(url).hostname == _OPENSNOW_HOST


def picture_url(w: Webcam) -> str | None:
    """The address to fetch this cam's picture from, or None if we must not fetch one."""
    if not is_opensnow(w.url):
        return w.url
    direct = DIRECT_IMAGES.get(cam_id(w.url) or -1)
    return direct[0] if direct else None


def _item(label, cam_type, url, is_alive, stream_url=None, source=None) -> dict:
    return {
        "label": label, "cam_type": cam_type, "url": url, "is_alive": is_alive, "stream_url": stream_url,
        "source_name": source[0] if source else None, "source_url": source[1] if source else None,
    }


def present_webcams(webcams: list[Webcam]) -> list[dict]:
    items: list[dict] = []
    links: dict[str, dict] = {}  # source page -> its single "Live cams at ..." entry
    for w in webcams:
        direct = picture_url(w)
        known = DIRECT_IMAGES.get(cam_id(w.url) or -1)
        source = known[1] if known else source_for(w.url)
        if direct:
            items.append(_item(w.label, w.cam_type, direct, w.is_alive, stream_url_for(w.url), source))
        elif stream := stream_url_for(w.url):
            items.append(_item(w.label, "stream", source[1] if source else stream, True, stream, source))
        elif source and source[1] not in links:
            links[source[1]] = _item(f"Live cams at {source[0]}", "link", source[1], True, None, source)
    return items + list(links.values())
