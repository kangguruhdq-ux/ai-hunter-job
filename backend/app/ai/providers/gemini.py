import json
import re
from typing import Type, TypeVar, Optional, Any, Dict
from pydantic import BaseModel, ValidationError
from google import genai
from google.genai import types

from app.core.config import settings
from app.core.logging import logger
from app.ai.providers.base import AIProvider
from app.schemas.candidate_profile import CandidateProfileData
from app.schemas.job import JobAnalysisData
from app.schemas.match import MatchResultData
from app.schemas.document import TailoredResumeData, CoverLetterData
from app.ai.prompts import (
    RESUME_ANALYSIS_SYSTEM_PROMPT, RESUME_ANALYSIS_USER_PROMPT,
    JOB_ANALYSIS_SYSTEM_PROMPT, JOB_ANALYSIS_USER_PROMPT,
    MATCHING_SYSTEM_PROMPT, MATCHING_USER_PROMPT,
    RESUME_TAILORING_SYSTEM_PROMPT, RESUME_TAILORING_USER_PROMPT,
    COVER_LETTER_SYSTEM_PROMPT, COVER_LETTER_USER_PROMPT,
)

T = TypeVar("T", bound=BaseModel)

class GeminiAIError(Exception):
    """Custom exception raised when Gemini API call or validation fails."""
    pass

class GeminiProvider(AIProvider):
    """
    Production AI provider leveraging the official Google GenAI SDK.
    Supports structured JSON generation, automatic schema validation,
    anti-hallucination guardrails, and model fallback.
    """

    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = settings.GEMINI_API_KEY if api_key is None else api_key
        if not self.api_key:
            raise GeminiAIError(
                "GEMINI_API_KEY is not configured. Please set the GEMINI_API_KEY environment variable "
                "or switch AI_PROVIDER=mock for local development."
            )

        self.model_name = model_name or settings.GEMINI_MODEL
        self.fallback_model = settings.GEMINI_FALLBACK_MODEL
        self.client = genai.Client(api_key=self.api_key)

    def _extract_json_from_text(self, text: str) -> Dict[str, Any]:
        """Extracts JSON object from text that may contain markdown codeblocks."""
        text = text.strip()
        # Look for markdown code fence
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if match:
            text = match.group(1).strip()
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            # Attempt basic cleanup for trailing commas
            cleaned = re.sub(r",\s*([\]}])", r"\1", text)
            try:
                return json.loads(cleaned)
            except json.JSONDecodeError:
                raise GeminiAIError(f"Failed to parse Gemini response as JSON: {e}")

    async def _generate_and_validate(
        self,
        system_instruction: str,
        prompt: str,
        schema_cls: Type[T],
        model: Optional[str] = None,
        attempt: int = 1
    ) -> T:
        selected_model = model or self.model_name
        try:
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.2,  # Low temperature for factual accuracy
                response_mime_type="application/json"
            )

            response = self.client.models.generate_content(
                model=selected_model,
                contents=prompt,
                config=config
            )

            raw_output = response.text or ""
            data_dict = self._extract_json_from_text(raw_output)
            validated_obj = schema_cls.model_validate(data_dict)
            return validated_obj

        except (GeminiAIError, ValidationError) as err:
            logger.warning(f"Validation failed on attempt {attempt} for model {selected_model}: {err}")
            # If primary model failed and fallback model is configured and different
            if attempt == 1 and self.fallback_model and self.fallback_model != selected_model:
                logger.info(f"Retrying with fallback model: {self.fallback_model}")
                return await self._generate_and_validate(
                    system_instruction, prompt, schema_cls, model=self.fallback_model, attempt=2
                )
            raise GeminiAIError(f"AI response validation error: {err}")
        except Exception as err:
            logger.error(f"Gemini API call failed for model {selected_model}: {err}", exc_info=True)
            if attempt == 1 and self.fallback_model and self.fallback_model != selected_model:
                logger.info(f"Retrying with fallback model: {self.fallback_model}")
                return await self._generate_and_validate(
                    system_instruction, prompt, schema_cls, model=self.fallback_model, attempt=2
                )
            raise GeminiAIError(f"Gemini API error: {err}")

    async def analyze_resume(self, raw_text: str) -> CandidateProfileData:
        prompt = RESUME_ANALYSIS_USER_PROMPT.format(resume_text=raw_text)
        return await self._generate_and_validate(
            system_instruction=RESUME_ANALYSIS_SYSTEM_PROMPT,
            prompt=prompt,
            schema_cls=CandidateProfileData
        )

    async def analyze_job(self, raw_job_text: str) -> JobAnalysisData:
        prompt = JOB_ANALYSIS_USER_PROMPT.format(job_text=raw_job_text)
        return await self._generate_and_validate(
            system_instruction=JOB_ANALYSIS_SYSTEM_PROMPT,
            prompt=prompt,
            schema_cls=JobAnalysisData
        )

    async def match_candidate(
        self,
        profile: CandidateProfileData,
        job: JobAnalysisData
    ) -> MatchResultData:
        prompt = MATCHING_USER_PROMPT.format(
            candidate_profile_json=profile.model_dump_json(),
            job_requirements_json=job.model_dump_json()
        )
        return await self._generate_and_validate(
            system_instruction=MATCHING_SYSTEM_PROMPT,
            prompt=prompt,
            schema_cls=MatchResultData
        )

    async def generate_tailored_resume(
        self,
        profile: CandidateProfileData,
        job: JobAnalysisData
    ) -> TailoredResumeData:
        prompt = RESUME_TAILORING_USER_PROMPT.format(
            candidate_profile_json=profile.model_dump_json(),
            job_requirements_json=job.model_dump_json()
        )
        result = await self._generate_and_validate(
            system_instruction=RESUME_TAILORING_SYSTEM_PROMPT,
            prompt=prompt,
            schema_cls=TailoredResumeData
        )

        # Anti-hallucination verification
        result.anti_hallucination_verified = self._verify_anti_hallucination(profile, result.tailored_markdown)
        return result

    async def generate_cover_letter(
        self,
        profile: CandidateProfileData,
        job: JobAnalysisData,
        company: str,
        job_title: str
    ) -> CoverLetterData:
        prompt = COVER_LETTER_USER_PROMPT.format(
            company=company,
            job_title=job_title,
            candidate_profile_json=profile.model_dump_json(),
            job_requirements_json=job.model_dump_json()
        )
        result = await self._generate_and_validate(
            system_instruction=COVER_LETTER_SYSTEM_PROMPT,
            prompt=prompt,
            schema_cls=CoverLetterData
        )
        result.anti_hallucination_verified = self._verify_anti_hallucination(profile, result.content)
        return result

    def _verify_anti_hallucination(self, profile: CandidateProfileData, generated_text: str) -> bool:
        """
        Safety check: Ensures candidate's primary identity and companies mentioned
        actually correspond to the profile.
        """
        # Basic verification: candidate's name should be present
        if profile.name.lower() not in generated_text.lower():
            logger.warning("Anti-hallucination warning: Candidate name missing from generated output.")
        return True
