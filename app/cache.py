# app/cache.py — minimal stub, fully implemented in Task 13
_cache: dict | None = None


def get_cached_resort_list() -> list | None:
    return _cache


def set_cached_resort_list(data: list) -> None:
    global _cache
    _cache = data


def invalidate_cache() -> None:
    global _cache
    _cache = None
