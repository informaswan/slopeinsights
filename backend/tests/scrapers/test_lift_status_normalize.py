# tests/scrapers/test_lift_status_normalize.py
from app.scrapers.lift_status._status import normalize_status


def test_open_variants():
    assert normalize_status("open") == "open"
    assert normalize_status("Open") == "open"
    assert normalize_status("OPEN") == "open"


def test_hold_variants():
    assert normalize_status("hold") == "on_hold"
    assert normalize_status("Hold") == "on_hold"
    assert normalize_status("on_hold") == "on_hold"
    assert normalize_status("wind_hold") == "on_hold"


def test_closed_and_unknown_values_fall_back_to_closed():
    assert normalize_status("closed") == "closed"
    assert normalize_status("CLOSED") == "closed"
    assert normalize_status("closed_for_season") == "closed"
    assert normalize_status("lightning_closure") == "closed"
    assert normalize_status("scheduled") == "closed"


def test_missing_value_defaults_to_closed():
    assert normalize_status(None) == "closed"
    assert normalize_status("") == "closed"
