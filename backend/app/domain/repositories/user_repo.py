from abc import ABC, abstractmethod
from typing import Optional, List
from app.domain.entities.user import User


class IUserRepository(ABC):

    @abstractmethod
    def get_by_id(self, user_id: int) -> Optional[User]: ...

    @abstractmethod
    def get_by_email(self, email: str) -> Optional[User]: ...

    @abstractmethod
    def create(self, user: User) -> User: ...

    @abstractmethod
    def update(self, user: User) -> User: ...

    @abstractmethod
    def list_all(self) -> List[User]: ...
