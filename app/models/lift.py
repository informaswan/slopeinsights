from sqlalchemy import Column, String, Integer, Boolean, DateTime
from app.database import Base


class LiftStatus(Base):
    __tablename__ = "lift_status"

    id = Column(Integer, primary_key=True, autoincrement=True)
    resort_id = Column(String, nullable=False, index=True)
    lift_name = Column(String, nullable=False)
    status = Column(String, nullable=False)  # "open" | "closed" | "on_hold"
    scraped_at = Column(DateTime, nullable=False)
    is_stale = Column(Boolean, default=False)
