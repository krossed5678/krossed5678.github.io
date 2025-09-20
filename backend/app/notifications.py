import smtplib
from email.message import EmailMessage
from config import settings


def send_email(to_email: str, subject: str, body: str) -> bool:
    # If SMTP is not configured, no-op and return False
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASS:
        return False
    msg = EmailMessage()
    msg["From"] = settings.FROM_EMAIL
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as s:
            s.starttls()
            s.login(settings.SMTP_USER, settings.SMTP_PASS)
            s.send_message(msg)
        return True
    except Exception:
        return False
