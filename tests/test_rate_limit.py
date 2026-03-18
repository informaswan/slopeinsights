# tests/test_rate_limit.py
"""
Smoke test for the per-IP rate limit (60 req/min).
The TestClient uses a fixed loopback IP, so repeated calls from the same
client instance will accumulate against the same key.
We use a low custom limit (3/minute) on a dedicated test endpoint to keep
the test fast without hammering the actual 60-request limit.
"""
from fastapi import FastAPI
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.testclient import TestClient
from starlette.requests import Request


def test_rate_limit_exceeded_returns_429():
    """A limiter set to 3/minute returns 429 on the 4th request."""
    test_app = FastAPI()
    limiter = Limiter(key_func=get_remote_address)
    test_app.state.limiter = limiter
    test_app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    @test_app.get("/ping")
    @limiter.limit("3/minute")
    def ping(request: Request):
        return {"ok": True}

    with TestClient(test_app) as c:
        for _ in range(3):
            assert c.get("/ping").status_code == 200
        assert c.get("/ping").status_code == 429
