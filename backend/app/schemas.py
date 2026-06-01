from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models import ReservationStatus, Role, Segment, TransactionSide


# ---------- Auth ----------
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Role
    username: str


class LoginRequest(BaseModel):
    username: str
    password: str


# ---------- Price tiers ----------
class PriceTierBase(BaseModel):
    segment: Segment = Segment.wholesale
    min_amount: float = 0.0
    buy_spread_pct: float = 1.0
    sell_spread_pct: float = 1.0


class PriceTierCreate(PriceTierBase):
    pass


class PriceTierOut(PriceTierBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ---------- Currencies ----------
class CurrencyBase(BaseModel):
    code: str = Field(min_length=3, max_length=3)
    name: str
    flag: str = ""
    enabled: bool = True
    sort_order: int = 100
    buy_spread_pct: float = 2.0
    sell_spread_pct: float = 2.0


class CurrencyCreate(CurrencyBase):
    pass


class CurrencyUpdate(BaseModel):
    name: str | None = None
    flag: str | None = None
    enabled: bool | None = None
    sort_order: int | None = None
    buy_spread_pct: float | None = None
    sell_spread_pct: float | None = None


class CurrencyOut(CurrencyBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tiers: list[PriceTierOut] = []


# ---------- Public rates ----------
class PublicRate(BaseModel):
    code: str
    name: str
    flag: str
    mid: float
    buy: float           # kurs skupu (klient sprzedaje)
    sell: float          # kurs sprzedazy (klient kupuje)
    buy_spread_pct: float
    sell_spread_pct: float
    effective_date: str


class RatesResponse(BaseModel):
    base_currency: str = "PLN"
    updated_at: datetime | None = None
    rates: list[PublicRate]


# ---------- Calculator ----------
class CalcRequest(BaseModel):
    code: str
    amount: float = Field(gt=0)
    side: TransactionSide


class CalcResponse(BaseModel):
    code: str
    side: TransactionSide
    amount: float
    rate: float
    pln_amount: float
    segment: Segment


# ---------- Reservations ----------
class ReservationCreate(BaseModel):
    code: str = Field(description="Kod waluty, np. EUR")
    side: TransactionSide
    amount: float = Field(gt=0)
    customer_name: str
    customer_phone: str
    customer_email: str = ""
    pickup_location: str = ""
    note: str = ""


class ReservationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    code: str
    currency_code: str
    side: TransactionSide
    amount: float
    rate: float
    pln_amount: float
    customer_name: str
    customer_phone: str
    customer_email: str
    pickup_location: str
    note: str
    status: ReservationStatus
    created_at: datetime
    updated_at: datetime


class ReservationStatusUpdate(BaseModel):
    status: ReservationStatus
