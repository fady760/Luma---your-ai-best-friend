"""
Authentication Dependencies

FastAPI dependency that extracts and validates the current user
from the JWT token in the Authorization header.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select
from app.database import get_session
from app.auth.service import decode_access_token
from app.models.db_models import User

# This tells FastAPI where clients should send credentials to get a token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
) -> User:
    """
    FastAPI dependency that returns the authenticated user.
    
    Extracts the JWT from the Authorization header, decodes it,
    and fetches the corresponding user from the database.
    
    Raises HTTPException 401 if the token is invalid or user not found.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    try:
        uid = int(user_id)
    except (ValueError, TypeError):
        raise credentials_exception

    user = session.get(User, uid)
    if user is None:
        raise credentials_exception

    return user
