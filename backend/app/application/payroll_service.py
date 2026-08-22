from typing import Optional, List
from datetime import date
from decimal import Decimal
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, PermissionDeniedError
from app.domain.enums import Role
from app.domain.entities.payroll import SalaryStructure
from app.infrastructure.db import models as m
from app.infrastructure.db.repositories.sa_payroll_repo import SAPayrollRepository


class PayrollService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = SAPayrollRepository(db)

    def _get_employee(self, employee_id: int) -> m.EmployeeModel:
        obj = self.db.query(m.EmployeeModel).filter(m.EmployeeModel.id == employee_id).first()
        if not obj:
            raise NotFoundError("Employee")
        return obj

    def get_my_salary(self, requester: m.UserModel) -> Optional[m.SalaryStructureModel]:
        emp = self.db.query(m.EmployeeModel).filter(m.EmployeeModel.user_id == requester.id).first()
        if not emp:
            raise NotFoundError("Employee profile")
        structure = self.repo.get_active_structure(emp.id)
        if not structure:
            return None
        return self.db.query(m.SalaryStructureModel).filter(
            m.SalaryStructureModel.id == structure.id
        ).first()

    def get_all_payroll(self, requester: m.UserModel) -> List[m.SalaryStructureModel]:
        if requester.role != Role.ADMIN:
            raise PermissionDeniedError("Only admins can view all payroll records.")
        structures = self.repo.get_all_active()
        ids = [s.id for s in structures]
        return self.db.query(m.SalaryStructureModel).filter(m.SalaryStructureModel.id.in_(ids)).all()

    def update_salary(
        self,
        employee_id: int,
        requester: m.UserModel,
        basic: Decimal,
        hra: Decimal,
        allowances: dict,
        deductions: dict,
        effective_from: Optional[date] = None,
    ) -> m.SalaryStructureModel:
        if requester.role != Role.ADMIN:
            raise PermissionDeniedError("Only admins can update salary structures.")

        self._get_employee(employee_id)  # validates existence

        # Versioned update: deactivate current, insert new
        self.repo.deactivate_current(employee_id)

        new_structure = SalaryStructure(
            id=None,
            employee_id=employee_id,
            basic=basic,
            hra=hra,
            allowances=allowances,
            deductions=deductions,
            effective_from=effective_from or date.today(),
            is_active=True,
        )
        saved = self.repo.create(new_structure)
        return self.db.query(m.SalaryStructureModel).filter(
            m.SalaryStructureModel.id == saved.id
        ).first()

    def generate_payslip(self, requester: m.UserModel, month: str) -> bytes:
        """Generate a PDF payslip for the given month (format: YYYY-MM)."""
        emp = self.db.query(m.EmployeeModel).filter(m.EmployeeModel.user_id == requester.id).first()
        if not emp:
            raise NotFoundError("Employee profile")

        structure = self.repo.get_active_structure(emp.id)
        if not structure:
            raise NotFoundError("Salary structure")

        from app.infrastructure.pdf.payslip_generator import generate_payslip_pdf
        pdf_bytes = generate_payslip_pdf(
            employee_name=f"{emp.first_name} {emp.last_name}",
            employee_code=emp.employee_code,
            department=emp.department,
            designation=emp.designation,
            month=month,
            basic=structure.basic,
            hra=structure.hra,
            allowances=structure.allowances,
            deductions=structure.deductions,
            net_salary=structure.net_salary,
        )
        return pdf_bytes
