import logging
from functools import lru_cache

from langchain_openai import AzureChatOpenAI

from app.agent.prompts import JD_MATCH_PROMPT
from app.core.config import Settings, get_settings
from app.models.schemas import JDMatchResult, ResumeAnalysis

logger = logging.getLogger(__name__)


class JDMatcherAgent:
    """
    LLM-only agent that scores a resume against a specific pasted job description.

    Exposes a single stable interface — match(...) → JDMatchResult.
    """

    def __init__(self, settings: Settings) -> None:
        self._llm = AzureChatOpenAI(
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
            azure_deployment=settings.azure_openai_chat_deployment,
            temperature=0.3,
            max_retries=2,
        )
        self._chain = JD_MATCH_PROMPT | self._llm.with_structured_output(JDMatchResult)

        logger.info("JDMatcherAgent initialised (deployment=%s)", settings.azure_openai_chat_deployment)

    async def match(
        self, resume_text: str, target_role: str, analysis: ResumeAnalysis, job_description: str
    ) -> JDMatchResult:
        logger.info("Matching resume against job description for role '%s'", target_role)
        result: JDMatchResult = await self._chain.ainvoke(
            {
                "target_role": target_role,
                "skills": ", ".join(analysis.skills),
                "job_description": job_description,
                "resume_text": resume_text,
            }
        )
        logger.info("JD match complete — score: %d/100", result.jd_match_score)
        return result


@lru_cache(maxsize=1)
def get_jd_matcher_agent() -> JDMatcherAgent:
    """Cached factory — builds the agent once and reuses it across all requests."""
    return JDMatcherAgent(get_settings())
