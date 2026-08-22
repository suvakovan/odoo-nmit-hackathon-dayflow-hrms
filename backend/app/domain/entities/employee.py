from dataclasses import dataclass
from typing import Optional, Set
from datetime import date
from app.domain.enums import Role


@dataclass
class Employee:
    id: Optional[int]
    user_id: int
    employee_code: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str]
    address: Optional[str]
    manager_id: Optional[int]
    joining_date: date
    profile_picture_url: Optional[str]

    # Fields that an employee can edit themselves
    EMPLOYEE_EDITABLE_FIELDS: Set[str] = frozenset({"phone", "address", "profile_picture_url"})

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    def can_edit_field(self, field: str, requester_role: Role) -> bool:
        """Business rule: admins can edit anything; employees can only edit limited fields."""
        if requester_role == Role.ADMIN:
            return True
        return field in self.EMPLOYEE_EDITABLE_FIELDS
