import pytest
from unittest.mock import patch, MagicMock
from app.models.user import User, UserResort
from app.auth import create_jwt, decode_jwt, get_current_user
from fastapi import HTTPException


def test_user_table_exists(db):
    from sqlalchemy import inspect
    inspector = inspect(db.bind)
    tables = inspector.get_table_names()
    assert "users" in tables
    assert "user_resorts" in tables


def test_create_user(db):
    import uuid
    user = User(
        id=str(uuid.uuid4()),
        name="Test User",
        email="test@example.com",
        provider="google",
        provider_id="google-123",
    )
    db.add(user)
    db.commit()
    fetched = db.query(User).filter_by(email="test@example.com").first()
    assert fetched is not None
    assert fetched.name == "Test User"
    assert fetched.provider == "google"


def test_create_and_decode_jwt():
    token = create_jwt(user_id="user-abc", email="a@b.com")
    payload = decode_jwt(token)
    assert payload["sub"] == "user-abc"
    assert payload["email"] == "a@b.com"


def test_decode_jwt_invalid_token():
    with pytest.raises(HTTPException) as exc_info:
        decode_jwt("not.a.valid.token")
    assert exc_info.value.status_code == 401


def test_get_current_user_returns_user(db):
    import uuid
    uid = str(uuid.uuid4())
    user = User(id=uid, name="JWT User", email="jwt@test.com",
                provider="google", provider_id="gid-jwt")
    db.add(user)
    db.commit()
    token = create_jwt(user_id=uid, email="jwt@test.com")
    result = get_current_user(authorization=f"Bearer {token}", db=db)
    assert result.id == uid


def test_google_auth_creates_user(client):
    mock_id_info = {
        "sub": "google-new-user-123",
        "email": "new@google.com",
        "name": "New Google User",
        "picture": "https://example.com/pic.jpg",
    }
    with patch("app.routers.auth.id_token.verify_oauth2_token", return_value=mock_id_info):
        resp = client.post("/api/auth/google", json={"id_token": "fake-google-token"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["user"]["email"] == "new@google.com"
    assert data["user"]["name"] == "New Google User"
    assert "token" in data


def test_google_auth_returns_existing_user(client, db):
    import uuid
    uid = str(uuid.uuid4())
    db.add(User(id=uid, name="Existing", email="existing@google.com",
                provider="google", provider_id="google-existing-456"))
    db.commit()
    mock_id_info = {
        "sub": "google-existing-456",
        "email": "existing@google.com",
        "name": "Existing",
        "picture": None,
    }
    with patch("app.routers.auth.id_token.verify_oauth2_token", return_value=mock_id_info):
        resp = client.post("/api/auth/google", json={"id_token": "fake-token"})
    assert resp.status_code == 200
    assert resp.json()["user"]["id"] == uid


def test_auth_me_returns_current_user(client, db):
    import uuid
    uid = str(uuid.uuid4())
    db.add(User(id=uid, name="Me User", email="me@test.com",
                provider="google", provider_id="gid-me"))
    db.commit()
    token = create_jwt(user_id=uid, email="me@test.com")
    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "me@test.com"


def test_auth_me_rejects_no_token(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401
