import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Role(str, enum.Enum):
    admin = "admin"
    cashier = "cashier"


class Segment(str, enum.Enum):
    """Wariant cennika: detaliczny lub hurtowy."""

    retail = "retail"
    wholesale = "wholesale"


class ReservationStatus(str, enum.Enum):
    pending = "pending"        # zlozona, oczekuje na potwierdzenie
    confirmed = "confirmed"    # potwierdzona przez kantor
    ready = "ready"            # gotowa do odbioru
    completed = "completed"    # odebrana / zrealizowana
    cancelled = "cancelled"    # anulowana


class TransactionSide(str, enum.Enum):
    """Strona transakcji z perspektywy KLIENTA."""

    buy = "buy"    # klient kupuje walute (kantor sprzedaje) -> kurs sprzedazy
    sell = "sell"  # klient sprzedaje walute (kantor skupuje) -> kurs skupu


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(Enum(Role), default=Role.cashier)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class Currency(Base):
    """Waluta obsugiwana przez kantor wraz z domyslnymi odchylami od rynku."""

    __tablename__ = "currencies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(3), unique=True, index=True)  # np. EUR
    name: Mapped[str] = mapped_column(String(64))
    flag: Mapped[str] = mapped_column(String(8), default="")  # emoji flagi (opcjonalnie)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=100)

    # Domyslne odchyly detaliczne (procent od kursu rynkowego NBP).
    buy_spread_pct: Mapped[float] = mapped_column(Float, default=2.0)
    sell_spread_pct: Mapped[float] = mapped_column(Float, default=2.0)

    tiers: Mapped[list["PriceTier"]] = relationship(
        back_populates="currency", cascade="all, delete-orphan"
    )
    rates: Mapped[list["MarketRate"]] = relationship(
        back_populates="currency", cascade="all, delete-orphan"
    )


class PriceTier(Base):
    """Wariant cennika (prog ilosciowy) z wlasnymi odchylami od rynku.

    Pozwala definiowac np. ceny hurtowe od okreslonej kwoty.
    """

    __tablename__ = "price_tiers"
    __table_args__ = (UniqueConstraint("currency_id", "segment", "min_amount"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    currency_id: Mapped[int] = mapped_column(ForeignKey("currencies.id"))
    segment: Mapped[Segment] = mapped_column(Enum(Segment), default=Segment.wholesale)
    min_amount: Mapped[float] = mapped_column(Float, default=0.0)  # prog kwoty w walucie
    buy_spread_pct: Mapped[float] = mapped_column(Float, default=1.0)
    sell_spread_pct: Mapped[float] = mapped_column(Float, default=1.0)

    currency: Mapped[Currency] = relationship(back_populates="tiers")


class MarketRate(Base):
    """Kurs rynkowy (sredni NBP) pobrany z API NBP."""

    __tablename__ = "market_rates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    currency_id: Mapped[int] = mapped_column(ForeignKey("currencies.id"), index=True)
    mid: Mapped[float] = mapped_column(Float)            # kurs sredni w PLN
    effective_date: Mapped[str] = mapped_column(String(10))  # data publikacji NBP (YYYY-MM-DD)
    source: Mapped[str] = mapped_column(String(32), default="NBP")
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    currency: Mapped[Currency] = relationship(back_populates="rates")


class Reservation(Base):
    """Rezerwacja waluty z odbiorem osobistym."""

    __tablename__ = "reservations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(12), unique=True, index=True)
    currency_code: Mapped[str] = mapped_column(String(3))
    side: Mapped[TransactionSide] = mapped_column(Enum(TransactionSide))
    amount: Mapped[float] = mapped_column(Float)        # ilosc waluty obcej
    rate: Mapped[float] = mapped_column(Float)          # kurs zarezerwowany
    pln_amount: Mapped[float] = mapped_column(Float)    # kwota w PLN
    customer_name: Mapped[str] = mapped_column(String(128))
    customer_phone: Mapped[str] = mapped_column(String(32))
    customer_email: Mapped[str] = mapped_column(String(128), default="")
    pickup_location: Mapped[str] = mapped_column(String(128), default="")
    note: Mapped[str] = mapped_column(String(255), default="")
    status: Mapped[ReservationStatus] = mapped_column(
        Enum(ReservationStatus), default=ReservationStatus.pending
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now
    )
