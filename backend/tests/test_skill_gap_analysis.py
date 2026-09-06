import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import SessionLocal
from app.models.ai_activity import AIActivity
from app.agents.recommendation_agent import RecommendationAgent
from app.schemas.candidate_profile import CandidateProfileData
from app.schemas.job import JobAnalysisData
from app.schemas.match import MatchResultData
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

def test_recommendation_agent_categorization():
    profile = CandidateProfileData(
        name="Alex Mercer",
        skills=["Python", "FastAPI", "PostgreSQL", "Docker"],
        programming_languages=["Python"],
        frameworks=["FastAPI"],
        tools=["Docker", "PostgreSQL"],
        years_of_experience=5.0
    )

    job = JobAnalysisData(
        title="Senior Platform Engineer",
        company="Stripe",
        required_skills=["Python", "Kubernetes", "PostgreSQL"],
        preferred_skills=["Docker", "Terraform"],
        required_experience_years=5.0,
        responsibilities=["Build cloud platforms"],
        keywords=["Python", "Kubernetes", "Platform"]
    )

    match = MatchResultData(
        overall_score=78,
        skills_score=75,
        experience_score=100,
        responsibility_score=80,
        education_score=100,
        keyword_score=70,
        strengths=["Python", "PostgreSQL", "Docker"],
        skill_gaps=[],
        recommendation="GOOD_MATCH",
        reasoning="Good alignment with core backend stack."
    )

    analysis = RecommendationAgent.generate_detailed_analysis(profile, job, match, job_id="test-job-123")
    assert analysis.job_id == "test-job-123"
    assert analysis.recommendation == "GOOD_MATCH"

    # Verify 4 categories
    categories = analysis.categories
    assert "Already Strong" in categories
    assert "Some Experience" in categories
    assert "Needs Improvement" in categories
    assert "Missing" in categories

    # Python & PostgreSQL are required and candidate has them -> Already Strong
    strong_skills = [i.skill for i in categories["Already Strong"]]
    assert "Python" in strong_skills
    assert "PostgreSQL" in strong_skills

    # Kubernetes is required and candidate lacks it -> Missing
    missing_skills = [i.skill for i in categories["Missing"]]
    assert "Kubernetes" in missing_skills

    # Docker is preferred and candidate has it -> Some Experience
    some_exp = [i.skill for i in categories["Some Experience"]]
    assert "Docker" in some_exp

    # Terraform is preferred and candidate lacks it -> Needs Improvement
    needs_imp = [i.skill for i in categories["Needs Improvement"]]
    assert "Terraform" in needs_imp

    # Verify action plan & interview focus
    assert len(analysis.action_plan) > 0
    assert len(analysis.interview_focus_areas) > 0

def test_skill_gap_api_flow(client, db: Session):
    # Ensure sample jobs exist
    JobService.seed_sample_jobs(db)
    jobs = JobService.list_jobs(db)
    assert len(jobs) > 0

    first_job = jobs[0]
    res = client.get(f"/api/v1/jobs/{first_job.id}/skill-gap")
    assert res.status_code == 200
    data = res.json()
    assert data["job_id"] == first_job.id
    assert "categories" in data
    assert "action_plan" in data
    assert "interview_focus_areas" in data
    assert len(data["categories"]["Already Strong"]) > 0

    # Verify AIActivity logged for RecommendationAgent
    activity = db.query(AIActivity).filter(
        AIActivity.agent_name == "RecommendationAgent",
        AIActivity.action == "generate_skill_gap_analysis"
    ).first()
    assert activity is not None
    assert activity.status == "completed"
