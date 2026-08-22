import datetime
import random
import string
from app.infrastructure.db.session import SessionLocal
from app.infrastructure.db import models as m
from app.domain.enums import Role, LeaveType
from app.core.security import hash_password

DEFAULT_LEAVE_DAYS = {
    LeaveType.PAID: 12,
    LeaveType.SICK: 6,
    LeaveType.UNPAID: 0,
}


def seed_default_users():
    db = SessionLocal()
    try:
        # Default Admin
        admin_email = "admin@dayflow.com"
        admin_user = db.query(m.UserModel).filter(m.UserModel.email == admin_email).first()
        if not admin_user:
            admin_user = m.UserModel(
                email=admin_email,
                hashed_password=hash_password("AdminPassword123!"),
                role=Role.ADMIN,
                is_verified=True,
            )
            db.add(admin_user)
            db.flush()

            admin_emp = m.EmployeeModel(
                user_id=admin_user.id,
                employee_code="EMPADMIN01",
                first_name="Admin",
                last_name="User",
                department="Human Resources",
                designation="HR Manager",
                joining_date=datetime.date.today(),
            )
            db.add(admin_emp)

        # Default Employee
        emp_email = "employee@dayflow.com"
        emp_user = db.query(m.UserModel).filter(m.UserModel.email == emp_email).first()
        if not emp_user:
            emp_user = m.UserModel(
                email=emp_email,
                hashed_password=hash_password("EmployeePassword123!"),
                role=Role.EMPLOYEE,
                is_verified=True,
            )
            db.add(emp_user)
            db.flush()

            emp = m.EmployeeModel(
                user_id=emp_user.id,
                employee_code="EMPDEV01",
                first_name="Alex",
                last_name="Employee",
                department="Engineering",
                designation="Software Engineer",
                joining_date=datetime.date.today(),
            )
            db.add(emp)
            db.flush()

            # Seed leave balances for default employee
            year = datetime.date.today().year
            for lt, days in DEFAULT_LEAVE_DAYS.items():
                lb = m.LeaveBalanceModel(
                    employee_id=emp.id,
                    leave_type=lt,
                    year=year,
                    total_days=days,
                    used_days=0,
                )
                db.add(lb)

        db.commit()
        print("Default Admin and Employee accounts seeded successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding default users: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_default_users()
