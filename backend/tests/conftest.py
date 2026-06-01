import os
import tempfile

import pytest

os.environ.setdefault("NBP_FETCH_ON_STARTUP", "false")

_tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp.name}"


@pytest.fixture(scope="session")
def client():
    from fastapi.testclient import TestClient

    from app.database import Base, SessionLocal, engine
    from app.main import app
    from app.models import Currency, MarketRate
    from app.seed import seed

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db)
        # Wstrzykujemy sztuczne kursy rynkowe (bez wywolan do NBP w testach).
        for cur in db.query(Currency).all():
            db.add(
                MarketRate(
                    currency_id=cur.id,
                    mid=4.0,
                    effective_date="2026-01-02",
                    source="TEST",
                )
            )
        db.commit()
    finally:
        db.close()

    # Wylaczamy lifespan (scheduler/NBP) - uzywamy goleego ASGI.
    with TestClient(app) as test_client:
        yield test_client
