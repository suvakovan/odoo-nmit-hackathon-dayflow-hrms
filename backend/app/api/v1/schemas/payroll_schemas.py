from datetime import date
from decimal import Decimal
from typing import Optional, Dict
from pydantic import BaseModel


class SalaryStructureRequest(BaseModel):
    basic: Decimal
    hra: Decimal = Decimal("0")
    allowances: Dict[str, float] = {}
    deductions: Dict[str, float] = {}
    effective_from: Optional[date] = None


class SalaryStructureResponse(BaseModel):
    id: int
    employee_id: int
    basic: Decimal
    hra: Decimal
    allowances: Dict[str, float]
    deductions: Dict[str, float]
    effective_from: date
    is_active: bool
    net_salary: Decimal

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_net(cls, obj) -> "SalaryStructureResponse":
        total_allowances = sum((obj.allowances or {}).values())
        total_deductions = sum((obj.deductions or {}).values())
        net = Decimal(str(obj.basic)) + Decimal(str(obj.hra)) + Decimal(str(total_allowances)) - Decimal(str(total_deductions))
        return cls(
            id=obj.id,
            employee_id=obj.employee_id,
            basic=Decimal(str(obj.basic)),
            hra=Decimal(str(obj.hra)),
            allowances=obj.allowances or {},
            deductions=obj.deductions or {},
            effective_from=obj.effective_from,
            is_active=obj.is_active,
            net_salary=net,
        )
