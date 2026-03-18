from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime
from app.database import Base


class SnowCondition(Base):
    __tablename__ = "snow_conditions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    resort_id = Column(String, nullable=False, index=True)
    base_in = Column(Float)
    new_24h_in = Column(Float)
    new_48h_in = Column(Float)
    new_7d_in = Column(Float)
    surface = Column(String)
    trails_open = Column(Integer)
    trails_total = Column(Integer)
    scraped_at = Column(DateTime, nullable=False)
    is_stale = Column(Boolean, default=False)
