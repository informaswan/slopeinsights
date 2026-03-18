from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime
from app.database import Base


class WeatherForecast(Base):
    __tablename__ = "weather_forecasts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    resort_id = Column(String, nullable=False, index=True)
    forecast_date = Column(String, nullable=False)  # "YYYY-MM-DD"
    high_f = Column(Float)
    low_f = Column(Float)
    precip_pct = Column(Integer)
    snow_in_forecast = Column(Boolean, default=False)
    wind_mph = Column(Float)
    scraped_at = Column(DateTime, nullable=False)
    is_stale = Column(Boolean, default=False)
