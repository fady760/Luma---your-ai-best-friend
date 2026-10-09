"""
Journal API Routes

CRUD for journal entries + AI-assisted draft generation from conversations.
"""

from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel

from app.database import get_session
from app.auth.dependencies import get_current_user
from app.models.db_models import User, JournalEntry, Conversation, Message

router = APIRouter(prefix="/api/journal", tags=["Journal"])


# ─── Schemas ────────────────────────────────────────────────────

class JournalCreate(BaseModel):
    title: str
    content: str
    conversation_id: Optional[int] = None


class JournalUpdate(BaseModel):
    title: str
    content: str


class JournalResponse(BaseModel):
    id: int
    title: str
    content: str
    conversation_id: Optional[int]
    created_at: str
    updated_at: str


# ─── Helpers ────────────────────────────────────────────────────

def _assert_owns(entry: JournalEntry, user: User):
    if entry.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")


def _entry_response(e: JournalEntry) -> JournalResponse:
    return JournalResponse(
        id=e.id,
        title=e.title,
        content=e.content,
        conversation_id=e.conversation_id,
        created_at=e.created_at.isoformat(),
        updated_at=e.updated_at.isoformat(),
    )


# ─── Endpoints ──────────────────────────────────────────────────

@router.get("", response_model=list[JournalResponse])
def list_entries(
    limit: int = 20,
    offset: int = 0,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """List journal entries for the current user, newest first."""
    stmt = (
        select(JournalEntry)
        .where(JournalEntry.user_id == current_user.id)
        .order_by(JournalEntry.updated_at.desc())
        .offset(offset)
        .limit(limit)
    )
    entries = session.exec(stmt).all()

    if search:
        q = search.lower()
        entries = [
            e for e in entries
            if q in e.title.lower() or q in e.content.lower()
        ]

    return [_entry_response(e) for e in entries]


@router.post("", response_model=JournalResponse, status_code=201)
def create_entry(
    data: JournalCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Create a new journal entry."""
    if not data.title.strip():
        raise HTTPException(400, "Title cannot be empty")
    if not data.content.strip():
        raise HTTPException(400, "Content cannot be empty")

    # If a conversation_id is provided, verify ownership
    if data.conversation_id:
        conv = session.get(Conversation, data.conversation_id)
        if not conv or conv.user_id != current_user.id:
            raise HTTPException(404, "Conversation not found")

    entry = JournalEntry(
        user_id=current_user.id,
        title=data.title.strip(),
        content=data.content.strip(),
        conversation_id=data.conversation_id,
    )
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return _entry_response(entry)


@router.get("/{entry_id}", response_model=JournalResponse)
def get_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get a single journal entry."""
    entry = session.get(JournalEntry, entry_id)
    if not entry:
        raise HTTPException(404, "Entry not found")
    _assert_owns(entry, current_user)
    return _entry_response(entry)


@router.put("/{entry_id}", response_model=JournalResponse)
def update_entry(
    entry_id: int,
    data: JournalUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Update a journal entry's title and content."""
    entry = session.get(JournalEntry, entry_id)
    if not entry:
        raise HTTPException(404, "Entry not found")
    _assert_owns(entry, current_user)

    entry.title = data.title.strip()
    entry.content = data.content.strip()
    entry.updated_at = datetime.now(timezone.utc)
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return _entry_response(entry)


@router.delete("/{entry_id}", status_code=204)
def delete_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Delete a journal entry."""
    entry = session.get(JournalEntry, entry_id)
    if not entry:
        raise HTTPException(404, "Entry not found")
    _assert_owns(entry, current_user)
    session.delete(entry)
    session.commit()


@router.post("/generate/{conversation_id}", response_model=dict)
async def generate_draft(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Generate a journal draft from a conversation.
    Returns a suggested title and draft content — the user must
    review and save it manually.
    """
    conv = session.get(Conversation, conversation_id)
    if not conv or conv.user_id != current_user.id:
        raise HTTPException(404, "Conversation not found")

    msgs = session.exec(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    ).all()

    if not msgs:
        raise HTTPException(400, "This conversation has no messages yet")

    from app.nlp.summarizer import generate_journal_draft
    msg_dicts = [{"role": m.role, "content": m.content} for m in msgs]
    draft, is_fallback = await generate_journal_draft(msg_dicts, mode=conv.mode)

    # Suggest a title from the conversation title
    suggested_title = f"Journal: {conv.title}"[:200]

    return {
        "suggested_title": suggested_title,
        "draft": draft,
        "is_fallback": is_fallback,
        "conversation_id": conversation_id,
        "message_count": len(msgs),
    }
