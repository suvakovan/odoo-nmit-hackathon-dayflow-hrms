from typing import Optional, List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.v1.schemas.attendance_schemas import AttendanceResponse, AttendanceCorrectRequest
from app.application.attendance_service import AttendanceService
from app.core.dependencies import get_current_user, require_role
from app.core.exceptions import NotFoundError, PermissionDeniedError, ConflictError
from app.domain.enums import Role
from app.domain.exceptions import AlreadyCheckedIn, NotCheckedIn, AlreadyCheckedOut, InvalidCheckoutTime
from app.infrastructure.db.session import get_db
from app.infrastructure.db import models as m

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("/check-in", response_model=AttendanceResponse)
def check_in(
    current_user: m.UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = AttendanceService(db)
    try:
        obj = svc.check_in(current_user)
        return AttendanceResponse.from_orm_with_hours(obj)
    except AlreadyCheckedIn as e:
        raise HTTPException(status_code=409, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/check-out", response_model=AttendanceResponse)
def check_out(
    current_user: m.UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = AttendanceService(db)
    try:
        obj = svc.check_out(current_user)
        return AttendanceResponse.from_orm_with_hours(obj)
    except (NotCheckedIn, AlreadyCheckedOut, InvalidCheckoutTime) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/me", response_model=List[AttendanceResponse])
def my_attendance(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    current_user: m.UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = AttendanceService(db)
    records = svc.get_my_attendance(current_user, date_from, date_to)
    return [AttendanceResponse.from_orm_with_hours(r) for r in records]


@router.get("/", response_model=List[AttendanceResponse])
def all_attendance(
    employee_id: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    current_user: m.UserModel = Depends(require_role(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    svc = AttendanceService(db)
    try:
        records = svc.get_all(current_user, employee_id, date_from, date_to)
        return [AttendanceResponse.from_orm_with_hours(r) for r in records]
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/flagged", response_model=List[AttendanceResponse])
def get_flagged_attendance(
    current_user: m.UserModel = Depends(require_role(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    svc = AttendanceService(db)
    try:
        records = svc.get_flagged(current_user)
        return [AttendanceResponse.from_orm_with_hours(r) for r in records]
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.patch("/{id}/correct-time", response_model=AttendanceResponse)
def correct_attendance_time(
    id: int,
    payload: AttendanceCorrectRequest,
    current_user: m.UserModel = Depends(require_role(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    svc = AttendanceService(db)
    try:
        record = svc.correct_time(current_user, id, payload.check_in, payload.check_out)
        return AttendanceResponse.from_orm_with_hours(record)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))

