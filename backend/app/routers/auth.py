from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.auth import authenticate_user, create_access_token, get_current_user
from app.database import get_db
from app.models import User
from app.schemas import Token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)) -> Token:
    user = authenticate_user(db, form.username, form.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidlowy login lub haslo",
        )
    token = create_access_token(user.username, user.role)
    return Token(access_token=token, role=user.role, username=user.username)


@router.get("/me", response_model=dict)
def me(user: User = Depends(get_current_user)) -> dict:
    return {"username": user.username, "role": user.role.value}
