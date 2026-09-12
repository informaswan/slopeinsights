# app/schemas/__init__.py
from app.schemas.resort import (
    ResortSummary, ResortDetail, BestResortResponse,
    LiftDetail, WebcamItem, ParkingDetail,
)
from app.schemas.errors import ErrorResponse

__all__ = [
    "ResortSummary", "ResortDetail", "BestResortResponse",
    "LiftDetail", "WebcamItem", "ParkingDetail", "ErrorResponse",
]
