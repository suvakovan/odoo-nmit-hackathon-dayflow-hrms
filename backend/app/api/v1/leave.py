from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.v1.schemas.leave_schemas import (
    LeaveApplyRequest, LeaveReviewRequest, LeaveResponse, LeaveBalanceResponse
)
from app.application.leave_service import LeaveService
from app.core.dependencies import get_current_user, require_role
from app.core.exceptions import NotFoundError, PermissionDeniedError, ConflictError
from app.domain.enums import Role, LeaveStatus
from app.domain.exceptions import (
    InsufficientLeaveBalance, OverlappingLeaveRequest, InvalidLeaveDates
)
from app.infrastructure.db.session import get_db
from app.infrastructure.db import models as m

router = APIRouter(prefix="/leave", tags=["Leave"])


@router.post("/", response_model=LeaveResponse, status_code=201)
def apply_leave(
    payload: LeaveApplyRequest,
    current_user: m.UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = LeaveService(db)
    try:
        obj = svc.apply_leave(
            current_user,
            payload.leave_type,
            payload.start_date,
            payload.end_date,
            payload.remarks,
        )
        return LeaveResponse.from_orm_with_days(obj)
    except (InsufficientLeaveBalance, OverlappingLeaveRequest, InvalidLeaveDates) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ConflictError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.get("/me", response_model=List[LeaveResponse])
def my_leave_history(
    current_user: m.UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = LeaveService(db)
    return [LeaveResponse.from_orm_with_days(l) for l in svc.get_my_leave_history(current_user)]


@router.get("/balance", response_model=List[LeaveBalanceResponse])
def my_leave_balance(
    current_user: m.UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = LeaveService(db)
    balances = svc.get_my_balance(current_user)
    return [LeaveBalanceResponse.from_orm(b) for b in balances]


@router.get("/", response_model=List[LeaveResponse])
def all_leaves(
    status: Optional[LeaveStatus] = Query(None),
    employee_id: Optional[int] = Query(None),
    current_user: m.UserModel = Depends(require_role(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    svc = LeaveService(db)
    return [LeaveResponse.from_orm_with_days(l) for l in svc.get_all_leaves(current_user, status, employee_id)]


@router.patch("/{leave_id}/approve", response_model=LeaveResponse)
def approve_leave(
    leave_id: int,
    payload: LeaveReviewRequest,
    current_user: m.UserModel = Depends(require_role(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    svc = LeaveService(db)
    try:
        obj = svc.approve_leave(leave_id, current_user, payload.comment)
        return LeaveResponse.from_orm_with_days(obj)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except (PermissionDeniedError, ConflictError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{leave_id}/reject", response_model=LeaveResponse)
def reject_leave(
    leave_id: int,
    payload: LeaveReviewRequest,
    current_user: m.UserModel = Depends(require_role(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    svc = LeaveService(db)
    try:
        obj = svc.reject_leave(leave_id, current_user, payload.comment)
        return LeaveResponse.from_orm_with_days(obj)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except (PermissionDeniedError, ConflictError) as e:
        raise HTTPException(status_code=400, detail=str(e))
