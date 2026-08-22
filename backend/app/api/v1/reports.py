from typing import Optional, List
from datetime import date
import csv
import io
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import extract, func

from app.core.dependencies import require_role
from app.domain.enums import Role, AttendanceStatus
from app.infrastructure.db.session import get_db
from app.infrastructure.db import models as m

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/attendance")
def attendance_report(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    format: str = Query("csv", pattern="^(csv|json)$"),
    current_user: m.UserModel = Depends(require_role(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    q = db.query(m.AttendanceModel, m.EmployeeModel).join(
        m.EmployeeModel, m.AttendanceModel.employee_id == m.EmployeeModel.id
    )
    if date_from:
        q = q.filter(m.AttendanceModel.date >= date_from)
    if date_to:
        q = q.filter(m.AttendanceModel.date <= date_to)

    rows = q.order_by(m.AttendanceModel.date.desc()).all()

    if format == "json":
        return [
            {
                "employee_code": emp.employee_code,
                "employee_name": f"{emp.first_name} {emp.last_name}",
                "department": emp.department,
                "date": str(att.date),
                "check_in": str(att.check_in) if att.check_in else None,
                "check_out": str(att.check_out) if att.check_out else None,
                "status": att.status.value,
            }
            for att, emp in rows
        ]

    # CSV
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Employee Code", "Name", "Department", "Date", "Check-In", "Check-Out", "Status"])
    for att, emp in rows:
        hours = ""
        if att.check_in and att.check_out:
            hours = str(round((att.check_out - att.check_in).total_seconds() / 3600, 2))
        writer.writerow([
            emp.employee_code,
            f"{emp.first_name} {emp.last_name}",
            emp.department,
            str(att.date),
            str(att.check_in) if att.check_in else "",
            str(att.check_out) if att.check_out else "",
            att.status.value,
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=attendance-report.csv"},
    )


@router.get("/leave-summary")
def leave_summary(
    year: int = Query(default=date.today().year),
    current_user: m.UserModel = Depends(require_role(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(
            m.EmployeeModel.department,
            m.LeaveBalanceModel.leave_type,
            func.sum(m.LeaveBalanceModel.used_days).label("total_used"),
            func.sum(m.LeaveBalanceModel.total_days).label("total_allocated"),
        )
        .join(m.LeaveBalanceModel, m.EmployeeModel.id == m.LeaveBalanceModel.employee_id)
        .filter(m.LeaveBalanceModel.year == year)
        .group_by(m.EmployeeModel.department, m.LeaveBalanceModel.leave_type)
        .all()
    )

    return [
        {
            "department": dept,
            "leave_type": lt.value,
            "total_used_days": int(used or 0),
            "total_allocated_days": int(allocated or 0),
            "utilization_pct": round((int(used or 0) / max(int(allocated or 1), 1)) * 100, 1),
        }
        for dept, lt, used, allocated in rows
    ]
