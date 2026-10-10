import json
import httpx
from sqlmodel import Session, select
from app.database import engine
from app.models.db_models import Memory
from app.config import settings
from app.ai.vector_store import generate_embedding

MEMORY_PROMPT = """You are an AI assistant designed to extract important personal facts, preferences, and goals from a user's message.

Extract any explicit facts about the user. Only extract facts if they represent a personal preference, a long-term goal, a relationship, or an important life detail.

Output the facts as a JSON array of strings. If there are no important facts, output an empty array [].
Do NOT output anything else except the JSON array.

Example input: "I love Italian food and I'm learning Rust."
Example output: ["The user loves Italian food", "The user is learning the Rust programming language"]

User message:
"{user_message}"
"""

async def extract_memories_background_task(user_id: int, user_message: str):
    """
    Background task to extract memories from a user message and save them to the DB.
    """
    # Quick filter: don't extract if message is too short
    if len(user_message.split()) < 4:
        return

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/chat",
                json={
                    "model": settings.OLLAMA_MODEL,
                    "messages": [{"role": "user", "content": MEMORY_PROMPT.format(user_message=user_message)}],
                    "stream": False,
                    "options": {
                        "temperature": 0.1,
                    },
                },
            )
            response.raise_for_status()
            data = response.json()
            text = data["message"]["content"].strip()
            
            try:
                # Find JSON array in the response
                start = text.find('[')
                end = text.rfind(']') + 1
                if start != -1 and end != 0:
                    json_str = text[start:end]
                    facts = json.loads(json_str)
                    
                    if isinstance(facts, list):
                        with Session(engine) as session:
                            for fact in facts:
                                if isinstance(fact, str) and len(fact) > 5:
                                    # Stop if limit reached
                                    count = len(session.exec(select(Memory).where(Memory.user_id == user_id)).all())
                                    if count >= 50:
                                        break
                                    
                                    # Generate embedding synchronously
                                    embedding = generate_embedding(fact)
                                    memory = Memory(user_id=user_id, content=fact, embedding=embedding)
                                    session.add(memory)
                                    session.commit()
            except json.JSONDecodeError:
                pass
                
    except Exception as e:
        print(f"Memory extraction failed: {e}")
