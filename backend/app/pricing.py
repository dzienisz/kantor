"""Logika wyliczania kursow kantorowych jako % odchyl od kursu rynkowego (NBP).

Konwencja (z perspektywy KLIENTA):
- kurs SPRZEDAZY (klient kupuje walute, kantor sprzedaje) = mid * (1 + sell_spread%)
- kurs SKUPU (klient sprzedaje walute, kantor skupuje)     = mid * (1 - buy_spread%)
"""

from dataclasses import dataclass

ROUND_DIGITS = 4


@dataclass(frozen=True)
class Spread:
    buy_spread_pct: float
    sell_spread_pct: float


def sell_rate(mid: float, sell_spread_pct: float) -> float:
    """Kurs po ktorym kantor SPRZEDAJE walute klientowi."""
    return round(mid * (1 + sell_spread_pct / 100.0), ROUND_DIGITS)


def buy_rate(mid: float, buy_spread_pct: float) -> float:
    """Kurs po ktorym kantor SKUPUJE walute od klienta."""
    return round(mid * (1 - buy_spread_pct / 100.0), ROUND_DIGITS)


def select_spread(
    amount: float,
    base: Spread,
    tiers: list[tuple[float, Spread]],
) -> Spread:
    """Wybiera odchyl wg progu ilosciowego (wariantowanie cennika).

    `tiers` to lista (min_amount, Spread). Wybierany jest najwyzszy prog,
    ktory nie przekracza `amount`. Gdy zaden prog nie pasuje, zwracany jest `base`.
    """
    chosen = base
    best_threshold = -1.0
    for min_amount, spread in tiers:
        if amount >= min_amount and min_amount > best_threshold:
            best_threshold = min_amount
            chosen = spread
    return chosen


def convert(amount: float, rate: float, side: str) -> float:
    """Przelicza kwote transakcji.

    side == "buy"  -> klient kupuje `amount` waluty, placi PLN = amount * rate
    side == "sell" -> klient sprzedaje `amount` waluty, otrzymuje PLN = amount * rate
    W obu przypadkach PLN = amount * rate (rate dobierany wczesniej wg strony).
    """
    return round(amount * rate, 2)
