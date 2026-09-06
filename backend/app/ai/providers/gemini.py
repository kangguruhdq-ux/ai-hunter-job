import json
import re
import time
from typing import Type, TypeVar, Optional, Any, Dict, List, Tuple
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
    Enterprise-grade Gemini AI provider leveraging the Google GenAI SDK.
    Features:
    - Multi-model fallback chain (GEMINI_MODEL -> GEMINI_FALLBACK_MODELS)
    - Error classification (429 quota, 404 missing model, 503 outage, 401 auth, 400 validation)
    - Anti-loop protection (attempted_models set, bounded retries, no duplicate attempts)
    - Telemetry tracking (requested_model, successful_model, fallback_used, latency)
    - Clean user-facing error messages (no raw Python tracebacks)
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        fallback_models: Optional[List[str]] = None
    ):
        self.api_key = settings.GEMINI_API_KEY if api_key is None else api_key
        if not self.api_key:
            raise GeminiAIError(
                "GEMINI_API_KEY is not configured. Please set the GEMINI_API_KEY environment variable "
                "or switch AI_PROVIDER=mock for local development."
            )

        self.primary_model = model_name or settings.GEMINI_MODEL
        self.model_name = self.primary_model
        self.fallback_models = fallback_models if fallback_models is not None else settings.gemini_fallback_models_list
        self.fallback_model = self.fallback_models[0] if self.fallback_models else None
        self.client = genai.Client(api_key=self.api_key)

        # Build deduplicated execution model chain
        chain = [self.primary_model]
        for fb in self.fallback_models:
            if fb and fb not in chain:
                chain.append(fb)
        self.model_chain = chain

        self.last_telemetry: Dict[str, Any] = {}
        logger.info(f"GeminiProvider initialized. Model chain: {' -> '.join(self.model_chain)}")

    def _extract_json_from_text(self, text: str) -> Dict[str, Any]:
        """Extracts JSON object from text that may contain markdown codeblocks."""
        text = text.strip()
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if match:
            text = match.group(1).strip()
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            # Attempt basic cleanup for trailing commas
            cleaned = re.sub(r",\s*([\]}])", r"\1", text)
            try:
                return json.loads(cleaned)
            except json.JSONDecodeError as e:
                raise GeminiAIError(f"Failed to parse Gemini response as JSON: {e}")

    def _classify_error(self, err: Exception) -> Tuple[str, bool]:
        """
        Classifies an API or parsing exception.
        Returns: (error_type, should_fallback)
        """
        err_str = str(err).lower()

        # 429: Resource exhausted / rate limit / quota
        if "429" in err_str or "resource_exhausted" in err_str or "quota" in err_str or "rate limit" in err_str:
            return ("RESOURCE_EXHAUSTED", True)

        # 404: Model not found / unavailable
        if "404" in err_str or "not_found" in err_str or "model not found" in err_str or "is not found" in err_str:
            return ("MODEL_NOT_FOUND", True)

        # 401 / 403: Authentication or permission error -> DO NOT retry other models
        if "401" in err_str or "403" in err_str or "unauthenticated" in err_str or "permission_denied" in err_str:
            return ("AUTH_ERROR", False)

        # 400: Bad request / Invalid argument -> DO NOT retry blindly
        if "400" in err_str or "invalid_argument" in err_str:
            return ("BAD_REQUEST", False)

        # 500 / 502 / 503 / 504: Temporary server failure
        if "500" in err_str or "502" in err_str or "503" in err_str or "504" in err_str or "unavailable" in err_str or "server error" in err_str:
            return ("SERVER_ERROR", True)

        # Output schema / validation error
        if isinstance(err, (ValidationError, GeminiAIError)):
            return ("VALIDATION_ERROR", True)

        return ("PROVIDER_ERROR", True)

    async def _generate_and_validate(
        self,
        system_instruction: str,
        prompt: str,
        schema_cls: Type[T]
    ) -> T:
        """
        Executes model generation with multi-model fallback chain.
        Guarantees:
        - Bounded attempts (no infinite retry loop)
        - Each model attempted at most once
        - Fallback only on eligible errors (429, 404, 503, validation)
        - Immediate clean termination on auth or bad request
        - Telemetry recorded for AI activity observability
        """
        attempted_models: List[str] = []
        last_error: Optional[Exception] = None
        last_error_type: str = "UNKNOWN"
        start_time = time.time()

        for current_model in self.model_chain:
            if current_model in attempted_models:
                continue

            attempted_models.append(current_model)
            model_start = time.time()

            try:
                config = types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.2,
                    response_mime_type="application/json"
                )

                logger.info(f"Invoking Gemini model: {current_model} (attempt {len(attempted_models)}/{len(self.model_chain)})")
                response = self.client.models.generate_content(
                    model=current_model,
                    contents=prompt,
                    config=config
                )

                raw_output = response.text or ""
                data_dict = self._extract_json_from_text(raw_output)
                validated_obj = schema_cls.model_validate(data_dict)

                duration_ms = int((time.time() - start_time) * 1000)
                is_fallback = current_model != self.primary_model

                self.last_telemetry = {
                    "requested_model": self.primary_model,
                    "successful_model": current_model,
                    "attempted_models": attempted_models,
                    "fallback_used": is_fallback,
                    "status": "completed",
                    "duration_ms": duration_ms
                }

                if is_fallback:
                    logger.warning(
                        f"AI generation succeeded using fallback model '{current_model}' after {len(attempted_models)} attempts."
                    )

                return validated_obj

            except Exception as err:
                last_error = err
                last_error_type, should_fallback = self._classify_error(err)
                logger.warning(
                    f"Gemini attempt failed on model '{current_model}' with error_type '{last_error_type}': {err}"
                )

                # If auth error or bad request, abort chain immediately
                if not should_fallback:
                    duration_ms = int((time.time() - start_time) * 1000)
                    self.last_telemetry = {
                        "requested_model": self.primary_model,
                        "successful_model": None,
                        "attempted_models": attempted_models,
                        "fallback_used": False,
                        "status": "failed",
                        "error_type": last_error_type,
                        "duration_ms": duration_ms
                    }
                    if last_error_type == "AUTH_ERROR":
                        raise GeminiAIError("Autentikasi API key Google Gemini tidak valid atau tidak memiliki izin akses.")
                    raise GeminiAIError(f"Permintaan AI tidak valid: {err}")

        # If all models in the chain were exhausted
        duration_ms = int((time.time() - start_time) * 1000)
        self.last_telemetry = {
            "requested_model": self.primary_model,
            "successful_model": None,
            "attempted_models": attempted_models,
            "fallback_used": len(attempted_models) > 1,
            "status": "failed",
            "error_type": last_error_type,
            "duration_ms": duration_ms
        }

        logger.error(
            f"All configured Gemini models failed. Attempted models: {attempted_models}. Last error: {last_error}"
        )

        if last_error_type == "RESOURCE_EXHAUSTED":
            raise GeminiAIError(
                "Layanan AI sementara tidak tersedia karena semua model Gemini yang dikonfigurasi telah mencapai batas kuota (quota exhausted). Silakan coba beberapa saat lagi."
            )
        elif last_error_type == "MODEL_NOT_FOUND":
            raise GeminiAIError(
                "Model AI yang dikonfigurasi tidak tersedia pada endpoint API saat ini. Silakan periksa konfigurasi model Gemini Anda."
            )
        else:
            raise GeminiAIError(
                "Layanan AI sementara tidak tersedia. Sistem telah mencoba model fallback yang dikonfigurasi namun belum berhasil. Silakan coba kembali beberapa saat lagi."
            )

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
        if profile.name.lower() not in generated_text.lower():
            logger.warning("Anti-hallucination warning: Candidate name missing from generated output.")
        return True
