import pytest
from app.core.database import Base, engine, SessionLocal
from app.core.config import settings
from app.ai.providers.factory import reset_ai_provider
import app.models  # Ensure all models are registered with Base.metadata

@pytest.fixture(scope="session", autouse=True)
def configure_test_session():
    """Ensure database schema is created and isolate AI provider for test suite."""
    Base.metadata.create_all(bind=engine)
    orig_provider = settings.AI_PROVIDER
    # Tests use deterministic MockProvider to avoid burning external API quotas
    settings.AI_PROVIDER = "mock"
    reset_ai_provider()
    yield
    settings.AI_PROVIDER = orig_provider
    reset_ai_provider()
    Base.metadata.create_all(bind=engine)

@pytest.fixture(autouse=True)
def ensure_tables_exist():
    """Ensure tables exist before every single test."""
    Base.metadata.create_all(bind=engine)
