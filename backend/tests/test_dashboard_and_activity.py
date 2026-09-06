import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import SessionLocal
from app.services.job_service import JobService
from app.services.profile_service import ProfileService

@pytest.fixture(scope="module")
def client():
    return TestClient(app)

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

def test_dashboard_stats_api(client, db: Session):
    JobService.seed_sample_jobs(db)

    res = client.get("/api/v1/ai/dashboard-stats")
    assert res.status_code == 200
    stats = res.json()
    assert "recommended_jobs_count" in stats
    assert "applications_count" in stats
    assert "interviews_count" in stats
    assert "offers_count" in stats
    assert "average_match_score" in stats
    assert "top_matches" in stats
    assert stats["recommended_jobs_count"] >= 4

def test_ai_activity_api(client):
    res = client.get("/api/v1/ai/activity")
    assert res.status_code == 200
    activities = res.json()
    assert isinstance(activities, list)
    if activities:
        first = activities[0]
        assert "agent_name" in first
        assert "action" in first
        assert "status" in first

def test_ai_evaluation_api(client):
    res = client.get("/api/v1/ai/evaluation")
    assert res.status_code == 200
    eval_data = res.json()
    assert "total_ai_operations" in eval_data
    assert "success_rate_percent" in eval_data
    assert "average_latency_ms" in eval_data
    assert "anti_hallucination_pass_rate_percent" in eval_data

def test_orchestrator_pipeline_api(client, db: Session):
    JobService.seed_sample_jobs(db)
    jobs = JobService.list_jobs(db)
    assert len(jobs) > 0
    job = jobs[0]

    # Run orchestrator pipeline
    pipe_res = client.post(f"/api/v1/ai/pipeline/{job.id}")
    assert pipe_res.status_code == 200
    data = pipe_res.json()
    assert data["status"] == "success"
    assert "match_score" in data
    assert "tailored_resume_id" in data
    assert "cover_letter_id" in data
