import logging
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import Settings, get_settings

logger = logging.getLogger(__name__)


def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(subject: str, settings: Settings | None = None) -> str:
    settings = settings or get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


class InvalidTokenError(Exception):
    """Raised when a bearer token is missing, expired, or otherwise fails to decode."""


def decode_access_token(token: str, settings: Settings | None = None) -> str:
    """Returns the token's subject (the user's email) or raises InvalidTokenError."""
    settings = settings or get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError as exc:
        raise InvalidTokenError(str(exc)) from exc

    subject = payload.get("sub")
    if not subject:
        raise InvalidTokenError("Token payload is missing a subject")
    return subject
