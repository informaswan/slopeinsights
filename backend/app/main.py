from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded
from app.config import settings
from app.limiter import limiter
from app.database import SessionLocal, Base, engine
from app.seed import seed_resorts, seed_webcams, seed_parking_lots
from app.scheduler import create_scheduler
from app.routers import resorts as resorts_router
from app.routers import auth as auth_router
from app.routers import user_resorts as user_resorts_router
from app.routers import feedback as feedback_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_resorts(db)
        seed_webcams(db)
        seed_parking_lots(db)
    finally:
        db.close()
    scheduler = create_scheduler()
    scheduler.start()
    yield
    scheduler.shutdown(wait=False)



app = FastAPI(title="SlopeInsights API", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
# Added before CORS so CORS is the outer layer and 429 responses still carry CORS headers.
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*", "Bypass-Tunnel-Reminder"],
    expose_headers=["*"],
)
app.include_router(resorts_router.router, prefix="/api")
app.include_router(auth_router.router, prefix="/api")
app.include_router(user_resorts_router.router, prefix="/api")
app.include_router(feedback_router.router, prefix="/api")


@app.get("/health")
@limiter.exempt
def health():
    return {"status": "ok"}
