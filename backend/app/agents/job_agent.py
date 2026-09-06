import re
import httpx
from bs4 import BeautifulSoup
from typing import Optional, Tuple
from app.core.logging import logger
from app.schemas.job import JobAnalysisData
from app.ai.providers.factory import get_ai_provider

class JobFetchError(Exception):
    """Raised when URL scraping is forbidden or fails."""
    pass

class JobAgent:
    """
    Agent responsible for ingesting, fetching, and analyzing job postings.
    Supports raw text parsing, respectful URL extraction, and structured requirements analysis.
    """

    SAFE_HEADERS = {
        "User-Agent": "JobHunterAI-Assistant/1.0 (Ethical job search assistant; bot-check friendly)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }

    @classmethod
    async def fetch_url_content(cls, url: str) -> str:
        """
        Safely fetch job description from URL.
        Respects non-blocking timeouts and handles anti-bot / 403 / 404 gracefully.
        """
        if not url.startswith(("http://", "https://")):
            raise JobFetchError("Invalid URL. Must start with http:// or https://")

        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True, headers=cls.SAFE_HEADERS) as client:
                response = await client.get(url)

                if response.status_code in [401, 403]:
                    raise JobFetchError(
                        "Unable to retrieve this job automatically due to website access restrictions. "
                        "Please paste the job description."
                    )
                elif response.status_code == 404:
                    raise JobFetchError("Job URL not found (404). Please verify the link.")
                elif response.status_code >= 400:
                    raise JobFetchError(
                        f"Unable to retrieve this job automatically (HTTP {response.status_code}). "
                        "Please paste the job description."
                    )

                html = response.text
                soup = BeautifulSoup(html, "html.parser")

                # Remove non-content tags
                for tag in soup(["script", "style", "nav", "footer", "header", "noscript", "svg"]):
                    tag.decompose()

                text = soup.get_text(separator="\n")
                lines = [line.strip() for line in text.splitlines() if line.strip()]
                cleaned_text = "\n".join(lines)

                if len(cleaned_text) < 100:
                    raise JobFetchError(
                        "Unable to retrieve enough text from this job URL automatically. "
                        "Please paste the job description."
                    )

                return cleaned_text

        except JobFetchError:
            raise
        except Exception as e:
            logger.warning(f"Error fetching job URL {url}: {e}")
            raise JobFetchError(
                "Unable to retrieve this job automatically. Please paste the job description."
            )

    @classmethod
    async def analyze_job_text(cls, raw_text: str) -> JobAnalysisData:
        """Analyze raw job text using AI Provider to extract structured requirements."""
        if not raw_text or len(raw_text.strip()) < 20:
            raise ValueError("Job text is too short to analyze.")

        provider = get_ai_provider()
        return await provider.analyze_job(raw_text)
