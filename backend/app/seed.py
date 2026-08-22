import datetime
from app.infrastructure.db.session import SessionLocal
from app.infrastructure.db import models as m
from app.domain.enums import Role, AttendanceStatus, LeaveType, LeaveStatus
from app.core.security import hash_password

DEFAULT_LEAVE_DAYS = {
    LeaveType.PAID: 12,
    LeaveType.SICK: 6,
    LeaveType.UNPAID: 0,
}

EMPLOYEES_DATA = [
    {
        "email": "admin@dayflow.com",
        "password": "AdminPassword123!",
        "role": Role.ADMIN,
        "code": "EMPADMIN01",
        "first_name": "Admin",
        "last_name": "User",
        "phone": "+91 98765 00000",
        "address": "Headquarters, HR Tower, Silicon Valley",
        "basic": 90000,
        "hra": 45000,
        "allowances": {"medical": 5000, "conveyance": 3000, "special": 7000},
        "deductions": {"pf": 5400, "tax": 8000},
    },
    {
        "email": "employee@dayflow.com",
        "password": "EmployeePassword123!",
        "role": Role.EMPLOYEE,
        "code": "EMPDEV01",
        "first_name": "Alex",
        "last_name": "Employee",
        "phone": "+91 98765 11111",
        "address": "42 Tech Park Avenue, Suite 101",
        "basic": 50000,
        "hra": 25000,
        "allowances": {"medical": 3000, "transport": 2000},
        "deductions": {"pf": 3000, "tax": 2500},
    },
    {
        "email": "sarah.j@dayflow.com",
        "password": "EmployeePassword123!",
        "role": Role.EMPLOYEE,
        "code": "EMPDEV02",
        "first_name": "Sarah",
        "last_name": "Jenkins",
        "phone": "+91 98765 22222",
        "address": "15 Palm Grove Street, City Center",
        "basic": 65000,
        "hra": 32500,
        "allowances": {"medical": 4000, "bonus": 5000},
        "deductions": {"pf": 3900, "tax": 4500},
    },
    {
        "email": "michael.c@dayflow.com",
        "password": "EmployeePassword123!",
        "role": Role.EMPLOYEE,
        "code": "EMPDEV03",
        "first_name": "Michael",
        "last_name": "Chen",
        "phone": "+91 98765 33333",
        "address": "88 Innovation Boulevard",
        "basic": 55000,
        "hra": 27500,
        "allowances": {"medical": 3500, "transport": 2500},
        "deductions": {"pf": 3300, "tax": 3000},
    },
    {
        "email": "priya.s@dayflow.com",
        "password": "EmployeePassword123!",
        "role": Role.EMPLOYEE,
        "code": "EMPDEV04",
        "first_name": "Priya",
        "last_name": "Sharma",
        "phone": "+91 98765 44444",
        "address": "7 Green Valley Apartments",
        "basic": 70000,
        "hra": 35000,
        "allowances": {"medical": 4500, "special": 6000},
        "deductions": {"pf": 4200, "tax": 5500},
    },
    {
        "email": "david.m@dayflow.com",
        "password": "EmployeePassword123!",
        "role": Role.EMPLOYEE,
        "code": "EMPDEV05",
        "first_name": "David",
        "last_name": "Miller",
        "phone": "+91 98765 55555",
        "address": "104 Sunset Drive, Westside",
        "basic": 48000,
        "hra": 24000,
        "allowances": {"medical": 2500, "transport": 1500},
        "deductions": {"pf": 2880, "tax": 2000},
    },
]


def seed_database():
    db = SessionLocal()
    try:
        current_year = datetime.date.today().year
        today = datetime.date.today()

        created_users = []
        created_employees = []

        print("Seeding Users & Employees...")
        for data in EMPLOYEES_DATA:
            user = db.query(m.UserModel).filter(m.UserModel.email == data["email"]).first()
            if not user:
                user = m.UserModel(
                    email=data["email"],
                    hashed_password=hash_password(data["password"]),
                    role=data["role"],
                    is_verified=True,
                )
                db.add(user)
                db.flush()

            emp = db.query(m.EmployeeModel).filter(m.EmployeeModel.user_id == user.id).first()
            if not emp:
                emp = m.EmployeeModel(
                    user_id=user.id,
                    employee_code=data["code"],
                    first_name=data["first_name"],
                    last_name=data["last_name"],
                    phone=data["phone"],
                    address=data["address"],
                    joining_date=today - datetime.timedelta(days=180),
                )
                db.add(emp)
                db.flush()

            created_users.append(user)
            created_employees.append(emp)

            # Leave Balances
            for lt, days in DEFAULT_LEAVE_DAYS.items():
                existing_lb = db.query(m.LeaveBalanceModel).filter(
                    m.LeaveBalanceModel.employee_id == emp.id,
                    m.LeaveBalanceModel.leave_type == lt,
                    m.LeaveBalanceModel.year == current_year,
                ).first()
                if not existing_lb:
                    used = 2 if lt == LeaveType.PAID else (1 if lt == LeaveType.SICK else 0)
                    lb = m.LeaveBalanceModel(
                        employee_id=emp.id,
                        leave_type=lt,
                        year=current_year,
                        total_days=days,
                        used_days=used,
                    )
                    db.add(lb)

            # Salary Structure
            existing_salary = db.query(m.SalaryStructureModel).filter(
                m.SalaryStructureModel.employee_id == emp.id,
                m.SalaryStructureModel.is_active == True,
            ).first()
            if not existing_salary:
                ss = m.SalaryStructureModel(
                    employee_id=emp.id,
                    basic=data["basic"],
                    hra=data["hra"],
                    allowances=data["allowances"],
                    deductions=data["deductions"],
                    effective_from=today - datetime.timedelta(days=180),
                    is_active=True,
                )
                db.add(ss)

            # Seed Documents for Employee
            doc_types = ["ID_PROOF", "QUALIFICATION", "CONTRACT", "OTHER"]
            for doc_t in doc_types:
                existing_doc = db.query(m.DocumentModel).filter(
                    m.DocumentModel.employee_id == emp.id,
                    m.DocumentModel.doc_type == doc_t,
                ).first()
                if not existing_doc:
                    doc = m.DocumentModel(
                        employee_id=emp.id,
                        file_url=f"/static/docs/{doc_t.lower()}_{emp.employee_code}.pdf",
                        doc_type=doc_t,
                    )
                    db.add(doc)

            # Seed Notifications
            notifications_list = [
                "Welcome to Dayflow HRMS platform!",
                f"Your profile details were updated successfully.",
                "Your monthly payroll slip is ready for viewing.",
                "Reminder: System maintenance scheduled for Sunday at 02:00 AM.",
                "Your leave request balance has been refreshed for 2026.",
            ]
            for msg in notifications_list:
                existing_notif = db.query(m.NotificationModel).filter(
                    m.NotificationModel.user_id == user.id,
                    m.NotificationModel.message == msg,
                ).first()
                if not existing_notif:
                    notif = m.NotificationModel(
                        user_id=user.id,
                        message=msg,
                        is_read=False,
                    )
                    db.add(notif)

        db.flush()
        print("Seeding Attendance Records...")
        admin_user = created_users[0]

        # Seed 5-6 Attendance Records per employee across past 5 days
        for emp in created_employees:
            for day_offset in range(6):
                att_date = today - datetime.timedelta(days=day_offset)
                existing_att = db.query(m.AttendanceModel).filter(
                    m.AttendanceModel.employee_id == emp.id,
                    m.AttendanceModel.date == att_date,
                ).first()

                if not existing_att:
                    if day_offset == 0:  # Today
                        check_in = datetime.datetime.combine(att_date, datetime.time(9, 15))
                        check_out = datetime.datetime.combine(att_date, datetime.time(18, 15))
                        status = AttendanceStatus.PRESENT
                        flagged = False
                    elif day_offset == 1:  # Yesterday
                        check_in = datetime.datetime.combine(att_date, datetime.time(9, 30))
                        check_out = datetime.datetime.combine(att_date, datetime.time(17, 30))
                        status = AttendanceStatus.PRESENT
                        flagged = False
                    elif day_offset == 2:  # Flagged entry
                        check_in = datetime.datetime.combine(att_date, datetime.time(10, 0))
                        check_out = datetime.datetime.combine(att_date, datetime.time(14, 0))
                        status = AttendanceStatus.HALF_DAY
                        flagged = True
                    elif day_offset == 3:
                        check_in = datetime.datetime.combine(att_date, datetime.time(9, 0))
                        check_out = datetime.datetime.combine(att_date, datetime.time(18, 0))
                        status = AttendanceStatus.PRESENT
                        flagged = False
                    elif day_offset == 4:  # Another flagged entry
                        check_in = datetime.datetime.combine(att_date, datetime.time(11, 30))
                        check_out = None
                        status = AttendanceStatus.HALF_DAY
                        flagged = True
                    else:
                        check_in = None
                        check_out = None
                        status = AttendanceStatus.ABSENT
                        flagged = False

                    att = m.AttendanceModel(
                        employee_id=emp.id,
                        date=att_date,
                        check_in=check_in,
                        check_out=check_out,
                        status=status,
                        flagged=flagged,
                    )
                    db.add(att)

        print("Seeding Leave Requests...")
        sample_leave_requests = [
            {
                "emp_idx": 1,
                "type": LeaveType.PAID,
                "start": today + datetime.timedelta(days=2),
                "end": today + datetime.timedelta(days=4),
                "remarks": "Family trip to mountains",
                "status": LeaveStatus.PENDING,
                "review_comment": None,
            },
            {
                "emp_idx": 1,
                "type": LeaveType.SICK,
                "start": today - datetime.timedelta(days=10),
                "end": today - datetime.timedelta(days=9),
                "remarks": "High fever and viral flu",
                "status": LeaveStatus.APPROVED,
                "review_comment": "Get well soon!",
            },
            {
                "emp_idx": 2,
                "type": LeaveType.PAID,
                "start": today + datetime.timedelta(days=5),
                "end": today + datetime.timedelta(days=7),
                "remarks": "Attending cousin's wedding",
                "status": LeaveStatus.PENDING,
                "review_comment": None,
            },
            {
                "emp_idx": 3,
                "type": LeaveType.SICK,
                "start": today + datetime.timedelta(days=1),
                "end": today + datetime.timedelta(days=1),
                "remarks": "Dental surgery appointment",
                "status": LeaveStatus.APPROVED,
                "review_comment": "Approved.",
            },
            {
                "emp_idx": 4,
                "type": LeaveType.UNPAID,
                "start": today + datetime.timedelta(days=15),
                "end": today + datetime.timedelta(days=20),
                "remarks": "Personal extended relocation travel",
                "status": LeaveStatus.REJECTED,
                "review_comment": "Insufficient notice provided during project delivery cycle.",
            },
            {
                "emp_idx": 5,
                "type": LeaveType.PAID,
                "start": today + datetime.timedelta(days=3),
                "end": today + datetime.timedelta(days=4),
                "remarks": "Home renovation supervision",
                "status": LeaveStatus.PENDING,
                "review_comment": None,
            },
        ]

        for lr_data in sample_leave_requests:
            emp = created_employees[lr_data["emp_idx"]]
            existing_lr = db.query(m.LeaveRequestModel).filter(
                m.LeaveRequestModel.employee_id == emp.id,
                m.LeaveRequestModel.start_date == lr_data["start"],
                m.LeaveRequestModel.leave_type == lr_data["type"],
            ).first()

            if not existing_lr:
                lr = m.LeaveRequestModel(
                    employee_id=emp.id,
                    leave_type=lr_data["type"],
                    start_date=lr_data["start"],
                    end_date=lr_data["end"],
                    remarks=lr_data["remarks"],
                    status=lr_data["status"],
                    reviewed_by=admin_user.id if lr_data["status"] != LeaveStatus.PENDING else None,
                    review_comment=lr_data["review_comment"],
                )
                db.add(lr)

        db.commit()
        print("Database successfully seeded with 5-6 realistic records per table!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()


def seed_default_users():
    seed_database()


if __name__ == "__main__":
    seed_default_users()
