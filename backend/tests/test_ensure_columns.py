from sqlalchemy import create_engine, inspect, text

from app.database import ensure_columns


def test_adds_missing_summit_columns_to_an_existing_table():
    engine = create_engine("sqlite://")
    with engine.begin() as conn:
        conn.execute(text("CREATE TABLE weather_forecasts (id INTEGER PRIMARY KEY, high_f FLOAT)"))
    ensure_columns(engine)
    names = {c["name"] for c in inspect(engine).get_columns("weather_forecasts")}
    assert {"summit_high_f", "summit_low_f"} <= names


def test_is_safe_to_run_twice_and_with_no_table():
    engine = create_engine("sqlite://")
    ensure_columns(engine)  # no table yet: nothing to do
    with engine.begin() as conn:
        conn.execute(text("CREATE TABLE weather_forecasts (id INTEGER PRIMARY KEY)"))
    ensure_columns(engine)
    ensure_columns(engine)
