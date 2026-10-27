# app/elevation.py
"""Adjusting a forecast temperature to a different elevation.

NOAA's forecast is for the terrain height of its ~2.5 km grid cell, not the summit. Air cools
about 3.5°F per 1,000 ft of climb on average (the standard environmental lapse rate, 6.5°C/km),
so the summit is estimated from the grid cell's own elevation. It is a rule of thumb: winter
inversions (cold air pooled low) make real summit lows warmer than this, so the app labels
the numbers as estimates.
"""

LAPSE_F_PER_1000_FT = 3.5
_FEET_PER_METER = 3.28084


def meters_to_feet(meters: float) -> float:
    return meters * _FEET_PER_METER


def adjust_temp_f(temp_f: float | None, from_ft: float | None, to_ft: float | None) -> float | None:
    """`temp_f` measured at `from_ft`, estimated at `to_ft`. None if any input is missing."""
    if temp_f is None or from_ft is None or to_ft is None:
        return None
    return round(temp_f - LAPSE_F_PER_1000_FT * (to_ft - from_ft) / 1000)
