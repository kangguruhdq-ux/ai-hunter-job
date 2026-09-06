import pytest
from app.core.database import Base, engine, SessionLocal
import app.models  # Ensure all models are registered with Base.metadata

@pytest.fixture(scope="session", autouse=True)
def initialize_test_database():
    """Ensure database schema is created for the entire test session."""
    Base.metadata.create_all(bind=engine)
    yield
    # Keep database ready or clean up at the end of the entire session
    Base.metadata.create_all(bind=engine)

@pytest.fixture(autouse=True)
def ensure_tables_exist():
    """Ensure tables exist before every single test."""
    Base.metadata.create_all(bind=engine)
