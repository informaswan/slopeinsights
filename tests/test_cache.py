# tests/test_cache.py
import pytest
from app.cache import get_cached_resort_list, set_cached_resort_list, invalidate_cache


@pytest.fixture(autouse=True)
def reset_cache():
    invalidate_cache()
    yield
    invalidate_cache()


def test_cache_miss_returns_none():
    assert get_cached_resort_list() is None


def test_cache_hit_returns_data():
    data = [{"id": "vail", "name": "Vail"}]
    set_cached_resort_list(data)
    assert get_cached_resort_list() == data


def test_invalidate_clears_cache():
    set_cached_resort_list([{"id": "vail"}])
    invalidate_cache()
    assert get_cached_resort_list() is None
