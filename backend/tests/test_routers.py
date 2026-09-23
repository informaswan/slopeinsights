# tests/test_routers.py
import json
import pytest
from datetime import datetime, timezone
from app.seed import seed_resorts
from app.models.snow import SnowCondition
from app.models.lift import LiftStatus
from app.models.webcam import Webcam
from app.models.parking import ParkingLot
from app.models.weather import WeatherForecast


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_get_resorts_returns_list(client, db):
    seed_resorts(db)
    response = client.get("/api/resorts", headers={"X-API-Key": "dev-key"})
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 50


def test_get_resorts_sets_cache_control(client, db):
    seed_resorts(db)
    response = client.get("/api/resorts", headers={"X-API-Key": "dev-key"})
    assert response.headers["cache-control"] == "public, max-age=60"


def test_get_resort_detail_sets_cache_control(client, db):
    seed_resorts(db)
    response = client.get("/api/resorts/vail", headers={"X-API-Key": "dev-key"})
    assert response.headers["cache-control"] == "public, max-age=60"


def test_get_resort_detail_is_served_from_cache_within_its_ttl(client, db):
    seed_resorts(db)
    db.add(SnowCondition(resort_id="vail", base_in=10.0, scraped_at=datetime.now(timezone.utc), is_stale=False))
    db.commit()
    first = client.get("/api/resorts/vail", headers={"X-API-Key": "dev-key"}).json()
    assert first["snow"]["base_in"] == 10.0

    # Mutate the underlying row directly; a cache hit means the next request
    # still serves the old value instead of recomputing from the DB.
    db.query(SnowCondition).filter_by(resort_id="vail").update({"base_in": 99.0})
    db.commit()
    second = client.get("/api/resorts/vail", headers={"X-API-Key": "dev-key"}).json()
    assert second["snow"]["base_in"] == 10.0


def test_get_resorts_requires_api_key(client, monkeypatch):
    from app.config import settings
    monkeypatch.setattr(settings, "environment", "production")
    response = client.get("/api/resorts")
    assert response.status_code == 401


def test_get_resorts_includes_snow(client, db):
    seed_resorts(db)
    db.add(SnowCondition(
        resort_id="vail", base_in=36.0, new_24h_in=6.0, new_48h_in=10.0,
        new_7d_in=18.0, surface="powder", trails_open=150, trails_total=195,
        scraped_at=datetime.now(timezone.utc), is_stale=False,
    ))
    db.commit()
    response = client.get("/api/resorts", headers={"X-API-Key": "dev-key"})
    resorts = {r["id"]: r for r in response.json()}
    assert resorts["vail"]["snow"]["base_in"] == 36.0


def test_get_resort_detail(client, db):
    seed_resorts(db)
    db.add(SnowCondition(
        resort_id="vail", base_in=36.0, new_24h_in=6.0, new_48h_in=10.0,
        new_7d_in=18.0, surface="powder", trails_open=150, trails_total=195,
        scraped_at=datetime.now(timezone.utc), is_stale=False,
    ))
    db.add(Webcam(resort_id="vail", label="Summit", cam_type="hls",
                  url="https://cams.vail.com/summit.m3u8", is_alive=True))
    db.commit()
    response = client.get("/api/resorts/vail", headers={"X-API-Key": "dev-key"})
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "vail"
    assert data["snow"]["base_in"] == 36.0
    assert len(data["webcams"]) == 1
    assert data["latitude"] == pytest.approx(39.6061)
    assert data["longitude"] == pytest.approx(-106.3550)


def test_get_resort_detail_not_found(client, db):
    seed_resorts(db)
    response = client.get("/api/resorts/nonexistent", headers={"X-API-Key": "dev-key"})
    assert response.status_code == 404


def test_get_resort_lifts(client, db):
    seed_resorts(db)
    now = datetime.now(timezone.utc)
    db.add(LiftStatus(resort_id="vail", lift_name="Eagle Bahn Gondola",
                      status="open", scraped_at=now, is_stale=False))
    db.add(LiftStatus(resort_id="vail", lift_name="Highline",
                      status="closed", scraped_at=now, is_stale=False))
    db.commit()
    response = client.get("/api/resorts/vail/lifts", headers={"X-API-Key": "dev-key"})
    assert response.status_code == 200
    data = response.json()
    assert data["open"] == 1
    assert data["total"] == 2
    names = [i["name"] for i in data["items"]]
    assert "Eagle Bahn Gondola" in names


def test_get_resort_webcams(client, db):
    seed_resorts(db)
    db.add(Webcam(resort_id="vail", label="Summit", cam_type="hls",
                  url="https://cams.vail.com/summit.m3u8", is_alive=True))
    db.commit()
    response = client.get("/api/resorts/vail/webcams", headers={"X-API-Key": "dev-key"})
    assert response.status_code == 200
    data = response.json()
    assert data["resort_id"] == "vail"
    assert len(data["items"]) == 1
    assert data["items"][0]["cam_type"] == "hls"


def test_get_resort_webcams_excludes_traffic_cams(client, db):
    seed_resorts(db)
    db.add(Webcam(resort_id="vail", label="Summit", cam_type="hls",
                  url="https://cams.vail.com/summit.m3u8", is_alive=True, category="mountain"))
    db.add(Webcam(resort_id="vail", label="I-70 East", cam_type="jpeg",
                  url="https://images.drivebc.ca/x.jpg", is_alive=True, category="traffic"))
    db.commit()
    response = client.get("/api/resorts/vail/webcams", headers={"X-API-Key": "dev-key"})
    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["label"] == "Summit"


def test_resort_detail_includes_live_traffic_cams_separately_from_webcams(client, db):
    seed_resorts(db)
    db.add(Webcam(resort_id="vail", label="Summit", cam_type="hls",
                  url="https://cams.vail.com/summit.m3u8", is_alive=True, category="mountain"))
    db.add(Webcam(resort_id="vail", label="I-70 East", cam_type="jpeg",
                  url="https://images.drivebc.ca/x.jpg", is_alive=True, category="traffic"))
    db.commit()
    data = client.get("/api/resorts/vail", headers={"X-API-Key": "dev-key"}).json()
    assert [w["label"] for w in data["webcams"]] == ["Summit"]
    assert [w["label"] for w in data["live_traffic_cams"]] == ["I-70 East"]


def test_get_resort_parking(client, db):
    seed_resorts(db)
    now = datetime.now(timezone.utc)
    db.add(ParkingLot(resort_id="vail", lot_name="Structure 1", is_live=True,
                      status="open", capacity_pct=45, scraped_at=now, is_stale=False))
    db.add(ParkingLot(resort_id="vail", lot_name="Lot A", is_live=False,
                      distance_ft=500, cost="Free",
                      directions_url="https://maps.google.com/?q=vail"))
    db.commit()
    response = client.get("/api/resorts/vail/parking", headers={"X-API-Key": "dev-key"})
    assert response.status_code == 200
    data = response.json()
    assert data["has_live_data"] is True
    assert len(data["live_lots"]) == 1
    assert len(data["static_lots"]) == 1


def test_get_best_resorts(client, db):
    seed_resorts(db)
    now = datetime.now(timezone.utc)
    db.add(SnowCondition(resort_id="vail", base_in=50.0, new_24h_in=12.0,
                         new_48h_in=18.0, new_7d_in=30.0, trails_open=150,
                         trails_total=195, scraped_at=now, is_stale=False))
    db.commit()
    response = client.get("/api/resorts/best", headers={"X-API-Key": "dev-key"})
    assert response.status_code == 200
    data = response.json()
    assert "resorts" in data
    assert len(data["resorts"]) <= 5


def _add_period(db, date, high=None, low=None, precip=None, snow=False, wind=None, snow_amount=None):
    db.add(WeatherForecast(
        resort_id="vail", forecast_date=date, high_f=high, low_f=low, precip_pct=precip,
        snow_in_forecast=snow, snow_amount_in=snow_amount, wind_mph=wind,
        scraped_at=datetime.now(timezone.utc), is_stale=False,
    ))


def test_resort_detail_merges_day_and_night_periods_into_one_entry_per_date(client, db):
    seed_resorts(db)
    # NOAA returns separate day and night periods; the API must serve one entry per date.
    _add_period(db, "2026-09-21", high=51, precip=0, wind=0)
    _add_period(db, "2026-09-21", low=36, precip=1, wind=5)
    _add_period(db, "2026-09-22", high=53, precip=42, wind=5)
    _add_period(db, "2026-09-22", low=41, precip=39, wind=0)
    db.commit()
    forecast = client.get("/api/resorts/vail", headers={"X-API-Key": "dev-key"}).json()["weather"]["forecast"]
    assert [f["date"] for f in forecast] == ["2026-09-21", "2026-09-22"]
    assert (forecast[0]["high_f"], forecast[0]["low_f"]) == (51, 36)
    assert (forecast[1]["high_f"], forecast[1]["low_f"]) == (53, 41)


def test_resort_detail_forecast_uses_worst_precip_and_wind_and_any_snow_of_the_day(client, db):
    seed_resorts(db)
    _add_period(db, "2026-09-21", high=30, precip=10, snow=False, wind=8)
    _add_period(db, "2026-09-21", low=20, precip=70, snow=True, wind=15)
    db.commit()
    day = client.get("/api/resorts/vail", headers={"X-API-Key": "dev-key"}).json()["weather"]["forecast"][0]
    assert day["precip_pct"] == 70
    assert day["wind_mph"] == 15
    assert day["snow_in_forecast"] is True


def test_resort_detail_forecast_keeps_a_night_only_first_day(client, db):
    seed_resorts(db)
    # Fetched in the evening: today only has a night period.
    _add_period(db, "2026-09-21", low=36, precip=1, wind=5)
    _add_period(db, "2026-09-22", high=53, precip=42, wind=5)
    _add_period(db, "2026-09-22", low=41, precip=39, wind=0)
    db.commit()
    forecast = client.get("/api/resorts/vail", headers={"X-API-Key": "dev-key"}).json()["weather"]["forecast"]
    assert len(forecast) == 2
    assert (forecast[0]["high_f"], forecast[0]["low_f"]) == (None, 36)


def test_resort_detail_forecast_includes_snow_amount_in(client, db):
    seed_resorts(db)
    # The scraper stores the same daily total on both the day and night period; the API
    # should serve it once, not double it.
    _add_period(db, "2026-09-21", high=30, snow_amount=3.5)
    _add_period(db, "2026-09-21", low=20, snow_amount=3.5)
    _add_period(db, "2026-09-22", high=32)  # no snow expected: stays null
    db.commit()
    forecast = client.get("/api/resorts/vail", headers={"X-API-Key": "dev-key"}).json()["weather"]["forecast"]
    assert forecast[0]["snow_amount_in"] == 3.5
    assert forecast[1]["snow_amount_in"] is None


def test_resort_detail_includes_the_nws_snow_forecast_separately_from_reported_snow(client, db):
    from app.models.snow_forecast import SnowForecast
    seed_resorts(db)
    now = datetime.now(timezone.utc)
    db.add(SnowCondition(resort_id="vail", base_in=30.0, new_24h_in=1.0, scraped_at=now, is_stale=False))
    db.add(SnowForecast(resort_id="vail", next_24h_in=4.0, next_48h_in=7.5, next_72h_in=9.0, scraped_at=now, is_stale=False))
    db.commit()
    data = client.get("/api/resorts/vail", headers={"X-API-Key": "dev-key"}).json()
    assert data["snow"]["new_24h_in"] == 1.0
    assert data["snow_forecast"]["next_24h_in"] == 4.0
    assert data["snow_forecast"]["next_72h_in"] == 9.0
    assert data["snow_forecast"]["is_stale"] is False


def test_resort_detail_snow_forecast_is_null_when_there_is_none(client, db):
    seed_resorts(db)
    assert client.get("/api/resorts/vail", headers={"X-API-Key": "dev-key"}).json()["snow_forecast"] is None
