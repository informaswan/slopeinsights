# app/cache.py
"""
In-memory cache for GET /api/resorts list response.
Refreshed by the snow scraper job and every top-of-hour (current_pct changes hourly).
Thread-safe for single-process FastAPI + APScheduler deployment.
"""
from typing import Any

_cache: dict[str, Any] = {"resort_list": None}


def get_cached_resort_list() -> list | None:
    return _cache["resort_list"]


def set_cached_resort_list(data: list) -> None:
    _cache["resort_list"] = data


def invalidate_cache() -> None:
    _cache["resort_list"] = None
