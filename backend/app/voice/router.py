"""
Voice API Routes

Endpoints for speech-to-text transcription and voice status.
TTS is handled entirely in the browser using the Web Speech API.
"""

import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse

from app.auth.dependencies import get_current_user
from app.models.db_models import User

router = APIRouter(prefix="/api/voice", tags=["Voice"])

SUPPORTED_AUDIO_TYPES = {
    "audio/webm", "audio/webm;codecs=opus", "audio/ogg",
    "audio/ogg;codecs=opus", "audio/wav", "audio/mpeg",
    "audio/mp4", "audio/x-m4a", "application/octet-stream",
}


@router.get("/status")
def voice_status(current_user: User = Depends(get_current_user)):
    """Check whether Whisper is available for server-side transcription."""
    from app.voice.whisper_stt import get_whisper_status
    return get_whisper_status()


@router.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Transcribe an audio file to text using Whisper.

    Accepts multipart/form-data with an 'audio' file field.
    Supported formats: webm, ogg, wav, mp3, mp4.

    Returns:
        {
          "text": "transcribed text",
          "language": "en",
          "available": true,
          "segments": [...]
        }
    """
    # Read audio bytes
    audio_bytes = await audio.read()

    if not audio_bytes:
        raise HTTPException(400, "Audio file is empty")

    if len(audio_bytes) > 25 * 1024 * 1024:  # 25 MB limit
        raise HTTPException(400, "Audio file too large (max 25MB)")

    # Determine file extension from content type
    content_type = audio.content_type or "audio/webm"
    ext_map = {
        "audio/webm": "webm",
        "audio/ogg": "ogg",
        "audio/wav": "wav",
        "audio/mpeg": "mp3",
        "audio/mp4": "mp4",
        "audio/x-m4a": "m4a",
    }
    ext = ext_map.get(content_type.split(";")[0], "webm")

    from app.voice.whisper_stt import transcribe_audio
    result = transcribe_audio(audio_bytes, file_extension=ext)

    if not result["available"]:
        # Whisper not ready yet — client should fall back to browser STT
        return JSONResponse(
            status_code=503,
            content={
                "text": "",
                "available": False,
                "error": result.get("error", "Whisper model not ready"),
                "fallback": "browser",
            }
        )

    return result
