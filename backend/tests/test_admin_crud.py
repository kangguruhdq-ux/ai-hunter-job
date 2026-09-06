import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import SessionLocal
from app.core.security import create_access_token, hash_password
from app.models.user import User
from app.models.job import Job, JobRequirement
from app.models.application import Application
from app.models.resume import Resume
from app.models.generated_document import GeneratedDocument

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

# ==================== ADMIN CRUD TESTS ====================

def test_admin_user_crud_full_lifecycle(client, db: Session):
    admin, admin_token = create_user_with_token(db, f"admin_{uuid.uuid4().hex[:6]}@jobhunter.ai", role="admin")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. CREATE USER
    new_email = f"new_candidate_{uuid.uuid4().hex[:6]}@example.com"
    create_res = client.post("/api/v1/admin/users", headers=admin_headers, json={
        "email": new_email,
        "full_name": "New Candidate",
        "password": "SecurePassword2026!",
        "role": "user",
        "is_active": True
    })
    assert create_res.status_code == 201
    created_user = create_res.json()
    assert created_user["email"] == new_email
    assert created_user["role"] == "user"
    assert created_user["is_active"] is True
    assert "password_hash" not in created_user
    user_id = created_user["id"]

    # 2. READ USER DETAIL & LIST
    detail_res = client.get(f"/api/v1/admin/users/{user_id}", headers=admin_headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == user_id

    list_res = client.get("/api/v1/admin/users?search=" + new_email, headers=admin_headers)
    assert list_res.status_code == 200
    assert list_res.json()["total"] >= 1

    # 3. UPDATE USER
    update_res = client.put(f"/api/v1/admin/users/{user_id}", headers=admin_headers, json={
        "full_name": "Updated Candidate Name",
        "role": "admin",
        "is_active": False
    })
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["full_name"] == "Updated Candidate Name"
    assert updated_data["role"] == "admin"
    assert updated_data["is_active"] is False

    # 4. DELETE USER
    del_res = client.delete(f"/api/v1/admin/users/{user_id}", headers=admin_headers)
    assert del_res.status_code == 204

    # Verify deleted
    verify_res = client.get(f"/api/v1/admin/users/{user_id}", headers=admin_headers)
    assert verify_res.status_code == 404

def test_admin_self_lockout_protection(client, db: Session):
    admin, admin_token = create_user_with_token(db, f"admin_lock_{uuid.uuid4().hex[:6]}@jobhunter.ai", role="admin")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Cannot deactivate self
    deact_res = client.put(f"/api/v1/admin/users/{admin.id}", headers=admin_headers, json={
        "is_active": False
    })
    assert deact_res.status_code == 400
    assert "tidak dapat menonaktifkan" in deact_res.json()["detail"].lower()

    # Cannot demote self
    demote_res = client.put(f"/api/v1/admin/users/{admin.id}", headers=admin_headers, json={
        "role": "user"
    })
    assert demote_res.status_code == 400
    assert "tidak dapat menurunkan" in demote_res.json()["detail"].lower()

    # Cannot delete self
    del_res = client.delete(f"/api/v1/admin/users/{admin.id}", headers=admin_headers)
    assert del_res.status_code == 400
    assert "tidak dapat menghapus akun admin anda sendiri" in del_res.json()["detail"].lower()

def test_normal_user_denied_from_all_admin_endpoints(client, db: Session):
    normal_user, normal_token = create_user_with_token(db, f"normal_{uuid.uuid4().hex[:6]}@test.com", role="user")
    normal_headers = {"Authorization": f"Bearer {normal_token}"}

    # Test various admin endpoints
    endpoints = [
        ("GET", "/api/v1/admin/stats"),
        ("GET", "/api/v1/admin/users"),
        ("POST", "/api/v1/admin/users"),
        ("GET", "/api/v1/admin/resumes"),
        ("GET", "/api/v1/admin/jobs"),
        ("POST", "/api/v1/admin/jobs"),
        ("GET", "/api/v1/admin/applications"),
        ("GET", "/api/v1/admin/documents"),
        ("GET", "/api/v1/admin/ai-activities"),
        ("GET", "/api/v1/admin/ai-activities/stats"),
        ("GET", "/api/v1/admin/system-health"),
        ("GET", "/api/v1/admin/settings"),
    ]

    for method, path in endpoints:
        if method == "GET":
            res = client.get(path, headers=normal_headers)
        elif method == "POST":
            res = client.post(path, headers=normal_headers, json={"email": "hacker@evil.com", "full_name": "Hacker", "password": "Password123!"})
        assert res.status_code == 403, f"Expected 403 on {method} {path}, got {res.status_code}"

def test_admin_job_crud(client, db: Session):
    admin, admin_token = create_user_with_token(db, f"admin_jobs_{uuid.uuid4().hex[:6]}@jobhunter.ai", role="admin")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. CREATE JOB
    job_payload = {
        "title": "Principal Distributed Systems Architect",
        "company": "Cloudflare",
        "location": "Remote",
        "employment_type": "Full-time",
        "salary_min": 210000,
        "salary_max": 275000,
        "raw_description": "Architect high-performance distributed edge microservices handling millions of req/s.",
        "required_skills": ["Rust", "Go", "Distributed Systems", "BGP"],
        "responsibilities": ["Lead network layer architecture", "Optimize edge cache latency"],
        "is_active": True
    }
    create_res = client.post("/api/v1/admin/jobs", headers=admin_headers, json=job_payload)
    assert create_res.status_code == 201
    job_id = create_res.json()["id"]
    assert create_res.json()["company"] == "Cloudflare"

    # 2. READ JOB DETAIL
    detail_res = client.get(f"/api/v1/admin/jobs/{job_id}", headers=admin_headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["title"] == "Principal Distributed Systems Architect"
    assert "Rust" in detail_res.json()["required_skills"]

    # 3. UPDATE JOB
    update_res = client.put(f"/api/v1/admin/jobs/{job_id}", headers=admin_headers, json={
        "location": "San Francisco, CA (Hybrid)",
        "salary_max": 300000
    })
    assert update_res.status_code == 200
    assert update_res.json()["location"] == "San Francisco, CA (Hybrid)"

    # 4. DELETE JOB
    del_res = client.delete(f"/api/v1/admin/jobs/{job_id}", headers=admin_headers)
    assert del_res.status_code == 204

    verify_res = client.get(f"/api/v1/admin/jobs/{job_id}", headers=admin_headers)
    assert verify_res.status_code == 404

def test_admin_application_and_document_management(client, db: Session):
    admin, admin_token = create_user_with_token(db, f"admin_apps_{uuid.uuid4().hex[:6]}@jobhunter.ai", role="admin")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # List applications
    apps_res = client.get("/api/v1/admin/applications", headers=admin_headers)
    assert apps_res.status_code == 200
    assert "total" in apps_res.json()

    # List documents
    docs_res = client.get("/api/v1/admin/documents", headers=admin_headers)
    assert docs_res.status_code == 200
    assert "total" in docs_res.json()

    # List resumes
    res_res = client.get("/api/v1/admin/resumes", headers=admin_headers)
    assert res_res.status_code == 200
    assert "total" in res_res.json()

    # AI activities & stats
    act_res = client.get("/api/v1/admin/ai-activities", headers=admin_headers)
    assert act_res.status_code == 200

    stats_res = client.get("/api/v1/admin/ai-activities/stats", headers=admin_headers)
    assert stats_res.status_code == 200
    assert "success_rate" in stats_res.json()
    assert "average_latency_ms" in stats_res.json()
