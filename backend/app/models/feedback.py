from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Text, DateTime
from app.database import Base


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, autoincrement=True)
    category = Column(String, nullable=False, default="other")
    message = Column(Text, nullable=False)
    email = Column(String)  # optional: only if the person wants a reply
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
