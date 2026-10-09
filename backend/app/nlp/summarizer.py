"""
Journal Summarizer

Generates structured journal drafts from conversation messages.
Uses the local LLM if available, falls back to extractive summarization.
"""

from typing import Optional


SUMMARIZATION_PROMPT = """You are helping a user create a personal journal entry from a conversation they had with an AI companion.

Analyze the conversation below and write a structured journal summary in the FIRST PERSON (as if the user is writing it).

The summary must include exactly these sections:
1. **Main Topics** — what the user talked about (2-4 bullet points)
2. **Challenges & Concerns** — any worries, problems, or difficulties mentioned
3. **Possible Next Steps** — any actions or intentions the user mentioned
4. **Reflection Question** — one thoughtful question for the user to reflect on

Rules:
- Only include what was actually discussed. Do NOT invent emotions, diagnoses, or facts.
- Write from the user's perspective ("I talked about...", "I'm concerned about...")
- Keep it concise — this is a personal journal, not a report
- The reflection question should be open-ended and encouraging

Conversation:
{conversation}

Write the journal entry now:"""


async def generate_journal_draft(
    messages: list[dict],
    mode: str = "talk_reflect",
) -> tuple[str, bool]:
    """
    Generate a structured journal draft from conversation messages.

    Args:
        messages: List of {"role": ..., "content": ...} dicts
        mode: conversation mode (for context)

    Returns:
        (draft_text, is_fallback) tuple
    """
    # Build conversation text for the prompt
    conv_text = "\n".join(
        f"{'User' if m['role'] == 'user' else 'Luma'}: {m['content']}"
        for m in messages
        if m["role"] in ("user", "assistant")
    )

    if not conv_text.strip():
        return "No conversation content to summarize.", True

    # Try the local LLM first
    try:
        from app.ai.llm import chat_with_ollama
        prompt = SUMMARIZATION_PROMPT.format(conversation=conv_text)
        draft, is_fallback = await chat_with_ollama(
            [{"role": "user", "content": prompt}],
            mode="talk_reflect",
        )
        if not is_fallback:
            return draft, False
    except Exception:
        pass

    # Extractive fallback — pick key sentences from user messages
    return _extractive_summary(messages), True


def _extractive_summary(messages: list[dict]) -> str:
    """
    Simple extractive summarization as a fallback.
    Picks the longest user messages as key content.
    """
    user_msgs = [m["content"] for m in messages if m["role"] == "user"]
    if not user_msgs:
        return "No user messages found in this conversation."

    # Sort by length and pick top 3-5 as most substantive
    key_msgs = sorted(user_msgs, key=len, reverse=True)[:5]

    lines = ["**[Draft generated without AI — please edit before saving]**\n"]
    lines.append("**Main Topics**")
    for msg in key_msgs[:3]:
        snippet = msg[:150].strip()
        if len(msg) > 150:
            snippet += "…"
        lines.append(f"- {snippet}")

    lines.append("\n**Challenges & Concerns**")
    lines.append("- Please review and fill in any challenges you discussed.")

    lines.append("\n**Possible Next Steps**")
    lines.append("- Please add any actions or plans you mentioned.")

    lines.append("\n**Reflection Question**")
    lines.append("- What was the most important thing on your mind during this conversation?")

    return "\n".join(lines)
