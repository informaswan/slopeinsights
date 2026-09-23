# tests/test_cache.py
import pytest
from unittest.mock import patch
from app.cache import (
    get_cached_resort_list, set_cached_resort_list, invalidate_cache,
    get_cached_resort_detail, set_cached_resort_detail, CACHE_TTL_SECONDS,
)


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


def test_detail_cache_miss_returns_none():
    assert get_cached_resort_detail("vail") is None


def test_detail_cache_hit_returns_data():
    data = {"id": "vail", "name": "Vail"}
    set_cached_resort_detail("vail", data)
    assert get_cached_resort_detail("vail") == data


def test_detail_cache_is_keyed_per_resort():
    set_cached_resort_detail("vail", {"id": "vail"})
    assert get_cached_resort_detail("breck") is None


def test_detail_cache_expires_after_its_ttl():
    with patch("app.cache.time.monotonic", side_effect=[0, CACHE_TTL_SECONDS + 1]):
        set_cached_resort_detail("vail", {"id": "vail"})
        assert get_cached_resort_detail("vail") is None


def test_detail_cache_survives_up_to_its_ttl():
    with patch("app.cache.time.monotonic", side_effect=[0, CACHE_TTL_SECONDS - 1]):
        set_cached_resort_detail("vail", {"id": "vail"})
        assert get_cached_resort_detail("vail") == {"id": "vail"}


def test_invalidate_clears_the_detail_cache_too():
    set_cached_resort_detail("vail", {"id": "vail"})
    invalidate_cache()
    assert get_cached_resort_detail("vail") is None
