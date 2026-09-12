# app/scoring.py
"""
Composite scoring for /api/resorts/best.

Formula:
  snow_component  = min(new_24h_in / 12.0, 1.0)  × 0.5
  crowd_component = (100 - current_pct) / 100      × 0.3   [inverted: less crowded = higher]
  lift_component  = lifts_open / lifts_total        × 0.2

Missing components score 0. If ALL components are missing, returns None (resort excluded).
"""


def compute_best_score(
    new_24h_in: float | None,
    current_pct: int | None,
    lifts_open: int | None,
    lifts_total: int | None,
) -> float | None:
    if all(v is None for v in [new_24h_in, current_pct, lifts_open]):
        return None

    snow = min((new_24h_in if new_24h_in is not None else 0.0) / 12.0, 1.0) * 0.5
    crowd = ((100 - current_pct) / 100.0) * 0.3 if current_pct is not None else 0.0
    lift = ((lifts_open if lifts_open is not None else 0) / lifts_total) * 0.2 if lifts_total else 0.0

    return round(snow + crowd + lift, 4)


def rank_resorts(resorts: list[dict], n: int = 5) -> list[dict]:
    """Score and rank a list of resort summary dicts. Returns top n."""
    scored = []
    for r in resorts:
        snow = (r.get("snow") or {}).get("new_24h_in")
        crowd_pct = (r.get("crowd") or {}).get("current_pct")
        lifts = r.get("lifts") or {}
        score = compute_best_score(
            new_24h_in=snow,
            current_pct=crowd_pct,
            lifts_open=lifts.get("open"),
            lifts_total=lifts.get("total"),
        )
        if score is not None:
            scored.append((score, r))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [r for _, r in scored[:n]]
