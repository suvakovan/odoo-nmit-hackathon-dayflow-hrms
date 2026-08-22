from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str, extra: Optional[dict] = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": subject, "exp": expire, "type": "access"}
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    payload = {"sub": subject, "exp": expire, "type": "refresh"}
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and validate a JWT token. Raises JWTError on failure."""
    return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])


def create_email_verification_token(email: str) -> str:
    """Create a short-lived signed token for email verification."""
    from itsdangerous import URLSafeTimedSerializer
    s = URLSafeTimedSerializer(settings.JWT_SECRET_KEY)
    return s.dumps(email, salt="email-verify")


def verify_email_token(token: str, max_age: int = 3600) -> Optional[str]:
    """Validate email verification token. Returns email or None."""
    from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
    s = URLSafeTimedSerializer(settings.JWT_SECRET_KEY)
    try:
        email = s.loads(token, salt="email-verify", max_age=max_age)
        return email
    except (BadSignature, SignatureExpired):
        return None
