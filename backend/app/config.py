"""
Luma Backend Configuration
Loads settings from environment variables / .env file.
"""

from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    # Security
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Database
    DATABASE_URL: str = "sqlite:///./luma.db"

    # Ollama
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "phi3.5"
    OLLAMA_EXECUTABLE: str = r"C:\Users\fadis\AppData\Local\Programs\Ollama\ollama.exe"

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    model_config = {
        "env_file": Path(__file__).parent.parent / ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
