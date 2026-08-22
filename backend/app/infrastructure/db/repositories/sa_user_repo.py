from typing import Optional, List
from sqlalchemy.orm import Session

from app.domain.entities.user import User
from app.domain.repositories.user_repo import IUserRepository
from app.infrastructure.db import models as m
from app.domain.enums import Role


class SAUserRepository(IUserRepository):
    def __init__(self, db: Session):
        self.db = db

    def _to_entity(self, model: m.UserModel) -> User:
        return User(
            id=model.id,
            email=model.email,
            hashed_password=model.hashed_password,
            role=model.role,
            is_verified=model.is_verified,
        )

    def get_by_id(self, user_id: int) -> Optional[User]:
        obj = self.db.query(m.UserModel).filter(m.UserModel.id == user_id).first()
        return self._to_entity(obj) if obj else None

    def get_by_email(self, email: str) -> Optional[User]:
        obj = self.db.query(m.UserModel).filter(m.UserModel.email == email).first()
        return self._to_entity(obj) if obj else None

    def create(self, user: User) -> User:
        obj = m.UserModel(
            email=user.email,
            hashed_password=user.hashed_password,
            role=user.role,
            is_verified=user.is_verified,
        )
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return self._to_entity(obj)

    def update(self, user: User) -> User:
        obj = self.db.query(m.UserModel).filter(m.UserModel.id == user.id).first()
        obj.email = user.email
        obj.hashed_password = user.hashed_password
        obj.role = user.role
        obj.is_verified = user.is_verified
        self.db.commit()
        self.db.refresh(obj)
        return self._to_entity(obj)

    def list_all(self) -> List[User]:
        objs = self.db.query(m.UserModel).all()
        return [self._to_entity(o) for o in objs]
