# tests/test_webcam_proxy.py
"""The proxy must never be served a stale edge-cached copy of a camera image.

webcams.opensnow.com sits behind Cloudflare with `max-age=31536000`, so requesting the
identical URL every time returned a months-old frame (a September image in October).
Each upstream request therefore carries a unique query string.
"""
from itertools import count
from urllib.parse import parse_qs, urlparse

import httpx
import pytest

CAM = "https://webcams.opensnow.com/current/607.jpg"


@pytest.fixture
def upstream_requests(monkeypatch):
    seen = []

    class FakeClient:
        def __init__(self, *a, **kw):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *exc):
            return False

        async def get(self, url, **kw):
            seen.append((url, kw.get("headers", {})))
            return httpx.Response(200, content=b"jpegbytes", headers={"content-type": "image/jpeg"},
                                  request=httpx.Request("GET", url))

    monkeypatch.setattr("app.routers.resorts.httpx.AsyncClient", FakeClient)
    return seen


def test_upstream_url_gets_a_cache_buster(client, upstream_requests):
    assert client.get("/api/webcam-proxy", params={"url": CAM}).status_code == 200
    url, headers = upstream_requests[0]
    assert url.startswith(CAM + "?")
    assert "t" in parse_qs(urlparse(url).query)
    assert "no-cache" in headers.get("Cache-Control", "")


def test_cache_buster_changes_between_requests(client, upstream_requests, monkeypatch):
    ticks = count(1000)
    monkeypatch.setattr("app.routers.resorts.time.time", lambda: next(ticks))
    client.get("/api/webcam-proxy", params={"url": CAM})
    client.get("/api/webcam-proxy", params={"url": CAM})
    assert upstream_requests[0][0] != upstream_requests[1][0]


def test_existing_query_string_is_preserved(client, upstream_requests):
    client.get("/api/webcam-proxy", params={"url": CAM + "?size=large"})
    query = parse_qs(urlparse(upstream_requests[0][0]).query)
    assert query["size"] == ["large"] and "t" in query


def test_disallowed_host_is_still_rejected(client, upstream_requests):
    r = client.get("/api/webcam-proxy", params={"url": "https://evil.example.com/a.jpg"})
    assert r.status_code == 400 and upstream_requests == []
