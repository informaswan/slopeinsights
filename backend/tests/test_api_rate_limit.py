# tests/test_api_rate_limit.py
"""The default 60/minute per-client limit must apply to the real app, not just a toy app."""


def test_real_app_enforces_default_limit(client):
    codes = [client.get("/api/resorts").status_code for _ in range(61)]
    assert codes[:60] == [200] * 60
    assert codes[60] == 429


def test_health_check_is_exempt(client):
    assert all(client.get("/health").status_code == 200 for _ in range(70))


def test_limit_response_still_carries_cors_headers(client):
    for _ in range(60):
        client.get("/api/resorts")
    resp = client.get("/api/resorts", headers={"Origin": "http://localhost:8081"})
    assert resp.status_code == 429
    assert "access-control-allow-origin" in resp.headers
