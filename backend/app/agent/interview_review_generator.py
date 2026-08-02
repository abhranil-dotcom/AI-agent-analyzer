import logging
from functools import lru_cache

from langchain_openai import AzureChatOpenAI

from app.agent.prompts import GENERATE_INTERVIEW_REVIEW_PROMPT
from app.core.config import Settings, get_settings
from app.models.schemas import InterviewQAEntry, InterviewReview

logger = logging.getLogger(__name__)


def _average(values: list[float]) -> float | None:
    return sum(values) / len(values) if values else None


def _dedupe(items: list[str], limit: int = 8) -> list[str]:
    seen: list[str] = []
    for item in items:
        if item and item not in seen:
            seen.append(item)
        if len(seen) >= limit:
            break
    return seen


def _format_content_notes(qa: list[InterviewQAEntry]) -> str:
    """Content/technical notes — present for every mode, built purely from the real per-question
    evaluator output already produced for this session (never re-derived or guessed)."""
    scores = [item.evaluation.score for item in qa]
    missing_points = _dedupe([p for item in qa for p in item.evaluation.missing_points])
    suggestions = _dedupe([s for item in qa for s in item.evaluation.improvement_suggestions])

    lines = [
        "Content Notes (real per-question evaluator output):",
        f"- {len(qa)} questions answered, scores ranged {min(scores)}-{max(scores)}/100",
    ]
    if missing_points:
        lines.append(f"- Recurring missing points across answers: {'; '.join(missing_points)}")
    if suggestions:
        lines.append(f"- Content/technical improvement suggestions already given: {'; '.join(suggestions)}")
    return "\n".join(lines)


def _format_delivery_notes(qa: list[InterviewQAEntry]) -> str | None:
    """Voice/Video only. None when no turn captured speech metrics — the caller must then omit
    this block entirely so the LLM has no basis to mention delivery at all."""
    speech = [item.speech_metrics for item in qa if item.speech_metrics is not None]
    if not speech:
        return None

    wpm = _average([s.words_per_minute for s in speech])
    total_fillers = sum(s.filler_word_count for s in speech)
    fluency = _average([s.fluency_score for s in speech if s.fluency_score is not None])
    confidence = _average([s.speech_confidence for s in speech if s.speech_confidence is not None])
    pause_counts = [s.pause_count for s in speech if s.pause_count is not None]
    longest_pauses = [s.longest_pause_seconds for s in speech if s.longest_pause_seconds is not None]

    strengths = _dedupe([s for item in qa for s in item.evaluation.communication_strengths])
    improvements = _dedupe([s for item in qa for s in item.evaluation.communication_improvement_suggestions])

    lines = ["Delivery Notes (real, client-measured speech signals — not self-reported):"]
    if wpm is not None:
        lines.append(f"- Average speaking pace: {wpm:.0f} words per minute")
    if total_fillers > 0:
        lines.append(f"- Filler words used across the session: {total_fillers}")
    if fluency is not None:
        lines.append(f"- Average fluency score: {fluency:.0f}/100")
    if pause_counts:
        lines.append(
            f"- Pauses: {sum(pause_counts)} total across the session"
            + (f", longest single pause {max(longest_pauses):.1f}s" if longest_pauses else "")
        )
    if confidence is not None:
        lines.append(f"- Average recognizer confidence (rough clarity/pronunciation proxy): {confidence * 100:.0f}%")
    if strengths:
        lines.append(f"- Delivery strengths already noted: {'; '.join(strengths)}")
    if improvements:
        lines.append(f"- Delivery improvement suggestions already given: {'; '.join(improvements)}")
    return "\n".join(lines)


def _format_presentation_notes(qa: list[InterviewQAEntry]) -> str | None:
    """Video only. None when no turn captured video metrics."""
    video = [item.video_metrics for item in qa if item.video_metrics is not None]
    if not video:
        return None

    face_presence = _average([v.face_presence_ratio for v in video])
    camera_facing = _average([v.camera_facing_ratio for v in video])
    posture = _average([v.posture_score for v in video if v.posture_score is not None])
    brightness = _average([v.average_brightness for v in video if v.average_brightness is not None])
    out_of_frame = sum(v.out_of_frame_events or 0 for v in video)
    posture_warnings = sum(v.posture_warning_events or 0 for v in video)
    phone_use = sum(v.phone_use_events or 0 for v in video)
    multiple_people = sum(v.multiple_person_events or 0 for v in video)

    strengths = _dedupe([s for item in qa for s in item.evaluation.presentation_strengths])
    improvements = _dedupe([s for item in qa for s in item.evaluation.presentation_improvement_suggestions])

    lines = ["Presentation Notes (real, client-measured camera signals):"]
    if face_presence is not None:
        lines.append(f"- Average face visibility: {face_presence * 100:.0f}% of sampled frames")
    if camera_facing is not None:
        lines.append(f"- Average camera engagement (facing camera): {camera_facing * 100:.0f}%")
    if posture is not None:
        lines.append(f"- Average posture score: {posture:.0f}/100")
    if brightness is not None:
        lines.append(f"- Average lighting brightness: {brightness:.0f}/100")
    if out_of_frame > 0:
        lines.append(f"- Drifted out of frame: {out_of_frame} time(s) across the session")
    if posture_warnings > 0:
        lines.append(f"- Sustained poor-posture episodes: {posture_warnings} across the session")
    if phone_use > 0:
        lines.append(f"- Possible phone-use episodes detected: {phone_use} across the session")
    if multiple_people > 0:
        lines.append(f"- Multiple people visible episodes: {multiple_people} across the session")
    if strengths:
        lines.append(f"- Presentation strengths already noted: {'; '.join(strengths)}")
    if improvements:
        lines.append(f"- Presentation improvement suggestions already given: {'; '.join(improvements)}")
    return "\n".join(lines)


def _format_session_notes(qa: list[InterviewQAEntry]) -> str:
    blocks = [_format_content_notes(qa)]
    delivery = _format_delivery_notes(qa)
    if delivery:
        blocks.append(delivery)
    presentation = _format_presentation_notes(qa)
    if presentation:
        blocks.append(presentation)
    return "\n\n".join(blocks)


class InterviewReviewAgent:
    """
    Generates the end-of-session "AI Interview Review" — a short narrative synthesis (overall
    review, strengths, areas to improve, actionable suggestions, top-3 focus) grounded entirely in
    the real per-question evaluations and aggregated delivery/presentation metrics already captured
    during the session. Stateless, single call per session, mirrors AnswerEvaluatorAgent's shape.
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
        self._chain = GENERATE_INTERVIEW_REVIEW_PROMPT | self._llm.with_structured_output(InterviewReview)

        logger.info("InterviewReviewAgent initialised (deployment=%s)", settings.azure_openai_chat_deployment)

    async def generate(
        self,
        company_slug: str,
        target_role: str,
        interview_mode: str,
        qa: list[InterviewQAEntry],
        overall_score: int,
        technical_score: int,
        communication_score: int,
        confidence_score: int,
    ) -> InterviewReview:
        logger.info("Generating interview review for %s mode, %d questions", interview_mode, len(qa))
        result: InterviewReview = await self._chain.ainvoke(
            {
                "company_slug": company_slug,
                "target_role": target_role,
                "interview_mode": interview_mode,
                "question_count": len(qa),
                "overall_score": overall_score,
                "technical_score": technical_score,
                "communication_score": communication_score,
                "confidence_score": confidence_score,
                "session_notes": _format_session_notes(qa),
            }
        )
        logger.info("Interview review generated")
        return result


@lru_cache(maxsize=1)
def get_interview_review_agent() -> InterviewReviewAgent:
    """Cached factory — builds the agent once and reuses it across all requests."""
    return InterviewReviewAgent(get_settings())
