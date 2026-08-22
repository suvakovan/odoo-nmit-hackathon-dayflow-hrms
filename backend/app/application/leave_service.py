from typing import Optional, List
from datetime import date
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, PermissionDeniedError, ConflictError
from app.domain.enums import Role, LeaveType, LeaveStatus
from app.domain.entities.leave import Leave, LeaveBalance
from app.infrastructure.db import models as m
from app.infrastructure.db.repositories.sa_leave_repo import SALeaveRepository
from app.domain.exceptions import (
    InsufficientLeaveBalance, OverlappingLeaveRequest, InvalidLeaveDates
)
import datetime as dt


class LeaveService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = SALeaveRepository(db)

    def _get_employee_for_user(self, user: m.UserModel) -> m.EmployeeModel:
        emp = self.db.query(m.EmployeeModel).filter(m.EmployeeModel.user_id == user.id).first()
        if not emp:
            raise NotFoundError("Employee profile")
        return emp

    def apply_leave(
        self,
        requester: m.UserModel,
        leave_type: LeaveType,
        start_date: date,
        end_date: date,
        remarks: Optional[str] = None,
    ) -> m.LeaveRequestModel:
        emp = self._get_employee_for_user(requester)

        # Domain validation: date order
        leave = Leave(
            id=None, employee_id=emp.id, leave_type=leave_type,
            start_date=start_date, end_date=end_date,
            remarks=remarks, status=LeaveStatus.PENDING,
            reviewed_by=None, review_comment=None,
        )
        leave.validate_dates()

        # Overlap check
        overlapping = self.repo.get_overlapping(emp.id, start_date, end_date)
        if overlapping:
            raise OverlappingLeaveRequest()

        # Balance check (UNPAID is always allowed)
        if leave_type != LeaveType.UNPAID:
            year = start_date.year
            balance = self.repo.get_balance(emp.id, leave_type, year)
            if not balance:
                raise ConflictError(f"No leave balance configured for {leave_type.value} in {year}.")
            if not balance.can_take_leave(leave.total_days):
                raise InsufficientLeaveBalance(leave_type.value, balance.remaining_days, leave.total_days)

        saved = self.repo.create(leave)

        # Notify admins (non-blocking)
        try:
            from app.infrastructure.tasks import task_notify_admins
            task_notify_admins.delay(
                message=f"New leave request submitted by {emp.first_name} {emp.last_name}.",
                email_subject="New Leave Request Submitted",
                email_body=f"Employee {emp.first_name} {emp.last_name} has requested {leave.total_days} day(s) of {leave_type.value} leave starting from {start_date} to {end_date}."
            )
        except Exception:
            pass

        return self.db.query(m.LeaveRequestModel).filter(m.LeaveRequestModel.id == saved.id).first()

    def approve_leave(
        self, leave_id: int, requester: m.UserModel, comment: Optional[str] = None
    ) -> m.LeaveRequestModel:
        if requester.role != Role.ADMIN:
            raise PermissionDeniedError("Only admins can approve leave.")

        leave = self.repo.get_by_id(leave_id)
        if not leave:
            raise NotFoundError("Leave request")
        if leave.status != LeaveStatus.PENDING:
            raise ConflictError("Only pending leave requests can be approved.")

        leave.status = LeaveStatus.APPROVED
        leave.reviewed_by = requester.id
        leave.review_comment = comment
        self.repo.update(leave)

        # Deduct balance
        if leave.leave_type != LeaveType.UNPAID:
            year = leave.start_date.year
            balance = self.repo.get_balance(leave.employee_id, leave.leave_type, year)
            if not balance:
                raise ConflictError(f"No leave balance configured for {leave.leave_type.value} in {year}.")
            
            remaining = balance.total_days - balance.used_days
            if remaining < leave.total_days:
                from app.domain.exceptions import InsufficientLeaveBalance
                raise InsufficientLeaveBalance(leave.leave_type.value, remaining, leave.total_days)

            balance.used_days += leave.total_days
            self.repo.update_balance(balance)

        # Mark attendance range as LEAVE
        from app.application.attendance_service import AttendanceService
        att_svc = AttendanceService(self.db)
        att_svc.mark_range_as_leave(leave.employee_id, leave.start_date, leave.end_date)

        # Notify employee
        try:
            emp_obj = self.db.query(m.EmployeeModel).filter(
                m.EmployeeModel.id == leave.employee_id
            ).first()
            if emp_obj and emp_obj.user:
                from app.infrastructure.tasks import task_send_notification_and_email
                task_send_notification_and_email.delay(
                    user_id=emp_obj.user.id,
                    message=f"Your leave request for {leave.leave_type} has been APPROVED.",
                    email_subject="Leave Request Approved",
                    email_body=f"Hello {emp_obj.first_name},\n\nYour leave request for {leave.leave_type} from {leave.start_date} to {leave.end_date} has been APPROVED.\nComment: {comment or 'No comments'}"
                )
        except Exception:
            pass

        return self.db.query(m.LeaveRequestModel).filter(m.LeaveRequestModel.id == leave_id).first()

    def reject_leave(
        self, leave_id: int, requester: m.UserModel, comment: Optional[str] = None
    ) -> m.LeaveRequestModel:
        if requester.role != Role.ADMIN:
            raise PermissionDeniedError("Only admins can reject leave.")

        leave = self.repo.get_by_id(leave_id)
        if not leave:
            raise NotFoundError("Leave request")
        if leave.status != LeaveStatus.PENDING:
            raise ConflictError("Only pending leave requests can be rejected.")

        leave.status = LeaveStatus.REJECTED
        leave.reviewed_by = requester.id
        leave.review_comment = comment
        self.repo.update(leave)

        try:
            emp_obj = self.db.query(m.EmployeeModel).filter(
                m.EmployeeModel.id == leave.employee_id
            ).first()
            if emp_obj and emp_obj.user:
                from app.infrastructure.tasks import task_send_notification_and_email
                task_send_notification_and_email.delay(
                    user_id=emp_obj.user.id,
                    message=f"Your leave request for {leave.leave_type} has been REJECTED.",
                    email_subject="Leave Request Rejected",
                    email_body=f"Hello {emp_obj.first_name},\n\nYour leave request for {leave.leave_type} from {leave.start_date} to {leave.end_date} has been REJECTED.\nComment: {comment or 'No comments'}"
                )
        except Exception:
            pass

        return self.db.query(m.LeaveRequestModel).filter(m.LeaveRequestModel.id == leave_id).first()

    def get_my_leave_history(self, requester: m.UserModel) -> List[m.LeaveRequestModel]:
        emp = self._get_employee_for_user(requester)
        leaves = self.repo.get_by_employee(emp.id)
        ids = [l.id for l in leaves]
        return self.db.query(m.LeaveRequestModel).filter(m.LeaveRequestModel.id.in_(ids)).all()

    def get_my_balance(self, requester: m.UserModel) -> List[m.LeaveBalanceModel]:
        emp = self._get_employee_for_user(requester)
        year = dt.date.today().year
        return (
            self.db.query(m.LeaveBalanceModel)
            .filter(
                m.LeaveBalanceModel.employee_id == emp.id,
                m.LeaveBalanceModel.year == year,
            )
            .all()
        )

    def get_all_leaves(
        self,
        requester: m.UserModel,
        status: Optional[LeaveStatus] = None,
        employee_id: Optional[int] = None,
    ) -> List[m.LeaveRequestModel]:
        if requester.role != Role.ADMIN:
            raise PermissionDeniedError("Only admins can view all leave requests.")
        leaves = self.repo.list_all(status, employee_id)
        ids = [l.id for l in leaves]
        return self.db.query(m.LeaveRequestModel).filter(m.LeaveRequestModel.id.in_(ids)).all()
