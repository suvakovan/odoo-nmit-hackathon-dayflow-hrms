import os
import uuid
import aiofiles
from pathlib import Path
from typing import Optional
from fastapi import UploadFile

from app.core.config import settings


ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_DOC_TYPES = {"application/pdf", "image/jpeg", "image/png"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def _ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


async def save_file(
    file: UploadFile,
    subfolder: str = "uploads",
    allowed_types: Optional[set] = None,
    max_size: Optional[int] = None,
) -> str:
    """
    Save an uploaded file. Switchable between local disk and S3 stub.
    """
    # Read content to check size
    content = await file.read()
    file_size = len(content)
    
    # Reset read pointer in case it's needed elsewhere
    await file.seek(0)

    # Validate size
    limit_size = max_size if max_size is not None else MAX_FILE_SIZE
    if file_size > limit_size:
        raise ValueError(f"File size exceeds maximum allowed size of {limit_size // (1024*1024)} MB")

    # Validate type
    if allowed_types is not None and file.content_type not in allowed_types:
        raise ValueError(f"Unsupported content type: {file.content_type}")

    ext = Path(file.filename).suffix.lower() if file.filename else ".bin"
    filename = f"{uuid.uuid4().hex}{ext}"

    if getattr(settings, "STORAGE_BACKEND", "local").lower() == "s3":
        # S3 Stubbing
        import logging
        logging.getLogger(__name__).info(f"[S3 Stub] Uploading {filename} to S3 bucket...")
        return f"https://dayflow-bucket.s3.amazonaws.com/{subfolder}/{filename}"

    # Local storage
    upload_dir = Path(settings.UPLOAD_DIR) / subfolder
    _ensure_dir(str(upload_dir))
    file_path = upload_dir / filename

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    return f"/uploads/{subfolder}/{filename}"


def delete_file(file_url: str) -> None:
    """Delete a file given its URL path (local or S3 stub)."""
    if not file_url:
        return
    if file_url.startswith("http"):
        # S3 Stub deletion log
        import logging
        logging.getLogger(__name__).info(f"[S3 Stub] Deleting {file_url} from S3 bucket...")
        return
    relative_path = file_url.lstrip("/")
    abs_path = Path(settings.UPLOAD_DIR).parent / relative_path
    if abs_path.exists():
        abs_path.unlink()

