"""
Conversation API Routes

Endpoints for creating conversations, sending messages,
listing history, and deleting conversations.
"""

from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlmodel import Session, select
from pydantic import BaseModel

from app.database import get_session
from app.auth.dependencies import get_current_user
from app.models.db_models import User, Conversation, Message
from app.ai.llm import chat_with_ollama, check_ollama_status

router = APIRouter(prefix="/api/conversations", tags=["Conversations"])

VALID_MODES = {"talk_reflect", "problem_solver", "goal_planner"}
CONTEXT_WINDOW = 20  # how many recent messages to send to the LLM


# ─── Schemas ────────────────────────────────────────────────────

class ConversationCreate(BaseModel):
    mode: str = "talk_reflect"
    title: Optional[str] = None


class ConversationResponse(BaseModel):
    id: int
    title: str
    mode: str
    created_at: str
    updated_at: str
    message_count: int = 0


class MessageCreate(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    predicted_intent: Optional[str]
    intent_confidence: Optional[float]
    created_at: str
    is_fallback: bool = False


class ConversationDetail(BaseModel):
    id: int
    title: str
    mode: str
    created_at: str
    updated_at: str
    messages: list[MessageResponse]


# ─── Helpers ────────────────────────────────────────────────────

def _assert_owns(conversation: Conversation, user: User):
    """Raise 403 if the conversation does not belong to the user."""
    if conversation.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


def _conv_response(conv: Conversation, count: int = 0) -> ConversationResponse:
    return ConversationResponse(
        id=conv.id,
        title=conv.title,
        mode=conv.mode,
        created_at=conv.created_at.isoformat(),
        updated_at=conv.updated_at.isoformat(),
        message_count=count,
    )


def _msg_response(msg: Message, is_fallback: bool = False) -> MessageResponse:
    return MessageResponse(
        id=msg.id,
        conversation_id=msg.conversation_id,
        role=msg.role,
        content=msg.content,
        predicted_intent=msg.predicted_intent,
        intent_confidence=msg.intent_confidence,
        created_at=msg.created_at.isoformat(),
        is_fallback=is_fallback,
    )


# ─── Endpoints ──────────────────────────────────────────────────

@router.get("", response_model=list[ConversationResponse])
def list_conversations(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """List the authenticated user's conversations, newest first."""
    stmt = (
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
        .offset(offset)
        .limit(limit)
    )
    convs = session.exec(stmt).all()
    result = []
    for conv in convs:
        count = len(session.exec(
            select(Message).where(Message.conversation_id == conv.id)
        ).all())
        result.append(_conv_response(conv, count))
    return result


@router.post("", response_model=ConversationResponse, status_code=201)
def create_conversation(
    data: ConversationCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Create a new conversation for the authenticated user."""
    if data.mode not in VALID_MODES:
        raise HTTPException(400, f"mode must be one of {VALID_MODES}")

    mode_labels = {
        "talk_reflect": "Talk & Reflect",
        "problem_solver": "Problem Solver",
        "goal_planner": "Goal Planner",
    }
    title = data.title or mode_labels.get(data.mode, "New Conversation")

    conv = Conversation(user_id=current_user.id, title=title, mode=data.mode)
    session.add(conv)
    session.commit()
    session.refresh(conv)
    return _conv_response(conv, 0)


@router.get("/{conversation_id}", response_model=ConversationDetail)
def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get a single conversation with all its messages."""
    conv = session.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(404, "Conversation not found")
    _assert_owns(conv, current_user)

    msgs = session.exec(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    ).all()

    return ConversationDetail(
        id=conv.id,
        title=conv.title,
        mode=conv.mode,
        created_at=conv.created_at.isoformat(),
        updated_at=conv.updated_at.isoformat(),
        messages=[_msg_response(m) for m in msgs],
    )


@router.patch("/{conversation_id}/title", response_model=ConversationResponse)
def update_title(
    conversation_id: int,
    data: dict,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Update a conversation title."""
    conv = session.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(404, "Conversation not found")
    _assert_owns(conv, current_user)
    new_title = data.get("title", "").strip()
    if not new_title:
        raise HTTPException(400, "title cannot be empty")
    conv.title = new_title[:200]
    conv.updated_at = datetime.now(timezone.utc)
    session.add(conv)
    session.commit()
    session.refresh(conv)
    return _conv_response(conv)


@router.delete("/{conversation_id}", status_code=204)
def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Delete a conversation and all its messages."""
    conv = session.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(404, "Conversation not found")
    _assert_owns(conv, current_user)
    session.delete(conv)
    session.commit()


@router.post("/{conversation_id}/messages", response_model=list[MessageResponse])
async def send_message(
    conversation_id: int,
    data: MessageCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Send a user message and get an AI response.

    Returns a list of two MessageResponse objects:
    [user_message, assistant_message]
    """
    conv = session.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(404, "Conversation not found")
    _assert_owns(conv, current_user)

    content = data.content.strip()
    if not content:
        raise HTTPException(400, "Message content cannot be empty")

    # Classify the user's intent (non-blocking — falls back gracefully)
    intent_result = {"intent": None, "confidence": None}
    try:
        from app.nlp.intent_classifier import classify_intent
        intent_result = classify_intent(content)
    except Exception:
        pass

    # Save user message
    user_msg = Message(
        conversation_id=conversation_id,
        role="user",
        content=content,
        predicted_intent=intent_result.get("intent"),
        intent_confidence=intent_result.get("confidence"),
    )
    session.add(user_msg)
    session.commit()
    session.refresh(user_msg)

    # Build context window for the LLM (recent messages only)
    all_msgs = session.exec(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .limit(CONTEXT_WINDOW)
    ).all()
    # Reverse to chronological order
    context = [{"role": m.role, "content": m.content} for m in reversed(all_msgs)]

    # Call Ollama (or fallback)
    ai_text, is_fallback = await chat_with_ollama(context, mode=conv.mode)

    # Auto-generate a better title from the first user message
    if len(all_msgs) == 1:  # This was the very first message
        new_title = content[:60] + ("…" if len(content) > 60 else "")
        conv.title = new_title

    # Save assistant message
    ai_msg = Message(
        conversation_id=conversation_id,
        role="assistant",
        content=ai_text,
    )
    session.add(ai_msg)
    conv.updated_at = datetime.now(timezone.utc)
    session.add(conv)
    session.commit()
    session.refresh(ai_msg)

    # Automatically extract memories from the user message in the background
    from app.nlp.memory_extractor import extract_memories_background_task
    background_tasks.add_task(extract_memories_background_task, current_user.id, content)

    return [
        _msg_response(user_msg),
        _msg_response(ai_msg, is_fallback=is_fallback),
    ]


@router.get("/status/ai", tags=["Status"])
async def ai_status():
    """Check whether Ollama is running and the required model is available."""
    return await check_ollama_status()
