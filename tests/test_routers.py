# tests/test_routers.py
import json
from datetime import datetime, timezone
from app.seed import seed_resorts
from app.models.snow import SnowCondition
from app.models.lift import LiftStatus
from app.models.crowd import CrowdData
from app.models.webcam import Webcam
from app.models.parking import ParkingLot


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
    assert len(data) == 45


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
