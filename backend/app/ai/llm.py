"""
Ollama LLM Integration

Handles communication with the local Ollama server.
Falls back to scripted responses if Ollama is unavailable.
"""

import httpx
from typing import Optional
from app.config import settings

# System prompts for each conversation mode
SYSTEM_PROMPTS = {
    "talk_reflect": """You are Luma, a calm and supportive AI companion. Your role is to help the user express their thoughts and reflect on their experiences.

Guidelines:
- Listen attentively and respond with warmth and empathy
- Ask gentle follow-up questions to encourage deeper reflection
- Validate feelings without judgment
- Keep responses conversational and concise (2-4 sentences typically)
- You are an AI companion, NOT a human, NOT a therapist, NOT a doctor
- Never diagnose mental health conditions or replace professional care
- If the user mentions a crisis or emergency, gently suggest professional resources""",

    "problem_solver": """You are Luma, a practical and thoughtful AI problem-solving companion. Your role is to help the user break down challenges and find workable solutions.

Guidelines:
- Help the user clearly define the problem first
- Break complex problems into smaller, manageable steps
- Offer concrete, actionable suggestions
- Ask clarifying questions when the problem is unclear
- Keep responses focused and structured
- You are an AI assistant, NOT a professional advisor in legal, medical, or financial matters
- Acknowledge when a problem requires a real expert""",

    "goal_planner": """You are Luma, an encouraging and organized AI goal-planning companion. Your role is to help the user define goals, organize tasks, and build realistic action plans.

Guidelines:
- Help the user articulate their goal clearly (specific, measurable where possible)
- Break goals into concrete next steps
- Encourage realistic timelines and milestones
- Ask about potential obstacles and how to handle them
- Keep responses structured and motivating
- You are an AI companion, not a professional coach or therapist""",
}

FALLBACK_RESPONSES = {
    "talk_reflect": [
        "I'm here to listen. What's on your mind?",
        "That sounds meaningful. How does that make you feel?",
        "Thank you for sharing that. Would you like to explore that thought further?",
    ],
    "problem_solver": [
        "Let's think through this together. Can you describe the problem in more detail?",
        "That's a good challenge to tackle. What have you already tried?",
        "Let's break this down step by step. What's the most pressing part right now?",
    ],
    "goal_planner": [
        "That sounds like a worthwhile goal. What would success look like for you?",
        "Great — let's build a plan. What's the first small step you could take?",
        "I like that ambition. What's the biggest obstacle you foresee?",
    ],
}

_fallback_index = 0


async def chat_with_ollama(
    messages: list[dict],
    mode: str = "talk_reflect",
) -> tuple[str, bool]:
    """
    Send a conversation to Ollama and get a response.

    Args:
        messages: List of {"role": "user"|"assistant", "content": str} dicts.
        mode: Conversation mode key — determines the system prompt.

    Returns:
        (response_text, is_fallback) tuple.
        is_fallback is True when Ollama was unavailable and we used a scripted response.
    """
    system_prompt = SYSTEM_PROMPTS.get(mode, SYSTEM_PROMPTS["talk_reflect"])

    # Build the full message list with system prompt first
    full_messages = [{"role": "system", "content": system_prompt}] + messages

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/chat",
                json={
                    "model": settings.OLLAMA_MODEL,
                    "messages": full_messages,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "num_predict": 512,
                    },
                },
            )
            response.raise_for_status()
            data = response.json()
            text = data["message"]["content"].strip()
            return text, False

    except httpx.ConnectError:
        # Ollama is not running — use fallback
        return _get_fallback_response(mode), True
    except httpx.TimeoutException:
        return "I'm taking longer than usual to think. Please try again in a moment.", True
    except Exception:
        return _get_fallback_response(mode), True


def _get_fallback_response(mode: str) -> str:
    """Return a scripted fallback response for the given mode."""
    global _fallback_index
    responses = FALLBACK_RESPONSES.get(mode, FALLBACK_RESPONSES["talk_reflect"])
    response = responses[_fallback_index % len(responses)]
    _fallback_index += 1
    return f"[Offline mode — Luma AI is unavailable] {response}"


async def check_ollama_status() -> dict:
    """Check whether Ollama is running and the model is available."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            r.raise_for_status()
            models = [m["name"] for m in r.json().get("models", [])]
            model_ready = any(
                settings.OLLAMA_MODEL in m for m in models
            )
            return {
                "ollama_running": True,
                "model_ready": model_ready,
                "available_models": models,
                "required_model": settings.OLLAMA_MODEL,
            }
    except Exception:
        return {
            "ollama_running": False,
            "model_ready": False,
            "available_models": [],
            "required_model": settings.OLLAMA_MODEL,
        }
