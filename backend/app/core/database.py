from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from typing import Generator
from app.core.config import settings

# Configure connect_args based on DB dialect
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from sqlalchemy import text

def init_db():
    # Import all models before creating tables so metadata has all schemas
    import app.models  # noqa
    Base.metadata.create_all(bind=engine)

    # Auto-migrate newly added columns for SQLite
    if settings.DATABASE_URL.startswith("sqlite"):
        with engine.connect() as conn:
            try:
                res = conn.execute(text("PRAGMA table_info(candidate_profiles)")).fetchall()
                existing_cols = {row[1] for row in res}
                if len(existing_cols) > 0 and "organizations" not in existing_cols:
                    conn.execute(text("ALTER TABLE candidate_profiles ADD COLUMN organizations JSON DEFAULT '[]'"))
                    conn.commit()
            except Exception:
                pass
