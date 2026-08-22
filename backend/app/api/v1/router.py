from fastapi import APIRouter
from app.api.v1 import auth, employees, attendance, leave, payroll, dashboard, reports, notifications

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(employees.router)
api_router.include_router(attendance.router)
api_router.include_router(leave.router)
api_router.include_router(payroll.router)
api_router.include_router(dashboard.router)
api_router.include_router(reports.router)
api_router.include_router(notifications.router)
