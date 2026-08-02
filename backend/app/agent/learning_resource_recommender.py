import logging
from functools import lru_cache

from langchain_openai import AzureChatOpenAI
from pydantic import BaseModel, Field

from app.agent.prompts import LEARNING_RESOURCES_PROMPT
from app.core.config import Settings, get_settings
from app.data.learning_platforms import ResolvedResource, get_curated_matches
from app.models.schemas import DifficultyLevel, LearningResourceEntry, ResumeAnalysis

logger = logging.getLogger(__name__)


class _CandidateNote(BaseModel):
    """LLM-facing shape — narrative only. Every factual field (title/url/instructor/price/is_free)
    was already resolved deterministically before the LLM ever sees a candidate; it cannot alter
    or invent any of them, only write about the exact resource it's given by index."""

    index: int
    difficulty: DifficultyLevel
    why_recommended: str
    what_to_look_for: str


class _LearningResourcesLLMOutput(BaseModel):
    notes: list[_CandidateNote] = Field(..., description="Exactly one note per candidate given, matched by index")


class LearningResourceRecommenderAgent:
    """
    Turns a candidate's missing skills into a personalized learning path built ONLY from
    individually verified real resources (see app.data.learning_platforms.get_curated_matches).

    Unlike a naive "ask the LLM to recommend a course" design, resource selection is entirely
    deterministic: for each missing skill, the best verified paid resource and best verified free
    resource (if any exist) are looked up directly — never LLM-picked, never a generic search or
    catalog-browse link. The LLM's only role is writing a short personalized why/what-to-look-for
    note per resource and judging its difficulty; it never sees or influences which resource is
    used, so it cannot recommend something that doesn't exist. A missing skill with no verified
    match on a given side (paid/free) simply isn't represented there — never a fabricated stand-in.

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

        # Deterministic candidate selection — happens BEFORE any LLM call, so the LLM only ever
        # narrates real, already-resolved resources. Each skill contributes at most one paid and
        # one free candidate; skills with no verified match on a side simply contribute nothing there.
        candidates: list[tuple[str, ResolvedResource]] = []
        for skill in missing_skills:
            matches = get_curated_matches(skill)
            if matches["paid"] is not None:
                candidates.append((skill, matches["paid"]))
            if matches["free"] is not None:
                candidates.append((skill, matches["free"]))

        if not candidates:
            logger.info("No verified curated resources for any missing skill — returning empty list")
            return []

        candidates_block = "\n".join(
            f"[{i}] Skill: {skill} | Platform: {resolved.platform_name} | Title: {resolved.title}"
            for i, (skill, resolved) in enumerate(candidates)
        )

        result: _LearningResourcesLLMOutput = await self._chain.ainvoke(
            {
                "target_role": target_role,
                "resume_text": resume_text,
                "candidates": candidates_block,
            }
        )
        notes_by_index = {note.index: note for note in result.notes}

        resources = []
        for i, (skill, resolved) in enumerate(candidates):
            note = notes_by_index.get(i)
            if note is None:
                # The LLM skipped this candidate — never invent a note; drop it rather than show a
                # real resource with blank/fabricated narrative.
                logger.warning("No LLM note returned for candidate index %d (skill=%s) — dropping", i, skill)
                continue
            resources.append(
                LearningResourceEntry(
                    skill=skill,
                    platform=resolved.platform,
                    platform_name=resolved.platform_name,
                    title=resolved.title,
                    difficulty=note.difficulty,
                    why_recommended=note.why_recommended,
                    what_to_look_for=note.what_to_look_for,
                    estimated_duration=resolved.estimated_duration,
                    resource_url=resolved.resource_url,
                    is_curated=resolved.is_curated,
                    instructor=resolved.instructor,
                    price_status=resolved.price_status,
                    is_free=resolved.is_free,
                )
            )
        logger.info("Learning resource recommendation complete — %d entries", len(resources))
        return resources


@lru_cache(maxsize=1)
def get_learning_resource_recommender_agent() -> LearningResourceRecommenderAgent:
    """Cached factory — builds the agent once and reuses it across all requests."""
    return LearningResourceRecommenderAgent(get_settings())
