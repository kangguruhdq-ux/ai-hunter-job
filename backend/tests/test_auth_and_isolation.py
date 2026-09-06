import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.resume import Resume
from app.models.job import Job
from app.models.generated_document import GeneratedDocument
from app.models.application import Application
from app.core.security import hash_password, create_access_token
from app.services.job_service import JobService

@pytest.fixture(scope="module")
def client():
    return TestClient(app)

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

@pytest.fixture(scope="module", autouse=True)
def cleanup_isolation_test_users():
    with SessionLocal() as db:
        db.query(User).filter(User.email.in_([
            "user_a_iso@example.com",
            "user_b_iso@example.com",
            "admin_iso@example.com"
        ])).delete(synchronize_session=False)
        db.commit()
    yield
    with SessionLocal() as db:
        db.query(User).filter(User.email.in_([
            "user_a_iso@example.com",
            "user_b_iso@example.com",
            "admin_iso@example.com"
        ])).delete(synchronize_session=False)
        db.commit()

@pytest.fixture(scope="module")
def user_a(client):
    res = client.post("/api/v1/auth/register", json={
        "email": "user_a_iso@example.com",
        "full_name": "User Alpha",
        "password": "Password123!"
    })
    assert res.status_code == 201
    return res.json()

@pytest.fixture(scope="module")
def user_b(client):
    res = client.post("/api/v1/auth/register", json={
        "email": "user_b_iso@example.com",
        "full_name": "User Beta",
        "password": "Password123!"
    })
    assert res.status_code == 201
    return res.json()

@pytest.fixture
def admin_user(db: Session):

    admin = User(
        email="admin_iso@example.com",
        full_name="Admin Isolation",
        password_hash=hash_password("AdminPassword123!"),
        role="admin",
        is_active=True
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    token = create_access_token({
        "sub": admin.id,
        "email": admin.email,
        "role": admin.role,
        "name": admin.full_name
    })
    return {"user": admin, "token": token}


def test_resume_isolation_between_users(client, db: Session, user_a, user_b):
    # 1. Create a resume belonging to User A
    resume_a = Resume(
        user_id=user_a["user"]["id"],
        file_name="alpha_resume.pdf",
        file_type="pdf",
        file_size=1024,
        storage_path="/tmp/alpha_resume.pdf",
        raw_text="Alpha experience in Python and Cloud Architecture",
        status="parsed"
    )
    db.add(resume_a)
    db.commit()
    db.refresh(resume_a)

    token_a = user_a["access_token"]
    token_b = user_b["access_token"]

    # User A can access resume A
    res_a = client.get(f"/api/v1/resume/{resume_a.id}", headers={"Authorization": f"Bearer {token_a}"})
    assert res_a.status_code == 200
    assert res_a.json()["id"] == resume_a.id

    # User B CANNOT access resume A (404 Not Found)
    res_b = client.get(f"/api/v1/resume/{resume_a.id}", headers={"Authorization": f"Bearer {token_b}"})
    assert res_b.status_code == 404

    # User B's list of resumes should not contain resume A
    list_b = client.get("/api/v1/resume", headers={"Authorization": f"Bearer {token_b}"})
    assert list_b.status_code == 200
    b_resume_ids = [r["id"] for r in list_b.json()]
    assert resume_a.id not in b_resume_ids


def test_application_isolation_between_users(client, db: Session, user_a, user_b):
    JobService.seed_sample_jobs(db)
    jobs = JobService.list_jobs(db)
    assert len(jobs) > 0
    job = jobs[0]

    token_a = user_a["access_token"]
    token_b = user_b["access_token"]

    # 1. User A creates application
    create_res = client.post("/api/v1/applications", json={
        "job_id": job.id,
        "status": "Applied",
        "notes": "Alpha secret interview note"
    }, headers={"Authorization": f"Bearer {token_a}"})
    assert create_res.status_code == 201
    app_a_id = create_res.json()["id"]

    # 2. User B tries to view application A
    view_res = client.get(f"/api/v1/applications/{app_a_id}", headers={"Authorization": f"Bearer {token_b}"})
    assert view_res.status_code == 404

    # 3. User B tries to update application A
    patch_res = client.patch(f"/api/v1/applications/{app_a_id}", json={
        "status": "Offer",
        "notes": "Hacked notes"
    }, headers={"Authorization": f"Bearer {token_b}"})
    assert patch_res.status_code == 404

    # 4. User B tries to delete application A
    del_res = client.delete(f"/api/v1/applications/{app_a_id}", headers={"Authorization": f"Bearer {token_b}"})
    assert del_res.status_code == 404

    # 5. Verify User B kanban board does not include application A
    kanban_b = client.get("/api/v1/applications/kanban", headers={"Authorization": f"Bearer {token_b}"})
    assert kanban_b.status_code == 200
    for col in kanban_b.json():
        for app_item in col["applications"]:
            assert app_item["id"] != app_a_id


def test_document_isolation_between_users(client, db: Session, user_a, user_b):
    JobService.seed_sample_jobs(db)
    jobs = JobService.list_jobs(db)
    job = jobs[0]

    # Create document owned by User A
    doc_a = GeneratedDocument(
        user_id=user_a["user"]["id"],
        job_id=job.id,
        document_type="cover_letter",
        title="Cover Letter for Alpha",
        content="Confidential alpha letter content"
    )
    db.add(doc_a)
    db.commit()
    db.refresh(doc_a)

    token_a = user_a["access_token"]
    token_b = user_b["access_token"]

    # User A can get document A
    res_a = client.get(f"/api/v1/documents/{doc_a.id}", headers={"Authorization": f"Bearer {token_a}"})
    assert res_a.status_code == 200
    assert res_a.json()["id"] == doc_a.id

    # User B CANNOT get document A
    res_b = client.get(f"/api/v1/documents/{doc_a.id}", headers={"Authorization": f"Bearer {token_b}"})
    assert res_b.status_code == 404

    # User B CANNOT update document A
    update_res = client.put(f"/api/v1/documents/{doc_a.id}", json={
        "title": "Hacked Title",
        "content": "Malicious content"
    }, headers={"Authorization": f"Bearer {token_b}"})
    assert update_res.status_code == 404

    # User B CANNOT download document A
    dl_res = client.get(f"/api/v1/documents/{doc_a.id}/download", headers={"Authorization": f"Bearer {token_b}"})
    assert dl_res.status_code == 404

    # User B documents list does NOT contain document A
    list_res = client.get("/api/v1/documents", headers={"Authorization": f"Bearer {token_b}"})
    assert list_res.status_code == 200
    b_doc_ids = [d["id"] for d in list_res.json()]
    assert doc_a.id not in b_doc_ids


def test_unauthenticated_requests_blocked(client):
    # Endpoints must block unauthenticated access with 401
    assert client.get("/api/v1/resume").status_code == 401
    assert client.get("/api/v1/candidate/profile").status_code == 401
    assert client.get("/api/v1/candidate/preferences").status_code == 401
    assert client.get("/api/v1/applications").status_code == 401
    assert client.get("/api/v1/applications/kanban").status_code == 401
    assert client.get("/api/v1/documents").status_code == 401
    assert client.get("/api/v1/ai/dashboard-stats").status_code == 401
    assert client.get("/api/v1/admin/stats").status_code == 401

def test_admin_rbac_protection(client, user_a, admin_user):
    token_user = user_a["access_token"]
    token_admin = admin_user["token"]

    # 1. Normal user cannot access admin stats (403 Forbidden)
    res_user = client.get("/api/v1/admin/stats", headers={"Authorization": f"Bearer {token_user}"})
    assert res_user.status_code == 403

    # 2. Normal user cannot access admin users list (403 Forbidden)
    res_user_list = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {token_user}"})
    assert res_user_list.status_code == 403

    # 3. Admin user can access admin stats (200 OK)
    res_admin = client.get("/api/v1/admin/stats", headers={"Authorization": f"Bearer {token_admin}"})
    assert res_admin.status_code == 200
    stats = res_admin.json()
    assert "total_users" in stats
    assert "active_users" in stats
    assert "total_resumes" in stats
    assert "total_jobs" in stats

    # 4. Admin user can list users
    res_admin_users = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {token_admin}"})
    assert res_admin_users.status_code == 200
    users_data = res_admin_users.json()
    assert users_data["total"] >= 1
    assert any(u["email"] == user_a["user"]["email"] for u in users_data["users"])

    # 5. Admin user can toggle user active status
    user_id = user_a["user"]["id"]
    patch_res = client.patch(f"/api/v1/admin/users/{user_id}/status", json={
        "is_active": False
    }, headers={"Authorization": f"Bearer {token_admin}"})
    assert patch_res.status_code == 200
    assert patch_res.json()["is_active"] is False

    # 6. Admin cannot deactivate own account (400 Bad Request)
    self_patch = client.patch(f"/api/v1/admin/users/{admin_user['user'].id}/status", json={
        "is_active": False
    }, headers={"Authorization": f"Bearer {token_admin}"})
    assert self_patch.status_code == 400

    # 7. Re-activate User A
    reactivate_res = client.patch(f"/api/v1/admin/users/{user_id}/status", json={
        "is_active": True
    }, headers={"Authorization": f"Bearer {token_admin}"})
    assert reactivate_res.status_code == 200
    assert reactivate_res.json()["is_active"] is True

