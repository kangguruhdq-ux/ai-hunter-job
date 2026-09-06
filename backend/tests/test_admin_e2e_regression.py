import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.core.database import SessionLocal
from app.core.security import create_access_token, hash_password
from app.models import (
    User,
    Resume,
    Job,
    Application,
    GeneratedDocument,
    AIActivity,
)
from app.ai.providers.mock import MockProvider

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

def create_user_with_token(db: Session, email: str, role: str = "user", is_active: bool = True) -> tuple[User, str]:
    user = User(
        id=str(uuid.uuid4()),
        email=email,
        full_name=f"User {email.split('@')[0]}",
        password_hash=hash_password("StrongPassword123!"),
        role=role,
        is_active=is_active
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return user, token

def test_public_login_and_auth_security(client: TestClient, db: Session):
    """Verify that public login rejects invalid credentials and non-admins cannot access admin stats."""
    # Invalid login attempt
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@jobhunter.ai", "password": "WrongPassword!"}
    )
    assert res.status_code == 401

    # Standard user cannot access admin routes
    user, user_token = create_user_with_token(db, f"standard_{uuid.uuid4().hex[:6]}@jobhunter.ai", role="user")
    headers = {"Authorization": f"Bearer {user_token}"}

    admin_res = client.get("/api/v1/admin/stats", headers=headers)
    assert admin_res.status_code == 403
    assert "administrator" in admin_res.json()["detail"].lower()

def test_admin_full_lifecycle_and_self_lockout(client: TestClient, db: Session):
    """Verify end-to-end admin capabilities: CRUD, self-lockout, and job deletion."""
    # 1. Superadmin setup
    admin, admin_token = create_user_with_token(db, f"superadmin_{uuid.uuid4().hex[:6]}@jobhunter.ai", role="admin")
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Access stats
    stats_res = client.get("/api/v1/admin/stats", headers=headers)
    assert stats_res.status_code == 200
    assert stats_res.json()["admin_users"] >= 1

    # 3. Create a managed user
    new_user_res = client.post(
        "/api/v1/admin/users",
        json={
            "email": f"managed_{uuid.uuid4().hex[:6]}@jobhunter.ai",
            "full_name": "Managed User",
            "password": "InitialPassword123!",
            "role": "user",
            "is_active": True
        },
        headers=headers
    )
    assert new_user_res.status_code == 201
    managed_user_id = new_user_res.json()["id"]

    # 4. Self-lockout check: Admin cannot deactivate self
    deact_self = client.put(
        f"/api/v1/admin/users/{admin.id}",
        json={"is_active": False},
        headers=headers
    )
    assert deact_self.status_code == 400
    assert "tidak dapat menonaktifkan" in deact_self.json()["detail"].lower()

    # Self-lockout check: Admin cannot demote self
    demote_self = client.put(
        f"/api/v1/admin/users/{admin.id}",
        json={"role": "user"},
        headers=headers
    )
    assert demote_self.status_code == 400
    assert "tidak dapat menurunkan" in demote_self.json()["detail"].lower()

    # Self-lockout check: Admin cannot delete self
    del_self = client.delete(f"/api/v1/admin/users/{admin.id}", headers=headers)
    assert del_self.status_code == 400
    assert "tidak dapat menghapus" in del_self.json()["detail"].lower()

    # 5. Create and manage a Job
    job_res = client.post(
        "/api/v1/admin/jobs",
        json={
            "title": "Principal AI Architect",
            "company": "DeepMind Partner",
            "location": "Remote",
            "employment_type": "Full-time",
            "raw_description": "Architect autonomous AI workflows with Python and FastAPI.",
            "required_skills": ["Python", "FastAPI", "Gemini", "Next.js"],
            "is_active": True
        },
        headers=headers
    )
    assert job_res.status_code == 201
    job_id = job_res.json()["id"]

    # 6. Admin can update and delete job
    update_job_res = client.put(
        f"/api/v1/admin/jobs/{job_id}",
        json={"location": "Global Remote"},
        headers=headers
    )
    assert update_job_res.status_code == 200
    assert update_job_res.json()["location"] == "Global Remote"

    # Delete the job
    del_job_res = client.delete(f"/api/v1/admin/jobs/{job_id}", headers=headers)
    assert del_job_res.status_code == 204

    # 7. Clean up managed user
    del_user_res = client.delete(f"/api/v1/admin/users/{managed_user_id}", headers=headers)
    assert del_user_res.status_code == 204

@pytest.mark.asyncio
async def test_gemini_fallback_e2e_observability(client: TestClient, db: Session):
    """Verify Gemini multi-fallback simulation, telemetry recording, and admin health."""
    provider = MockProvider(simulation_mode="primary_429")

    result = await provider.analyze_job("Senior Fullstack Engineer at Stripe")
    assert result is not None

    telemetry = provider.last_telemetry
    assert telemetry.get("fallback_used") is True
    assert "gemini-2.5-flash" in telemetry.get("successful_model")
    assert len(telemetry.get("attempted_models")) == 2

    # Verify System Health endpoint shows multi-fallback status
    admin, admin_token = create_user_with_token(db, f"health_{uuid.uuid4().hex[:6]}@jobhunter.ai", role="admin")
    headers = {"Authorization": f"Bearer {admin_token}"}

    health_res = client.get("/api/v1/admin/system-health", headers=headers)
    assert health_res.status_code == 200
    health_data = health_res.json()
    assert health_data["status"] == "operational"
    assert "fallback_models" in health_data["ai_provider"]
    assert len(health_data["ai_provider"]["fallback_models"]) >= 1
