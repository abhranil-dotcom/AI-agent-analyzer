import logging
from functools import lru_cache

from langchain_openai import AzureChatOpenAI

from app.agent.prompts import INTERVIEW_KIT_PROMPT, QUESTION_COUNTS_PROMPT_TEXT
from app.core.config import Settings, get_settings
from app.data.companies.registry import get_company
from app.models.schemas import InterviewKit, ResumeAnalysis
from app.services.vector_store import get_company_retriever

logger = logging.getLogger(__name__)

_RETRIEVAL_CATEGORIES = (
    "company_overview",
    "interview_process",
    "hr_questions",
    "technical_questions",
    "coding_patterns",
    "preparation_tips",
    "resume_based_questions",
    "interview_experiences",
)


class InterviewKitGeneratorAgent:
    """
    RAG agent that retrieves grounding context from a company's FAISS knowledge base before
    generating a structured interview-preparation kit.

    Exposes a single stable interface — generate(...) → InterviewKit.
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
        self._chain = INTERVIEW_KIT_PROMPT | self._llm.with_structured_output(InterviewKit)

        logger.info("InterviewKitGeneratorAgent initialised (deployment=%s)", settings.azure_openai_chat_deployment)

    async def _retrieve_context(self, company_slug: str, target_role: str) -> str:
        """Retrieve per-category so no single category is starved by a global top-k search."""
        blocks: list[str] = []
        for category in _RETRIEVAL_CATEGORIES:
            retriever = get_company_retriever(company_slug, k=3, category=category)
            docs = await retriever.ainvoke(f"{target_role} interview preparation")
            if docs:
                joined = "\n---\n".join(d.page_content for d in docs)
                blocks.append(f"### {category}\n{joined}")
        return "\n\n".join(blocks)

    async def generate(
        self, company_slug: str, target_role: str, resume_text: str, analysis: ResumeAnalysis
    ) -> InterviewKit:
        company = get_company(company_slug)
        if company is None:
            raise ValueError(f"Unsupported company slug: {company_slug}")

        logger.info("Generating interview kit for %s / role '%s'", company_slug, target_role)
        retrieved_context = await self._retrieve_context(company_slug, target_role)

        kit: InterviewKit = await self._chain.ainvoke(
            {
                "company_name": company.display_name,
                "target_role": target_role,
                "retrieved_context": retrieved_context,
                "resume_text": resume_text,
                "ats_score": analysis.ats_score,
                "summary": analysis.summary,
                "skills": ", ".join(analysis.skills),
                "strengths": ", ".join(analysis.strengths),
                "weaknesses": ", ".join(analysis.weaknesses),
                "missing_skills": ", ".join(analysis.missing_skills),
                "question_counts": QUESTION_COUNTS_PROMPT_TEXT,
            }
        )
        logger.info(
            "Interview kit complete for %s — %d HR, %d resume, %d technical, %d coding questions",
            company_slug,
            len(kit.hr_questions),
            len(kit.resume_questions),
            len(kit.technical_questions),
            len(kit.coding_questions),
        )
        return kit


@lru_cache(maxsize=1)
def get_interview_kit_agent() -> InterviewKitGeneratorAgent:
    """Cached factory — builds the agent once and reuses it across all requests."""
    return InterviewKitGeneratorAgent(get_settings())
