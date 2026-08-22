from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

celery_app = Celery(
    "dayflow",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.infrastructure.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    worker_prefetch_multiplier=1,
)

celery_app.conf.beat_schedule = {
    "nightly-attendance-check": {
        "task": "app.infrastructure.tasks.task_flag_missing_checkouts",
        "schedule": crontab(hour=1, minute=0),
    },
    "monthly-leave-accrual": {
        "task": "app.infrastructure.tasks.task_accrue_leave_balances",
        "schedule": crontab(day_of_month=1, hour=0, minute=0),
    },
}

