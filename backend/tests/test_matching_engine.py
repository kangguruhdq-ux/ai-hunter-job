import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import SessionLocal
from app.agents.match_agent import MatchAgent
from app.schemas.candidate_profile import CandidateProfileData, EducationItem
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

def test_deterministic_scoring_weights():
    # 1. Candidate with exact matching skills & 6 years experience
    profile = CandidateProfileData(
        name="Sarah Connor",
        skills=["Python", "FastAPI", "PostgreSQL", "Docker", "AWS"],
        programming_languages=["Python"],
        frameworks=["FastAPI"],
        tools=["Docker", "AWS", "PostgreSQL"],
        experience=[],
        education=[EducationItem(degree="B.S.", institution="MIT")],
        years_of_experience=6.0
    )

    # Job requiring those exact skills with 5 years experience
    job = JobAnalysisData(
        title="Senior Python Backend Engineer",
        company="Stripe",
        required_skills=["Python", "FastAPI", "PostgreSQL"],
        preferred_skills=["Docker", "AWS"],
        required_experience_years=5.0,
        education_requirements=["B.S. in CS"],
        responsibilities=["Design and deploy backend APIs with Python and FastAPI"],
        keywords=["Python", "FastAPI", "PostgreSQL", "Backend"]
    )

    breakdown, overall, strengths, gaps, rec = MatchAgent.calculate_deterministic_scores(profile, job)

    assert 80 <= overall <= 100
    assert rec == "STRONG_MATCH"
    assert breakdown["skills"] >= 90
    assert breakdown["experience"] == 100
    assert "Python" in strengths
    assert "FastAPI" in strengths

def test_deterministic_scoring_weak_match():
    # Candidate with different stack
    profile = CandidateProfileData(
        name="Front-end Junior",
        skills=["HTML", "CSS", "Figma"],
        programming_languages=["JavaScript"],
        frameworks=[],
        tools=["Figma"],
        years_of_experience=1.0
    )

    job = JobAnalysisData(
        title="Principal Distributed Systems Architect",
        company="Datadog",
        required_skills=["Rust", "C++", "Linux Kernel", "Distributed Systems"],
        preferred_skills=["Kubernetes", "eBPF"],
        required_experience_years=8.0,
        responsibilities=["Write kernel-level telemetry drivers in Rust and C++"],
        keywords=["Rust", "Kernel", "Distributed Systems"]
    )

    breakdown, overall, strengths, gaps, rec = MatchAgent.calculate_deterministic_scores(profile, job)

    assert overall < 55
    assert rec in ["WEAK_MATCH", "POSSIBLE_MATCH"]
    missing = [g.skill for g in gaps if g.category == "Missing"]
    assert "Rust" in missing
    assert "Distributed Systems" in missing

def test_match_api_endpoints(client, db: Session):
    # Ensure sample jobs exist
    JobService.seed_sample_jobs(db)
    jobs = JobService.list_jobs(db)
    assert len(jobs) > 0

    first_job = jobs[0]

    # Test POST match
    post_res = client.post(f"/api/v1/jobs/{first_job.id}/match")
    assert post_res.status_code == 200
    match_data = post_res.json()
    assert "overall_score" in match_data
    assert "skills_score" in match_data
    assert "recommendation" in match_data
    assert len(match_data["skill_gaps"]) > 0

    # Test GET recommended ranked
    rec_res = client.get("/api/v1/jobs/recommended/ranked")
    assert rec_res.status_code == 200
    ranked = rec_res.json()
    assert len(ranked) > 0
    # Ensure sorted descending
    scores = [r["overall_score"] for r in ranked]
    assert scores == sorted(scores, reverse=True)
