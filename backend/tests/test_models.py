# tests/test_models.py
from datetime import datetime, timezone
import json
from app.models.resort import Resort
from app.models.snow import SnowCondition
from app.models.lift import LiftStatus
from app.models.weather import WeatherForecast
from app.models.webcam import Webcam
from app.models.parking import ParkingLot
from app.models.scraper_health import ScraperHealth


def test_resort_model(db):
    resort = Resort(
        id="vail", name="Vail", pass_type="epic", region="Colorado",
        state="CO", country="US", latitude=39.6061, longitude=-106.3550,
        summit_elevation_ft=11570, vertical_drop_ft=3450,
        website="https://www.vail.com", timezone="America/Denver",
        liftie_id="vail", onthesnow_slug="colorado/vail-ski-resort",
    )
    db.add(resort)
    db.commit()
    result = db.query(Resort).filter_by(id="vail").first()
    assert result.name == "Vail"
    assert result.pass_type == "epic"


def test_snow_condition_model(db):
    resort = Resort(id="vail", name="Vail", pass_type="epic", region="Colorado",
                    state="CO", country="US", latitude=39.6, longitude=-106.3,
                    timezone="America/Denver", liftie_id="vail",
                    onthesnow_slug="colorado/vail-ski-resort")
    db.add(resort)
    db.flush()
    snow = SnowCondition(
        resort_id="vail", base_in=36.0, new_24h_in=6.0, new_48h_in=10.0,
        new_7d_in=18.0, surface="powder", trails_open=150, trails_total=195,
        scraped_at=datetime.now(timezone.utc), is_stale=False,
    )
    db.add(snow)
    db.commit()
    result = db.query(SnowCondition).filter_by(resort_id="vail").first()
    assert result.base_in == 36.0
    assert result.surface == "powder"


def test_lift_status_model(db):
    resort = Resort(id="vail", name="Vail", pass_type="epic", region="Colorado",
                    state="CO", country="US", latitude=39.6, longitude=-106.3,
                    timezone="America/Denver", liftie_id="vail",
                    onthesnow_slug="colorado/vail-ski-resort")
    db.add(resort)
    db.flush()
    lift = LiftStatus(resort_id="vail", lift_name="Eagle Bahn Gondola",
                      status="open", scraped_at=datetime.now(timezone.utc), is_stale=False)
    db.add(lift)
    db.commit()
    result = db.query(LiftStatus).filter_by(resort_id="vail").first()
    assert result.lift_name == "Eagle Bahn Gondola"
    assert result.status == "open"


def test_webcam_model(db):
    resort = Resort(id="vail", name="Vail", pass_type="epic", region="Colorado",
                    state="CO", country="US", latitude=39.6, longitude=-106.3,
                    timezone="America/Denver", liftie_id="vail",
                    onthesnow_slug="colorado/vail-ski-resort")
    db.add(resort)
    db.flush()
    cam = Webcam(resort_id="vail", label="Eagle's Nest", cam_type="hls",
                 url="https://cams.vail.com/eagles-nest.m3u8", is_alive=True)
    db.add(cam)
    db.commit()
    result = db.query(Webcam).filter_by(resort_id="vail").first()
    assert result.cam_type == "hls"
    assert result.is_alive is True
