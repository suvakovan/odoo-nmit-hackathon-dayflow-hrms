from abc import ABC, abstractmethod
from typing import Optional, List
from datetime import date
from app.domain.entities.payroll import SalaryStructure


class IPayrollRepository(ABC):

    @abstractmethod
    def get_active_structure(self, employee_id: int) -> Optional[SalaryStructure]: ...

    @abstractmethod
    def get_all_structures(self, employee_id: int) -> List[SalaryStructure]: ...

    @abstractmethod
    def get_all_active(self) -> List[SalaryStructure]: ...

    @abstractmethod
    def deactivate_current(self, employee_id: int) -> None: ...

    @abstractmethod
    def create(self, structure: SalaryStructure) -> SalaryStructure: ...
