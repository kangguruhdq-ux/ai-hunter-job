import pytest
from app.ai.providers.mock import MockProvider
from app.ai.providers.factory import get_ai_provider, reset_ai_provider
from app.ai.providers.gemini import GeminiProvider, GeminiAIError
from app.schemas.candidate_profile import CandidateProfileData
from app.schemas.job import JobAnalysisData

@pytest.mark.asyncio
async def test_mock_provider_analyze_resume():
    provider = MockProvider()
    resume_text = (
        "Alex Chen\nSenior Backend Engineer\n"
        "Proficient in Python, FastAPI, PostgreSQL, Docker, AWS, and Redis.\n"
        "6 years of experience building distributed systems."
    )
    profile = await provider.analyze_resume(resume_text)
    assert isinstance(profile, CandidateProfileData)
    assert profile.name == "Alex Chen"
    assert "Python" in profile.skills
    assert "FastAPI" in profile.skills
    assert "PostgreSQL" in profile.skills
    assert len(profile.experience) > 0
    assert profile.years_of_experience >= 5.0

@pytest.mark.asyncio
async def test_mock_provider_analyze_job():
    provider = MockProvider()
    job_text = (
        "Senior Backend Engineer at Stripe\n"
        "We are looking for an engineer with strong Python, FastAPI, PostgreSQL, and Kubernetes experience."
    )
    job = await provider.analyze_job(job_text)
    assert isinstance(job, JobAnalysisData)
    assert "Python" in job.required_skills
    assert "FastAPI" in job.required_skills
    assert len(job.responsibilities) > 0

@pytest.mark.asyncio
async def test_mock_provider_matching():
    provider = MockProvider()
    resume_text = "Senior Python Engineer with FastAPI and PostgreSQL expertise."
    profile = await provider.analyze_resume(resume_text)
    job = await provider.analyze_job("Senior Backend Engineer at Stripe requiring Python, FastAPI, and Kubernetes.")

    match_result = await provider.match_candidate(profile, job)
    assert 0 <= match_result.overall_score <= 100
    assert match_result.recommendation in ["STRONG_MATCH", "GOOD_MATCH", "POSSIBLE_MATCH", "WEAK_MATCH"]
    assert len(match_result.strengths) > 0
    assert len(match_result.skill_gaps) > 0

@pytest.mark.asyncio
async def test_mock_provider_tailored_documents():
    provider = MockProvider()
    profile = await provider.analyze_resume("Python and FastAPI specialist")
    job = await provider.analyze_job("Backend Engineer at Stripe")

    tailored = await provider.generate_tailored_resume(profile, job)
    assert tailored.anti_hallucination_verified is True
    assert profile.name in tailored.tailored_markdown
    assert len(tailored.tailored_changes) > 0

    letter = await provider.generate_cover_letter(profile, job, company="Stripe", job_title="Backend Engineer")
    assert letter.anti_hallucination_verified is True
    assert "Stripe" in letter.content
    assert profile.name in letter.content

def test_gemini_provider_unconfigured_error():
    with pytest.raises(GeminiAIError, match="GEMINI_API_KEY is not configured"):
        GeminiProvider(api_key="")

def test_factory_fallback_to_mock():
    reset_ai_provider()
    provider = get_ai_provider()
    assert isinstance(provider, MockProvider)
