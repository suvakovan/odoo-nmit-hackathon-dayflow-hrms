from dataclasses import dataclass, field
from typing import Optional
from app.domain.enums import Role


@dataclass
class User:
    id: Optional[int]
    email: str
    hashed_password: str
    role: Role
    is_verified: bool = False

    def is_admin(self) -> bool:
        return self.role == Role.ADMIN

    def is_employee(self) -> bool:
        return self.role == Role.EMPLOYEE
