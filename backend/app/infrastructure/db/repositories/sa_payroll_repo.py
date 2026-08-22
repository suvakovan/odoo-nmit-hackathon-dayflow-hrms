from typing import Optional, List
from decimal import Decimal
from sqlalchemy.orm import Session

from app.domain.entities.payroll import SalaryStructure
from app.domain.repositories.payroll_repo import IPayrollRepository
from app.infrastructure.db import models as m


class SAPayrollRepository(IPayrollRepository):
    def __init__(self, db: Session):
        self.db = db

    def _to_entity(self, obj: m.SalaryStructureModel) -> SalaryStructure:
        return SalaryStructure(
            id=obj.id,
            employee_id=obj.employee_id,
            basic=Decimal(str(obj.basic)),
            hra=Decimal(str(obj.hra)),
            allowances=obj.allowances or {},
            deductions=obj.deductions or {},
            effective_from=obj.effective_from,
            is_active=obj.is_active,
        )

    def get_active_structure(self, employee_id: int) -> Optional[SalaryStructure]:
        obj = (
            self.db.query(m.SalaryStructureModel)
            .filter(
                m.SalaryStructureModel.employee_id == employee_id,
                m.SalaryStructureModel.is_active == True,
            )
            .first()
        )
        return self._to_entity(obj) if obj else None

    def get_all_structures(self, employee_id: int) -> List[SalaryStructure]:
        objs = (
            self.db.query(m.SalaryStructureModel)
            .filter(m.SalaryStructureModel.employee_id == employee_id)
            .order_by(m.SalaryStructureModel.effective_from.desc())
            .all()
        )
        return [self._to_entity(o) for o in objs]

    def get_all_active(self) -> List[SalaryStructure]:
        objs = (
            self.db.query(m.SalaryStructureModel)
            .filter(m.SalaryStructureModel.is_active == True)
            .all()
        )
        return [self._to_entity(o) for o in objs]

    def deactivate_current(self, employee_id: int) -> None:
        self.db.query(m.SalaryStructureModel).filter(
            m.SalaryStructureModel.employee_id == employee_id,
            m.SalaryStructureModel.is_active == True,
        ).update({"is_active": False})
        self.db.commit()

    def create(self, structure: SalaryStructure) -> SalaryStructure:
        obj = m.SalaryStructureModel(
            employee_id=structure.employee_id,
            basic=structure.basic,
            hra=structure.hra,
            allowances=structure.allowances,
            deductions=structure.deductions,
            effective_from=structure.effective_from,
            is_active=structure.is_active,
        )
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return self._to_entity(obj)
