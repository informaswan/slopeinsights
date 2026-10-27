# app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Columns added to tables that may already exist. create_all() only builds missing tables, and
# the deploy script doesn't run Alembic, so these are added here at startup if absent.
_ADDED_COLUMNS = [
    ("weather_forecasts", "summit_high_f", "FLOAT"),
    ("weather_forecasts", "summit_low_f", "FLOAT"),
]


def ensure_columns(bind) -> None:
    from sqlalchemy import inspect, text
    inspector = inspect(bind)
    with bind.begin() as conn:
        for table, column, sql_type in _ADDED_COLUMNS:
            if not inspector.has_table(table):
                continue
            if column not in {c["name"] for c in inspector.get_columns(table)}:
                conn.execute(text(f'ALTER TABLE {table} ADD COLUMN {column} {sql_type}'))
