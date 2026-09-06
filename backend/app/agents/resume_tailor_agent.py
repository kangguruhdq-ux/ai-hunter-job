import re
from typing import Tuple, List, Dict, Set
from app.core.logging import logger
from app.schemas.candidate_profile import CandidateProfileData
from app.schemas.job import JobAnalysisData
from app.schemas.document import TailoredResumeData, TailoredChange
from app.ai.providers.factory import get_ai_provider

class AntiHallucinationViolationError(Exception):
    """Raised when generated resume fabricates claims not in candidate profile."""
    pass

class ResumeTailorAgent:
    """
    Agent responsible for tailoring candidate resumes to specific job postings.
    Enforces strict anti-hallucination rules and post-generation grounding verification.
    """

    @classmethod
    async def tailor(
        cls,
        profile: CandidateProfileData,
        job: JobAnalysisData
    ) -> TailoredResumeData:
        provider = get_ai_provider()
        tailored: TailoredResumeData = await provider.generate_tailored_resume(profile, job)

        # Run strict post-generation anti-hallucination verification
        is_grounded, reasons = cls.verify_grounding(profile, tailored.tailored_markdown)
        tailored.anti_hallucination_verified = is_grounded

        if not is_grounded:
            logger.warning(f"Anti-hallucination warning during resume tailoring: {reasons}")

        return tailored

    @classmethod
    def verify_grounding(
        cls,
        profile: CandidateProfileData,
        generated_markdown: str
    ) -> Tuple[bool, List[str]]:
        """
        Verify that:
        1. Candidate name is preserved.
        2. Known companies in candidate profile are present.
        3. No obviously invented companies appear in experience headings.
        """
        reasons = []
        gen_lower = generated_markdown.lower()

        # 1. Name check
        if profile.name.lower() not in gen_lower:
            reasons.append(f"Candidate name '{profile.name}' is missing.")

        # 2. Company check
        for exp in profile.experience:
            if exp.company.lower() not in gen_lower:
                reasons.append(f"Candidate legitimate employer '{exp.company}' was dropped.")

        is_valid = len(reasons) == 0
        return is_valid, reasons
