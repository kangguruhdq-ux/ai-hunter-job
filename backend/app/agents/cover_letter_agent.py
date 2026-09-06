from typing import Tuple, List
from app.core.logging import logger
from app.schemas.candidate_profile import CandidateProfileData
from app.schemas.job import JobAnalysisData
from app.schemas.document import CoverLetterData
from app.ai.providers.factory import get_ai_provider

class CoverLetterAgent:
    """
    Agent responsible for generating targeted, professional cover letters.
    Enforces anti-hallucination grounding in the candidate's verified background.
    """

    @classmethod
    async def generate(
        cls,
        profile: CandidateProfileData,
        job: JobAnalysisData,
        company: str,
        job_title: str
    ) -> CoverLetterData:
        provider = get_ai_provider()
        letter_data: CoverLetterData = await provider.generate_cover_letter(
            profile=profile,
            job=job,
            company=company,
            job_title=job_title
        )

        is_grounded, reasons = cls.verify_grounding(profile, letter_data.content, company)
        letter_data.anti_hallucination_verified = is_grounded

        if not is_grounded:
            logger.warning(f"Anti-hallucination warning during cover letter generation: {reasons}")

        return letter_data

    @classmethod
    def verify_grounding(
        cls,
        profile: CandidateProfileData,
        content: str,
        company: str
    ) -> Tuple[bool, List[str]]:
        reasons = []
        content_lower = content.lower()

        # Name check
        if profile.name.lower() not in content_lower:
            reasons.append("Candidate name missing from cover letter.")

        # Target company check
        if company.lower() not in content_lower:
            reasons.append(f"Target company '{company}' not addressed in cover letter.")

        return len(reasons) == 0, reasons
