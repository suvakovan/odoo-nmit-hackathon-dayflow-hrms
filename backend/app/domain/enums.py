from enum import Enum


class Role(str, Enum):
    ADMIN = "ADMIN"
    EMPLOYEE = "EMPLOYEE"


class AttendanceStatus(str, Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
    HALF_DAY = "HALF_DAY"
    LEAVE = "LEAVE"


class LeaveType(str, Enum):
    PAID = "PAID"
    SICK = "SICK"
    UNPAID = "UNPAID"


class LeaveStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
