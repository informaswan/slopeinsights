from app.models.user import User, UserResort


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
