from app.core.config import settings
from app.core.logging import logger
from app.ai.providers.base import AIProvider
from app.ai.providers.mock import MockProvider
from app.ai.providers.gemini import GeminiProvider, GeminiAIError

_provider_instance: AIProvider | None = None

def get_ai_provider() -> AIProvider:
    """
    Factory function returning the configured AI Provider instance.
    Defaults to MockProvider if AI_PROVIDER=mock or if Gemini is unconfigured.
    """
    global _provider_instance
    if _provider_instance is not None:
        return _provider_instance

    provider_name = (settings.AI_PROVIDER or "mock").lower().strip()

    if provider_name == "gemini":
        if not settings.GEMINI_API_KEY:
            logger.warning(
                "AI_PROVIDER is set to 'gemini', but GEMINI_API_KEY is empty. "
                "Falling back safely to MockProvider."
            )
            _provider_instance = MockProvider()
        else:
            try:
                _provider_instance = GeminiProvider()
                logger.info(f"Initialized GeminiProvider with model: {settings.GEMINI_MODEL}")
            except Exception as e:
                logger.error(f"Failed to initialize GeminiProvider: {e}. Falling back to MockProvider.")
                _provider_instance = MockProvider()
    else:
        logger.info("Initializing MockProvider (offline realistic mode).")
        _provider_instance = MockProvider()

    return _provider_instance

def reset_ai_provider():
    """Reset the singleton instance (useful for unit testing)."""
    global _provider_instance
    _provider_instance = None
