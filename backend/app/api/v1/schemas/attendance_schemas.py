from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel
from app.domain.enums import AttendanceStatus


class AttendanceResponse(BaseModel):
    id: int
    employee_id: int
    date: date
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    status: AttendanceStatus
    working_hours: Optional[float] = None
    flagged: bool = False

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_hours(cls, obj) -> "AttendanceResponse":
        hours = None
        if obj.check_in and obj.check_out:
            delta = obj.check_out - obj.check_in
            hours = round(delta.total_seconds() / 3600, 2)
        return cls(
            id=obj.id,
            employee_id=obj.employee_id,
            date=obj.date,
            check_in=obj.check_in,
            check_out=obj.check_out,
            status=obj.status,
            working_hours=hours,
            flagged=obj.flagged,
        )


class AttendanceCorrectRequest(BaseModel):
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None

