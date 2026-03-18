from sqlalchemy import Column, String, Integer, Boolean
from app.database import Base


class Webcam(Base):
    __tablename__ = "webcams"

    id = Column(Integer, primary_key=True, autoincrement=True)
    resort_id = Column(String, nullable=False, index=True)
    label = Column(String, nullable=False)
    cam_type = Column(String, nullable=False)  # "hls" | "jpeg"
    url = Column(String, nullable=False)
    is_alive = Column(Boolean, default=True)
