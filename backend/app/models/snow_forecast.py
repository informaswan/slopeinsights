from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime
from app.database import Base


class SnowForecast(Base):
    """Expected new snowfall, rolling from the moment of the scrape (NWS gridpoint data).
    Separate from SnowCondition, which is snow that already fell as reported by the resort."""
    __tablename__ = "snow_forecasts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    resort_id = Column(String, nullable=False, unique=True, index=True)
    next_24h_in = Column(Float)
    next_48h_in = Column(Float)
    next_72h_in = Column(Float)
    scraped_at = Column(DateTime, nullable=False)
    is_stale = Column(Boolean, default=False)
