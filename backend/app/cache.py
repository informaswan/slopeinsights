# app/cache.py
"""
In-memory cache for resort responses.

- GET /api/resorts (the list): invalidated explicitly by the scraper jobs whose
  data actually appears in it — snow, weather, and lift status (parking doesn't
  show up in the list, only on a resort's own detail page) — so it's never more
  than one scrape cycle stale.
- GET /api/resorts/{id} (detail): a short TTL cache instead of invalidation
  hooks. Detail pulls from every scraper (snow, lifts, weather, parking,
  webcams) — threading an invalidation call through all of them for a page
  that's cheap to recompute anyway isn't worth the coupling. A resort's detail
  response is reused for up to CACHE_TTL_SECONDS before being recomputed.

Thread-safe for single-process FastAPI + APScheduler deployment.
"""
import time
from typing import Any

CACHE_TTL_SECONDS = 60

_cache: dict[str, Any] = {"resort_list": None, "resort_detail": {}}


def get_cached_resort_list() -> list | None:
    return _cache["resort_list"]


def set_cached_resort_list(data: list) -> None:
    _cache["resort_list"] = data


def get_cached_resort_detail(resort_id: str) -> dict | None:
    entry = _cache["resort_detail"].get(resort_id)
    if entry is None:
        return None
    data, expires_at = entry
    if time.monotonic() >= expires_at:
        del _cache["resort_detail"][resort_id]
        return None
    return data


def set_cached_resort_detail(resort_id: str, data: dict) -> None:
    _cache["resort_detail"][resort_id] = (data, time.monotonic() + CACHE_TTL_SECONDS)


def invalidate_cache() -> None:
    _cache["resort_list"] = None
    _cache["resort_detail"] = {}
