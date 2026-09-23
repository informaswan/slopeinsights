# app/notify.py
"""Optional email notification for feedback. No-op unless SMTP is configured."""
import logging
import smtplib
from email.message import EmailMessage

from app.config import settings

logger = logging.getLogger(__name__)


def recipients() -> list[str]:
    """FEEDBACK_TO_EMAIL may hold several addresses, separated by commas."""
    return [a.strip() for a in settings.feedback_to_email.split(",") if a.strip()]


def email_enabled() -> bool:
    return bool(settings.smtp_host and recipients())


def send_feedback_email(category: str, message: str, reply_to: str | None) -> None:
    """Never raises: a mail outage must not lose or fail a feedback submission
    (it's already saved to the database by the time this runs)."""
    if not email_enabled():
        return
    try:
        msg = EmailMessage()
        msg["Subject"] = f"[SlopeInsights feedback] {category}"
        msg["From"] = settings.smtp_from or settings.smtp_user or recipients()[0]
        msg["To"] = ", ".join(recipients())
        if reply_to:
            msg["Reply-To"] = reply_to
        msg.set_content(f"Category: {category}\nReply-to: {reply_to or '(none given)'}\n\n{message}")
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
            smtp.starttls()
            if settings.smtp_user:
                smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(msg)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Feedback email failed: %s", exc)
