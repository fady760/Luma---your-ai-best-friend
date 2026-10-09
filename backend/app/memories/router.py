"""
Memories API Routes

User-controlled memory/preference system.
Users explicitly save facts they want Luma to remember.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel

from app.database import get_session
from app.auth.dependencies import get_current_user
from app.models.db_models import User, Memory

router = APIRouter(prefix="/api/memories", tags=["Memories"])

MAX_MEMORIES = 50  # Prevent unbounded growth


class MemoryCreate(BaseModel):
    content: str


class MemoryUpdate(BaseModel):
    content: str


class MemoryResponse(BaseModel):
    id: int
    content: str
    created_at: str
    updated_at: str


def _memory_response(m: Memory) -> MemoryResponse:
    return MemoryResponse(
        id=m.id,
        content=m.content,
        created_at=m.created_at.isoformat(),
        updated_at=m.updated_at.isoformat(),
    )


@router.get("", response_model=list[MemoryResponse])
def list_memories(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """List all memories for the current user."""
    memories = session.exec(
        select(Memory)
        .where(Memory.user_id == current_user.id)
        .order_by(Memory.updated_at.desc())
    ).all()
    return [_memory_response(m) for m in memories]


@router.post("", response_model=MemoryResponse, status_code=201)
def create_memory(
    data: MemoryCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Save a new memory. User must explicitly trigger this."""
    content = data.content.strip()
    if not content:
        raise HTTPException(400, "Memory content cannot be empty")
    if len(content) > 500:
        raise HTTPException(400, "Memory content too long (max 500 chars)")

    # Enforce per-user limit
    count = len(session.exec(
        select(Memory).where(Memory.user_id == current_user.id)
    ).all())
    if count >= MAX_MEMORIES:
        raise HTTPException(400, f"Maximum of {MAX_MEMORIES} memories reached. Delete some first.")

    memory = Memory(user_id=current_user.id, content=content)
    session.add(memory)
    session.commit()
    session.refresh(memory)
    return _memory_response(memory)


@router.put("/{memory_id}", response_model=MemoryResponse)
def update_memory(
    memory_id: int,
    data: MemoryUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Edit a saved memory."""
    memory = session.get(Memory, memory_id)
    if not memory or memory.user_id != current_user.id:
        raise HTTPException(404, "Memory not found")
    memory.content = data.content.strip()
    memory.updated_at = datetime.now(timezone.utc)
    session.add(memory)
    session.commit()
    session.refresh(memory)
    return _memory_response(memory)


@router.delete("/{memory_id}", status_code=204)
def delete_memory(
    memory_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Delete a memory — it will no longer be included in future chats."""
    memory = session.get(Memory, memory_id)
    if not memory or memory.user_id != current_user.id:
        raise HTTPException(404, "Memory not found")
    session.delete(memory)
    session.commit()
