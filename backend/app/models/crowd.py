from sqlalchemy import Column, String, Integer, Text, UniqueConstraint
from app.database import Base


class CrowdData(Base):
    __tablename__ = "crowd_data"
    __table_args__ = (UniqueConstraint("resort_id", "day_of_week"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    resort_id = Column(String, nullable=False, index=True)
    day_of_week = Column(Integer, nullable=False)  # 0=Mon, 6=Sun
    hourly_json = Column(Text, nullable=False)  # JSON array of 10 ints (8am-5pm)
