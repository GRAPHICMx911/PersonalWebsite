from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select, or_, func
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.message import ContactMessage
from backend.app.models.user import User
from backend.app.core.dependencies import get_current_admin
from backend.app.schemas.message import (
    ContactMessageCreate,
    ContactMessageUpdate,
    ContactMessageResponse,
    ContactMessageStats,
)

router = APIRouter(
    prefix="/api",
    tags=["Contact & Inquiries"],
)


# =========================================================
# PUBLIC ENDPOINTS
# =========================================================

@router.post(
    "/contact",
    status_code=status.HTTP_201_CREATED,
    summary="Submit Contact Message / Inquiry",
)
@router.post(
    "/messages/submit",
    status_code=status.HTTP_201_CREATED,
    summary="Submit Contact Message (Alias)",
)
def submit_contact_message(
    payload: ContactMessageCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Public contact endpoint allowing visitors, recruiters, and clients
    to submit direct inquiries.
    """
    # Extract client IP & User Agent
    client_ip = request.headers.get("x-forwarded-for")
    if client_ip:
        client_ip = client_ip.split(",")[0].strip()
    elif request.client:
        client_ip = request.client.host
    else:
        client_ip = None

    user_agent = request.headers.get("user-agent")
    if user_agent and len(user_agent) > 250:
        user_agent = user_agent[:250]

    # Clean input
    clean_name = payload.name.strip()
    clean_email = payload.email.strip().lower()
    clean_subject = payload.subject.strip()
    clean_message = payload.message.strip()

    new_message = ContactMessage(
        name=clean_name,
        email=clean_email,
        subject=clean_subject,
        message=clean_message,
        ip_address=client_ip,
        user_agent=user_agent,
        is_read=False,
        is_archived=False,
    )

    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    return {
        "status": "success",
        "message": "Thank you! Your message has been sent successfully. I will get back to you shortly.",
        "id": new_message.id,
    }


# =========================================================
# ADMIN INBOX ENDPOINTS
# =========================================================

@router.get(
    "/messages",
    response_model=List[ContactMessageResponse],
    summary="Admin List Inquiries & Messages",
)
def admin_list_messages(
    status_filter: Optional[str] = Query("all", description="all, unread, read, or archived"),
    search: Optional[str] = Query(None, description="Search by name, email, or subject"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Retrieve all received contact inquiries for admin inbox."""
    statement = select(ContactMessage)

    if status_filter == "unread":
        statement = statement.where(ContactMessage.is_read == False, ContactMessage.is_archived == False)
    elif status_filter == "read":
        statement = statement.where(ContactMessage.is_read == True, ContactMessage.is_archived == False)
    elif status_filter == "archived":
        statement = statement.where(ContactMessage.is_archived == True)
    elif status_filter != "all":
        # By default in 'all' view, show non-archived messages
        statement = statement.where(ContactMessage.is_archived == False)

    if search:
        pattern = f"%{search.strip()}%"
        statement = statement.where(
            or_(
                ContactMessage.name.ilike(pattern),
                ContactMessage.email.ilike(pattern),
                ContactMessage.subject.ilike(pattern),
                ContactMessage.message.ilike(pattern),
            )
        )

    statement = statement.order_by(
        ContactMessage.is_read.asc(),
        ContactMessage.created_at.desc(),
        ContactMessage.id.desc(),
    ).offset(offset).limit(limit)

    return db.scalars(statement).all()


@router.get(
    "/messages/stats",
    response_model=ContactMessageStats,
    summary="Admin Get Inbox Message Counters",
)
def admin_get_message_stats(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Retrieve inbox statistics: total, unread, read, and archived messages."""
    total = db.scalar(select(func.count(ContactMessage.id))) or 0
    unread = db.scalar(select(func.count(ContactMessage.id)).where(ContactMessage.is_read == False, ContactMessage.is_archived == False)) or 0
    read = db.scalar(select(func.count(ContactMessage.id)).where(ContactMessage.is_read == True, ContactMessage.is_archived == False)) or 0
    archived = db.scalar(select(func.count(ContactMessage.id)).where(ContactMessage.is_archived == True)) or 0

    return {
        "total": total,
        "unread": unread,
        "read": read,
        "archived": archived,
    }


@router.get(
    "/messages/{message_id}",
    response_model=ContactMessageResponse,
    summary="Admin Get Single Message Details",
)
def admin_get_message(
    message_id: int,
    mark_as_read: bool = Query(True, description="Automatically mark message as read"),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Retrieve full details of an inquiry and optionally mark as read."""
    message = db.get(ContactMessage, message_id)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Message with ID {message_id} not found.",
        )

    if mark_as_read and not message.is_read:
        message.is_read = True
        message.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(message)

    return message


@router.patch(
    "/messages/{message_id}/read",
    response_model=ContactMessageResponse,
    summary="Admin Toggle / Set Message Read Status",
)
def admin_toggle_read_status(
    message_id: int,
    is_read: Optional[bool] = Query(None, description="Explicit read status, or toggle if omitted"),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Toggle or explicitly set read/unread status on an inquiry."""
    message = db.get(ContactMessage, message_id)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Message with ID {message_id} not found.",
        )

    if is_read is not None:
        message.is_read = is_read
    else:
        message.is_read = not message.is_read

    message.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(message)
    return message


@router.patch(
    "/messages/{message_id}/archive",
    response_model=ContactMessageResponse,
    summary="Admin Toggle / Set Message Archived Status",
)
def admin_toggle_archive_status(
    message_id: int,
    is_archived: Optional[bool] = Query(None, description="Explicit archive status, or toggle if omitted"),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Move message to archive or restore it back to inbox."""
    message = db.get(ContactMessage, message_id)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Message with ID {message_id} not found.",
        )

    if is_archived is not None:
        message.is_archived = is_archived
    else:
        message.is_archived = not message.is_archived

    message.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(message)
    return message


@router.post(
    "/messages/mark-all-read",
    summary="Admin Mark All Unread Messages as Read",
)
def admin_mark_all_read(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Bulk mark all unread non-archived messages as read."""
    unread_messages = db.scalars(select(ContactMessage).where(ContactMessage.is_read == False)).all()
    count = len(unread_messages)
    now = datetime.now(timezone.utc)
    for m in unread_messages:
        m.is_read = True
        m.updated_at = now
    db.commit()
    return {"message": f"Successfully marked {count} messages as read."}


@router.delete(
    "/messages/{message_id}",
    status_code=status.HTTP_200_OK,
    summary="Admin Permanently Delete Message",
)
def admin_delete_message(
    message_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Permanently delete an inquiry from database."""
    message = db.get(ContactMessage, message_id)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Message with ID {message_id} not found.",
        )

    db.delete(message)
    db.commit()
    return {"message": f"Message ID {message_id} from '{message.name}' was permanently deleted."}
