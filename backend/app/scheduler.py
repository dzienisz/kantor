import logging

from apscheduler.schedulers.background import BackgroundScheduler

from app.config import get_settings
from app.database import SessionLocal
from app.nbp import refresh_rates

logger = logging.getLogger("kantor.scheduler")
settings = get_settings()

_scheduler: BackgroundScheduler | None = None


def _job() -> None:
    db = SessionLocal()
    try:
        refresh_rates(db)
    except Exception:  # noqa: BLE001 - logujemy i nie wywracamy schedulera
        logger.exception("Blad odswiezania kursow NBP")
    finally:
        db.close()


def start_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        return
    _scheduler = BackgroundScheduler(daemon=True)
    _scheduler.add_job(
        _job,
        "interval",
        minutes=settings.nbp_refresh_minutes,
        id="nbp_refresh",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info("Scheduler NBP uruchomiony (co %d min)", settings.nbp_refresh_minutes)


def shutdown_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
