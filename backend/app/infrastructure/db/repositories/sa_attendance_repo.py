from typing import Optional, List
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import extract

from app.domain.entities.attendance import Attendance
from app.domain.repositories.attendance_repo import IAttendanceRepository
from app.domain.enums import AttendanceStatus
from app.infrastructure.db import models as m


class SAAttendanceRepository(IAttendanceRepository):
    def __init__(self, db: Session):
        self.db = db

    def _to_entity(self, obj: m.AttendanceModel) -> Attendance:
        return Attendance(
            id=obj.id,
            employee_id=obj.employee_id,
            date=obj.date,
            check_in=obj.check_in,
            check_out=obj.check_out,
            status=obj.status,
            flagged=obj.flagged,
        )

    def get_by_id(self, attendance_id: int) -> Optional[Attendance]:
        obj = self.db.query(m.AttendanceModel).filter(m.AttendanceModel.id == attendance_id).first()
        return self._to_entity(obj) if obj else None

    def get_today(self, employee_id: int, today: date) -> Optional[Attendance]:
        obj = (
            self.db.query(m.AttendanceModel)
            .filter(
                m.AttendanceModel.employee_id == employee_id,
                m.AttendanceModel.date == today,
            )
            .first()
        )
        return self._to_entity(obj) if obj else None

    def get_by_employee(
        self,
        employee_id: int,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> List[Attendance]:
        q = self.db.query(m.AttendanceModel).filter(
            m.AttendanceModel.employee_id == employee_id
        )
        if date_from:
            q = q.filter(m.AttendanceModel.date >= date_from)
        if date_to:
            q = q.filter(m.AttendanceModel.date <= date_to)
        return [self._to_entity(o) for o in q.order_by(m.AttendanceModel.date.desc()).all()]

    def list_all(
        self,
        employee_id: Optional[int] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> List[Attendance]:
        q = self.db.query(m.AttendanceModel)
        if employee_id:
            q = q.filter(m.AttendanceModel.employee_id == employee_id)
        if date_from:
            q = q.filter(m.AttendanceModel.date >= date_from)
        if date_to:
            q = q.filter(m.AttendanceModel.date <= date_to)
        return [self._to_entity(o) for o in q.order_by(m.AttendanceModel.date.desc()).all()]

    def create(self, attendance: Attendance) -> Attendance:
        obj = m.AttendanceModel(
            employee_id=attendance.employee_id,
            date=attendance.date,
            check_in=attendance.check_in,
            check_out=attendance.check_out,
            status=attendance.status,
            flagged=attendance.flagged,
        )
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return self._to_entity(obj)

    def update(self, attendance: Attendance) -> Attendance:
        obj = self.db.query(m.AttendanceModel).filter(m.AttendanceModel.id == attendance.id).first()
        obj.check_in = attendance.check_in
        obj.check_out = attendance.check_out
        obj.status = attendance.status
        obj.flagged = attendance.flagged
        self.db.commit()
        self.db.refresh(obj)
        return self._to_entity(obj)

    def count_present(self, employee_id: int, year: int, month: int) -> int:
        return (
            self.db.query(m.AttendanceModel)
            .filter(
                m.AttendanceModel.employee_id == employee_id,
                extract("year", m.AttendanceModel.date) == year,
                extract("month", m.AttendanceModel.date) == month,
                m.AttendanceModel.status.in_([AttendanceStatus.PRESENT, AttendanceStatus.HALF_DAY]),
            )
            .count()
        )
