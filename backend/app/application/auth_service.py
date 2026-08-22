from typing import Optional, Tuple
from sqlalchemy.orm import Session

from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    create_email_verification_token, verify_email_token, decode_token,
)
from app.core.exceptions import AuthenticationError, ConflictError, ValidationError, NotFoundError
from app.domain.entities.user import User
from app.domain.enums import Role
from app.domain.entities.employee import Employee
from app.infrastructure.db import models as m
from app.infrastructure.db.repositories.sa_user_repo import SAUserRepository
from app.infrastructure.db.repositories.sa_employee_repo import SAEmployeeRepository
from app.infrastructure.db.repositories.sa_leave_repo import SALeaveRepository
from app.domain.entities.leave import LeaveBalance
from app.domain.enums import LeaveType
import datetime
import string
import random


DEFAULT_LEAVE_DAYS = {
    LeaveType.PAID: 12,
    LeaveType.SICK: 6,
    LeaveType.UNPAID: 0,
}


def _generate_employee_code() -> str:
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"EMP{suffix}"


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = SAUserRepository(db)
        self.employee_repo = SAEmployeeRepository(db)

    def signup(
        self,
        email: str,
        password: str,
        role: Role,
        first_name: str,
        last_name: str,
        department: str,
        designation: str,
    ) -> Tuple[m.UserModel, str]:
        """Register a new user and create their employee profile."""
        existing = self.user_repo.get_by_email(email)
        if existing:
            raise ConflictError("An account with this email already exists.")

        hashed = hash_password(password)
        user = self.user_repo.create(
            User(id=None, email=email, hashed_password=hashed, role=role, is_verified=False)
        )

        # Create employee profile automatically
        employee_code = _generate_employee_code()
        while self.employee_repo.get_by_code(employee_code):
            employee_code = _generate_employee_code()

        self.employee_repo.create(
            Employee(
                id=None,
                user_id=user.id,
                employee_code=employee_code,
                first_name=first_name,
                last_name=last_name,
                email=email,
                phone=None,
                address=None,
                department=department,
                designation=designation,
                manager_id=None,
                joining_date=datetime.date.today(),
                profile_picture_url=None,
            )
        )

        # Seed initial leave balances for employees
        if role == Role.EMPLOYEE:
            emp = self.employee_repo.get_by_user_id(user.id)
            leave_repo = SALeaveRepository(self.db)
            year = datetime.date.today().year
            for lt, days in DEFAULT_LEAVE_DAYS.items():
                leave_repo.create_balance(
                    LeaveBalance(
                        id=None,
                        employee_id=emp.id,
                        leave_type=lt,
                        year=year,
                        total_days=days,
                        used_days=0,
                    )
                )

        # Generate email verification token
        token = create_email_verification_token(email)

        # Fire Celery task (non-blocking)
        try:
            from app.infrastructure.tasks import task_send_verification_email
            task_send_verification_email.delay(email, token)
        except Exception:
            pass  # Don't fail signup if Celery is unavailable in dev

        user_model = self.db.query(m.UserModel).filter(m.UserModel.id == user.id).first()
        return user_model, token

    def verify_email(self, token: str) -> m.UserModel:
        email = verify_email_token(token)
        if not email:
            raise ValidationError("Invalid or expired verification token.")

        user = self.user_repo.get_by_email(email)
        if not user:
            raise NotFoundError("User")

        user.is_verified = True
        updated = self.user_repo.update(user)

        user_model = self.db.query(m.UserModel).filter(m.UserModel.id == updated.id).first()
        return user_model

    def login(self, email: str, password: str) -> dict:
        user = self.user_repo.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise AuthenticationError("Invalid email or password.")
        if not user.is_verified:
            raise AuthenticationError("Please verify your email before logging in.")

        access_token = create_access_token(str(user.id), {"role": user.role.value})
        refresh_token = create_refresh_token(str(user.id))

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    def refresh(self, refresh_token: str) -> dict:
        try:
            payload = decode_token(refresh_token)
            if payload.get("type") != "refresh":
                raise AuthenticationError("Invalid token type.")
            user_id = payload.get("sub")
        except Exception:
            raise AuthenticationError("Invalid or expired refresh token.")

        user = self.user_repo.get_by_id(int(user_id))
        if not user:
            raise NotFoundError("User")

        access_token = create_access_token(str(user.id), {"role": user.role.value})
        return {"access_token": access_token, "token_type": "bearer"}
