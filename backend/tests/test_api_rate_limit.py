# tests/test_api_rate_limit.py
"""The default 120/minute per-client limit must apply to the real app, not just a toy app."""


def test_real_app_enforces_default_limit(client):
    codes = [client.get("/api/resorts").status_code for _ in range(121)]
    assert codes[:120] == [200] * 120
    assert codes[120] == 429


def test_health_check_is_exempt(client):
    assert all(client.get("/health").status_code == 200 for _ in range(70))


def test_limit_response_still_carries_cors_headers(client):
    for _ in range(120):
        client.get("/api/resorts")
    resp = client.get("/api/resorts", headers={"Origin": "http://localhost:8081"})
    assert resp.status_code == 429
    assert "access-control-allow-origin" in resp.headers


def test_webcam_proxy_has_its_own_higher_limit(client):
    # A detail page loads several cams that refresh on a timer; they must not eat the
    # general budget or hit it first. Disallowed hosts answer 400 without any network call.
    url = "/api/webcam-proxy?url=https://evil.example.com/x.jpg"
    codes = [client.get(url).status_code for _ in range(121)]
    assert 429 not in codes
    assert client.get("/api/resorts").status_code == 200
