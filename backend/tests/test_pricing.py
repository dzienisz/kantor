from app import pricing
from app.pricing import Spread


def test_sell_rate_adds_spread():
    assert pricing.sell_rate(4.0, 2.0) == 4.08


def test_buy_rate_subtracts_spread():
    assert pricing.buy_rate(4.0, 2.0) == 3.92


def test_zero_spread_equals_mid():
    assert pricing.sell_rate(4.3210, 0.0) == 4.321
    assert pricing.buy_rate(4.3210, 0.0) == 4.321


def test_select_spread_picks_highest_matching_tier():
    base = Spread(2.0, 2.0)
    tiers = [(1000.0, Spread(1.5, 1.5)), (5000.0, Spread(0.8, 0.8))]
    assert pricing.select_spread(500, base, tiers) is base
    assert pricing.select_spread(2000, base, tiers).buy_spread_pct == 1.5
    assert pricing.select_spread(9000, base, tiers).buy_spread_pct == 0.8


def test_convert_rounds_to_cents():
    assert pricing.convert(100, 4.3215, "buy") == 432.15
