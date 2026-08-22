from typing import Optional, List
from datetime import date
from sqlalchemy.orm import Session

from app.domain.entities.leave import Leave, LeaveBalance
from app.domain.repositories.leave_repo import ILeaveRepository
from app.domain.enums import LeaveType, LeaveStatus
from app.infrastructure.db import models as m


class SALeaveRepository(ILeaveRepository):
    def __init__(self, db: Session):
        self.db = db

    def _to_entity(self, obj: m.LeaveRequestModel) -> Leave:
        return Leave(
            id=obj.id,
            employee_id=obj.employee_id,
            leave_type=obj.leave_type,
            start_date=obj.start_date,
            end_date=obj.end_date,
            remarks=obj.remarks,
            status=obj.status,
            reviewed_by=obj.reviewed_by,
            review_comment=obj.review_comment,
        )

    def _balance_to_entity(self, obj: m.LeaveBalanceModel) -> LeaveBalance:
        return LeaveBalance(
            id=obj.id,
            employee_id=obj.employee_id,
            leave_type=obj.leave_type,
            year=obj.year,
            total_days=obj.total_days,
            used_days=obj.used_days,
        )

    def get_by_id(self, leave_id: int) -> Optional[Leave]:
        obj = self.db.query(m.LeaveRequestModel).filter(m.LeaveRequestModel.id == leave_id).first()
        return self._to_entity(obj) if obj else None

    def get_by_employee(self, employee_id: int) -> List[Leave]:
        objs = (
            self.db.query(m.LeaveRequestModel)
            .filter(m.LeaveRequestModel.employee_id == employee_id)
            .order_by(m.LeaveRequestModel.created_at.desc())
            .all()
        )
        return [self._to_entity(o) for o in objs]

    def list_all(
        self,
        status: Optional[LeaveStatus] = None,
        employee_id: Optional[int] = None,
    ) -> List[Leave]:
        q = self.db.query(m.LeaveRequestModel)
        if status:
            q = q.filter(m.LeaveRequestModel.status == status)
        if employee_id:
            q = q.filter(m.LeaveRequestModel.employee_id == employee_id)
        return [self._to_entity(o) for o in q.order_by(m.LeaveRequestModel.created_at.desc()).all()]

    def get_overlapping(
        self,
        employee_id: int,
        start_date: date,
        end_date: date,
        exclude_id: Optional[int] = None,
    ) -> List[Leave]:
        q = (
            self.db.query(m.LeaveRequestModel)
            .filter(
                m.LeaveRequestModel.employee_id == employee_id,
                m.LeaveRequestModel.status != LeaveStatus.REJECTED,
                m.LeaveRequestModel.start_date <= end_date,
                m.LeaveRequestModel.end_date >= start_date,
            )
        )
        if exclude_id:
            q = q.filter(m.LeaveRequestModel.id != exclude_id)
        return [self._to_entity(o) for o in q.all()]

    def create(self, leave: Leave) -> Leave:
        obj = m.LeaveRequestModel(
            employee_id=leave.employee_id,
            leave_type=leave.leave_type,
            start_date=leave.start_date,
            end_date=leave.end_date,
            remarks=leave.remarks,
            status=leave.status,
        )
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return self._to_entity(obj)

    def update(self, leave: Leave) -> Leave:
        obj = self.db.query(m.LeaveRequestModel).filter(m.LeaveRequestModel.id == leave.id).first()
        obj.status = leave.status
        obj.reviewed_by = leave.reviewed_by
        obj.review_comment = leave.review_comment
        self.db.commit()
        self.db.refresh(obj)
        return self._to_entity(obj)

    def get_balance(self, employee_id: int, leave_type: LeaveType, year: int) -> Optional[LeaveBalance]:
        obj = (
            self.db.query(m.LeaveBalanceModel)
            .filter(
                m.LeaveBalanceModel.employee_id == employee_id,
                m.LeaveBalanceModel.leave_type == leave_type,
                m.LeaveBalanceModel.year == year,
            )
            .first()
        )
        return self._balance_to_entity(obj) if obj else None

    def get_all_balances(self, employee_id: int, year: int) -> List[LeaveBalance]:
        objs = (
            self.db.query(m.LeaveBalanceModel)
            .filter(
                m.LeaveBalanceModel.employee_id == employee_id,
                m.LeaveBalanceModel.year == year,
            )
            .all()
        )
        return [self._balance_to_entity(o) for o in objs]

    def create_balance(self, balance: LeaveBalance) -> LeaveBalance:
        obj = m.LeaveBalanceModel(
            employee_id=balance.employee_id,
            leave_type=balance.leave_type,
            year=balance.year,
            total_days=balance.total_days,
            used_days=balance.used_days,
        )
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return self._balance_to_entity(obj)

    def update_balance(self, balance: LeaveBalance) -> LeaveBalance:
        obj = self.db.query(m.LeaveBalanceModel).filter(m.LeaveBalanceModel.id == balance.id).first()
        obj.used_days = balance.used_days
        obj.total_days = balance.total_days
        self.db.commit()
        self.db.refresh(obj)
        return self._balance_to_entity(obj)

    def count_pending(self) -> int:
        return (
            self.db.query(m.LeaveRequestModel)
            .filter(m.LeaveRequestModel.status == LeaveStatus.PENDING)
            .count()
        )
