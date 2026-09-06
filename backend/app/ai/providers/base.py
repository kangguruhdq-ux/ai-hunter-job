from abc import ABC, abstractmethod
from app.schemas.candidate_profile import CandidateProfileData
from app.schemas.job import JobAnalysisData
from app.schemas.match import MatchResultData
from app.schemas.document import TailoredResumeData, CoverLetterData

class AIProvider(ABC):
    """Abstract Base Class for AI intelligence providers."""

    @abstractmethod
    async def analyze_resume(self, raw_text: str) -> CandidateProfileData:
        """Parse raw resume text into a structured candidate profile."""
        pass

    @abstractmethod
    async def analyze_job(self, raw_job_text: str) -> JobAnalysisData:
        """Parse raw job description into structured requirements."""
        pass

    @abstractmethod
    async def match_candidate(
        self,
        profile: CandidateProfileData,
        job: JobAnalysisData
    ) -> MatchResultData:
        """Calculate explainable compatibility, strengths, and skill gaps."""
        pass

    @abstractmethod
    async def generate_tailored_resume(
        self,
        profile: CandidateProfileData,
        job: JobAnalysisData
    ) -> TailoredResumeData:
        """Generate a tailored resume grounded strictly in candidate background."""
        pass

    @abstractmethod
    async def generate_cover_letter(
        self,
        profile: CandidateProfileData,
        job: JobAnalysisData,
        company: str,
        job_title: str
    ) -> CoverLetterData:
        """Generate an authentic, grounded cover letter for the target job."""
        pass
