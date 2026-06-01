import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.nbp import refresh_rates
from app.routers import admin, auth, public
from app.scheduler import shutdown_scheduler, start_scheduler
from app.seed import seed

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("kantor")
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db)
        if settings.nbp_fetch_on_startup:
            try:
                refresh_rates(db)
            except Exception:  # noqa: BLE001
                logger.warning("Nie udalo sie pobrac kursow NBP przy starcie", exc_info=True)
    finally:
        db.close()
    start_scheduler()
    yield
    shutdown_scheduler()


app = FastAPI(title="KANTOR API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    # Autoryzacja oparta o naglowek Bearer, nie ciasteczka — przy "*" nie wlaczamy credentials
    # (Starlette nie pozwala laczyc wildcard origin z allow_credentials=True).
    allow_credentials=not settings.cors_allow_wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(public.router)
app.include_router(admin.router)


@app.get("/api/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}
