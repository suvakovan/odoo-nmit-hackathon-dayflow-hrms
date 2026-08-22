from dataclasses import dataclass
from typing import Optional
from datetime import date, datetime
from app.domain.enums import AttendanceStatus
from app.domain.exceptions import (
    AlreadyCheckedIn,
    NotCheckedIn,
    AlreadyCheckedOut,
    InvalidCheckoutTime,
)

HALF_DAY_THRESHOLD_HOURS: float = 4.5


@dataclass
class Attendance:
    id: Optional[int]
    employee_id: int
    date: date
    check_in: Optional[datetime]
    check_out: Optional[datetime]
    status: AttendanceStatus

    @property
    def working_hours(self) -> Optional[float]:
        """Returns total working hours if both check_in and check_out are set."""
        if self.check_in and self.check_out:
            delta = self.check_out - self.check_in
            return round(delta.total_seconds() / 3600, 2)
        return None

    def validate_check_in(self) -> None:
        """Business rule: cannot check in twice on the same date."""
        if self.check_in is not None:
            raise AlreadyCheckedIn()

    def validate_check_out(self, proposed_check_out: datetime) -> None:
        """Business rules: must be checked in; cannot check out before check in; not already checked out."""
        if self.check_in is None:
            raise NotCheckedIn()
        if self.check_out is not None:
            raise AlreadyCheckedOut()
        if proposed_check_out < self.check_in:
            raise InvalidCheckoutTime()

    def compute_status_after_checkout(self, check_out: datetime) -> AttendanceStatus:
        """After checkout, determine if this is a full day or half day."""
        delta_hours = (check_out - self.check_in).total_seconds() / 3600
        if delta_hours < HALF_DAY_THRESHOLD_HOURS:
            return AttendanceStatus.HALF_DAY
        return AttendanceStatus.PRESENT
