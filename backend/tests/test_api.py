def _login(client) -> str:
    resp = client.post(
        "/api/auth/login",
        data={"username": "admin", "password": "admin123"},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}


def test_public_rates_have_buy_sell(client):
    data = client.get("/api/public/rates").json()
    assert data["base_currency"] == "PLN"
    assert len(data["rates"]) > 0
    eur = next(r for r in data["rates"] if r["code"] == "EUR")
    # mid=4.0, spread 1.5% -> sell=4.06, buy=3.94
    assert eur["sell"] > eur["mid"] > eur["buy"]
    assert eur["sell"] == 4.06
    assert eur["buy"] == 3.94


def test_calculator_buy_uses_sell_rate(client):
    resp = client.post(
        "/api/public/calculator",
        json={"code": "EUR", "amount": 100, "side": "buy"},
    )
    body = resp.json()
    assert body["rate"] == 4.06
    assert body["pln_amount"] == 406.0
    assert body["segment"] == "retail"


def test_calculator_wholesale_tier(client):
    # prog hurtowy EUR = 5000 -> ciaśniejszy odchyl
    resp = client.post(
        "/api/public/calculator",
        json={"code": "EUR", "amount": 6000, "side": "buy"},
    )
    body = resp.json()
    assert body["segment"] == "wholesale"


def test_reservation_lifecycle(client):
    create = client.post(
        "/api/public/reservations",
        json={
            "code": "USD",
            "side": "buy",
            "amount": 200,
            "customer_name": "Jan Kowalski",
            "customer_phone": "600100200",
            "pickup_location": "Oddzial Centrum",
        },
    )
    assert create.status_code == 201, create.text
    res = create.json()
    assert res["status"] == "pending"
    code = res["code"]

    lookup = client.get(f"/api/public/reservations/{code}")
    assert lookup.status_code == 200
    assert lookup.json()["customer_name"] == "Jan Kowalski"

    token = _login(client)
    headers = {"Authorization": f"Bearer {token}"}
    patch = client.patch(
        f"/api/admin/reservations/{res['id']}",
        json={"status": "ready"},
        headers=headers,
    )
    assert patch.status_code == 200
    assert patch.json()["status"] == "ready"


def test_admin_requires_auth(client):
    assert client.get("/api/admin/currencies").status_code == 401


def test_admin_currency_crud(client):
    token = _login(client)
    headers = {"Authorization": f"Bearer {token}"}
    create = client.post(
        "/api/admin/currencies",
        json={"code": "SEK", "name": "Korona szwedzka", "buy_spread_pct": 3, "sell_spread_pct": 3},
        headers=headers,
    )
    assert create.status_code == 201, create.text
    cid = create.json()["id"]
    upd = client.put(
        f"/api/admin/currencies/{cid}",
        json={"sell_spread_pct": 2.5},
        headers=headers,
    )
    assert upd.json()["sell_spread_pct"] == 2.5
