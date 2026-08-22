import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email(
    to_email: str,
    subject: str,
    html_body: str,
    text_body: Optional[str] = None,
) -> bool:
    """
    Send an email via SMTP. Returns True on success, False otherwise.
    In dev mode (EMAILS_ENABLED=false), logs the email instead of sending.
    """
    if not settings.EMAILS_ENABLED:
        logger.info(
            f"[DEV MODE] Email NOT sent. To: {to_email} | Subject: {subject}\n{text_body or html_body}"
        )
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.SMTP_USER}>"
        msg["To"] = to_email

        if text_body:
            msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())

        logger.info(f"Email sent to {to_email}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


def send_verification_email(to_email: str, token: str) -> bool:
    verify_url = f"http://localhost:3000/verify-email?token={token}"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Welcome to Dayflow HRMS</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="{verify_url}" style="background: #4F46E5; color: white; padding: 12px 24px; 
           text-decoration: none; border-radius: 6px; display: inline-block;">
           Verify Email
        </a>
        <p style="color: #666; font-size: 12px;">This link expires in 1 hour.</p>
    </div>
    """
    return send_email(to_email, "Verify your Dayflow email", html, f"Verify here: {verify_url}")


def send_leave_status_email(to_email: str, status: str, leave_type: str, comment: Optional[str] = None) -> bool:
    status_color = "#10B981" if status == "APPROVED" else "#EF4444"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Leave Request Update — Dayflow HRMS</h2>
        <p>Your <strong>{leave_type}</strong> leave request has been 
           <span style="color: {status_color}; font-weight: bold;">{status}</span>.</p>
        {"<p><strong>Comment:</strong> " + comment + "</p>" if comment else ""}
        <p>Log in to <a href="http://localhost:3000">Dayflow</a> to view details.</p>
    </div>
    """
    return send_email(to_email, f"Leave Request {status} — Dayflow", html)
