from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database
    DATABASE_URL: str = "postgresql://dayflow_user:changeme@localhost:5432/dayflow"

    # Auth
    JWT_SECRET_KEY: str = "insecure-dev-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_NAME: str = "Dayflow HRMS"
    EMAILS_ENABLED: bool = False

    # Redis / Celery
    REDIS_URL: str = "redis://localhost:6379/0"

    # File storage
    STORAGE_BACKEND: str = "local"
    UPLOAD_DIR: str = "/app/uploads"

    # App
    APP_ENV: str = "development"
    CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


settings = Settings()
