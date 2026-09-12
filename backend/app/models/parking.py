from sqlalchemy import Column, String, Integer, Boolean, DateTime
from app.database import Base


class ParkingLot(Base):
    __tablename__ = "parking_lots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    resort_id = Column(String, nullable=False, index=True)
    lot_name = Column(String, nullable=False)
    is_live = Column(Boolean, default=False)
    status = Column(String)
    capacity_pct = Column(Integer)
    distance_ft = Column(Integer)
    cost = Column(String)
    directions_url = Column(String)
    scraped_at = Column(DateTime)
    is_stale = Column(Boolean, default=False)
