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


async def save_file(file: UploadFile, subfolder: str = "uploads") -> str:
    """
    Save an uploaded file to local disk.
    Returns the relative URL path to the file.
    """
    upload_dir = Path(settings.UPLOAD_DIR) / subfolder
    _ensure_dir(str(upload_dir))

    ext = Path(file.filename).suffix.lower() if file.filename else ".bin"
    filename = f"{uuid.uuid4().hex}{ext}"
    file_path = upload_dir / filename

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise ValueError(f"File size exceeds maximum allowed size of {MAX_FILE_SIZE // (1024*1024)} MB")

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    return f"/uploads/{subfolder}/{filename}"


def delete_file(file_url: str) -> None:
    """Delete a file given its relative URL path."""
    if not file_url:
        return
    relative_path = file_url.lstrip("/")
    abs_path = Path(settings.UPLOAD_DIR).parent / relative_path
    if abs_path.exists():
        abs_path.unlink()
