from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.application.notification_service import NotificationService
from app.core.dependencies import get_current_user
from app.infrastructure.db.session import get_db
from app.infrastructure.db import models as m
from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: int
    message: str
    is_read: bool

    model_config = {"from_attributes": True}


router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    unread_only: bool = False,
    current_user: m.UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = NotificationService(db)
    return svc.get_for_user(current_user.id, unread_only)


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_read(
    notification_id: int,
    current_user: m.UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = NotificationService(db)
    obj = svc.mark_read(notification_id, current_user.id)
    return obj


@router.patch("/mark-all-read")
def mark_all_read(
    current_user: m.UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = NotificationService(db)
    count = svc.mark_all_read(current_user.id)
    return {"marked_read": count}
