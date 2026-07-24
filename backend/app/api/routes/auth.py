import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    generate_reset_token,
    hash_password,
    hash_reset_token,
    verify_password,
)
from app.db.database import get_db
from app.db.models import User
from app.models.schemas import (
    ForgotPasswordRequest,
    MessageResponse,
    ResetPasswordRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserOut,
)
from app.services.email_service import send_password_reset_email

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

_GENERIC_FORGOT_PASSWORD_MESSAGE = "If an account exists for that email, a password reset link has been sent."


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: UserCreate, db: Session = Depends(get_db)) -> TokenResponse:
    """Register a new account and return a bearer token, so the frontend can log the user in immediately."""
    existing = db.query(User).filter(User.email == body.email).first()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists.")

    user = User(email=body.email, hashed_password=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    logger.info("New user registered: %s", user.email)
    token = create_access_token(subject=user.email)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.query(User).filter(User.email == body.email).first()
    if user is None or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password.")

    token = create_access_token(subject=user.email)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
async def read_current_user(current_user: User = Depends(get_current_user)) -> UserOut:
    """Validates the stored token and returns the user — used by the frontend to hydrate auth state on load."""
    return UserOut.model_validate(current_user)


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    body: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)
) -> MessageResponse:
    """Always returns the same message whether or not the email is registered, so this endpoint
    can't be used to enumerate accounts."""
    settings = get_settings()
    user = db.query(User).filter(User.email == body.email).first()

    if user is not None:
        raw_token = generate_reset_token()
        user.reset_token_hash = hash_reset_token(raw_token)
        user.reset_token_expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=settings.password_reset_token_expire_minutes
        )
        db.commit()

        reset_url = f"{settings.frontend_url}/reset-password?token={raw_token}"
        background_tasks.add_task(send_password_reset_email, user.email, reset_url)
        logger.info("Password reset requested for %s", user.email)

    return MessageResponse(message=_GENERIC_FORGOT_PASSWORD_MESSAGE)


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)) -> MessageResponse:
    token_hash = hash_reset_token(body.token)
    now = datetime.now(timezone.utc)

    user = db.query(User).filter(User.reset_token_hash == token_hash).first()
    if user is None or user.reset_token_expires_at is None or user.reset_token_expires_at < now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This reset link is invalid or has expired.")

    user.hashed_password = hash_password(body.new_password)
    user.reset_token_hash = None
    user.reset_token_expires_at = None
    db.commit()

    logger.info("Password reset completed for %s", user.email)
    return MessageResponse(message="Your password has been reset. You can now log in.")
