import os

# SMTP settings (optional). If not set, notifications are no-ops.
SMTP_HOST = os.environ.get("SMTP_HOST")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER")
SMTP_PASS = os.environ.get("SMTP_PASS")
FROM_EMAIL = os.environ.get("FROM_EMAIL") or "no-reply@example.com"
