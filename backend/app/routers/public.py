import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Currency, Reservation
from app.schemas import (
    CalcRequest,
    CalcResponse,
    RatesResponse,
    ReservationCreate,
    ReservationOut,
)
from app.services import build_public_rates, quote

router = APIRouter(prefix="/api/public", tags=["public"])


def _get_currency(db: Session, code: str) -> Currency:
    currency = (
        db.query(Currency)
        .filter(Currency.code == code.upper(), Currency.enabled.is_(True))
        .first()
    )
    if currency is None:
        raise HTTPException(status_code=404, detail=f"Waluta {code} niedostepna")
    return currency


@router.get("/rates", response_model=RatesResponse)
def get_rates(db: Session = Depends(get_db)) -> RatesResponse:
    rates, updated_at = build_public_rates(db)
    return RatesResponse(rates=rates, updated_at=updated_at)


@router.post("/calculator", response_model=CalcResponse)
def calculate(payload: CalcRequest, db: Session = Depends(get_db)) -> CalcResponse:
    currency = _get_currency(db, payload.code)
    try:
        rate, pln, segment = quote(db, currency, payload.amount, payload.side)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return CalcResponse(
        code=currency.code,
        side=payload.side,
        amount=payload.amount,
        rate=rate,
        pln_amount=pln,
        segment=segment,
    )


def _generate_code() -> str:
    return "K" + secrets.token_hex(4).upper()


@router.post("/reservations", response_model=ReservationOut, status_code=201)
def create_reservation(
    payload: ReservationCreate, db: Session = Depends(get_db)
) -> ReservationOut:
    currency = _get_currency(db, payload.code)
    try:
        rate, pln, _segment = quote(db, currency, payload.amount, payload.side)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    reservation = Reservation(
        code=_generate_code(),
        currency_code=currency.code,
        side=payload.side,
        amount=payload.amount,
        rate=rate,
        pln_amount=pln,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        customer_email=payload.customer_email,
        pickup_location=payload.pickup_location,
        note=payload.note,
    )
    db.add(reservation)
    db.commit()
    db.refresh(reservation)
    return reservation


@router.get("/reservations/{code}", response_model=ReservationOut)
def get_reservation(code: str, db: Session = Depends(get_db)) -> ReservationOut:
    reservation = db.query(Reservation).filter(Reservation.code == code.upper()).first()
    if reservation is None:
        raise HTTPException(status_code=404, detail="Nie znaleziono rezerwacji")
    return reservation
