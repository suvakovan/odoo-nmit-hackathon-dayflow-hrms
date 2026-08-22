from dataclasses import dataclass
from typing import Optional
from datetime import date
from app.domain.enums import LeaveType, LeaveStatus
from app.domain.exceptions import InvalidLeaveDates


@dataclass
class Leave:
    id: Optional[int]
    employee_id: int
    leave_type: LeaveType
    start_date: date
    end_date: date
    remarks: Optional[str]
    status: LeaveStatus
    reviewed_by: Optional[int]
    review_comment: Optional[str]

    def validate_dates(self) -> None:
        """Business rule: end_date must be >= start_date."""
        if self.end_date < self.start_date:
            raise InvalidLeaveDates()

    @property
    def total_days(self) -> int:
        """Calculates the number of leave days (inclusive)."""
        return (self.end_date - self.start_date).days + 1

    def overlaps_with(self, other_start: date, other_end: date) -> bool:
        """Returns True if this leave request overlaps with the given date range."""
        return not (self.end_date < other_start or self.start_date > other_end)


@dataclass
class LeaveBalance:
    id: Optional[int]
    employee_id: int
    leave_type: LeaveType
    year: int
    total_days: int
    used_days: int

    @property
    def remaining_days(self) -> int:
        return self.total_days - self.used_days

    def can_take_leave(self, days: int) -> bool:
        """UNPAID leave always allowed; PAID/SICK checked against balance."""
        return self.remaining_days >= days
