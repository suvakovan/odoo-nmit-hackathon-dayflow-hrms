class DayflowError(Exception):
    """Base application error."""
    pass


class AuthenticationError(DayflowError):
    """Raised when authentication fails."""
    pass


class PermissionDeniedError(DayflowError):
    """Raised when a user lacks permission for an action."""
    pass


class NotFoundError(DayflowError):
    """Raised when a requested resource does not exist."""
    def __init__(self, resource: str = "Resource"):
        super().__init__(f"{resource} not found.")
        self.resource = resource


class ConflictError(DayflowError):
    """Raised when an operation conflicts with existing state."""
    pass


class ValidationError(DayflowError):
    """Raised when input fails business validation."""
    pass
