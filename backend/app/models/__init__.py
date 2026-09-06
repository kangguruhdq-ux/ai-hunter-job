from app.models.base import TimeStampedBase, generate_uuid
from app.models.user import User
from app.models.resume import Resume
from app.models.candidate_profile import CandidateProfile
from app.models.candidate_preference import CandidatePreference
from app.models.job import Job, JobRequirement
from app.models.job_match import JobMatch
from app.models.application import Application
from app.models.generated_document import GeneratedDocument
from app.models.ai_activity import AIActivity

__all__ = [
    "TimeStampedBase",
    "generate_uuid",
    "User",
    "Resume",
    "CandidateProfile",
    "CandidatePreference",
    "Job",
    "JobRequirement",
    "JobMatch",
    "Application",
    "GeneratedDocument",
    "AIActivity",
]
