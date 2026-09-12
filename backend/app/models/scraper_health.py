from sqlalchemy import Column, String, Integer, DateTime, Text
from app.database import Base


class ScraperHealth(Base):
    __tablename__ = "scraper_health"

    id = Column(Integer, primary_key=True, autoincrement=True)
    scraper_name = Column(String, nullable=False, index=True)
    last_run_at = Column(DateTime)
    status = Column(String)
    consecutive_failures = Column(Integer, default=0)
    skip_until_run = Column(Integer, default=0)
    last_error = Column(Text)
