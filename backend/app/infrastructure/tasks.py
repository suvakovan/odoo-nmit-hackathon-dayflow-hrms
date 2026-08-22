import logging
from typing import Optional

from app.infrastructure.celery_app import celery_app
from app.infrastructure.email.mailer import (
    send_verification_email,
    send_leave_status_email,
    send_email,
)

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3)
def task_send_verification_email(self, to_email: str, token: str):
    try:
        send_verification_email(to_email, token)
    except Exception as exc:
        logger.error(f"Failed to send verification email: {exc}")
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def task_send_leave_status_email(
    self, to_email: str, status: str, leave_type: str, comment: Optional[str] = None
):
    try:
        send_leave_status_email(to_email, status, leave_type, comment)
    except Exception as exc:
        logger.error(f"Failed to send leave status email: {exc}")
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def task_notify_admins_new_leave(self, employee_name: str, leave_type: str, days: int):
    """Placeholder task — in production, look up all admin emails and notify them."""
    logger.info(
        f"[TASK] New leave request from {employee_name}: {days} day(s) of {leave_type}"
    )


@celery_app.task
def task_send_generic_email(to_email: str, subject: str, body: str):
    send_email(to_email, subject, f"<p>{body}</p>", body)
