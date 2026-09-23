# app/scrapers/lift_status/_status.py


def normalize_status(raw: str | None) -> str:
    """Every platform this package talks to uses its own vocabulary ("open",
    "CLOSED", "closed_for_season", "lightning_closure", "Hold", ...) — collapse
    them all to our three canonical values."""
    if not raw:
        return "closed"
    key = raw.strip().lower()
    if "hold" in key:
        return "on_hold"
    if key == "open":
        return "open"
    return "closed"
