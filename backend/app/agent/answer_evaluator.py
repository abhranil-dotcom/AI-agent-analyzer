import logging
from functools import lru_cache

from langchain_openai import AzureChatOpenAI

from app.agent.prompts import EVALUATE_ANSWER_PROMPT
from app.core.config import Settings, get_settings
from app.models.schemas import AnswerEvaluation, SpeechMetrics, VideoMetrics

logger = logging.getLogger(__name__)


def _format_delivery_context(speech_metrics: SpeechMetrics | None, video_metrics: VideoMetrics | None) -> str:
    """Build the optional 'Delivery Metrics' block fed to the evaluator prompt. Empty string when
    both are None (Text mode), so the chain input is byte-identical to pre-voice/video behavior."""
    if speech_metrics is None and video_metrics is None:
        return ""

    lines = ["Delivery Metrics (real, measured — not self-reported):"]
    if speech_metrics is not None:
        lines.append(f"- Speaking pace: {speech_metrics.words_per_minute:.0f} words per minute")
        lines.append(f"- Answer duration: {speech_metrics.duration_seconds:.0f} seconds")
        if speech_metrics.filler_word_count > 0:
            examples = ", ".join(speech_metrics.filler_words[:8])
            lines.append(f"- Filler words used: {speech_metrics.filler_word_count} (e.g. {examples})")
        else:
            lines.append("- Filler words used: none detected")
    if video_metrics is not None:
        lines.append(f"- Camera-facing (eye contact proxy): {video_metrics.camera_facing_ratio * 100:.0f}% of the answer")
        lines.append(f"- Head-stability (posture proxy): {video_metrics.head_stability_score}/100")
        if video_metrics.face_presence_ratio < 0.5:
            lines.append(
                f"- Face was only detected in {video_metrics.face_presence_ratio * 100:.0f}% of sampled frames "
                "(candidate may have been out of frame for parts of the answer)"
            )
    return "\n".join(lines)


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
        self,
        question: str,
        category: str,
        target_role: str,
        company_slug: str,
        candidate_answer: str,
        speech_metrics: SpeechMetrics | None = None,
        video_metrics: VideoMetrics | None = None,
    ) -> AnswerEvaluation:
        logger.info("Evaluating %s answer for role '%s' at %s", category, target_role, company_slug)
        result: AnswerEvaluation = await self._chain.ainvoke(
            {
                "question": question,
                "category": category,
                "target_role": target_role,
                "company_slug": company_slug,
                "candidate_answer": candidate_answer,
                "delivery_context": _format_delivery_context(speech_metrics, video_metrics),
            }
        )
        logger.info("Evaluation complete — score: %d/100", result.score)
        return result


@lru_cache(maxsize=1)
def get_answer_evaluator_agent() -> AnswerEvaluatorAgent:
    """Cached factory — builds the agent once and reuses it across all requests."""
    return AnswerEvaluatorAgent(get_settings())
