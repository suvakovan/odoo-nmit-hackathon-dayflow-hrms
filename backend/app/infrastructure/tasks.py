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
def task_send_password_reset_email(self, to_email: str, token: str):
    from app.infrastructure.email.mailer import send_password_reset_email
    try:
        send_password_reset_email(to_email, token)
    except Exception as exc:
        logger.error(f"Failed to send password reset email: {exc}")
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


@celery_app.task
def task_send_notification_and_email(
    user_id: int,
    message: str,
    email_subject: str,
    email_body: str,
):
    from app.infrastructure.db.session import SessionLocal
    from app.application.notification_service import NotificationService
    from app.infrastructure.db import models as m
    from app.infrastructure.email.mailer import send_email

    db = SessionLocal()
    try:
        svc = NotificationService(db)
        svc.create_notification(user_id, message)

        user = db.query(m.UserModel).filter(m.UserModel.id == user_id).first()
        if user and user.email:
            send_email(user.email, email_subject, email_body, message)
    except Exception as e:
        logger.error(f"Failed to send notification/email to user {user_id}: {e}")
    finally:
        db.close()


@celery_app.task
def task_notify_admins(
    message: str,
    email_subject: str,
    email_body: str,
):
    from app.infrastructure.db.session import SessionLocal
    from app.application.notification_service import NotificationService
    from app.infrastructure.db import models as m
    from app.infrastructure.email.mailer import send_email
    from app.domain.enums import Role

    db = SessionLocal()
    try:
        svc = NotificationService(db)
        admins = db.query(m.UserModel).filter(m.UserModel.role == Role.ADMIN).all()
        for admin in admins:
            svc.create_notification(admin.id, message)
            if admin.email:
                send_email(admin.email, email_subject, email_body, message)
    except Exception as e:
        logger.error(f"Failed to notify admins: {e}")
    finally:
        db.close()


@celery_app.task
def task_flag_missing_checkouts(db=None):
    from datetime import date, timedelta
    from app.infrastructure.db.session import SessionLocal
    from app.infrastructure.db import models as m
    import logging

    logger = logging.getLogger(__name__)
    owns_db = False
    if db is None:
        db = SessionLocal()
        owns_db = True

    try:
        yesterday = date.today() - timedelta(days=1)
        flagged_count = 0
        
        # Query attendance of yesterday that has check-in but no check-out
        records = db.query(m.AttendanceModel).filter(
            m.AttendanceModel.date == yesterday,
            m.AttendanceModel.check_in.isnot(None),
            m.AttendanceModel.check_out.is_(None)
        ).all()

        for record in records:
            record.flagged = True
            flagged_count += 1
            
            try:
                emp = db.query(m.EmployeeModel).filter(m.EmployeeModel.id == record.employee_id).first()
                if emp and emp.user_id:
                    from app.application.notification_service import NotificationService
                    svc = NotificationService(db)
                    svc.create_notification(
                        user_id=emp.user_id,
                        message=f"Your attendance for {yesterday} was flagged due to a missing check-out. Please contact HR to correct it."
                    )
            except Exception as ex:
                logger.error(f"Failed to notify user for flagged attendance: {ex}")

        db.commit()
        logger.info(f"Nightly attendance check: flagged {flagged_count} records for {yesterday}")
    except Exception as e:
        logger.error(f"Error running nightly check: {e}")
    finally:
        if owns_db:
            db.close()


@celery_app.task
def task_accrue_leave_balances():
    from datetime import date
    from app.infrastructure.db.session import SessionLocal
    from app.infrastructure.db import models as m
    from app.domain.enums import LeaveType
    import logging

    logger = logging.getLogger(__name__)
    db = SessionLocal()
    try:
        current_year = date.today().year
        employees = db.query(m.EmployeeModel).all()
        accrued_count = 0

        for emp in employees:
            # We want to accrue for PAID and SICK leave types
            for l_type, increment in [("PAID", 1.5), ("SICK", 1.0)]:
                # Look for existing balance for this employee, type, and year
                balance = db.query(m.LeaveBalanceModel).filter(
                    m.LeaveBalanceModel.employee_id == emp.id,
                    m.LeaveBalanceModel.leave_type == l_type,
                    m.LeaveBalanceModel.year == current_year
                ).first()

                if balance:
                    balance.total_days += increment
                else:
                    # If it doesn't exist, create it with initial balance + increment
                    balance = m.LeaveBalanceModel(
                        employee_id=emp.id,
                        leave_type=l_type,
                        year=current_year,
                        total_days=increment,
                        used_days=0
                    )
                    db.add(balance)
                accrued_count += 1

        db.commit()
        logger.info(f"Monthly leave accrual complete: updated/created {accrued_count} balance records for year {current_year}")
    except Exception as e:
        logger.error(f"Error running monthly leave accrual task: {e}")
    finally:
        db.close()



