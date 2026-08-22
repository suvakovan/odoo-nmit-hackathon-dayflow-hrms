from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
if not hasattr(bcrypt, "__about__"):
    class _BcryptAbout:
        __version__ = getattr(bcrypt, "__version__", "4.3.0")
    bcrypt.__about__ = _BcryptAbout()

from passlib.context import CryptContext
from jose import JWTError, jwt

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


def create_email_verification_token(user_id: int, email: str) -> str:
    """Create a short-lived signed token for email verification."""
    from itsdangerous import URLSafeTimedSerializer
    s = URLSafeTimedSerializer(settings.JWT_SECRET_KEY)
    return s.dumps({"user_id": user_id, "email": email}, salt="email-verify")


def verify_email_token(token: str, max_age: int = 3600) -> Optional[dict]:
    """Validate email verification token. Returns payload dict or None."""
    from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
    s = URLSafeTimedSerializer(settings.JWT_SECRET_KEY)
    try:
        payload = s.loads(token, salt="email-verify", max_age=max_age)
        return payload
    except (BadSignature, SignatureExpired):
        return None


def create_password_reset_token(user_id: int, email: str) -> str:
    """Create a short-lived signed token for password reset."""
    from itsdangerous import URLSafeTimedSerializer
    s = URLSafeTimedSerializer(settings.JWT_SECRET_KEY)
    return s.dumps({"user_id": user_id, "email": email}, salt="password-reset")


def verify_password_reset_token(token: str, max_age: int = 3600) -> Optional[dict]:
    """Validate password reset token. Returns payload dict or None."""
    from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
    s = URLSafeTimedSerializer(settings.JWT_SECRET_KEY)
    try:
        payload = s.loads(token, salt="password-reset", max_age=max_age)
        return payload
    except (BadSignature, SignatureExpired):
        return None
