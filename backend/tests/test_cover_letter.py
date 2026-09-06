import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import SessionLocal
from app.models.ai_activity import AIActivity
from app.agents.cover_letter_agent import CoverLetterAgent
from app.schemas.candidate_profile import CandidateProfileData, ExperienceItem
from app.schemas.job import JobAnalysisData
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

@pytest.mark.asyncio
async def test_cover_letter_agent_grounding():
    profile = CandidateProfileData(
        name="Marcus Vance",
        headline="Senior Systems Engineer",
        summary="Backend distributed systems developer specializing in Python and high-throughput streams.",
        skills=["Python", "FastAPI", "PostgreSQL", "Kafka", "Docker"],
        programming_languages=["Python"],
        tools=["Kafka", "Docker"],
        experience=[
            ExperienceItem(
                title="Staff Backend Engineer",
                company="Nexus Infrastructure",
                location="Remote",
                start_date="2021-01",
                end_date=None,
                current=True,
                description="Engineered transactional microservices.",
                achievements=["Processed 50k requests/second with 99.99% uptime."]
            )
        ],
        years_of_experience=6.0
    )

    job = JobAnalysisData(
        title="Senior Backend Engineer",
        company="Stripe",
        required_skills=["Python", "FastAPI", "Distributed Systems"],
        responsibilities=["Build high scale financial services"]
    )

    letter = await CoverLetterAgent.generate(
        profile=profile,
        job=job,
        company="Stripe",
        job_title="Senior Backend Engineer"
    )

    assert letter.anti_hallucination_verified is True
    assert "Marcus Vance" in letter.content
    assert "Stripe" in letter.content
    assert len(letter.content) > 100

    # Verification function unit test
    is_valid, reasons = CoverLetterAgent.verify_grounding(profile, letter.content, "Stripe")
    assert is_valid is True
    assert len(reasons) == 0

def test_cover_letter_api_flow(client, db: Session):
    JobService.seed_sample_jobs(db)
    jobs = JobService.list_jobs(db)
    assert len(jobs) > 0
    job = jobs[0]

    # Generate cover letter
    gen_res = client.post(f"/api/v1/jobs/{job.id}/cover-letter")
    assert gen_res.status_code == 201
    doc_data = gen_res.json()
    assert doc_data["document_type"] == "cover_letter"
    assert doc_data["job_id"] == job.id
    assert doc_data["anti_hallucination_verified"] is True
    assert job.company in doc_data["content"]
    doc_id = doc_data["id"]

    # Retrieve cover letter via job route
    get_res = client.get(f"/api/v1/jobs/{job.id}/cover-letter")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == doc_id

    # Verify AIActivity recorded
    activity = db.query(AIActivity).filter(
        AIActivity.agent_name == "CoverLetterAgent",
        AIActivity.action == "generate_cover_letter"
    ).first()
    assert activity is not None
    assert activity.status == "completed"
