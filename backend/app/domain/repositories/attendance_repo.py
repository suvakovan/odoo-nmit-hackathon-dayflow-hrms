from abc import ABC, abstractmethod
from typing import Optional, List
from datetime import date
from app.domain.entities.attendance import Attendance


class IAttendanceRepository(ABC):

    @abstractmethod
    def get_by_id(self, attendance_id: int) -> Optional[Attendance]: ...

    @abstractmethod
    def get_today(self, employee_id: int, today: date) -> Optional[Attendance]: ...

    @abstractmethod
    def get_by_employee(
        self,
        employee_id: int,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> List[Attendance]: ...

    @abstractmethod
    def list_all(
        self,
        employee_id: Optional[int] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> List[Attendance]: ...

    @abstractmethod
    def create(self, attendance: Attendance) -> Attendance: ...

    @abstractmethod
    def update(self, attendance: Attendance) -> Attendance: ...

    @abstractmethod
    def count_present(self, employee_id: int, year: int, month: int) -> int: ...
