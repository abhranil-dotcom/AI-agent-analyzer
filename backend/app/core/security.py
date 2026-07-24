import hashlib
import logging
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import Settings, get_settings

logger = logging.getLogger(__name__)


def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def generate_reset_token() -> str:
    """Returns a high-entropy URL-safe token. The raw value is emailed and never stored."""
    return secrets.token_urlsafe(32)


def hash_reset_token(raw_token: str) -> str:
    """SHA-256 (not bcrypt) is fine here: the input is already a random 256-bit token, not a
    user-chosen password, so there's no offline dictionary-attack risk to slow down against."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


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
