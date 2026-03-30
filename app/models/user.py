from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    avatar_url = Column(String, nullable=True)
    provider = Column(String, nullable=False)
    provider_id = Column(String, nullable=False, unique=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))


class UserResort(Base):
    __tablename__ = "user_resorts"
    __table_args__ = (UniqueConstraint("user_id", "resort_id"),)

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    resort_id = Column(String, ForeignKey("resorts.id"), nullable=False)
    added_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
