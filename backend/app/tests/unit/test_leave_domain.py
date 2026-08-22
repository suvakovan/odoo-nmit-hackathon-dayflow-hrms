import pytest
from datetime import date, timedelta
from app.domain.entities.leave import Leave, LeaveBalance
from app.domain.enums import LeaveType, LeaveStatus
from app.domain.exceptions import InvalidLeaveDates, InsufficientLeaveBalance


class TestLeaveEntity:
    def test_validate_dates_valid(self):
        leave = Leave(
            id=None, employee_id=1, leave_type=LeaveType.PAID,
            start_date=date(2024, 3, 1), end_date=date(2024, 3, 5),
            remarks=None, status=LeaveStatus.PENDING,
            reviewed_by=None, review_comment=None,
        )
        leave.validate_dates()  # should not raise

    def test_validate_dates_invalid(self):
        leave = Leave(
            id=None, employee_id=1, leave_type=LeaveType.PAID,
            start_date=date(2024, 3, 5), end_date=date(2024, 3, 1),
            remarks=None, status=LeaveStatus.PENDING,
            reviewed_by=None, review_comment=None,
        )
        with pytest.raises(InvalidLeaveDates):
            leave.validate_dates()

    def test_total_days(self):
        leave = Leave(
            id=None, employee_id=1, leave_type=LeaveType.PAID,
            start_date=date(2024, 3, 1), end_date=date(2024, 3, 5),
            remarks=None, status=LeaveStatus.PENDING,
            reviewed_by=None, review_comment=None,
        )
        assert leave.total_days == 5

    def test_single_day_leave(self):
        leave = Leave(
            id=None, employee_id=1, leave_type=LeaveType.SICK,
            start_date=date(2024, 3, 1), end_date=date(2024, 3, 1),
            remarks=None, status=LeaveStatus.PENDING,
            reviewed_by=None, review_comment=None,
        )
        assert leave.total_days == 1

    def test_overlaps_with_true(self):
        leave = Leave(
            id=1, employee_id=1, leave_type=LeaveType.PAID,
            start_date=date(2024, 3, 1), end_date=date(2024, 3, 10),
            remarks=None, status=LeaveStatus.PENDING,
            reviewed_by=None, review_comment=None,
        )
        assert leave.overlaps_with(date(2024, 3, 5), date(2024, 3, 15)) is True

    def test_overlaps_with_false(self):
        leave = Leave(
            id=1, employee_id=1, leave_type=LeaveType.PAID,
            start_date=date(2024, 3, 1), end_date=date(2024, 3, 5),
            remarks=None, status=LeaveStatus.PENDING,
            reviewed_by=None, review_comment=None,
        )
        assert leave.overlaps_with(date(2024, 3, 6), date(2024, 3, 10)) is False


class TestLeaveBalance:
    def test_remaining_days(self):
        balance = LeaveBalance(
            id=1, employee_id=1, leave_type=LeaveType.PAID,
            year=2024, total_days=12, used_days=3,
        )
        assert balance.remaining_days == 9

    def test_can_take_leave_sufficient(self):
        balance = LeaveBalance(
            id=1, employee_id=1, leave_type=LeaveType.PAID,
            year=2024, total_days=12, used_days=3,
        )
        assert balance.can_take_leave(5) is True

    def test_can_take_leave_insufficient(self):
        balance = LeaveBalance(
            id=1, employee_id=1, leave_type=LeaveType.PAID,
            year=2024, total_days=12, used_days=10,
        )
        assert balance.can_take_leave(5) is False

    def test_can_take_leave_exactly_remaining(self):
        balance = LeaveBalance(
            id=1, employee_id=1, leave_type=LeaveType.PAID,
            year=2024, total_days=12, used_days=7,
        )
        assert balance.can_take_leave(5) is True
