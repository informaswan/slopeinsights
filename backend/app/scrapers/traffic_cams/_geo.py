# app/scrapers/traffic_cams/_geo.py
import math

_EARTH_RADIUS_MI = 3958.8


def haversine_miles(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Straight-line ("as the crow flies") distance between two points, in miles."""
    to_rad = math.radians
    dlat = to_rad(lat2 - lat1)
    dlng = to_rad(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(to_rad(lat1)) * math.cos(to_rad(lat2)) * math.sin(dlng / 2) ** 2
    return 2 * _EARTH_RADIUS_MI * math.asin(math.sqrt(a))
