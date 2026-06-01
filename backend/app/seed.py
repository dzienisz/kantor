"""Inicjalne dane: konto administratora oraz domyslne waluty z odchylami."""

import logging

from sqlalchemy.orm import Session

from app.auth import hash_password
from app.config import get_settings
from app.models import Currency, PriceTier, Role, Segment, User

logger = logging.getLogger("kantor.seed")
settings = get_settings()

DEFAULT_CURRENCIES = [
    {"code": "EUR", "name": "Euro", "flag": "EU", "sort_order": 10,
     "buy_spread_pct": 1.5, "sell_spread_pct": 1.5},
    {"code": "USD", "name": "Dolar amerykanski", "flag": "US", "sort_order": 20,
     "buy_spread_pct": 1.8, "sell_spread_pct": 1.8},
    {"code": "GBP", "name": "Funt brytyjski", "flag": "GB", "sort_order": 30,
     "buy_spread_pct": 2.0, "sell_spread_pct": 2.0},
    {"code": "CHF", "name": "Frank szwajcarski", "flag": "CH", "sort_order": 40,
     "buy_spread_pct": 2.2, "sell_spread_pct": 2.2},
    {"code": "CZK", "name": "Korona czeska", "flag": "CZ", "sort_order": 50,
     "buy_spread_pct": 3.0, "sell_spread_pct": 3.0},
    {"code": "NOK", "name": "Korona norweska", "flag": "NO", "sort_order": 60,
     "buy_spread_pct": 3.0, "sell_spread_pct": 3.0},
]


def seed(db: Session) -> None:
    if db.query(User).filter(User.username == settings.admin_username).first() is None:
        db.add(
            User(
                username=settings.admin_username,
                hashed_password=hash_password(settings.admin_password),
                role=Role.admin,
            )
        )
        logger.info("Utworzono konto administratora '%s'", settings.admin_username)

    for item in DEFAULT_CURRENCIES:
        if db.query(Currency).filter(Currency.code == item["code"]).first() is None:
            currency = Currency(**item)
            # Przykladowy wariant hurtowy: ciaśniejszy odchyl od progu 5000 jednostek.
            currency.tiers.append(
                PriceTier(
                    segment=Segment.wholesale,
                    min_amount=5000.0,
                    buy_spread_pct=max(item["buy_spread_pct"] - 0.7, 0.2),
                    sell_spread_pct=max(item["sell_spread_pct"] - 0.7, 0.2),
                )
            )
            db.add(currency)
    db.commit()
