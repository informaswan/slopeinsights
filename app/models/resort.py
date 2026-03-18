from sqlalchemy import Column, String, Float, Integer, Boolean
from app.database import Base


class Resort(Base):
    __tablename__ = "resorts"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    pass_type = Column(String, nullable=False)  # "epic" | "ikon"
    region = Column(String, nullable=False)
    state = Column(String, nullable=False)
    country = Column(String, nullable=False, default="US")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    summit_elevation_ft = Column(Integer)
    vertical_drop_ft = Column(Integer)
    website = Column(String)
    timezone = Column(String, nullable=False)
    liftie_id = Column(String, nullable=False)
    onthesnow_slug = Column(String, nullable=False)
    noaa_grid_url = Column(String)  # cached after first NOAA call
