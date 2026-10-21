import os
import uuid
import base64
from pathlib import Path
from typing import List, Optional
from fastapi import UploadFile, HTTPException, status, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.app.models.uploaded_file import UploadedFile

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB maximum upload size


async def save_uploaded_file(
    file: UploadFile,
    subfolder: str,
    allowed_exts: List[str],
    db: Session,
) -> dict:
    """
    Saves an uploaded file both to persistent Neon PostgreSQL storage (base64)
    and, if writable, to the local disk cache (frontend/uploads/<subfolder>).
    Returns URLs and metadata compatible with both local and Vercel serverless environments.
    """
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file format '{ext}'. Allowed formats: {', '.join(allowed_exts)}",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB",
        )

    clean_basename = "".join(
        c for c in Path(file.filename or "file").stem if c.isalnum() or c in ("-", "_")
    ).lower()
    if not clean_basename:
        clean_basename = "file"
    unique_filename = f"{clean_basename}_{uuid.uuid4().hex[:8]}{ext}"

    # 1. Save to persistent Neon PostgreSQL database
    b64_str = base64.b64encode(content).decode("ascii")
    content_type = file.content_type or "application/octet-stream"
    if ext == ".pdf":
        content_type = "application/pdf"
    elif ext in (".jpg", ".jpeg"):
        content_type = "image/jpeg"
    elif ext == ".png":
        content_type = "image/png"
    elif ext == ".webp":
        content_type = "image/webp"

    rec = UploadedFile(
        filename=unique_filename,
        original_name=file.filename or unique_filename,
        content_type=content_type,
        file_size=len(content),
        file_data=b64_str,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)

    # 2. Opportunistically write to local disk cache (only if filesystem is writable)
    local_dir = Path(f"frontend/uploads/{subfolder}")
    try:
        local_dir.mkdir(parents=True, exist_ok=True)
        with open(local_dir / unique_filename, "wb") as f:
            f.write(content)
    except OSError:
        pass  # Read-only serverless environment (e.g. Vercel), safely ignored

    return {
        "status": "success",
        "url": f"/api/uploads/{subfolder}/{unique_filename}",
        "relative_url": f"/uploads/{subfolder}/{unique_filename}",
        "filename": unique_filename,
        "original_name": file.filename,
        "file_size": len(content),
        "content_type": content_type,
    }


def serve_file(subfolder: str, filename: str, db: Session) -> Response:
    """
    Serves a file either from local disk cache or directly from Neon PostgreSQL database.
    """
    # 1. Check local filesystem cache
    local_path = Path(f"frontend/uploads/{subfolder}/{filename}")
    if local_path.is_file():
        return FileResponse(str(local_path))

    # 2. Check Neon PostgreSQL persistent storage
    rec = db.query(UploadedFile).filter(UploadedFile.filename == filename).first()
    if rec:
        raw_bytes = base64.b64decode(rec.file_data)
        safe_name = rec.original_name.replace('"', '\\"')
        headers = {
            "Content-Disposition": f'inline; filename="{safe_name}"',
            "Cache-Control": "public, max-age=31536000, immutable",
            "Access-Control-Allow-Origin": "*",
        }
        return Response(
            content=raw_bytes,
            media_type=rec.content_type,
            headers=headers,
        )

    raise HTTPException(status_code=404, detail="Requested file not found")
