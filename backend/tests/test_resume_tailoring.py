import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import SessionLocal
from app.models.ai_activity import AIActivity
from app.agents.resume_tailor_agent import ResumeTailorAgent
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
async def test_resume_tailor_agent_grounding():
    profile = CandidateProfileData(
        name="Elena Rostova",
        headline="Staff Platform Engineer",
        summary="Specialized in cloud Kubernetes platforms and infrastructure automation.",
        skills=["Python", "Go", "Docker", "Kubernetes", "AWS"],
        programming_languages=["Python", "Go"],
        frameworks=[],
        tools=["Docker", "Kubernetes", "AWS"],
        experience=[
            ExperienceItem(
                title="Lead Infrastructure Engineer",
                company="Skyline Cloud",
                location="Remote",
                start_date="2020-01",
                end_date=None,
                current=True,
                description="Managing high-scale multi-tenant Kubernetes clusters.",
                achievements=["Maintained 99.99% infrastructure uptime across 40 clusters."]
            )
        ],
        years_of_experience=7.0
    )

    job = JobAnalysisData(
        title="Staff DevOps Engineer",
        company="Stripe",
        required_skills=["Kubernetes", "AWS", "Python"],
        preferred_skills=["Docker", "Go"],
        responsibilities=["Automate multi-region deployments"]
    )

    tailored = await ResumeTailorAgent.tailor(profile, job)
    assert tailored.anti_hallucination_verified is True
    assert "Elena Rostova" in tailored.tailored_markdown
    assert "Skyline Cloud" in tailored.tailored_markdown
    assert len(tailored.tailored_changes) > 0

    # Verification function unit test
    is_valid, reasons = ResumeTailorAgent.verify_grounding(profile, tailored.tailored_markdown)
    assert is_valid is True
    assert len(reasons) == 0

def test_tailored_resume_api_flow(client, db: Session):
    JobService.seed_sample_jobs(db)
    jobs = JobService.list_jobs(db)
    assert len(jobs) > 0
    job = jobs[0]

    # Generate tailored resume
    gen_res = client.post(f"/api/v1/jobs/{job.id}/tailored-resume")
    assert gen_res.status_code == 201
    doc_data = gen_res.json()
    assert doc_data["document_type"] == "tailored_resume"
    assert doc_data["job_id"] == job.id
    assert doc_data["anti_hallucination_verified"] is True
    doc_id = doc_data["id"]

    # Retrieve document
    get_res = client.get(f"/api/v1/documents/{doc_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == doc_id

    # Edit document
    edit_res = client.put(f"/api/v1/documents/{doc_id}", json={
        "title": "Customized Resume for Stripe",
        "content": "# Custom Content\nEdited by candidate."
    })
    assert edit_res.status_code == 200
    assert edit_res.json()["title"] == "Customized Resume for Stripe"
    assert "Edited by candidate" in edit_res.json()["content"]

    # Download document
    dl_res = client.get(f"/api/v1/documents/{doc_id}/download")
    assert dl_res.status_code == 200
    assert "text/markdown" in dl_res.headers["content-type"]
    assert "Edited by candidate" in dl_res.text

    # Verify AIActivity recorded
    activity = db.query(AIActivity).filter(
        AIActivity.agent_name == "ResumeTailorAgent",
        AIActivity.action == "generate_tailored_resume"
    ).first()
    assert activity is not None
    assert activity.status == "completed"
