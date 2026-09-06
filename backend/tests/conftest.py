import pytest
from app.core.database import Base, engine, SessionLocal, init_db
from app.core.config import settings
from app.ai.providers.factory import reset_ai_provider
import app.models  # Ensure all models are registered with Base.metadata

@pytest.fixture(scope="session", autouse=True)
def configure_test_session():
    """Ensure database schema is created and isolate AI provider for test suite."""
    init_db()
    orig_provider = settings.AI_PROVIDER
    # Tests use deterministic MockProvider to avoid burning external API quotas
    settings.AI_PROVIDER = "mock"
    reset_ai_provider()
    yield
    settings.AI_PROVIDER = orig_provider
    reset_ai_provider()
    init_db()

@pytest.fixture(autouse=True)
def ensure_tables_exist():
    """Ensure tables exist before every single test."""
    Base.metadata.create_all(bind=engine)

from app.main import app
from app.api.deps import get_current_user, get_current_active_user
from app.services.resume_service import ResumeService

@pytest.fixture(autouse=True)
def auto_authenticate_legacy_tests(request):
    """Automatically authenticate legacy tests that don't pass explicit Bearer tokens."""
    if "test_auth" in request.module.__name__:
        yield
        return

    with SessionLocal() as db:
        user = ResumeService.get_or_create_default_user(db)
        app.dependency_overrides[get_current_user] = lambda: user
        app.dependency_overrides[get_current_active_user] = lambda: user
    try:
        yield
    finally:
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_current_active_user, None)


