"""
Luma Database Setup

Handles SQLite database initialization and session management.
Uses SQLModel (built on SQLAlchemy) for ORM.
"""

from sqlmodel import SQLModel, Session, create_engine
from app.config import settings

# Create the database engine
# For SQLite, we need connect_args to allow multi-threaded access
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,  # Set to True for SQL query logging during development
)


def init_db():
    """Create all database tables. Called on application startup."""
    # Import all models so SQLModel registers them
    from app.models.db_models import User, Conversation, Message, JournalEntry, Memory, Embedding  # noqa: F401
    SQLModel.metadata.create_all(engine)


def get_session():
    """
    Dependency that provides a database session.
    Used with FastAPI's Depends() in route handlers.
    The session is automatically closed after the request.
    """
    with Session(engine) as session:
        yield session
