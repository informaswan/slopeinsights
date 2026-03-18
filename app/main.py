from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.database import SessionLocal, Base, engine
from app.seed import seed_resorts
from app.scheduler import create_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_resorts(db)
    finally:
        db.close()
    scheduler = create_scheduler()
    scheduler.start()
    yield
    scheduler.shutdown(wait=False)


app = FastAPI(title="PowderPass API", lifespan=lifespan)


@app.get("/health")
def health():
    return {"status": "ok"}
