from abc import ABC, abstractmethod
from typing import Optional, List
from app.domain.entities.employee import Employee


class IEmployeeRepository(ABC):

    @abstractmethod
    def get_by_id(self, employee_id: int) -> Optional[Employee]: ...

    @abstractmethod
    def get_by_user_id(self, user_id: int) -> Optional[Employee]: ...

    @abstractmethod
    def get_by_code(self, employee_code: str) -> Optional[Employee]: ...

    @abstractmethod
    def list_all(self, search: Optional[str] = None) -> List[Employee]: ...

    @abstractmethod
    def create(self, employee: Employee) -> Employee: ...

    @abstractmethod
    def update(self, employee: Employee) -> Employee: ...

    @abstractmethod
    def delete(self, employee_id: int) -> None: ...
