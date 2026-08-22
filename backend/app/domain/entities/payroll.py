from dataclasses import dataclass, field
from typing import Optional, Dict
from datetime import date
from decimal import Decimal


@dataclass
class SalaryStructure:
    id: Optional[int]
    employee_id: int
    basic: Decimal
    hra: Decimal
    allowances: Dict[str, float]   # e.g. {"transport": 2000, "medical": 1000}
    deductions: Dict[str, float]   # e.g. {"pf": 1800, "tax": 3000}
    effective_from: date
    is_active: bool

    @property
    def total_allowances(self) -> Decimal:
        return Decimal(str(sum(self.allowances.values())))

    @property
    def total_deductions(self) -> Decimal:
        return Decimal(str(sum(self.deductions.values())))

    @property
    def gross_salary(self) -> Decimal:
        return self.basic + self.hra + self.total_allowances

    @property
    def net_salary(self) -> Decimal:
        """Business rule: net = basic + hra + allowances - deductions."""
        return self.gross_salary - self.total_deductions
