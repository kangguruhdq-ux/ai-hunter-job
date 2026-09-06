import pytest
import time
from unittest.mock import MagicMock, patch
from app.ai.providers.gemini import GeminiProvider, GeminiAIError
from app.ai.providers.mock import MockProvider
from app.schemas.job import JobAnalysisData

@pytest.mark.asyncio
async def test_mock_provider_fallback_simulation_modes():
    # 1. Normal mode
    provider = MockProvider(simulation_mode="normal")
    job = await provider.analyze_job("Senior Python Engineer at Stripe")
    assert "Senior" in job.title
    assert provider.last_telemetry["requested_model"] == "gemini-3.7-flash"
    assert provider.last_telemetry["fallback_used"] is False

    # 2. 429 Quota Exhausted Simulation -> Fallback model triggered
    p_429 = MockProvider(simulation_mode="primary_429")
    job_429 = await p_429.analyze_job("Senior Python Engineer at Stripe")
    assert job_429 is not None
    assert p_429.last_telemetry["fallback_used"] is True
    assert p_429.last_telemetry["successful_model"] == "gemini-2.5-flash"
    assert len(p_429.last_telemetry["attempted_models"]) == 2

    # 3. 404 Model Not Found Simulation -> Skips to next available fallback
    p_404 = MockProvider(simulation_mode="primary_404")
    job_404 = await p_404.analyze_job("Senior Python Engineer at Stripe")
    assert job_404 is not None
    assert p_404.last_telemetry["fallback_used"] is True
    assert p_404.last_telemetry["successful_model"] == "gemini-2.0-flash"
    assert len(p_404.last_telemetry["attempted_models"]) == 3

    # 4. 503 Server Failure Simulation -> Fallback succeeds
    p_503 = MockProvider(simulation_mode="primary_503")
    job_503 = await p_503.analyze_job("Senior Python Engineer at Stripe")
    assert job_503 is not None
    assert p_503.last_telemetry["fallback_used"] is True

    # 5. All models fail -> Clean user error
    p_fail = MockProvider(simulation_mode="all_fail")
    with pytest.raises(GeminiAIError) as exc_info:
        await p_fail.analyze_job("Senior Python Engineer at Stripe")
    assert "quota exhausted" in str(exc_info.value).lower()
    assert p_fail.last_telemetry["status"] == "failed"

def test_gemini_provider_error_classification():
    provider = GeminiProvider(api_key="test_api_key_valid", model_name="gemini-3.7-flash")

    # 429 error
    err_429 = Exception("429 RESOURCE_EXHAUSTED: Quota exceeded for model gemini-3.7-flash")
    etype, should_fallback = provider._classify_error(err_429)
    assert etype == "RESOURCE_EXHAUSTED"
    assert should_fallback is True

    # 404 error
    err_404 = Exception("404 NOT_FOUND: Model gemini-2.5-flash is not found")
    etype, should_fallback = provider._classify_error(err_404)
    assert etype == "MODEL_NOT_FOUND"
    assert should_fallback is True

    # 401 error (auth)
    err_401 = Exception("401 UNAUTHENTICATED: API key not valid")
    etype, should_fallback = provider._classify_error(err_401)
    assert etype == "AUTH_ERROR"
    assert should_fallback is False

    # 400 error (bad request)
    err_400 = Exception("400 INVALID_ARGUMENT: Invalid parameter format")
    etype, should_fallback = provider._classify_error(err_400)
    assert etype == "BAD_REQUEST"
    assert should_fallback is False

    # 503 error (temporary unavailable)
    err_503 = Exception("503 UNAVAILABLE: The service is currently overloaded")
    etype, should_fallback = provider._classify_error(err_503)
    assert etype == "SERVER_ERROR"
    assert should_fallback is True

def test_gemini_provider_deduplication_and_no_retry_loops():
    # Pass duplicate models in fallback list
    provider = GeminiProvider(
        api_key="test_api_key_valid",
        model_name="gemini-3.7-flash",
        fallback_models=["gemini-3.7-flash", "gemini-2.0-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
    )
    # Ensure deduplicated in chain
    assert provider.model_chain == ["gemini-3.7-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
    assert len(provider.model_chain) == len(set(provider.model_chain))
