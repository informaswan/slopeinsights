# tests/test_cache.py
from app.cache import get_cached_resort_list, set_cached_resort_list, invalidate_cache


def test_cache_miss_returns_none():
    invalidate_cache()
    assert get_cached_resort_list() is None


def test_cache_hit_returns_data():
    invalidate_cache()
    data = [{"id": "vail", "name": "Vail"}]
    set_cached_resort_list(data)
    assert get_cached_resort_list() == data


def test_invalidate_clears_cache():
    set_cached_resort_list([{"id": "vail"}])
    invalidate_cache()
    assert get_cached_resort_list() is None
