import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import SessionLocal
from app.services.job_service import JobService
from app.services.application_service import ApplicationService
from app.schemas.application import ApplicationCreate, ApplicationUpdate, VALID_STATUSES

@pytest.fixture(scope="module")
def client():
    return TestClient(app)

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

def test_application_lifecycle(db: Session, client):
    JobService.seed_sample_jobs(db)
    jobs = JobService.list_jobs(db)
    assert len(jobs) > 0
    job = jobs[0]

    # 1. Create Application (Wishlist)
    create_res = client.post("/api/v1/applications", json={
        "job_id": job.id,
        "status": "Wishlist",
        "notes": "Interested in distributed team culture."
    })
    assert create_res.status_code == 201
    app_data = create_res.json()
    assert app_data["status"] == "Wishlist"
    app_id = app_data["id"]

    # 2. Update status along lifecycle: Applied -> Interview -> Offer
    stages = ["Applied", "Screening", "Interview", "Offer"]
    for stage in stages:
        patch_res = client.patch(f"/api/v1/applications/{app_id}", json={
            "status": stage,
            "notes": f"Moved to {stage}"
        })
        assert patch_res.status_code == 200
        assert patch_res.json()["status"] == stage

    # 3. Add interview date and salary offer
    interview_time = datetime.utcnow().isoformat()
    patch_meta = client.patch(f"/api/v1/applications/{app_id}", json={
        "salary_offered": 195000,
        "notes": "Received written offer!"
    })
    assert patch_meta.status_code == 200
    assert patch_meta.json()["salary_offered"] == 195000

    # 4. Check Kanban board contains the application in Offer column
    kanban_res = client.get("/api/v1/applications/kanban")
    assert kanban_res.status_code == 200
    columns = kanban_res.json()
    assert len(columns) == len(VALID_STATUSES)

    offer_col = next((c for c in columns if c["status"] == "Offer"), None)
    assert offer_col is not None
    assert any(a["id"] == app_id for a in offer_col["applications"])

    # 5. Check Delete
    del_res = client.delete(f"/api/v1/applications/{app_id}")
    assert del_res.status_code == 204
