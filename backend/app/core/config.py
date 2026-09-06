import os
from pathlib import Path
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_current_dir = Path(__file__).resolve().parent  # app/core
_backend_dir = _current_dir.parent.parent       # backend
_root_dir = _backend_dir.parent                # project root

_env_files = [
    str(_backend_dir / ".env"),
    str(_root_dir / ".env"),
    ".env",
]

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    PROJECT_NAME: str = "JobHunter AI"
    API_V1_STR: str = "/api/v1"

    # Security & Authentication Configuration
    JWT_SECRET_KEY: str = "jobhunter-ai-secure-jwt-secret-key-2026-production-ready"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # AI Provider Configuration
    AI_PROVIDER: str = "mock"  # "gemini" or "mock"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.7-flash"
    GEMINI_FALLBACK_MODELS: str = "gemini-2.5-flash,gemini-2.0-flash,gemini-1.5-flash"
    GEMINI_FALLBACK_MODEL: str = "gemini-2.0-flash"

    # Initial Administrator Provisioning
    INITIAL_ADMIN_EMAIL: str = "admin@jobhunter.ai"
    INITIAL_ADMIN_PASSWORD: str = "AdminJobHunter2026!"

    @property
    def gemini_fallback_models_list(self) -> List[str]:
        raw = self.GEMINI_FALLBACK_MODELS or self.GEMINI_FALLBACK_MODEL
        models = [m.strip() for m in raw.split(",") if m.strip()]
        # Filter duplicates while preserving order
        seen = set()
        deduped = []
        for m in models:
            if m not in seen and m != self.GEMINI_MODEL:
                seen.add(m)
                deduped.append(m)
        return deduped

    # Database Configuration
    DATABASE_URL: str = "sqlite:///./data/jobhunter.db"

    # Server Configuration
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ]

    # File uploads
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=_env_files,
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
