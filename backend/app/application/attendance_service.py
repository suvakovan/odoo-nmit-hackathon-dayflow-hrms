from typing import Optional, List
from datetime import date, datetime, timezone
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, PermissionDeniedError, ConflictError
from app.domain.enums import Role, AttendanceStatus
from app.domain.entities.attendance import Attendance
from app.infrastructure.db import models as m
from app.infrastructure.db.repositories.sa_attendance_repo import SAAttendanceRepository


class AttendanceService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = SAAttendanceRepository(db)

    def _get_employee_for_user(self, user: m.UserModel) -> m.EmployeeModel:
        emp = self.db.query(m.EmployeeModel).filter(m.EmployeeModel.user_id == user.id).first()
        if not emp:
            raise NotFoundError("Employee profile")
        return emp

    def check_in(self, requester: m.UserModel) -> m.AttendanceModel:
        emp = self._get_employee_for_user(requester)
        today = date.today()

        existing = self.repo.get_today(emp.id, today)
        if existing:
            domain_obj = existing
            # Create domain entity to validate
            from app.domain.entities.attendance import Attendance as AE
            ae = AE(
                id=existing.id, employee_id=existing.employee_id, date=existing.date,
                check_in=existing.check_in, check_out=existing.check_out, status=existing.status
            )
            ae.validate_check_in()  # raises AlreadyCheckedIn

        now = datetime.now(timezone.utc)
        new_record = Attendance(
            id=None,
            employee_id=emp.id,
            date=today,
            check_in=now,
            check_out=None,
            status=AttendanceStatus.PRESENT,
        )
        saved = self.repo.create(new_record)

        return self.db.query(m.AttendanceModel).filter(m.AttendanceModel.id == saved.id).first()

    def check_out(self, requester: m.UserModel) -> m.AttendanceModel:
        emp = self._get_employee_for_user(requester)
        today = date.today()

        existing = self.repo.get_today(emp.id, today)
        if not existing:
            raise NotFoundError("Today's attendance record")

        from app.domain.entities.attendance import Attendance as AE
        ae = AE(
            id=existing.id, employee_id=existing.employee_id, date=existing.date,
            check_in=existing.check_in, check_out=existing.check_out, status=existing.status
        )
        now = datetime.now(timezone.utc)
        ae.validate_check_out(now)  # raises NotCheckedIn, AlreadyCheckedOut, or InvalidCheckoutTime

        new_status = ae.compute_status_after_checkout(now)
        updated = Attendance(
            id=existing.id,
            employee_id=existing.employee_id,
            date=existing.date,
            check_in=existing.check_in,
            check_out=now,
            status=new_status,
        )
        saved = self.repo.update(updated)

        return self.db.query(m.AttendanceModel).filter(m.AttendanceModel.id == saved.id).first()

    def get_my_attendance(
        self,
        requester: m.UserModel,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> List[m.AttendanceModel]:
        emp = self._get_employee_for_user(requester)
        records = self.repo.get_by_employee(emp.id, date_from, date_to)
        ids = [r.id for r in records]
        return self.db.query(m.AttendanceModel).filter(m.AttendanceModel.id.in_(ids)).all()

    def get_all(
        self,
        requester: m.UserModel,
        employee_id: Optional[int] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> List[m.AttendanceModel]:
        # Service-level guard
        if requester.role != Role.ADMIN:
            raise PermissionDeniedError("Only admins can view all attendance records.")
        records = self.repo.list_all(employee_id, date_from, date_to)
        ids = [r.id for r in records]
        return self.db.query(m.AttendanceModel).filter(m.AttendanceModel.id.in_(ids)).all()

    def mark_range_as_leave(self, employee_id: int, start: date, end: date) -> None:
        """Mark all dates in range as LEAVE status (called on leave approval)."""
        from datetime import timedelta
        current = start
        while current <= end:
            existing = self.repo.get_today(employee_id, current)
            if existing:
                domain = Attendance(
                    id=existing.id, employee_id=existing.employee_id, date=existing.date,
                    check_in=existing.check_in, check_out=existing.check_out,
                    status=AttendanceStatus.LEAVE,
                )
                self.repo.update(domain)
            else:
                self.repo.create(Attendance(
                    id=None, employee_id=employee_id, date=current,
                    check_in=None, check_out=None, status=AttendanceStatus.LEAVE,
                ))
            current += timedelta(days=1)

    def get_flagged(self, requester: m.UserModel) -> List[m.AttendanceModel]:
        if requester.role != Role.ADMIN:
            raise PermissionDeniedError("Only admins can view flagged attendance records.")
        return self.db.query(m.AttendanceModel).filter(m.AttendanceModel.flagged == True).all()

    def correct_time(
        self,
        requester: m.UserModel,
        attendance_id: int,
        check_in: Optional[datetime],
        check_out: Optional[datetime]
    ) -> m.AttendanceModel:
        if requester.role != Role.ADMIN:
            raise PermissionDeniedError("Only admins can correct attendance records.")
        
        record = self.db.query(m.AttendanceModel).filter(m.AttendanceModel.id == attendance_id).first()
        if not record:
            raise NotFoundError("Attendance record")
            
        record.check_in = check_in
        record.check_out = check_out
        
        # Calculate status
        if check_in and check_out:
            delta_hours = (check_out - check_in).total_seconds() / 3600
            if delta_hours < 4.5:
                record.status = AttendanceStatus.HALF_DAY
            else:
                record.status = AttendanceStatus.PRESENT
        else:
            record.status = AttendanceStatus.PRESENT

        record.flagged = False
        self.db.commit()
        self.db.refresh(record)
        return record

