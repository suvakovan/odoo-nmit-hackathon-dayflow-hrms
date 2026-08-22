from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.domain.enums import Role
from app.infrastructure.db.session import get_db
from app.infrastructure.db import models as m

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> m.UserModel:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(m.UserModel).filter(m.UserModel.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify your email to continue.",
        )
    return user


def require_role(*allowed_roles: Role):
    """Dependency factory that enforces role-based access at the router level."""
    def checker(user: m.UserModel = Depends(get_current_user)) -> m.UserModel:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions.",
            )
        return user
    return checker


def get_current_employee(
    current_user: m.UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> m.EmployeeModel:
    """Resolves the Employee profile for the current user."""
    employee = (
        db.query(m.EmployeeModel)
        .filter(m.EmployeeModel.user_id == current_user.id)
        .first()
    )
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee profile not found for this user.",
        )
    return employee
