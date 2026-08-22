import pytest
from datetime import datetime, date, timedelta, timezone
from app.infrastructure.db import models as m
from app.core.security import hash_password, create_access_token
from app.domain.enums import Role, AttendanceStatus, LeaveType, LeaveStatus
from app.infrastructure.tasks import task_flag_missing_checkouts, task_accrue_leave_balances

@pytest.fixture
def test_admin_and_employee(db_session):
    # Create an admin user & employee
    admin_user = m.UserModel(
        email="admin_test@dayflow.com",
        hashed_password=hash_password("adminpass"),
        role=Role.ADMIN,
        is_verified=True
    )
    db_session.add(admin_user)
    db_session.flush()

    admin_emp = m.EmployeeModel(
        user_id=admin_user.id,
        employee_code="EMP_ADMIN",
        first_name="Admin",
        last_name="Test",
        joining_date=date.today()
    )
    db_session.add(admin_emp)

    # Create employee 1
    emp_user_1 = m.UserModel(
        email="emp1@dayflow.com",
        hashed_password=hash_password("emppass"),
        role=Role.EMPLOYEE,
        is_verified=True
    )
    db_session.add(emp_user_1)
    db_session.flush()

    emp_1 = m.EmployeeModel(
        user_id=emp_user_1.id,
        employee_code="EMP_001",
        first_name="John",
        last_name="Doe",
        joining_date=date.today()
    )
    db_session.add(emp_1)

    # Create employee 2
    emp_user_2 = m.UserModel(
        email="emp2@dayflow.com",
        hashed_password=hash_password("emppass"),
        role=Role.EMPLOYEE,
        is_verified=True
    )
    db_session.add(emp_user_2)
    db_session.flush()

    emp_2 = m.EmployeeModel(
        user_id=emp_user_2.id,
        employee_code="EMP_002",
        first_name="Jane",
        last_name="Smith",
        joining_date=date.today()
    )
    db_session.add(emp_2)

    db_session.commit()
    return {
        "admin": (admin_user, admin_emp),
        "emp1": (emp_user_1, emp_1),
        "emp2": (emp_user_2, emp_2)
    }

def get_auth_headers(user):
    token = create_access_token(subject=str(user.id))
    return {"Authorization": f"Bearer {token}"}

# ==============================================================================
# (a) File upload validation
# ==============================================================================
def test_document_upload_validation(client, test_admin_and_employee, db_session):
    emp_user, emp = test_admin_and_employee["emp1"]
    headers = get_auth_headers(emp_user)

    # 1. Reject file types that are not PDF/PNG/JPEG
    files = {"file": ("test.txt", b"dummy content", "text/plain")}
    data = {"doc_type": "Resume"}
    response = client.post(f"/api/v1/employees/{emp.id}/documents", headers=headers, files=files, data=data)
    assert response.status_code == 422
    assert "Unsupported content type" in response.json()["detail"]

    # 2. Reject file size > 5MB
    large_content = b"0" * (5 * 1024 * 1024 + 100) # Slightly larger than 5MB
    files = {"file": ("large.pdf", large_content, "application/pdf")}
    response = client.post(f"/api/v1/employees/{emp.id}/documents", headers=headers, files=files, data=data)
    assert response.status_code == 422
    assert "exceeds maximum allowed size" in response.json()["detail"]

    # 3. Allow valid file (e.g. PDF under 5MB)
    valid_content = b"PDF dummy content"
    files = {"file": ("resume.pdf", valid_content, "application/pdf")}
    response = client.post(f"/api/v1/employees/{emp.id}/documents", headers=headers, files=files, data=data)
    assert response.status_code == 200
    doc_id = response.json()["id"]
    assert doc_id is not None


# ==============================================================================
# (b) Document deletion rules
# ==============================================================================
def test_document_deletion_rules(client, test_admin_and_employee, db_session):
    admin_user, _ = test_admin_and_employee["admin"]
    emp_user_1, emp_1 = test_admin_and_employee["emp1"]
    emp_user_2, emp_2 = test_admin_and_employee["emp2"]

    # Create a document for emp_1 created recently (within 24 hours)
    doc_recent = m.DocumentModel(
        employee_id=emp_1.id,
        doc_type="Resume",
        file_url="/tmp/resume.pdf",
        uploaded_at=datetime.now(timezone.utc) - timedelta(hours=1)
    )
    db_session.add(doc_recent)

    # Create a document for emp_1 created >24 hours ago
    doc_old = m.DocumentModel(
        employee_id=emp_1.id,
        doc_type="ID_Proof",
        file_url="/tmp/id.pdf",
        uploaded_at=datetime.now(timezone.utc) - timedelta(hours=25)
    )
    db_session.add(doc_old)
    db_session.commit()

    # 1. Non-owner/non-admin cannot delete
    headers_emp2 = get_auth_headers(emp_user_2)
    response = client.delete(f"/api/v1/employees/{emp_1.id}/documents/{doc_recent.id}", headers=headers_emp2)
    assert response.status_code == 403

    # 2. Owner can delete within 24 hours
    headers_emp1 = get_auth_headers(emp_user_1)
    response = client.delete(f"/api/v1/employees/{emp_1.id}/documents/{doc_recent.id}", headers=headers_emp1)
    assert response.status_code == 200

    # 3. Owner cannot delete after 24 hours
    response = client.delete(f"/api/v1/employees/{emp_1.id}/documents/{doc_old.id}", headers=headers_emp1)
    assert response.status_code == 403
    assert "24 hours" in response.json()["detail"]

    # 4. Admin can delete anytime (even after 24 hours)
    headers_admin = get_auth_headers(admin_user)
    response = client.delete(f"/api/v1/employees/{emp_1.id}/documents/{doc_old.id}", headers=headers_admin)
    assert response.status_code == 200


# ==============================================================================
# (c) Automatic attendance nightly flagging behavior
# ==============================================================================
def test_attendance_nightly_flagging_behavior(test_admin_and_employee, db_session):
    _, emp_1 = test_admin_and_employee["emp1"]
    _, emp_2 = test_admin_and_employee["emp2"]
    
    yesterday = date.today() - timedelta(days=1)

    # 1. Create a record with check-in but no check-out (missing check-out)
    rec_missing = m.AttendanceModel(
        employee_id=emp_1.id,
        date=yesterday,
        check_in=datetime.now(timezone.utc) - timedelta(hours=32),
        check_out=None,
        status=AttendanceStatus.PRESENT,
        flagged=False
    )
    db_session.add(rec_missing)

    # 2. Create a record with check-in and check-out (complete)
    rec_complete = m.AttendanceModel(
        employee_id=emp_2.id,
        date=yesterday,
        check_in=datetime.now(timezone.utc) - timedelta(hours=32),
        check_out=datetime.now(timezone.utc) - timedelta(hours=24),
        status=AttendanceStatus.PRESENT,
        flagged=False
    )
    db_session.add(rec_complete)
    db_session.commit()

    # Run the nightly task passing the test db_session
    task_flag_missing_checkouts(db=db_session)

    # Re-fetch records
    db_session.expire_all()
    db_missing = db_session.query(m.AttendanceModel).filter(m.AttendanceModel.id == rec_missing.id).first()
    db_complete = db_session.query(m.AttendanceModel).filter(m.AttendanceModel.id == rec_complete.id).first()

    assert db_missing.flagged is True
    assert db_complete.flagged is False

    # Check that in-app notification was created for emp1
    notification = db_session.query(m.NotificationModel).filter(m.NotificationModel.user_id == emp_1.user_id).first()
    assert notification is not None
    assert "flagged" in notification.message


# ==============================================================================
# (d) Leave balance deduction and rejection
# ==============================================================================
def test_leave_balance_deduction_and_rejection(client, test_admin_and_employee, db_session):
    admin_user, _ = test_admin_and_employee["admin"]
    emp_user, emp = test_admin_and_employee["emp1"]
    current_year = date.today().year

    # Setup a leave balance for PAID type
    balance = m.LeaveBalanceModel(
        employee_id=emp.id,
        leave_type=LeaveType.PAID,
        year=current_year,
        total_days=2.0,
        used_days=0.0
    )
    db_session.add(balance)
    db_session.commit()

    # 1. Apply a leave request that exceeds total_days (3 days requested)
    headers = get_auth_headers(emp_user)
    payload = {
        "leave_type": "PAID",
        "start_date": str(date.today() + timedelta(days=1)),
        "end_date": str(date.today() + timedelta(days=3)), # 3 days
        "remarks": "Exceeding vacation"
    }
    response = client.post("/api/v1/leave/", headers=headers, json=payload)
    assert response.status_code == 400
    assert "Insufficient" in response.json()["detail"]

    # 2. Apply a leave request that fits inside balance (1 day requested)
    payload_valid = {
        "leave_type": "PAID",
        "start_date": str(date.today() + timedelta(days=1)),
        "end_date": str(date.today() + timedelta(days=1)), # 1 day
        "remarks": "Short vacation"
    }
    response = client.post("/api/v1/leave/", headers=headers, json=payload_valid)
    assert response.status_code == 201
    leave_id = response.json()["id"]

    # Approve this leave request as admin
    headers_admin = get_auth_headers(admin_user)
    response_approve = client.patch(f"/api/v1/leave/{leave_id}/approve", headers=headers_admin, json={"comment": "Approved!"})
    assert response_approve.status_code == 200

    # Verify balance was deducted (used_days should be 1.0)
    db_session.expire_all()
    db_balance = db_session.query(m.LeaveBalanceModel).filter(m.LeaveBalanceModel.id == balance.id).first()
    assert db_balance.used_days == 1.0

    # 3. Apply a leave request of 2 days (which exceeds the remaining balance of 1.0)
    payload_exceed = {
        "leave_type": "PAID",
        "start_date": str(date.today() + timedelta(days=5)),
        "end_date": str(date.today() + timedelta(days=6)), # 2 days
        "remarks": "Exceeding remaining"
    }
    response = client.post("/api/v1/leave/", headers=headers, json=payload_exceed)
    assert response.status_code == 400
    assert "Insufficient" in response.json()["detail"]
