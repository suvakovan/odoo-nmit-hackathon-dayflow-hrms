from datetime import date
from typing import Optional
from pydantic import BaseModel, model_validator
from app.domain.enums import LeaveType, LeaveStatus


class LeaveApplyRequest(BaseModel):
    leave_type: LeaveType
    start_date: date
    end_date: date
    remarks: Optional[str] = None

    @model_validator(mode="after")
    def check_dates(self) -> "LeaveApplyRequest":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date.")
        return self


class LeaveReviewRequest(BaseModel):
    comment: Optional[str] = None


class LeaveResponse(BaseModel):
    id: int
    employee_id: int
    leave_type: LeaveType
    start_date: date
    end_date: date
    remarks: Optional[str] = None
    status: LeaveStatus
    reviewed_by: Optional[int] = None
    review_comment: Optional[str] = None
    total_days: int = 0

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_days(cls, obj) -> "LeaveResponse":
        return cls(
            id=obj.id,
            employee_id=obj.employee_id,
            leave_type=obj.leave_type,
            start_date=obj.start_date,
            end_date=obj.end_date,
            remarks=obj.remarks,
            status=obj.status,
            reviewed_by=obj.reviewed_by,
            review_comment=obj.review_comment,
            total_days=(obj.end_date - obj.start_date).days + 1,
        )


class LeaveBalanceResponse(BaseModel):
    id: int
    leave_type: LeaveType
    year: int
    total_days: int
    used_days: int
    remaining_days: int

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm(cls, obj) -> "LeaveBalanceResponse":
        return cls(
            id=obj.id,
            leave_type=obj.leave_type,
            year=obj.year,
            total_days=obj.total_days,
            used_days=obj.used_days,
            remaining_days=obj.total_days - obj.used_days,
        )
