from typing import Optional, List
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.domain.entities.employee import Employee
from app.domain.repositories.employee_repo import IEmployeeRepository
from app.infrastructure.db import models as m


class SAEmployeeRepository(IEmployeeRepository):
    def __init__(self, db: Session):
        self.db = db

    def _to_entity(self, obj: m.EmployeeModel) -> Employee:
        return Employee(
            id=obj.id,
            user_id=obj.user_id,
            employee_code=obj.employee_code,
            first_name=obj.first_name,
            last_name=obj.last_name,
            email=obj.user.email if obj.user else "",
            phone=obj.phone,
            address=obj.address,
            manager_id=obj.manager_id,
            joining_date=obj.joining_date,
            profile_picture_url=obj.profile_picture_url,
        )

    def get_by_id(self, employee_id: int) -> Optional[Employee]:
        obj = self.db.query(m.EmployeeModel).filter(m.EmployeeModel.id == employee_id).first()
        return self._to_entity(obj) if obj else None

    def get_by_user_id(self, user_id: int) -> Optional[Employee]:
        obj = self.db.query(m.EmployeeModel).filter(m.EmployeeModel.user_id == user_id).first()
        return self._to_entity(obj) if obj else None

    def get_by_code(self, employee_code: str) -> Optional[Employee]:
        obj = self.db.query(m.EmployeeModel).filter(m.EmployeeModel.employee_code == employee_code).first()
        return self._to_entity(obj) if obj else None

    def list_all(self, search: Optional[str] = None) -> List[Employee]:
        q = self.db.query(m.EmployeeModel)
        if search:
            q = q.filter(
                or_(
                    m.EmployeeModel.first_name.ilike(f"%{search}%"),
                    m.EmployeeModel.last_name.ilike(f"%{search}%"),
                    m.EmployeeModel.employee_code.ilike(f"%{search}%"),
                )
            )
        return [self._to_entity(o) for o in q.all()]

    def create(self, employee: Employee) -> Employee:
        obj = m.EmployeeModel(
            user_id=employee.user_id,
            employee_code=employee.employee_code,
            first_name=employee.first_name,
            last_name=employee.last_name,
            phone=employee.phone,
            address=employee.address,
            manager_id=employee.manager_id,
            joining_date=employee.joining_date,
            profile_picture_url=employee.profile_picture_url,
        )
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return self._to_entity(obj)

    def update(self, employee: Employee) -> Employee:
        obj = self.db.query(m.EmployeeModel).filter(m.EmployeeModel.id == employee.id).first()
        obj.first_name = employee.first_name
        obj.last_name = employee.last_name
        obj.phone = employee.phone
        obj.address = employee.address
        obj.manager_id = employee.manager_id
        obj.joining_date = employee.joining_date
        obj.profile_picture_url = employee.profile_picture_url
        self.db.commit()
        self.db.refresh(obj)
        return self._to_entity(obj)

    def delete(self, employee_id: int) -> None:
        obj = self.db.query(m.EmployeeModel).filter(m.EmployeeModel.id == employee_id).first()
        if obj:
            self.db.delete(obj)
            self.db.commit()
