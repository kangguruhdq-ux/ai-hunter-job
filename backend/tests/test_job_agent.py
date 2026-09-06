import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import SessionLocal
from app.agents.job_agent import JobAgent
from app.services.job_service import JobService
from app.schemas.job import JobCreatePasted, JobCreateManual

@pytest.fixture(scope="module")
def client():
    return TestClient(app)

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

@pytest.mark.asyncio
async def test_job_agent_analysis():
    job_text = (
        "Principal Software Engineer at Netflix\n"
        "Looking for an engineer to architect streaming telemetry. "
        "Required: Python, Distributed Systems, Kafka, AWS. "
        "Preferred: Go, Redis, Docker, Kubernetes. 7+ years experience."
    )
    result = await JobAgent.analyze_job_text(job_text)
    assert result.company == "Netflix" or "Software Engineer" in result.title
    assert len(result.required_skills) > 0
    assert len(result.responsibilities) > 0

@pytest.mark.asyncio
async def test_create_pasted_job_and_duplicate(db: Session):
    data = JobCreatePasted(
        title="Site Reliability Engineer",
        company="GitHub",
        raw_text="Join GitHub as SRE. Requirements: Python, Linux, Kubernetes, Terraform."
    )
    job1 = await JobService.create_from_pasted(db=db, data=data)
    assert job1.id is not None
    assert job1.title == "Site Reliability Engineer"
    assert job1.company == "GitHub"
    assert job1.requirements is not None

    # Test duplicate detection
    job2 = await JobService.create_from_pasted(db=db, data=data)
    assert job2.id == job1.id  # Returns existing job without creating duplicate

def test_manual_job_creation(db: Session):
    data = JobCreateManual(
        title="DevOps Specialist",
        company="HashiCorp",
        location="Remote",
        employment_type="Full-time",
        raw_description="HashiCorp infrastructure team",
        required_skills=["Terraform", "Vault", "AWS"],
        preferred_skills=["Docker", "Go"],
        required_experience_years=4.0,
        responsibilities=["Maintain cloud infrastructure modules"]
    )
    job = JobService.create_manual(db=db, data=data)
    assert job.id is not None
    assert job.company == "HashiCorp"
    assert "Terraform" in job.requirements.required_skills

def test_jobs_api_flow(client):
    # Test Seed
    seed_res = client.post("/api/v1/jobs/seed")
    assert seed_res.status_code == 200
    jobs = seed_res.json()
    assert len(jobs) >= 4

    # Test List
    list_res = client.get("/api/v1/jobs")
    assert list_res.status_code == 200
    all_jobs = list_res.json()
    assert len(all_jobs) >= 4

    # Test Search
    search_res = client.get("/api/v1/jobs?search=Stripe")
    assert search_res.status_code == 200
    stripe_jobs = search_res.json()
    assert len(stripe_jobs) >= 1
    assert any("Stripe" in j["company"] for j in stripe_jobs)

    # Test Get Single Job
    target_id = stripe_jobs[0]["id"]
    get_res = client.get(f"/api/v1/jobs/{target_id}")
    assert get_res.status_code == 200
    single_job = get_res.json()
    assert single_job["id"] == target_id
    assert single_job["requirements"] is not None
