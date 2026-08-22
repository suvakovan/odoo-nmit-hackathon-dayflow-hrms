from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.api.v1.schemas.payroll_schemas import SalaryStructureRequest, SalaryStructureResponse
from app.application.payroll_service import PayrollService
from app.core.dependencies import get_current_user, require_role
from app.core.exceptions import NotFoundError, PermissionDeniedError
from app.domain.enums import Role
from app.infrastructure.db.session import get_db
from app.infrastructure.db import models as m

router = APIRouter(prefix="/payroll", tags=["Payroll"])


@router.get("/me", response_model=Optional[SalaryStructureResponse])
def my_salary(
    current_user: m.UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = PayrollService(db)
    try:
        obj = svc.get_my_salary(current_user)
        if not obj:
            return None
        return SalaryStructureResponse.from_orm_with_net(obj)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/me/slip/{month}")
def download_payslip(
    month: str,  # format: YYYY-MM
    current_user: m.UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = PayrollService(db)
    try:
        pdf_bytes = svc.generate_payslip(current_user, month)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=payslip-{month}.pdf"},
    )


@router.get("/", response_model=List[SalaryStructureResponse])
def all_payroll(
    current_user: m.UserModel = Depends(require_role(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    svc = PayrollService(db)
    try:
        objs = svc.get_all_payroll(current_user)
        return [SalaryStructureResponse.from_orm_with_net(o) for o in objs]
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.put("/{employee_id}", response_model=SalaryStructureResponse)
def update_salary(
    employee_id: int,
    payload: SalaryStructureRequest,
    current_user: m.UserModel = Depends(require_role(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    svc = PayrollService(db)
    try:
        obj = svc.update_salary(
            employee_id,
            current_user,
            payload.basic,
            payload.hra,
            payload.allowances,
            payload.deductions,
            payload.effective_from,
        )
        return SalaryStructureResponse.from_orm_with_net(obj)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/{employee_id}/slip/{month}")
def download_employee_payslip(
    employee_id: int,
    month: str,  # format: YYYY-MM
    current_user: m.UserModel = Depends(require_role(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    svc = PayrollService(db)
    try:
        emp = db.query(m.EmployeeModel).filter(m.EmployeeModel.id == employee_id).first()
        if not emp or not emp.user_id:
            raise NotFoundError("Employee profile or associated user account")
        user_obj = db.query(m.UserModel).filter(m.UserModel.id == emp.user_id).first()
        if not user_obj:
            raise NotFoundError("Employee user")
        pdf_bytes = svc.generate_payslip(user_obj, month)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=payslip-{employee_id}-{month}.pdf"},
    )

