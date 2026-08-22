from datetime import date
from typing import Optional, List
from pydantic import BaseModel, EmailStr


class EmployeeResponse(BaseModel):
    id: int
    user_id: int
    employee_code: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    manager_id: Optional[int] = None
    joining_date: date
    profile_picture_url: Optional[str] = None

    model_config = {"from_attributes": True}


class EmployeeListResponse(BaseModel):
    employees: List[EmployeeResponse]
    total: int


class EmployeeUpdateRequest(BaseModel):
    """Fields that an EMPLOYEE can self-update."""
    phone: Optional[str] = None
    address: Optional[str] = None
    profile_picture_url: Optional[str] = None


class AdminEmployeeUpdateRequest(BaseModel):
    """All fields that an ADMIN can update."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    manager_id: Optional[int] = None
    joining_date: Optional[date] = None
    profile_picture_url: Optional[str] = None


class DocumentResponse(BaseModel):
    id: int
    employee_id: int
    file_url: str
    doc_type: Optional[str] = None

    model_config = {"from_attributes": True}
