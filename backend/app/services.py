"""Funkcje pomocnicze laczace dane (kursy NBP + cennik) w wyniki dla API."""

from datetime import datetime

from sqlalchemy.orm import Session

from app import pricing
from app.models import Currency, Segment, TransactionSide
from app.nbp import latest_rate
from app.pricing import Spread
from app.schemas import PublicRate


def build_public_rates(db: Session) -> tuple[list[PublicRate], datetime | None]:
    currencies = (
        db.query(Currency)
        .filter(Currency.enabled.is_(True))
        .order_by(Currency.sort_order, Currency.code)
        .all()
    )
    rates: list[PublicRate] = []
    last_fetch: datetime | None = None
    for currency in currencies:
        market = latest_rate(db, currency.id)
        if market is None:
            continue
        if last_fetch is None or (market.fetched_at and market.fetched_at > last_fetch):
            last_fetch = market.fetched_at
        rates.append(
            PublicRate(
                code=currency.code,
                name=currency.name,
                flag=currency.flag,
                mid=round(market.mid, 4),
                buy=pricing.buy_rate(market.mid, currency.buy_spread_pct),
                sell=pricing.sell_rate(market.mid, currency.sell_spread_pct),
                buy_spread_pct=currency.buy_spread_pct,
                sell_spread_pct=currency.sell_spread_pct,
                effective_date=market.effective_date,
            )
        )
    return rates, last_fetch


def _spread_for(currency: Currency, amount: float) -> tuple[Spread, Segment]:
    base = Spread(currency.buy_spread_pct, currency.sell_spread_pct)
    tiers = [
        (t.min_amount, Spread(t.buy_spread_pct, t.sell_spread_pct))
        for t in currency.tiers
        if t.segment == Segment.wholesale
    ]
    chosen = pricing.select_spread(amount, base, tiers)
    segment = Segment.wholesale if chosen is not base else Segment.retail
    return chosen, segment


def quote(
    db: Session, currency: Currency, amount: float, side: TransactionSide
) -> tuple[float, float, Segment]:
    """Zwraca (kurs, kwota_pln, segment) dla zadanej transakcji."""
    market = latest_rate(db, currency.id)
    if market is None:
        raise ValueError("Brak kursu rynkowego dla waluty")
    spread, segment = _spread_for(currency, amount)
    if side == TransactionSide.buy:
        rate = pricing.sell_rate(market.mid, spread.sell_spread_pct)
    else:
        rate = pricing.buy_rate(market.mid, spread.buy_spread_pct)
    pln = pricing.convert(amount, rate, side.value)
    return rate, pln, segment
