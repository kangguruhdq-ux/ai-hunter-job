import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.resume import Resume
from app.models.candidate_profile import CandidateProfile
from app.models.ai_activity import AIActivity
from app.services.profile_service import ProfileService

@pytest.fixture(scope="module")
def client():
    return TestClient(app)

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

import uuid

@pytest.mark.asyncio
async def test_extract_and_save_profile_service(db: Session):
    user = User(email=f"test.profile.{uuid.uuid4()}@jobhunter.ai", full_name="Jordan Reed")
    db.add(user)
    db.commit()


    resume = Resume(
        user_id=user.id,
        file_name="jordan_cv.pdf",
        file_type="pdf",
        file_size=8000,
        storage_path="/tmp/jordan.pdf",
        raw_text="Jordan Reed\nFull Stack Developer with Python, React, TypeScript, and Docker.",
        status="parsed"
    )
    db.add(resume)
    db.commit()

    profile = await ProfileService.extract_and_save_profile(db=db, resume_id=resume.id, user_id=user.id)
    assert profile is not None
    assert profile.user_id == user.id
    assert "Python" in profile.skills
    assert profile.years_of_experience > 0

    # Verify AIActivity logged
    activity = db.query(AIActivity).filter(
        AIActivity.user_id == user.id,
        AIActivity.action == "extract_candidate_profile"
    ).first()
    assert activity is not None
    assert activity.status == "completed"
    assert activity.duration_ms is not None

def test_candidate_profile_api(client):
    # Test GET profile
    res = client.get("/api/v1/candidate/profile")
    assert res.status_code == 200

    # Test PUT profile
    update_data = {
        "name": "Jordan Reed",
        "headline": "Staff Distributed Systems Architect",
        "summary": "Deep expertise in high-concurrency systems.",
        "location": "Seattle, WA",
        "skills": ["Python", "FastAPI", "Go", "PostgreSQL", "Kafka"],
        "programming_languages": ["Python", "Go"],
        "frameworks": ["FastAPI"],
        "tools": ["Kafka", "PostgreSQL", "Docker"],
        "experience": [],
        "education": [],
        "certifications": ["AWS Certified Professional"],
        "projects": [],
        "years_of_experience": 8.0
    }
    put_res = client.put("/api/v1/candidate/profile", json=update_data)
    assert put_res.status_code == 200
    saved = put_res.json()
    assert saved["name"] == "Jordan Reed"
    assert saved["headline"] == "Staff Distributed Systems Architect"
    assert "Kafka" in saved["skills"]
    assert saved["years_of_experience"] == 8.0

def test_candidate_preferences_api(client):
    # Test GET default preferences
    get_res = client.get("/api/v1/candidate/preferences")
    assert get_res.status_code == 200
    pref = get_res.json()
    assert "preferred_roles" in pref
    assert pref["currency"] == "USD"

    # Test PUT preferences
    update_pref = {
        "preferred_roles": ["Lead Backend Engineer", "Principal Architect"],
        "preferred_locations": ["Remote", "New York, NY"],
        "preferred_job_types": ["Remote", "Full-time"],
        "preferred_stack": ["Python", "FastAPI", "PostgreSQL", "Kubernetes"],
        "min_salary": 180000,
        "max_salary": 240000,
        "currency": "USD"
    }
    put_res = client.put("/api/v1/candidate/preferences", json=update_pref)
    assert put_res.status_code == 200
    data = put_res.json()
    assert data["min_salary"] == 180000
    assert "Lead Backend Engineer" in data["preferred_roles"]
