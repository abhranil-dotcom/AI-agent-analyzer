import logging
from functools import lru_cache

from langchain_openai import AzureChatOpenAI

from app.agent.prompts import COVER_LETTER_PROMPT
from app.core.config import Settings, get_settings
from app.models.schemas import CoverLetter, ResumeAnalysis

logger = logging.getLogger(__name__)

_NO_COMPANY_FALLBACK = "Not specified — write a generic but still role-targeted letter."


class CoverLetterGeneratorAgent:
    """
    LLM-only agent that writes a complete cover letter grounded in the candidate's resume.

    Works standalone (company_name=None produces a generic-but-role-targeted letter) or
    personalized if a company name is already known from an earlier step in the session.

    Exposes a single stable interface — generate(...) → CoverLetter.
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
        self._chain = COVER_LETTER_PROMPT | self._llm.with_structured_output(CoverLetter)

        logger.info("CoverLetterGeneratorAgent initialised (deployment=%s)", settings.azure_openai_chat_deployment)

    async def generate(
        self, resume_text: str, target_role: str, analysis: ResumeAnalysis, company_name: str | None
    ) -> CoverLetter:
        company_context = company_name or _NO_COMPANY_FALLBACK
        logger.info("Generating cover letter for role '%s' (company=%s)", target_role, company_name or "none")
        result: CoverLetter = await self._chain.ainvoke(
            {
                "target_role": target_role,
                "company_name": company_context,
                "summary": analysis.summary,
                "strengths": ", ".join(analysis.strengths),
                "skills": ", ".join(analysis.skills),
                "resume_text": resume_text,
            }
        )
        logger.info("Cover letter complete — %d body paragraphs", len(result.body_paragraphs))
        return result


@lru_cache(maxsize=1)
def get_cover_letter_generator_agent() -> CoverLetterGeneratorAgent:
    """Cached factory — builds the agent once and reuses it across all requests."""
    return CoverLetterGeneratorAgent(get_settings())
