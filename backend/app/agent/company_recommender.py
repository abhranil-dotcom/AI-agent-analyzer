import logging
from functools import lru_cache

from langchain_openai import AzureChatOpenAI
from pydantic import BaseModel

from app.agent.prompts import RECOMMEND_PROMPT
from app.core.config import Settings, get_settings
from app.data.companies.registry import get_company_registry
from app.models.schemas import CompanyRecommendation, ResumeAnalysis

logger = logging.getLogger(__name__)


class _RecommendationList(BaseModel):
    """Internal wrapper — with_structured_output needs a single root model, not a bare list."""

    recommendations: list[CompanyRecommendation]


def _format_roster() -> str:
    return "\n".join(f"- {c.slug} — {c.display_name}: {c.blurb}" for c in get_company_registry())


class CompanyRecommenderAgent:
    """
    LLM-only (no retrieval) agent that ranks the fixed company roster against a candidate's
    resume, target role, and prior ATS analysis.

    Exposes a single stable interface — recommend(...) → list[CompanyRecommendation].
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
        self._chain = RECOMMEND_PROMPT | self._llm.with_structured_output(_RecommendationList)

        logger.info("CompanyRecommenderAgent initialised (deployment=%s)", settings.azure_openai_chat_deployment)

    async def recommend(
        self, resume_text: str, target_role: str, analysis: ResumeAnalysis
    ) -> list[CompanyRecommendation]:
        """Rank the company roster and return the top 5 personalized matches."""
        logger.info("Recommending companies for role '%s' (ats_score=%d)", target_role, analysis.ats_score)
        result: _RecommendationList = await self._chain.ainvoke(
            {
                "target_role": target_role,
                "ats_score": analysis.ats_score,
                "skills": ", ".join(analysis.skills),
                "strengths": ", ".join(analysis.strengths),
                "missing_skills": ", ".join(analysis.missing_skills),
                "roster": _format_roster(),
                "resume_text": resume_text,
            }
        )
        logger.info("Recommendation complete — %d companies returned", len(result.recommendations))
        return result.recommendations


@lru_cache(maxsize=1)
def get_company_recommender_agent() -> CompanyRecommenderAgent:
    """Cached factory — builds the agent once and reuses it across all requests."""
    return CompanyRecommenderAgent(get_settings())
