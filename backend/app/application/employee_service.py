from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, PermissionDeniedError
from app.domain.enums import Role
from app.domain.entities.employee import Employee
from app.infrastructure.db import models as m
from app.infrastructure.db.repositories.sa_employee_repo import SAEmployeeRepository


class EmployeeService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = SAEmployeeRepository(db)

    def get_my_profile(self, user_id: int) -> m.EmployeeModel:
        obj = self.db.query(m.EmployeeModel).filter(m.EmployeeModel.user_id == user_id).first()
        if not obj:
            raise NotFoundError("Employee profile")
        return obj

    def get_by_id(self, employee_id: int, requester: m.UserModel) -> m.EmployeeModel:
        """Admin can view anyone; employee can only view themselves."""
        obj = self.db.query(m.EmployeeModel).filter(m.EmployeeModel.id == employee_id).first()
        if not obj:
            raise NotFoundError("Employee")
        if requester.role == Role.EMPLOYEE and obj.user_id != requester.id:
            raise PermissionDeniedError("You can only view your own profile.")
        return obj

    def list_all(
        self,
        requester: m.UserModel,
        search: Optional[str] = None,
    ) -> List[m.EmployeeModel]:
        if requester.role != Role.ADMIN:
            raise PermissionDeniedError("Only admins can list all employees.")
        entities = self.repo.list_all(search=search)
        ids = [e.id for e in entities]
        return self.db.query(m.EmployeeModel).filter(m.EmployeeModel.id.in_(ids)).all()

    def update_profile(
        self,
        employee_id: int,
        updates: Dict[str, Any],
        requester: m.UserModel,
    ) -> m.EmployeeModel:
        obj = self.db.query(m.EmployeeModel).filter(m.EmployeeModel.id == employee_id).first()
        if not obj:
            raise NotFoundError("Employee")

        # Service-level ownership/role check
        if requester.role == Role.EMPLOYEE and obj.user_id != requester.id:
            raise PermissionDeniedError("You can only update your own profile.")

        # Field-level permission check using domain entity
        domain_entity = self.repo.get_by_id(employee_id)
        for field in updates:
            if not domain_entity.can_edit_field(field, requester.role):
                raise PermissionDeniedError(f"You are not allowed to edit the field '{field}'.")

        for field, value in updates.items():
            if hasattr(obj, field):
                setattr(obj, field, value)

        self.db.commit()
        self.db.refresh(obj)
        return obj
