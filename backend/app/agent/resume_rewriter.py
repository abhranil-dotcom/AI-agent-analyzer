import logging
from functools import lru_cache

from langchain_openai import AzureChatOpenAI

from app.agent.prompts import RESUME_REWRITE_PROMPT
from app.core.config import Settings, get_settings
from app.models.schemas import OptimizedResume, ResumeAnalysis

logger = logging.getLogger(__name__)


class ResumeRewriterAgent:
    """
    LLM-only agent that produces a complete, ready-to-use optimized resume — summary, bullets,
    skills phrasing, and project descriptions all strengthened — while staying strictly grounded
    in what the candidate's resume actually says.

    Exposes a single stable interface — rewrite(...) → OptimizedResume.
    """

    def __init__(self, settings: Settings) -> None:
        self._llm = AzureChatOpenAI(
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
            azure_deployment=settings.azure_openai_chat_deployment,
            temperature=0.4,
            max_retries=2,
        )
        self._chain = RESUME_REWRITE_PROMPT | self._llm.with_structured_output(OptimizedResume)

        logger.info("ResumeRewriterAgent initialised (deployment=%s)", settings.azure_openai_chat_deployment)

    async def rewrite(self, resume_text: str, target_role: str, analysis: ResumeAnalysis) -> OptimizedResume:
        logger.info("Optimizing resume for role '%s'", target_role)
        result: OptimizedResume = await self._chain.ainvoke(
            {
                "target_role": target_role,
                "weaknesses": ", ".join(analysis.weaknesses),
                "missing_skills": ", ".join(analysis.missing_skills),
                "suggestions": ", ".join(analysis.suggestions),
                "resume_text": resume_text,
            }
        )
        logger.info("Resume optimization complete — %d sections", len(result.sections))
        return result


@lru_cache(maxsize=1)
def get_resume_rewriter_agent() -> ResumeRewriterAgent:
    """Cached factory — builds the agent once and reuses it across all requests."""
    return ResumeRewriterAgent(get_settings())
