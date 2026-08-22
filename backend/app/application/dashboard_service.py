from datetime import date, datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.core.exceptions import PermissionDeniedError
from app.domain.enums import Role, AttendanceStatus, LeaveStatus
from app.infrastructure.db import models as m


class DashboardService:
    def __init__(self, db: Session):
        self.db = db

    def get_employee_dashboard(self, requester: m.UserModel) -> dict:
        emp = self.db.query(m.EmployeeModel).filter(m.EmployeeModel.user_id == requester.id).first()
        if not emp:
            return {}

        today = date.today()
        year, month = today.year, today.month

        # Attendance % this month
        total_working_days = 22  # simplified assumption
        present_count = (
            self.db.query(m.AttendanceModel)
            .filter(
                m.AttendanceModel.employee_id == emp.id,
                extract("year", m.AttendanceModel.date) == year,
                extract("month", m.AttendanceModel.date) == month,
                m.AttendanceModel.status.in_([AttendanceStatus.PRESENT, AttendanceStatus.HALF_DAY]),
            )
            .count()
        )
        attendance_pct = round((present_count / total_working_days) * 100, 1) if total_working_days else 0

        # Today's attendance
        today_record = (
            self.db.query(m.AttendanceModel)
            .filter(
                m.AttendanceModel.employee_id == emp.id,
                m.AttendanceModel.date == today,
            )
            .first()
        )

        # Leave balances
        balances = (
            self.db.query(m.LeaveBalanceModel)
            .filter(
                m.LeaveBalanceModel.employee_id == emp.id,
                m.LeaveBalanceModel.year == year,
            )
            .all()
        )

        # Recent leave requests
        recent_leaves = (
            self.db.query(m.LeaveRequestModel)
            .filter(m.LeaveRequestModel.employee_id == emp.id)
            .order_by(m.LeaveRequestModel.created_at.desc())
            .limit(5)
            .all()
        )

        # Unread notifications
        unread_notif = (
            self.db.query(m.NotificationModel)
            .filter(
                m.NotificationModel.user_id == requester.id,
                m.NotificationModel.is_read == False,
            )
            .count()
        )

        return {
            "employee": {
                "id": emp.id,
                "name": f"{emp.first_name} {emp.last_name}",
                "employee_code": emp.employee_code,
                "department": emp.department,
                "designation": emp.designation,
                "joining_date": str(emp.joining_date),
                "profile_picture_url": emp.profile_picture_url,
            },
            "attendance": {
                "percentage": attendance_pct,
                "present_days": present_count,
                "today_checked_in": today_record is not None and today_record.check_in is not None,
                "today_checked_out": today_record is not None and today_record.check_out is not None,
                "today_status": today_record.status.value if today_record else None,
            },
            "leave_balances": [
                {
                    "type": b.leave_type.value,
                    "total": b.total_days,
                    "used": b.used_days,
                    "remaining": b.total_days - b.used_days,
                }
                for b in balances
            ],
            "recent_leaves": [
                {
                    "id": l.id,
                    "type": l.leave_type.value,
                    "start": str(l.start_date),
                    "end": str(l.end_date),
                    "status": l.status.value,
                }
                for l in recent_leaves
            ],
            "unread_notifications": unread_notif,
        }

    def get_admin_dashboard(self, requester: m.UserModel) -> dict:
        if requester.role != Role.ADMIN:
            raise PermissionDeniedError("Only admins can access the admin dashboard.")

        today = date.today()

        total_employees = self.db.query(m.EmployeeModel).count()
        pending_leaves = (
            self.db.query(m.LeaveRequestModel)
            .filter(m.LeaveRequestModel.status == LeaveStatus.PENDING)
            .count()
        )
        today_present = (
            self.db.query(m.AttendanceModel)
            .filter(
                m.AttendanceModel.date == today,
                m.AttendanceModel.status.in_([AttendanceStatus.PRESENT, AttendanceStatus.HALF_DAY]),
            )
            .count()
        )
        today_absent = total_employees - today_present

        # Department breakdown
        dept_counts = (
            self.db.query(m.EmployeeModel.department, func.count(m.EmployeeModel.id))
            .group_by(m.EmployeeModel.department)
            .all()
        )

        # Recent leave requests
        recent_pending = (
            self.db.query(m.LeaveRequestModel)
            .filter(m.LeaveRequestModel.status == LeaveStatus.PENDING)
            .order_by(m.LeaveRequestModel.created_at.desc())
            .limit(5)
            .all()
        )

        unread_notif = (
            self.db.query(m.NotificationModel)
            .filter(
                m.NotificationModel.user_id == requester.id,
                m.NotificationModel.is_read == False,
            )
            .count()
        )

        return {
            "stats": {
                "total_employees": total_employees,
                "pending_leave_requests": pending_leaves,
                "today_present": today_present,
                "today_absent": today_absent,
                "attendance_rate": round((today_present / max(total_employees, 1)) * 100, 1),
            },
            "department_breakdown": [
                {"department": dept, "count": cnt} for dept, cnt in dept_counts
            ],
            "recent_pending_leaves": [
                {
                    "id": l.id,
                    "employee_id": l.employee_id,
                    "type": l.leave_type.value,
                    "start": str(l.start_date),
                    "end": str(l.end_date),
                    "days": (l.end_date - l.start_date).days + 1,
                }
                for l in recent_pending
            ],
            "unread_notifications": unread_notif,
        }
