"""Klient API NBP - pobieranie kursow srednich (tabela A)."""

import logging

import httpx
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Currency, MarketRate

logger = logging.getLogger("kantor.nbp")
settings = get_settings()


def fetch_nbp_table(table: str | None = None) -> list[dict]:
    """Pobiera aktualna tabele kursow z NBP. Zwraca liste {code, mid, effectiveDate}."""
    table = table or settings.nbp_table
    url = f"{settings.nbp_base_url}/exchangerates/tables/{table}/?format=json"
    resp = httpx.get(url, timeout=15.0, headers={"Accept": "application/json"})
    resp.raise_for_status()
    data = resp.json()
    if not data:
        return []
    payload = data[0]
    effective_date = payload.get("effectiveDate", "")
    result = []
    for rate in payload.get("rates", []):
        result.append(
            {
                "code": rate["code"],
                "mid": float(rate["mid"]),
                "effectiveDate": effective_date,
            }
        )
    return result


def refresh_rates(db: Session) -> int:
    """Pobiera kursy z NBP i zapisuje je dla walut zdefiniowanych w kantorze.

    Zwraca liczbe zaktualizowanych walut.
    """
    rows = fetch_nbp_table()
    by_code = {r["code"].upper(): r for r in rows}
    currencies = db.query(Currency).all()
    updated = 0
    for currency in currencies:
        market = by_code.get(currency.code.upper())
        if market is None:
            continue
        existing = (
            db.query(MarketRate)
            .filter(
                MarketRate.currency_id == currency.id,
                MarketRate.effective_date == market["effectiveDate"],
            )
            .one_or_none()
        )
        if existing is None:
            db.add(
                MarketRate(
                    currency_id=currency.id,
                    mid=market["mid"],
                    effective_date=market["effectiveDate"],
                    source="NBP",
                )
            )
        else:
            existing.mid = market["mid"]
        updated += 1
    db.commit()
    logger.info("NBP: zaktualizowano kursy dla %d walut", updated)
    return updated


def latest_rate(db: Session, currency_id: int) -> MarketRate | None:
    return (
        db.query(MarketRate)
        .filter(MarketRate.currency_id == currency_id)
        .order_by(MarketRate.effective_date.desc(), MarketRate.id.desc())
        .first()
    )
