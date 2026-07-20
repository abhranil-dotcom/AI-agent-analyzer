import logging
from functools import lru_cache

from langchain_openai import AzureChatOpenAI

from app.agent.prompts import SKILL_GAP_PROMPT
from app.core.config import Settings, get_settings
from app.models.schemas import ResumeAnalysis, SkillGapAnalysis

logger = logging.getLogger(__name__)


class SkillGapAnalyzerAgent:
    """
    LLM-only agent that turns a candidate's skill gaps into a prioritized learning path.

    Never fabricates clickable URLs — see SKILL_GAP_SYSTEM_PROMPT's hard prohibition; only
    named, well-known resources or search terms are produced.

    Exposes a single stable interface — analyze(...) → SkillGapAnalysis.
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
        self._chain = SKILL_GAP_PROMPT | self._llm.with_structured_output(SkillGapAnalysis)

        logger.info("SkillGapAnalyzerAgent initialised (deployment=%s)", settings.azure_openai_chat_deployment)

    async def analyze(self, resume_text: str, target_role: str, analysis: ResumeAnalysis) -> SkillGapAnalysis:
        logger.info("Analysing skill gap for role '%s'", target_role)
        result: SkillGapAnalysis = await self._chain.ainvoke(
            {
                "target_role": target_role,
                "skills": ", ".join(analysis.skills),
                "missing_skills": ", ".join(analysis.missing_skills),
                "weaknesses": ", ".join(analysis.weaknesses),
                "resume_text": resume_text,
            }
        )
        logger.info("Skill gap analysis complete — %d entries in learning path", len(result.learning_path))
        return result


@lru_cache(maxsize=1)
def get_skill_gap_analyzer_agent() -> SkillGapAnalyzerAgent:
    """Cached factory — builds the agent once and reuses it across all requests."""
    return SkillGapAnalyzerAgent(get_settings())
