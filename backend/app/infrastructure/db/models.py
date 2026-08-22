from sqlalchemy import (
    Boolean, Column, Date, DateTime, Enum as SAEnum,
    ForeignKey, Integer, JSON, Numeric, String, Text, UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.infrastructure.db.base import Base
from app.domain.enums import Role, AttendanceStatus, LeaveType, LeaveStatus


class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(Role, name="role_enum"), nullable=False)
    is_verified = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    employee = relationship("EmployeeModel", back_populates="user", uselist=False)
    notifications = relationship("NotificationModel", back_populates="user")


class EmployeeModel(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    employee_code = Column(String(50), unique=True, nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20))
    address = Column(Text)
    manager_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    joining_date = Column(Date, nullable=False)
    profile_picture_url = Column(String(500))

    user = relationship("UserModel", back_populates="employee")
    manager = relationship("EmployeeModel", remote_side=[id])
    documents = relationship("DocumentModel", back_populates="employee")
    attendances = relationship("AttendanceModel", back_populates="employee")
    leave_requests = relationship("LeaveRequestModel", back_populates="employee")
    leave_balances = relationship("LeaveBalanceModel", back_populates="employee")
    salary_structures = relationship("SalaryStructureModel", back_populates="employee")


class DocumentModel(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    file_url = Column(String(500), nullable=False)
    doc_type = Column(String(50))  # ID_PROOF, OFFER_LETTER, etc.
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    employee = relationship("EmployeeModel", back_populates="documents")


class AttendanceModel(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    date = Column(Date, nullable=False)
    check_in = Column(DateTime(timezone=True), nullable=True)
    check_out = Column(DateTime(timezone=True), nullable=True)
    status = Column(SAEnum(AttendanceStatus, name="attendance_status_enum"), nullable=False)
    flagged = Column(Boolean, default=False, nullable=False)

    __table_args__ = (UniqueConstraint("employee_id", "date", name="uq_attendance_employee_date"),)

    employee = relationship("EmployeeModel", back_populates="attendances")


class LeaveRequestModel(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    leave_type = Column(SAEnum(LeaveType, name="leave_type_enum"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    remarks = Column(Text)
    status = Column(
        SAEnum(LeaveStatus, name="leave_status_enum"),
        default=LeaveStatus.PENDING,
        nullable=False,
    )
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    review_comment = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    employee = relationship("EmployeeModel", back_populates="leave_requests")
    reviewer = relationship("UserModel", foreign_keys=[reviewed_by])


class LeaveBalanceModel(Base):
    __tablename__ = "leave_balances"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    leave_type = Column(SAEnum(LeaveType, name="leave_type_balance_enum"), nullable=False)
    year = Column(Integer, nullable=False)
    total_days = Column(Integer, nullable=False, default=0)
    used_days = Column(Integer, nullable=False, default=0)

    __table_args__ = (
        UniqueConstraint("employee_id", "leave_type", "year", name="uq_leave_balance_employee_type_year"),
    )

    employee = relationship("EmployeeModel", back_populates="leave_balances")


class SalaryStructureModel(Base):
    __tablename__ = "salary_structures"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    basic = Column(Numeric(12, 2), nullable=False)
    hra = Column(Numeric(12, 2), default=0, nullable=False)
    allowances = Column(JSON().with_variant(JSONB, "postgresql"), default=dict, nullable=False)
    deductions = Column(JSON().with_variant(JSONB, "postgresql"), default=dict, nullable=False)
    effective_from = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    employee = relationship("EmployeeModel", back_populates="salary_structures")


class NotificationModel(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(String(1000), nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("UserModel", back_populates="notifications")
