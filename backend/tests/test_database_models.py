import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models import (
    User, Resume, CandidateProfile, CandidatePreference,
    Job, JobRequirement, JobMatch, Application,
    GeneratedDocument, AIActivity
)

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_database_models_creation(db_session):
    # 1. Create User
    user = User(email="alex.chen@example.com", full_name="Alex Chen")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    assert user.id is not None
    assert len(user.id) == 36

    # 2. Create Resume
    resume = Resume(
        user_id=user.id,
        file_name="Alex_Chen_Resume.pdf",
        file_type="pdf",
        file_size=10240,
        storage_path="/uploads/alex_resume.pdf",
        status="parsed"
    )
    db_session.add(resume)
    db_session.commit()
    assert resume.id is not None

    # 3. Create CandidateProfile
    profile = CandidateProfile(
        user_id=user.id,
        resume_id=resume.id,
        name="Alex Chen",
        headline="Senior Backend Engineer",
        skills=["Python", "FastAPI", "PostgreSQL", "Docker"],
        years_of_experience=6.5
    )
    db_session.add(profile)
    db_session.commit()
    assert profile.skills == ["Python", "FastAPI", "PostgreSQL", "Docker"]
    assert profile.years_of_experience == 6.5

    # 4. Create Job & JobRequirement
    job = Job(
        title="Senior Python Engineer",
        company="Stripe",
        location="Remote",
        employment_type="Full-time",
        raw_description="We are seeking an experienced Senior Python Engineer..."
    )
    db_session.add(job)
    db_session.commit()
    db_session.refresh(job)

    req = JobRequirement(
        job_id=job.id,
        required_skills=["Python", "FastAPI", "PostgreSQL"],
        preferred_skills=["Kubernetes", "AWS"],
        required_experience_years=5.0
    )
    db_session.add(req)
    db_session.commit()
    assert job.requirements.required_skills == ["Python", "FastAPI", "PostgreSQL"]

    # 5. Create JobMatch
    match = JobMatch(
        candidate_profile_id=profile.id,
        job_id=job.id,
        overall_score=88,
        skills_score=92,
        experience_score=90,
        responsibility_score=85,
        education_score=100,
        keyword_score=80,
        score_weights={"skills": 0.4, "experience": 0.25, "responsibilities": 0.2, "education": 0.1, "keywords": 0.05},
        strengths=["Python", "FastAPI", "PostgreSQL"],
        skill_gaps=[{"skill": "Kubernetes", "category": "Missing", "recommendation": "Learn K8s basics"}],
        recommendation="STRONG_MATCH",
        reasoning="Candidate satisfies all required skills with strong backend background."
    )
    db_session.add(match)
    db_session.commit()
    assert match.overall_score == 88
    assert match.recommendation == "STRONG_MATCH"

    # 6. Create Application
    application = Application(
        user_id=user.id,
        job_id=job.id,
        status="Applied",
        notes="Applied via company portal"
    )
    db_session.add(application)
    db_session.commit()
    assert application.status == "Applied"

    # 7. Create GeneratedDocument
    doc = GeneratedDocument(
        user_id=user.id,
        job_id=job.id,
        candidate_profile_id=profile.id,
        document_type="tailored_resume",
        title="Tailored Resume - Stripe",
        content="# Alex Chen\n## Senior Backend Engineer",
        anti_hallucination_verified=True
    )
    db_session.add(doc)
    db_session.commit()
    assert doc.anti_hallucination_verified is True

    # 8. Create AIActivity
    activity = AIActivity(
        user_id=user.id,
        agent_name="MatchAgent",
        action="calculate_compatibility",
        status="completed",
        duration_ms=340
    )
    db_session.add(activity)
    db_session.commit()
    assert activity.agent_name == "MatchAgent"
    assert activity.duration_ms == 340
