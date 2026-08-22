from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.application.dashboard_service import DashboardService
from app.core.dependencies import get_current_user, require_role
from app.domain.enums import Role
from app.infrastructure.db.session import get_db
from app.infrastructure.db import models as m

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/employee")
def employee_dashboard(
    current_user: m.UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = DashboardService(db)
    return svc.get_employee_dashboard(current_user)


@router.get("/admin")
def admin_dashboard(
    current_user: m.UserModel = Depends(require_role(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    svc = DashboardService(db)
    return svc.get_admin_dashboard(current_user)
