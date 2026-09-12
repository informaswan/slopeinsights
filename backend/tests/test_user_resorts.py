import uuid
from app.models.user import User, UserResort
from app.models.resort import Resort
from app.auth import create_jwt


def _make_user(db, email="test@test.com"):
    uid = str(uuid.uuid4())
    user = User(id=uid, name="Test", email=email, provider="google", provider_id=f"gid-{uid}")
    db.add(user)
    db.commit()
    return user


def _make_resort(db, resort_id="vail", name="Vail", pass_type="epic"):
    resort = Resort(
        id=resort_id, name=name, pass_type=pass_type,
        region="Colorado", state="CO", country="US",
        latitude=39.6, longitude=-106.4,
        summit_elevation_ft=11570, vertical_drop_ft=3450,
        timezone="America/Denver", liftie_id="vail",
        onthesnow_slug="vail",
    )
    db.add(resort)
    db.commit()
    return resort


def test_get_user_resorts_empty(client, db):
    user = _make_user(db)
    token = create_jwt(user_id=user.id, email=user.email)
    resp = client.get("/api/users/me/resorts", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json() == {"resort_ids": []}


def test_put_user_resorts(client, db):
    user = _make_user(db)
    _make_resort(db, "vail", "Vail")
    _make_resort(db, "breck", "Breckenridge")
    token = create_jwt(user_id=user.id, email=user.email)
    resp = client.put(
        "/api/users/me/resorts",
        headers={"Authorization": f"Bearer {token}"},
        json={"resort_ids": ["vail", "breck"]},
    )
    assert resp.status_code == 200
    assert set(resp.json()["resort_ids"]) == {"vail", "breck"}


def test_put_user_resorts_replaces(client, db):
    user = _make_user(db)
    _make_resort(db, "vail", "Vail")
    _make_resort(db, "breck", "Breckenridge")
    token = create_jwt(user_id=user.id, email=user.email)
    client.put("/api/users/me/resorts", headers={"Authorization": f"Bearer {token}"},
               json={"resort_ids": ["vail", "breck"]})
    resp = client.put("/api/users/me/resorts", headers={"Authorization": f"Bearer {token}"},
                      json={"resort_ids": ["breck"]})
    assert resp.json()["resort_ids"] == ["breck"]


def test_put_user_resorts_rejects_unauthenticated(client):
    resp = client.put("/api/users/me/resorts", json={"resort_ids": ["vail"]})
    assert resp.status_code == 401
