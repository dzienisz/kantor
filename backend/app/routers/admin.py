from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import require_admin
from app.database import get_db
from app.models import Currency, PriceTier, Reservation, User
from app.nbp import refresh_rates
from app.schemas import (
    CurrencyCreate,
    CurrencyOut,
    CurrencyUpdate,
    PriceTierCreate,
    PriceTierOut,
    ReservationOut,
    ReservationStatusUpdate,
)

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)])


# ---------- Kursy NBP ----------
@router.post("/rates/refresh")
def trigger_refresh(db: Session = Depends(get_db)) -> dict:
    count = refresh_rates(db)
    return {"updated": count}


# ---------- Waluty ----------
@router.get("/currencies", response_model=list[CurrencyOut])
def list_currencies(db: Session = Depends(get_db)) -> list[Currency]:
    return db.query(Currency).order_by(Currency.sort_order, Currency.code).all()


@router.post("/currencies", response_model=CurrencyOut, status_code=201)
def create_currency(payload: CurrencyCreate, db: Session = Depends(get_db)) -> Currency:
    code = payload.code.upper()
    if db.query(Currency).filter(Currency.code == code).first():
        raise HTTPException(status_code=409, detail=f"Waluta {code} juz istnieje")
    currency = Currency(**{**payload.model_dump(), "code": code})
    db.add(currency)
    db.commit()
    db.refresh(currency)
    return currency


@router.put("/currencies/{currency_id}", response_model=CurrencyOut)
def update_currency(
    currency_id: int, payload: CurrencyUpdate, db: Session = Depends(get_db)
) -> Currency:
    currency = db.get(Currency, currency_id)
    if currency is None:
        raise HTTPException(status_code=404, detail="Nie znaleziono waluty")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(currency, field, value)
    db.commit()
    db.refresh(currency)
    return currency


@router.delete("/currencies/{currency_id}", status_code=204)
def delete_currency(currency_id: int, db: Session = Depends(get_db)) -> None:
    currency = db.get(Currency, currency_id)
    if currency is None:
        raise HTTPException(status_code=404, detail="Nie znaleziono waluty")
    db.delete(currency)
    db.commit()


# ---------- Warianty cennika ----------
@router.post("/currencies/{currency_id}/tiers", response_model=PriceTierOut, status_code=201)
def add_tier(
    currency_id: int, payload: PriceTierCreate, db: Session = Depends(get_db)
) -> PriceTier:
    currency = db.get(Currency, currency_id)
    if currency is None:
        raise HTTPException(status_code=404, detail="Nie znaleziono waluty")
    tier = PriceTier(currency_id=currency_id, **payload.model_dump())
    db.add(tier)
    db.commit()
    db.refresh(tier)
    return tier


@router.delete("/tiers/{tier_id}", status_code=204)
def delete_tier(tier_id: int, db: Session = Depends(get_db)) -> None:
    tier = db.get(PriceTier, tier_id)
    if tier is None:
        raise HTTPException(status_code=404, detail="Nie znaleziono wariantu")
    db.delete(tier)
    db.commit()


# ---------- Rezerwacje ----------
@router.get("/reservations", response_model=list[ReservationOut])
def list_reservations(db: Session = Depends(get_db)) -> list[Reservation]:
    return db.query(Reservation).order_by(Reservation.created_at.desc()).all()


@router.patch("/reservations/{reservation_id}", response_model=ReservationOut)
def update_reservation_status(
    reservation_id: int, payload: ReservationStatusUpdate, db: Session = Depends(get_db)
) -> Reservation:
    reservation = db.get(Reservation, reservation_id)
    if reservation is None:
        raise HTTPException(status_code=404, detail="Nie znaleziono rezerwacji")
    reservation.status = payload.status
    db.commit()
    db.refresh(reservation)
    return reservation


# ---------- Profil ----------
@router.get("/whoami", response_model=dict)
def whoami(user: User = Depends(require_admin)) -> dict:
    return {"username": user.username, "role": user.role.value}
