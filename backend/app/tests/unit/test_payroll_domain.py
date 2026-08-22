import pytest
from decimal import Decimal
from datetime import date
from app.domain.entities.payroll import SalaryStructure


class TestSalaryStructure:
    def _make(self, basic=50000, hra=10000, allowances=None, deductions=None) -> SalaryStructure:
        return SalaryStructure(
            id=1, employee_id=1,
            basic=Decimal(str(basic)),
            hra=Decimal(str(hra)),
            allowances=allowances if allowances is not None else {"transport": 2000, "medical": 1000},
            deductions=deductions if deductions is not None else {"pf": 1800, "tax": 3000},
            effective_from=date(2024, 1, 1),
            is_active=True,
        )

    def test_total_allowances(self):
        s = self._make(allowances={"transport": 2000, "medical": 1000})
        assert s.total_allowances == Decimal("3000")

    def test_total_deductions(self):
        s = self._make(deductions={"pf": 1800, "tax": 3000})
        assert s.total_deductions == Decimal("4800")

    def test_gross_salary(self):
        s = self._make(basic=50000, hra=10000, allowances={"a": 3000})
        assert s.gross_salary == Decimal("63000")

    def test_net_salary(self):
        s = self._make(
            basic=50000, hra=10000,
            allowances={"transport": 2000, "medical": 1000},
            deductions={"pf": 1800, "tax": 3000},
        )
        # 50000 + 10000 + 3000 - 4800 = 58200
        assert s.net_salary == Decimal("58200")

    def test_net_salary_no_deductions(self):
        s = self._make(basic=50000, hra=5000, allowances={"a": 2000}, deductions={})
        assert s.net_salary == Decimal("57000")

    def test_net_salary_no_allowances(self):
        s = self._make(basic=50000, hra=5000, allowances={}, deductions={"pf": 1000})
        assert s.net_salary == Decimal("54000")
