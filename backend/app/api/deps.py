from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import InvalidTokenError, decode_access_token
from app.db.database import get_db
from app.db.models import User

_bearer_scheme = HTTPBearer(auto_error=False)

_CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials. Please log in again.",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise _CREDENTIALS_EXCEPTION

    try:
        email = decode_access_token(credentials.credentials)
    except InvalidTokenError as exc:
        raise _CREDENTIALS_EXCEPTION from exc

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise _CREDENTIALS_EXCEPTION
    return user
