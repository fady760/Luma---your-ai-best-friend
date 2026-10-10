"""
Whisper Speech-to-Text Service

Uses faster-whisper for local, offline speech recognition.
Falls back gracefully if the model or library is unavailable.
"""

import io
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# Monkey-patch av.open to fix faster-whisper compatibility with newer PyAV versions
try:
    import av
    _original_av_open = av.open
    def _patched_av_open(*args, **kwargs):
        kwargs.pop("metadata_errors", None)
        return _original_av_open(*args, **kwargs)
    av.open = _patched_av_open
except ImportError:
    pass

# Whisper model size — "base" is a good balance of speed and accuracy.
# Options: tiny (~75MB), base (~150MB), small (~500MB), medium (~1.5GB)
WHISPER_MODEL_SIZE = "base"

_model = None
_model_loading = False


def _get_model():
    """Lazily load the Whisper model on first use."""
    global _model, _model_loading
    if _model is not None:
        return _model
    if _model_loading:
        return None

    _model_loading = True
    try:
        from faster_whisper import WhisperModel
        logger.info(f"Loading Whisper '{WHISPER_MODEL_SIZE}' model...")
        # Use CPU with int8 quantization — works on any machine without CUDA
        _model = WhisperModel(WHISPER_MODEL_SIZE, device="cpu", compute_type="int8")
        logger.info("Whisper model loaded successfully.")
        return _model
    except ImportError:
        logger.warning("faster-whisper not installed. Voice transcription unavailable.")
        return None
    except Exception as e:
        logger.error(f"Failed to load Whisper model: {e}")
        return None
    finally:
        _model_loading = False


def transcribe_audio(audio_bytes: bytes, file_extension: str = "webm") -> dict:
    """
    Transcribe audio bytes to text using Whisper.

    Args:
        audio_bytes: Raw audio file bytes (webm, wav, mp3, ogg, etc.)
        file_extension: Format hint for the audio data

    Returns:
        dict with:
          - text: transcribed text (str)
          - language: detected language code (str)
          - available: whether Whisper was used (bool)
          - segments: list of segment dicts with timing info
    """
    model = _get_model()

    if model is None:
        return {
            "text": "",
            "language": "en",
            "available": False,
            "error": "Whisper model not available",
            "segments": [],
        }

    try:
        audio_stream = io.BytesIO(audio_bytes)
        segments, info = model.transcribe(
            audio_stream,
            beam_size=5,
            language=None,  # auto-detect
            vad_filter=True,  # filter out silence
            vad_parameters={"min_silence_duration_ms": 500},
        )
        segment_list = []
        full_text_parts = []
        for seg in segments:
            full_text_parts.append(seg.text.strip())
            segment_list.append({
                "start": round(seg.start, 2),
                "end": round(seg.end, 2),
                "text": seg.text.strip(),
            })

        full_text = " ".join(full_text_parts).strip()
        return {
            "text": full_text,
            "language": info.language,
            "available": True,
            "segments": segment_list,
            "duration": round(info.duration, 2) if hasattr(info, "duration") else None,
        }

    except Exception as e:
        logger.error(f"Transcription error: {e}")
        return {
            "text": "",
            "language": "en",
            "available": False,
            "error": str(e),
            "segments": [],
        }


def get_whisper_status() -> dict:
    """Return the current status of the Whisper model."""
    try:
        from faster_whisper import WhisperModel
        library_available = True
    except ImportError:
        library_available = False

    return {
        "library_available": library_available,
        "model_loaded": _model is not None,
        "model_size": WHISPER_MODEL_SIZE,
        "device": "cpu",
        "compute_type": "int8",
    }
