import logging
from functools import lru_cache
from urllib.parse import quote

from langchain_openai import AzureChatOpenAI
from pydantic import BaseModel, Field

from app.agent.prompts import LEARNING_RESOURCES_PROMPT
from app.core.config import Settings, get_settings
from app.models.schemas import DifficultyLevel, LearningResourceEntry, ResumeAnalysis

logger = logging.getLogger(__name__)


class _LearningResourceLLMEntry(BaseModel):
    """LLM-facing shape — deliberately excludes udemy_search_url, which the agent computes itself
    (a real, always-valid search link) rather than letting the model guess at one."""

    skill: str
    difficulty: DifficultyLevel
    why_recommended: str
    what_to_look_for: str


class _LearningResourcesLLMOutput(BaseModel):
    resources: list[_LearningResourceLLMEntry] = Field(..., description="One entry per missing skill given")


class LearningResourceRecommenderAgent:
    """
    LLM-only agent that turns a candidate's missing skills into a personalized learning path.

    Never fabricates a specific course/instructor/URL — see LEARNING_RESOURCES_SYSTEM_PROMPT's
    hard prohibition; the agent itself (not the LLM) attaches a real Udemy search URL per skill.

    Exposes a single stable interface — recommend(...) → list[LearningResourceEntry].
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
        self._chain = LEARNING_RESOURCES_PROMPT | self._llm.with_structured_output(_LearningResourcesLLMOutput)

        logger.info("LearningResourceRecommenderAgent initialised (deployment=%s)", settings.azure_openai_chat_deployment)

    async def recommend(
        self,
        resume_text: str,
        target_role: str,
        analysis: ResumeAnalysis,
        extra_missing_skills: list[str],
    ) -> list[LearningResourceEntry]:
        missing_skills = list(dict.fromkeys([*analysis.missing_skills, *extra_missing_skills]))
        logger.info("Recommending learning resources for role '%s' (%d skills)", target_role, len(missing_skills))

        result: _LearningResourcesLLMOutput = await self._chain.ainvoke(
            {
                "target_role": target_role,
                "missing_skills": ", ".join(missing_skills) if missing_skills else "none identified",
                "resume_text": resume_text,
            }
        )

        resources = [
            LearningResourceEntry(
                skill=entry.skill,
                difficulty=entry.difficulty,
                why_recommended=entry.why_recommended,
                what_to_look_for=entry.what_to_look_for,
                udemy_search_url=f"https://www.udemy.com/courses/search/?q={quote(entry.skill)}",
            )
            for entry in result.resources
        ]
        logger.info("Learning resource recommendation complete — %d entries", len(resources))
        return resources


@lru_cache(maxsize=1)
def get_learning_resource_recommender_agent() -> LearningResourceRecommenderAgent:
    """Cached factory — builds the agent once and reuses it across all requests."""
    return LearningResourceRecommenderAgent(get_settings())
