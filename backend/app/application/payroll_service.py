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

    def get_my_salary(self, requester: m.UserModel) -> m.SalaryStructureModel:
        emp = self.db.query(m.EmployeeModel).filter(m.EmployeeModel.user_id == requester.id).first()
        if not emp:
            raise NotFoundError("Employee profile")
        structure = self.repo.get_active_structure(emp.id)
        if not structure:
            new_structure = SalaryStructure(
                id=None,
                employee_id=emp.id,
                basic=Decimal("50000.00"),
                hra=Decimal("20000.00"),
                allowances={"hand_money": 10000, "transport": 5000, "special": 5000},
                deductions={"transaction_fee": 250, "monthly_savings": 5000, "pf": 3600},
                effective_from=date.today(),
                is_active=True,
            )
            saved = self.repo.create(new_structure)
            return self.db.query(m.SalaryStructureModel).filter(
                m.SalaryStructureModel.id == saved.id
            ).first()
        return self.db.query(m.SalaryStructureModel).filter(
            m.SalaryStructureModel.id == structure.id
        ).first()

    def get_all_payroll(self, requester: m.UserModel) -> List[m.SalaryStructureModel]:
        if requester.role != Role.ADMIN:
            raise PermissionDeniedError("Only admins can view all payroll records.")
        
        # Ensure all existing employees have an active salary structure
        all_emps = self.db.query(m.EmployeeModel).all()
        for emp in all_emps:
            struct = self.repo.get_active_structure(emp.id)
            if not struct:
                new_structure = SalaryStructure(
                    id=None,
                    employee_id=emp.id,
                    basic=Decimal("50000.00"),
                    hra=Decimal("20000.00"),
                    allowances={"transport": 5000, "medical": 5000, "special": 10000},
                    deductions={"pf": 3600, "tax": 2400},
                    effective_from=date.today(),
                    is_active=True,
                )
                self.repo.create(new_structure)

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
        
        # Notify employee (non-blocking)
        try:
            emp = self.db.query(m.EmployeeModel).filter(m.EmployeeModel.id == employee_id).first()
            if emp and emp.user_id:
                from app.infrastructure.tasks import task_send_notification_and_email
                task_send_notification_and_email.delay(
                    user_id=emp.user_id,
                    message="Your salary structure has been updated by HR.",
                    email_subject="Salary Structure Updated",
                    email_body=f"Hello {emp.first_name},\n\nYour salary structure has been updated by HR. Please check your payroll dashboard for details."
                )
        except Exception:
            pass

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
            new_structure = SalaryStructure(
                id=None,
                employee_id=emp.id,
                basic=Decimal("50000.00"),
                hra=Decimal("20000.00"),
                allowances={"transport": 5000, "medical": 5000, "special": 10000},
                deductions={"pf": 3600, "tax": 2400},
                effective_from=date.today(),
                is_active=True,
            )
            saved = self.repo.create(new_structure)
            structure = saved

        from app.infrastructure.pdf.payslip_generator import generate_payslip_pdf
        pdf_bytes = generate_payslip_pdf(
            employee_name=f"{emp.first_name} {emp.last_name}",
            employee_code=emp.employee_code,
            month=month,
            basic=structure.basic,
            hra=structure.hra,
            allowances=structure.allowances,
            deductions=structure.deductions,
            net_salary=structure.net_salary,
        )
        return pdf_bytes
