# app/schemas/resort.py
from __future__ import annotations
from pydantic import BaseModel


class SnowSummary(BaseModel):
    base_in: float | None
    new_24h_in: float | None
    scraped_at: str | None
    is_stale: bool


class LiftSummary(BaseModel):
    open: int
    total: int


class TrailSummary(BaseModel):
    open: int | None
    total: int | None


class CrowdSummary(BaseModel):
    current_level: str | None   # "low" | "medium" | "high" | "closed" | None
    current_pct: int | None
    source: str = "historical_pattern"


class ResortSummary(BaseModel):
    id: str
    name: str
    pass_type: str
    region: str
    state: str
    snow: SnowSummary | None
    lifts: LiftSummary | None
    trails: TrailSummary | None
    crowd: CrowdSummary | None


# ── Detail schemas ──────────────────────────────────────────────────────

class LiftItem(BaseModel):
    name: str
    status: str


class LiftDetail(BaseModel):
    open: int
    total: int
    scraped_at: str | None
    is_stale: bool
    items: list[LiftItem]


class SnowDetail(BaseModel):
    base_in: float | None
    new_24h_in: float | None
    new_48h_in: float | None
    new_7d_in: float | None
    surface: str | None
    scraped_at: str | None
    is_stale: bool


class WeatherPeriod(BaseModel):
    date: str
    high_f: float | None
    low_f: float | None
    precip_pct: int | None
    snow_in_forecast: bool
    wind_mph: float | None


class WeatherDetail(BaseModel):
    scraped_at: str | None
    is_stale: bool
    forecast: list[WeatherPeriod]


class CrowdDetail(BaseModel):
    current_level: str | None
    current_pct: int | None
    source: str
    label: str | None
    hourly_start: str
    hourly: list[int]


class WebcamItem(BaseModel):
    label: str
    cam_type: str
    url: str
    is_alive: bool


class LiveLot(BaseModel):
    name: str
    status: str | None
    capacity_pct: int | None


class StaticLot(BaseModel):
    name: str
    distance_ft: int | None
    cost: str | None
    directions_url: str | None


class ParkingDetail(BaseModel):
    has_live_data: bool
    scraped_at: str | None
    is_stale: bool
    live_lots: list[LiveLot]
    static_lots: list[StaticLot]


class TrafficCamLink(BaseModel):
    label: str
    url: str


class RoadCameraStop(BaseModel):
    name: str
    url: str


class RoadCameraGroup(BaseModel):
    name: str
    note: str | None = None
    stops: list[RoadCameraStop]


class RoadCameraResponse(BaseModel):
    groups: list[RoadCameraGroup]
    note: str


class ResortDetail(BaseModel):
    id: str
    name: str
    pass_type: str
    region: str
    state: str
    country: str
    summit_elevation_ft: int | None
    vertical_drop_ft: int | None
    website: str | None
    snow: SnowDetail | None
    lifts: LiftDetail | None
    trails: TrailSummary | None
    crowd: CrowdDetail | None
    weather: WeatherDetail | None
    webcams: list[WebcamItem]
    parking: ParkingDetail
    traffic_cams: list[TrafficCamLink]
    traffic_cams_note: str | None


class BestResortResponse(BaseModel):
    resorts: list[ResortSummary]
    generated_at: str
