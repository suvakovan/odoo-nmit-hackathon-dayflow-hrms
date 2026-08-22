import pytest
from datetime import date, datetime, timezone
from app.domain.entities.attendance import Attendance, HALF_DAY_THRESHOLD_HOURS
from app.domain.enums import AttendanceStatus
from app.domain.exceptions import AlreadyCheckedIn, NotCheckedIn, AlreadyCheckedOut, InvalidCheckoutTime


class TestAttendanceEntity:
    def _make(self, check_in=None, check_out=None) -> Attendance:
        return Attendance(
            id=1, employee_id=1, date=date.today(),
            check_in=check_in, check_out=check_out,
            status=AttendanceStatus.PRESENT,
        )

    def test_working_hours_none_when_no_checkout(self):
        att = self._make(check_in=datetime(2024, 3, 1, 9, 0, tzinfo=timezone.utc))
        assert att.working_hours is None

    def test_working_hours_calculated(self):
        att = self._make(
            check_in=datetime(2024, 3, 1, 9, 0, tzinfo=timezone.utc),
            check_out=datetime(2024, 3, 1, 17, 0, tzinfo=timezone.utc),
        )
        assert att.working_hours == 8.0

    def test_validate_check_in_raises_when_already_checked_in(self):
        att = self._make(check_in=datetime(2024, 3, 1, 9, 0, tzinfo=timezone.utc))
        with pytest.raises(AlreadyCheckedIn):
            att.validate_check_in()

    def test_validate_check_in_ok_when_no_record(self):
        att = self._make()
        att.validate_check_in()  # should not raise

    def test_validate_check_out_raises_when_not_checked_in(self):
        att = self._make()
        with pytest.raises(NotCheckedIn):
            att.validate_check_out(datetime.now(timezone.utc))

    def test_validate_check_out_raises_when_already_checked_out(self):
        att = self._make(
            check_in=datetime(2024, 3, 1, 9, 0, tzinfo=timezone.utc),
            check_out=datetime(2024, 3, 1, 17, 0, tzinfo=timezone.utc),
        )
        with pytest.raises(AlreadyCheckedOut):
            att.validate_check_out(datetime(2024, 3, 1, 18, 0, tzinfo=timezone.utc))

    def test_validate_check_out_raises_when_before_check_in(self):
        att = self._make(check_in=datetime(2024, 3, 1, 9, 0, tzinfo=timezone.utc))
        with pytest.raises(InvalidCheckoutTime):
            att.validate_check_out(datetime(2024, 3, 1, 8, 0, tzinfo=timezone.utc))

    def test_compute_status_full_day(self):
        att = self._make(check_in=datetime(2024, 3, 1, 9, 0, tzinfo=timezone.utc))
        checkout = datetime(2024, 3, 1, 18, 0, tzinfo=timezone.utc)
        status = att.compute_status_after_checkout(checkout)
        assert status == AttendanceStatus.PRESENT

    def test_compute_status_half_day(self):
        att = self._make(check_in=datetime(2024, 3, 1, 9, 0, tzinfo=timezone.utc))
        checkout = datetime(2024, 3, 1, 12, 0, tzinfo=timezone.utc)  # only 3 hours
        status = att.compute_status_after_checkout(checkout)
        assert status == AttendanceStatus.HALF_DAY
