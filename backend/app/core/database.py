import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from typing import Generator
from app.core.config import settings

# Configure connect_args based on DB dialect and ensure directory exists
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    if db_path and not db_path.startswith(":memory:"):
        db_dir = os.path.dirname(os.path.abspath(db_path))
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)

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

def init_db():
    # Import all models before creating tables so metadata has all schemas
    import app.models  # noqa
    Base.metadata.create_all(bind=engine)

    # Auto-migrate newly added columns for SQLite
    if settings.DATABASE_URL.startswith("sqlite"):
        with engine.connect() as conn:
            try:
                # candidate_profiles: organizations
                res = conn.execute(text("PRAGMA table_info(candidate_profiles)")).fetchall()
                existing_cols = {row[1] for row in res}
                if len(existing_cols) > 0 and "organizations" not in existing_cols:
                    conn.execute(text("ALTER TABLE candidate_profiles ADD COLUMN organizations JSON DEFAULT '[]'"))
                    conn.commit()

                # users: password_hash, role, is_active
                res_u = conn.execute(text("PRAGMA table_info(users)")).fetchall()
                user_cols = {row[1] for row in res_u}
                if len(user_cols) > 0:
                    if "password_hash" not in user_cols:
                        conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)"))
                    if "role" not in user_cols:
                        conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user'"))
                    if "is_active" not in user_cols:
                        conn.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1"))
                    conn.commit()

                # job_matches: user_id
                res_m = conn.execute(text("PRAGMA table_info(job_matches)")).fetchall()
                match_cols = {row[1] for row in res_m}
                if len(match_cols) > 0 and "user_id" not in match_cols:
                    conn.execute(text("ALTER TABLE job_matches ADD COLUMN user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE"))
                    conn.commit()
            except Exception:
                pass

    # Ensure default admin account exists
    try:
        from app.services.auth_service import AuthService
        with SessionLocal() as db:
            AuthService.seed_initial_admin(db)
    except Exception:
        pass


