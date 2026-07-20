import logging
from functools import lru_cache

from langchain_openai import AzureChatOpenAI

from app.agent.prompts import EVALUATE_ANSWER_PROMPT
from app.core.config import Settings, get_settings
from app.models.schemas import AnswerEvaluation

logger = logging.getLogger(__name__)


class AnswerEvaluatorAgent:
    """
    Stateless, single-turn agent that scores one mock-interview question/answer pair.

    No retrieval, no memory — each call is fully self-contained, matching the mock interview's
    turn-based, backend-stateless design (the frontend holds prior Q&A in local state).

    Exposes a single stable interface — evaluate(...) → AnswerEvaluation.
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
        self._chain = EVALUATE_ANSWER_PROMPT | self._llm.with_structured_output(AnswerEvaluation)

        logger.info("AnswerEvaluatorAgent initialised (deployment=%s)", settings.azure_openai_chat_deployment)

    async def evaluate(
        self, question: str, category: str, target_role: str, company_slug: str, candidate_answer: str
    ) -> AnswerEvaluation:
        logger.info("Evaluating %s answer for role '%s' at %s", category, target_role, company_slug)
        result: AnswerEvaluation = await self._chain.ainvoke(
            {
                "question": question,
                "category": category,
                "target_role": target_role,
                "company_slug": company_slug,
                "candidate_answer": candidate_answer,
            }
        )
        logger.info("Evaluation complete — score: %d/100", result.score)
        return result


@lru_cache(maxsize=1)
def get_answer_evaluator_agent() -> AnswerEvaluatorAgent:
    """Cached factory — builds the agent once and reuses it across all requests."""
    return AnswerEvaluatorAgent(get_settings())
