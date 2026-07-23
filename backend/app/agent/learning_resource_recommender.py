import logging
from functools import lru_cache

from langchain_openai import AzureChatOpenAI
from pydantic import BaseModel, Field

from app.agent.prompts import LEARNING_RESOURCES_PROMPT
from app.core.config import Settings, get_settings
from app.data.learning_platforms import LearningPlatformKey, resolve_resource
from app.models.schemas import DifficultyLevel, LearningResourceEntry, ResumeAnalysis

logger = logging.getLogger(__name__)


class _LearningResourceLLMEntry(BaseModel):
    """LLM-facing shape — deliberately excludes every factual field (title/url/duration), which
    the agent resolves itself via resolve_resource() rather than letting the model guess."""

    skill: str
    platform: LearningPlatformKey
    difficulty: DifficultyLevel
    why_recommended: str
    what_to_look_for: str


class _LearningResourcesLLMOutput(BaseModel):
    resources: list[_LearningResourceLLMEntry] = Field(
        ..., description="2-5 platform picks per missing skill given"
    )


class LearningResourceRecommenderAgent:
    """
    LLM-only agent that turns a candidate's missing skills into a personalized, multi-platform
    learning path (Udemy, Coursera, edX, freeCodeCamp, YouTube, Microsoft Learn, AWS Skill
    Builder, Google Cloud Skills Boost, Oracle University, Cisco Networking Academy, Kaggle
    Learn, Codecademy, GeeksforGeeks, LeetCode, HackerRank).

    Never fabricates a specific course/instructor/URL/duration — see
    LEARNING_RESOURCES_SYSTEM_PROMPT's hard prohibition; the agent itself (not the LLM) resolves
    every factual field per (skill, platform) pick via app.data.learning_platforms.resolve_resource.

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

        resources = []
        for entry in result.resources:
            resolved = resolve_resource(entry.platform, entry.skill)
            resources.append(
                LearningResourceEntry(
                    skill=entry.skill,
                    platform=entry.platform,
                    platform_name=resolved.platform_name,
                    title=resolved.title,
                    difficulty=entry.difficulty,
                    why_recommended=entry.why_recommended,
                    what_to_look_for=entry.what_to_look_for,
                    estimated_duration=resolved.estimated_duration,
                    resource_url=resolved.resource_url,
                    is_curated=resolved.is_curated,
                )
            )
        logger.info("Learning resource recommendation complete — %d entries", len(resources))
        return resources


@lru_cache(maxsize=1)
def get_learning_resource_recommender_agent() -> LearningResourceRecommenderAgent:
    """Cached factory — builds the agent once and reuses it across all requests."""
    return LearningResourceRecommenderAgent(get_settings())
