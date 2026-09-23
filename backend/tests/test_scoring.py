# tests/test_scoring.py
import pytest
from app.scoring import compute_best_score, rank_resorts


def test_full_score():
    # 12" snow (max) and 100% lifts open = perfect score
    assert compute_best_score(new_24h_in=12.0, lifts_open=18, lifts_total=18) == 1.0


def test_zero_snow_score():
    score = compute_best_score(new_24h_in=0.0, lifts_open=9, lifts_total=18)
    assert score == pytest.approx(0.3 * 0.5, abs=0.01)


def test_missing_component_scores_zero():
    # lift data missing
    score = compute_best_score(new_24h_in=6.0, lifts_open=None, lifts_total=None)
    assert score == pytest.approx(min(6.0 / 12.0, 1.0) * 0.7, abs=0.01)


def test_all_missing_excluded():
    assert compute_best_score(new_24h_in=None, lifts_open=None, lifts_total=None) is None


def test_rank_resorts_returns_top_5():
    resorts = [
        {"id": f"r{i}", "snow": {"new_24h_in": i}, "lifts": {"open": i, "total": 10}}
        for i in range(10)
    ]
    top = rank_resorts(resorts, n=5)
    assert len(top) == 5
    # Resort with highest snow (9") should be first
    assert top[0]["id"] == "r9"
