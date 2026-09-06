import pytest
from app.core.config import settings

def test_settings_initialization():
    assert settings.PROJECT_NAME == "JobHunter AI"
    assert settings.API_V1_STR == "/api/v1"
    assert settings.AI_PROVIDER in ["gemini", "mock"]
    assert settings.BACKEND_PORT == 8000

def test_cors_origins():
    assert isinstance(settings.CORS_ORIGINS, list)
    assert len(settings.CORS_ORIGINS) > 0
