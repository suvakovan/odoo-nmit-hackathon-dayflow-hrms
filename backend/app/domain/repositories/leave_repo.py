from abc import ABC, abstractmethod
from typing import Optional, List
from datetime import date
from app.domain.entities.leave import Leave, LeaveBalance
from app.domain.enums import LeaveType, LeaveStatus


class ILeaveRepository(ABC):

    @abstractmethod
    def get_by_id(self, leave_id: int) -> Optional[Leave]: ...

    @abstractmethod
    def get_by_employee(self, employee_id: int) -> List[Leave]: ...

    @abstractmethod
    def list_all(
        self,
        status: Optional[LeaveStatus] = None,
        employee_id: Optional[int] = None,
    ) -> List[Leave]: ...

    @abstractmethod
    def get_overlapping(
        self,
        employee_id: int,
        start_date: date,
        end_date: date,
        exclude_id: Optional[int] = None,
    ) -> List[Leave]: ...

    @abstractmethod
    def create(self, leave: Leave) -> Leave: ...

    @abstractmethod
    def update(self, leave: Leave) -> Leave: ...

    # Leave Balance
    @abstractmethod
    def get_balance(
        self, employee_id: int, leave_type: LeaveType, year: int
    ) -> Optional[LeaveBalance]: ...

    @abstractmethod
    def get_all_balances(self, employee_id: int, year: int) -> List[LeaveBalance]: ...

    @abstractmethod
    def create_balance(self, balance: LeaveBalance) -> LeaveBalance: ...

    @abstractmethod
    def update_balance(self, balance: LeaveBalance) -> LeaveBalance: ...

    @abstractmethod
    def count_pending(self) -> int: ...
