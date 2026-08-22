from typing import List
from sqlalchemy.orm import Session

from app.infrastructure.db import models as m


class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    def create(self, user_id: int, message: str) -> m.NotificationModel:
        obj = m.NotificationModel(user_id=user_id, message=message, is_read=False)
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def get_for_user(self, user_id: int, unread_only: bool = False) -> List[m.NotificationModel]:
        q = self.db.query(m.NotificationModel).filter(m.NotificationModel.user_id == user_id)
        if unread_only:
            q = q.filter(m.NotificationModel.is_read == False)
        return q.order_by(m.NotificationModel.created_at.desc()).limit(50).all()

    def mark_read(self, notification_id: int, user_id: int) -> m.NotificationModel:
        obj = (
            self.db.query(m.NotificationModel)
            .filter(
                m.NotificationModel.id == notification_id,
                m.NotificationModel.user_id == user_id,
            )
            .first()
        )
        if obj:
            obj.is_read = True
            self.db.commit()
            self.db.refresh(obj)
        return obj

    def mark_all_read(self, user_id: int) -> int:
        count = (
            self.db.query(m.NotificationModel)
            .filter(
                m.NotificationModel.user_id == user_id,
                m.NotificationModel.is_read == False,
            )
            .update({"is_read": True})
        )
        self.db.commit()
        return count

    def create_notification(self, user_id: int, message: str) -> m.NotificationModel:
        return self.create(user_id, message)

    def mark_as_read(self, notification_id: int, user_id: int) -> m.NotificationModel:
        return self.mark_read(notification_id, user_id)

    def list_unread(self, user_id: int) -> List[m.NotificationModel]:
        return self.get_for_user(user_id, unread_only=True)

