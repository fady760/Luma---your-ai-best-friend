"""
Authentication Service

Handles password hashing, JWT token creation, and user verification.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
from passlib.context import CryptContext
from jose import JWTError, jwt
from sqlmodel import Session, select
from app.config import settings
from app.models.db_models import User

# Password hashing context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against a bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Claims to encode in the token (must include 'sub' for user ID).
        expires_delta: Optional custom expiration time.
    
    Returns:
        Encoded JWT string.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decode and validate a JWT access token.
    
    Returns:
        Token claims dict if valid, None if invalid/expired.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


def authenticate_user(session: Session, username: str, password: str) -> Optional[User]:
    """
    Verify a user's credentials.
    
    Returns:
        User object if credentials are valid, None otherwise.
    """
    statement = select(User).where(User.username == username)
    user = session.exec(statement).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user
