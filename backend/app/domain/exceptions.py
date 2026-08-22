class DomainError(Exception):
    """Base class for all domain-level errors."""
    pass


class InsufficientLeaveBalance(DomainError):
    """Employee does not have enough leave balance."""
    def __init__(self, leave_type: str, available: int, requested: int):
        super().__init__(
            f"Insufficient {leave_type} leave balance. "
            f"Available: {available} day(s), requested: {requested} day(s)."
        )


class OverlappingLeaveRequest(DomainError):
    """An active leave request already exists for the date range."""
    def __init__(self):
        super().__init__("A leave request already exists that overlaps with the requested dates.")


class InvalidLeaveDates(DomainError):
    """Leave end_date is before start_date."""
    def __init__(self):
        super().__init__("Leave end date must be on or after the start date.")


class AlreadyCheckedIn(DomainError):
    """Employee has already checked in today."""
    def __init__(self):
        super().__init__("Already checked in for today.")


class NotCheckedIn(DomainError):
    """Employee has not checked in yet."""
    def __init__(self):
        super().__init__("No check-in record found for today.")


class AlreadyCheckedOut(DomainError):
    """Employee has already checked out today."""
    def __init__(self):
        super().__init__("Already checked out for today.")


class InvalidCheckoutTime(DomainError):
    """Check-out time is before check-in time."""
    def __init__(self):
        super().__init__("Check-out time cannot be before check-in time.")


class MultipleSalaryStructures(DomainError):
    """Cannot have two active salary structures simultaneously."""
    def __init__(self):
        super().__init__("An active salary structure already exists. It will be deactivated before creating a new one.")
