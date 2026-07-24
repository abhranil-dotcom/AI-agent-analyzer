import logging

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_RESEND_API_URL = "https://api.resend.com/emails"


def send_password_reset_email(to_email: str, reset_url: str) -> None:
    """Sends the reset link via Resend. Never raises — a delivery failure shouldn't reveal
    whether the account exists, and forgot-password already returns a generic response either way."""
    settings = get_settings()
    if not settings.resend_api_key:
        logger.warning("RESEND_API_KEY not set — skipping password reset email. Reset URL: %s", reset_url)
        return

    try:
        response = httpx.post(
            _RESEND_API_URL,
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            json={
                "from": settings.email_from,
                "to": [to_email],
                "subject": "Reset your password",
                "html": (
                    f"<p>Someone requested a password reset for your account.</p>"
                    f'<p><a href="{reset_url}">Click here to reset your password</a>. '
                    f"This link expires in {settings.password_reset_token_expire_minutes} minutes.</p>"
                    f"<p>If you didn't request this, you can safely ignore this email.</p>"
                ),
            },
            timeout=10.0,
        )
        response.raise_for_status()
    except httpx.HTTPError:
        logger.exception("Failed to send password reset email to %s via Resend", to_email)
