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
    Send an email via Brevo API or SMTP.
    Returns True on success, False otherwise.
    In dev mode (EMAILS_ENABLED=false), logs the email instead of sending.
    """
    if not settings.EMAILS_ENABLED:
        logger.info(
            f"[DEV MODE] Email NOT sent. To: {to_email} | Subject: {subject}\n{text_body or html_body}"
        )
        return True

    from_address = settings.EMAILS_FROM_ADDRESS or settings.SMTP_USER
    if not from_address or not settings.SMTP_HOST or not settings.SMTP_PASSWORD:
        logger.warning(
            f"[EMAIL DISABLED] Missing SMTP configuration. Email NOT sent to {to_email}."
        )
        return False

    # Attempt 1: If key looks like a Brevo API/SMTP Key, try Brevo v3 HTTP API first
    if settings.SMTP_PASSWORD.startswith(("xsmtpsib-", "xkeysib-")):
        try:
            import urllib.request, json
            url = "https://api.brevo.com/v3/smtp/email"
            payload = {
                "sender": {"name": settings.EMAILS_FROM_NAME, "email": from_address},
                "to": [{"email": to_email}],
                "subject": subject,
                "htmlContent": html_body,
            }
            if text_body:
                payload["textContent"] = text_body

            headers = {
                "accept": "application/json",
                "content-type": "application/json",
                "api-key": settings.SMTP_PASSWORD,
            }
            req = urllib.request.Request(
                url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status in (200, 201, 202):
                    logger.info(f"Email successfully sent to {to_email} via Brevo API: {subject}")
                    return True
        except Exception as api_err:
            logger.warning(f"Brevo API send attempt failed: {api_err}. Trying standard SMTP...")

    # Attempt 2: Standard SMTP sending
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.EMAILS_FROM_NAME} <{from_address}>"
        msg["To"] = to_email

        if text_body:
            msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        timeout = 10
        if settings.SMTP_PORT == 465:
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=timeout) as server:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(from_address, to_email, msg.as_string())
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=timeout) as server:
                server.ehlo()
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(from_address, to_email, msg.as_string())

        logger.info(f"Email successfully sent to {to_email}: {subject}")
        return True
    except Exception as e:
        logger.error(
            f"Failed to send email to {to_email}: {e}. Please ensure your Brevo API/SMTP key in backend/.env is active."
        )
        return False


def send_verification_email(to_email: str, token: str) -> bool:
    verify_url = f"http://localhost:3000/verify-email?token={token}"
    html = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #6366F1; font-size: 28px; font-weight: bold; margin: 0;">Dayflow HRMS</h1>
            <p style="color: #64748B; font-size: 14px; margin-top: 4px;">Human Resource Management System</p>
        </div>
        <div style="background: white; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <h2 style="color: #1E293B; font-size: 20px; margin-top: 0;">Verify Your Email Address</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">Welcome to Dayflow HRMS! Please click the button below to verify your account and activate full access.</p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="{verify_url}" style="background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);">
                   Verify Email Address
                </a>
            </div>
            <p style="color: #94A3B8; font-size: 12px; margin-bottom: 0;">If you did not request this account, you can safely ignore this email. This link will expire in 24 hours.</p>
        </div>
    </div>
    """
    return send_email(to_email, "Verify your Dayflow email address", html, f"Verify your email here: {verify_url}")


def send_password_reset_email(to_email: str, token: str) -> bool:
    reset_url = f"http://localhost:3000/reset-password?token={token}"
    html = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #6366F1; font-size: 28px; font-weight: bold; margin: 0;">Dayflow HRMS</h1>
            <p style="color: #64748B; font-size: 14px; margin-top: 4px;">Human Resource Management System</p>
        </div>
        <div style="background: white; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <h2 style="color: #1E293B; font-size: 20px; margin-top: 0;">Reset Your Password</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">We received a request to reset your password for Dayflow HRMS. Click the button below to set up a new password.</p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="{reset_url}" style="background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);">
                   Reset Password
                </a>
            </div>
            <p style="color: #94A3B8; font-size: 12px; margin-bottom: 0;">If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
        </div>
    </div>
    """
    return send_email(to_email, "Reset your Dayflow HRMS Password", html, f"Reset password link: {reset_url}")


def send_leave_status_email(to_email: str, status: str, leave_type: str, comment: Optional[str] = None) -> bool:
    status_color = "#10B981" if status == "APPROVED" else "#EF4444"
    html = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #6366F1; font-size: 28px; font-weight: bold; margin: 0;">Dayflow HRMS</h1>
            <p style="color: #64748B; font-size: 14px; margin-top: 4px;">Human Resource Management System</p>
        </div>
        <div style="background: white; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <h2 style="color: #1E293B; font-size: 20px; margin-top: 0;">Leave Request Status Update</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">Your <strong>{leave_type}</strong> leave request has been marked as <span style="color: {status_color}; font-weight: bold;">{status}</span>.</p>
            {"<div style='background: #F1F5F9; padding: 12px; border-radius: 8px; font-size: 13px; color: #334155; margin: 16px 0;'><strong>Reviewer Comment:</strong> " + comment + "</div>" if comment else ""}
            <div style="text-align: center; margin: 24px 0;">
                <a href="http://localhost:3000/leave" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
                   View Leave Dashboard
                </a>
            </div>
        </div>
    </div>
    """
    return send_email(to_email, f"Leave Request {status} — Dayflow HRMS", html)


def send_salary_update_email(
    to_email: str,
    employee_name: str,
    net_salary: float,
    basic: float,
    hra: float,
    hand_money: float,
    transaction_fee: float,
    monthly_savings: float,
) -> bool:
    html = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #6366F1; font-size: 28px; font-weight: bold; margin: 0;">Dayflow HRMS</h1>
            <p style="color: #64748B; font-size: 14px; margin-top: 4px;">Salary Notification</p>
        </div>
        <div style="background: white; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <h2 style="color: #1E293B; font-size: 20px; margin-top: 0;">Salary Structure Updated</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">Hello <strong>{employee_name}</strong>,</p>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">Your salary structure has been updated by HR. Here is your revised monthly salary breakdown:</p>
            
            <div style="background: #EEF2FF; padding: 16px; border-radius: 10px; text-align: center; margin: 20px 0;">
                <p style="color: #4F46E5; font-size: 12px; font-weight: bold; uppercase; margin: 0;">Monthly Net Salary</p>
                <p style="color: #1E1B4B; font-size: 32px; font-weight: 800; margin: 4px 0 0 0;">₹{net_salary:,.2f}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
                <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 8px 0; color: #64748B;">Basic Salary</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0F172A;">₹{basic:,.2f}</td>
                </tr>
                <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 8px 0; color: #64748B;">HRA</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0F172A;">₹{hra:,.2f}</td>
                </tr>
                <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 8px 0; color: #10B981; font-weight: 600;">Hand Money (Cash)</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #10B981;">₹{hand_money:,.2f}</td>
                </tr>
                <tr style="border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 8px 0; color: #D97706; font-weight: 600;">Transaction Fee</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #D97706;">₹{transaction_fee:,.2f}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #8B5CF6; font-weight: 600;">Monthly Savings</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #8B5CF6;">₹{monthly_savings:,.2f}</td>
                </tr>
            </table>

            <div style="text-align: center; margin-top: 24px;">
                <a href="http://localhost:3000/payroll" style="background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
                   View Payroll & Download Payslip
                </a>
            </div>
        </div>
    </div>
    """
    return send_email(to_email, f"Salary Structure Updated — Dayflow HRMS", html)


def send_attendance_notification_email(
    to_email: str,
    employee_name: str,
    action: str,  # "Check-In", "Check-Out", or "Attendance Corrected"
    date_str: str,
    time_str: str,
    status: str,
) -> bool:
    html = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #6366F1; font-size: 28px; font-weight: bold; margin: 0;">Dayflow HRMS</h1>
            <p style="color: #64748B; font-size: 14px; margin-top: 4px;">Attendance Activity</p>
        </div>
        <div style="background: white; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <h2 style="color: #1E293B; font-size: 20px; margin-top: 0;">Attendance {action} Recorded</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">Hello <strong>{employee_name}</strong>,</p>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">Your attendance activity has been logged on Dayflow HRMS:</p>
            
            <div style="background: #F8FAFC; padding: 16px; border-radius: 10px; border: 1px solid #E2E8F0; margin: 16px 0;">
                <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Action:</strong> {action}</p>
                <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Date:</strong> {date_str}</p>
                <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Time:</strong> {time_str}</p>
                <p style="margin: 4px 0; font-size: 13px; color: #475569;"><strong>Status:</strong> <span style="color: #10B981; font-weight: bold;">{status}</span></p>
            </div>

            <div style="text-align: center; margin-top: 24px;">
                <a href="http://localhost:3000/attendance" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
                   View Attendance Logs
                </a>
            </div>
        </div>
    </div>
    """
    return send_email(to_email, f"Attendance {action} Notification — Dayflow HRMS", html)
