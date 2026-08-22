from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.api.v1.schemas.auth_schemas import (
    SignupRequest, VerifyEmailRequest, LoginRequest,
    RefreshRequest, TokenResponse, UserResponse,
    ResendVerificationRequest,
)
from app.application.auth_service import AuthService
from app.core.dependencies import get_current_user, oauth2_scheme
from app.core.exceptions import AuthenticationError, ConflictError, ValidationError, NotFoundError
from app.core.security import create_email_verification_token
from app.infrastructure.db.session import get_db
from app.infrastructure.db import models as m


router = APIRouter(prefix="/auth", tags=["Auth"])


def _handle_domain_errors(fn):
    """Decorator to translate domain exceptions to HTTP responses."""
    from functools import wraps
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            return fn(*args, **kwargs)
        except ConflictError as e:
            raise HTTPException(status_code=409, detail=str(e))
        except AuthenticationError as e:
            raise HTTPException(status_code=401, detail=str(e))
        except (ValidationError, NotFoundError) as e:
            raise HTTPException(status_code=400, detail=str(e))
    return wrapper


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    svc = AuthService(db)
    try:
        user_model, token = svc.signup(
            email=payload.email,
            password=payload.password,
            role=payload.role,
            first_name=payload.first_name,
            last_name=payload.last_name,
            department=payload.department,
            designation=payload.designation,
        )
    except ConflictError as e:
        raise HTTPException(status_code=409, detail=str(e))

    return {
        "message": "Account created. Please check your email to verify your account.",
        "user_id": user_model.id,
        "verification_token": token,  # exposed for dev convenience
    }


@router.post("/verify-email")
def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    svc = AuthService(db)
    try:
        svc.verify_email(payload.token)
    except (ValidationError, NotFoundError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"message": "Email verified successfully. You can now log in."}


@router.get("/verify-email")
def verify_email_get(token: str, db: Session = Depends(get_db)):
    svc = AuthService(db)
    try:
        svc.verify_email(token)
        return RedirectResponse(url="http://localhost:3000/login?verified=true")
    except Exception:
        return RedirectResponse(url="http://localhost:3000/login?verified=false")


@router.post("/resend-verification")
def resend_verification(payload: ResendVerificationRequest, db: Session = Depends(get_db)):
    import redis
    from app.core.config import settings

    try:
        r = redis.from_url(settings.REDIS_URL, decode_responses=True)
        redis_key = f"rate:resend:{payload.email}"
        if r.get(redis_key):
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please wait 60 seconds before requesting another verification email."
            )
        r.setex(redis_key, 60, "1")
    except redis.RedisError as e:
        import logging
        logging.getLogger(__name__).warning(f"Redis rate limit failed: {e}")

    user_model = db.query(m.UserModel).filter(m.UserModel.email == payload.email).first()
    if not user_model:
        raise HTTPException(status_code=404, detail="User not found.")
    if user_model.is_verified:
        raise HTTPException(status_code=400, detail="Email is already verified.")

    token = create_email_verification_token(user_model.id, payload.email)

    try:
        from app.infrastructure.tasks import task_send_verification_email
        task_send_verification_email.delay(payload.email, token)
    except Exception:
        pass

    return {"message": "Verification email resent successfully."}



@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    svc = AuthService(db)
    try:
        tokens = svc.login(payload.email, payload.password)
    except AuthenticationError as e:
        raise HTTPException(status_code=401, detail=str(e))
    return tokens


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    svc = AuthService(db)
    try:
        tokens = svc.refresh(payload.refresh_token)
    except AuthenticationError as e:
        raise HTTPException(status_code=401, detail=str(e))
    return tokens


@router.get("/me", response_model=UserResponse)
def me(current_user: m.UserModel = Depends(get_current_user)):
    return current_user
