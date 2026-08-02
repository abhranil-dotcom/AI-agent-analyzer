import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.agent.answer_evaluator import AnswerEvaluatorAgent, get_answer_evaluator_agent
from app.agent.interview_kit_generator import InterviewKitGeneratorAgent, get_interview_kit_agent
from app.agent.interview_review_generator import get_interview_review_agent
from app.api.deps import get_current_user
from app.data.companies.registry import get_company
from app.db.database import get_db
from app.db.models import InterviewHistory, InterviewReview as InterviewReviewRow, User
from app.models.schemas import (
    EvaluateAnswerRequest,
    EvaluateAnswerResponse,
    GenerateInterviewKitRequest,
    GenerateInterviewKitResponse,
    InterviewHistoryDetail,
    InterviewHistoryEntry,
    InterviewHistoryListResponse,
    InterviewQAEntry,
    InterviewReview,
    SaveInterviewHistoryRequest,
)
from app.services.vector_store import KnowledgeBaseUnavailableError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/interview", tags=["interview"], dependencies=[Depends(get_current_user)])


@router.post("/kit", response_model=GenerateInterviewKitResponse)
async def generate_interview_kit(
    body: GenerateInterviewKitRequest,
    agent: InterviewKitGeneratorAgent = Depends(get_interview_kit_agent),
) -> GenerateInterviewKitResponse:
    """Retrieve grounding context from the company's knowledge base and generate an interview kit."""
    try:
        kit = await agent.generate(body.company_slug, body.target_role, body.extracted_text, body.analysis)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except KnowledgeBaseUnavailableError as exc:
        # The real filesystem path was already logged server-side in vector_store.py. Only a
        # friendly, display-name-aware message goes to the client — never the raw path.
        company = get_company(body.company_slug)
        company_label = company.display_name if company else body.company_slug
        logger.error(
            "Interview kit unavailable for company_slug=%s (namespace=%s, kb_subdir=%s)",
            body.company_slug, exc.namespace, exc.kb_subdir,
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                f"{company_label} interview knowledge base is not available yet. "
                "Please try another company or contact the administrator."
            ),
        ) from exc
    except Exception as exc:
        logger.exception("Interview kit generation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The interview prep service is unavailable. Please try again shortly.",
        ) from exc

    return GenerateInterviewKitResponse(kit=kit, company_slug=body.company_slug)


@router.post("/evaluate", response_model=EvaluateAnswerResponse)
async def evaluate_answer(
    body: EvaluateAnswerRequest,
    agent: AnswerEvaluatorAgent = Depends(get_answer_evaluator_agent),
) -> EvaluateAnswerResponse:
    """Score a single mock-interview question/answer pair."""
    try:
        evaluation = await agent.evaluate(
            body.question,
            body.category,
            body.target_role,
            body.company_slug,
            body.candidate_answer,
            body.speech_metrics,
            body.video_metrics,
        )
    except Exception as exc:
        logger.exception("Answer evaluation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The evaluation service is unavailable. Please try again shortly.",
        ) from exc

    return EvaluateAnswerResponse(evaluation=evaluation)


def _infer_interview_mode(qa: list[InterviewQAEntry]) -> str:
    """No `interview_mode` is persisted at the session level (see InterviewHistory) — derived from
    which per-turn metrics are present, same inference InterviewHistoryDetailPage.jsx does client-side."""
    if any(item.video_metrics is not None for item in qa):
        return "video"
    if any(item.speech_metrics is not None for item in qa):
        return "voice"
    return "text"


def _get_owned_interview_history(history_id: int, current_user: User, db: Session) -> InterviewHistory:
    entry = (
        db.query(InterviewHistory)
        .filter(InterviewHistory.id == history_id, InterviewHistory.user_id == current_user.id)
        .first()
    )
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview history entry not found.")
    return entry


@router.post("/history", response_model=InterviewHistoryDetail, status_code=status.HTTP_201_CREATED)
async def save_interview_history(
    body: SaveInterviewHistoryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> InterviewHistoryDetail:
    """Saves one completed mock-interview session. Called once by the frontend when a session
    finishes — there's no single backend call to auto-persist from, since a session spans many
    /evaluate calls. Scores are computed here from the submitted Q&A, never trusted from the client."""
    qa_count = len(body.qa)
    overall_score = round(sum(item.evaluation.score for item in body.qa) / qa_count)
    communication_score = round(sum(item.evaluation.communication_score for item in body.qa) / qa_count)
    technical_score = round(sum(item.evaluation.technical_score for item in body.qa) / qa_count)
    confidence_score = round(sum(item.evaluation.confidence_score for item in body.qa) / qa_count)

    entry = InterviewHistory(
        user_id=current_user.id,
        company_slug=body.company_slug,
        company_display_name=body.company_display_name,
        target_role=body.target_role,
        duration_seconds=body.duration_seconds,
        overall_score=overall_score,
        communication_score=communication_score,
        technical_score=technical_score,
        confidence_score=confidence_score,
        qa_json=[item.model_dump() for item in body.qa],
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    # Best-effort: the AI Interview Review is an enhancement, not the record itself — a failure
    # here must never lose the interview the candidate just saved. Agent construction happens
    # INSIDE this try, not via Depends(...) — a Depends(...) failure (e.g. missing LLM credentials)
    # is resolved by FastAPI before this function body even runs, which would turn a review-only
    # failure into a 500 that loses the whole save.
    review: InterviewReview | None = None
    try:
        review_agent = get_interview_review_agent()
        review = await review_agent.generate(
            body.company_slug,
            body.target_role,
            _infer_interview_mode(body.qa),
            body.qa,
            overall_score,
            technical_score,
            communication_score,
            confidence_score,
        )
        db.add(
            InterviewReviewRow(
                interview_history_id=entry.id,
                overall_review=review.overall_review,
                strengths=review.strengths,
                areas_to_improve=review.areas_to_improve,
                actionable_suggestions=review.actionable_suggestions,
                focus_for_next_interview=review.focus_for_next_interview,
            )
        )
        db.commit()
    except Exception as exc:
        logger.exception("Interview review generation failed for history_id=%s: %s", entry.id, exc)
        db.rollback()
        review = None

    return InterviewHistoryDetail(
        **InterviewHistoryEntry.model_validate(entry).model_dump(),
        duration_seconds=entry.duration_seconds,
        qa=entry.qa_json,
        review=review,
    )


@router.get("/history", response_model=InterviewHistoryListResponse)
async def list_interview_history(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> InterviewHistoryListResponse:
    entries = (
        db.query(InterviewHistory)
        .filter(InterviewHistory.user_id == current_user.id)
        .order_by(InterviewHistory.interview_date.desc())
        .all()
    )
    return InterviewHistoryListResponse(entries=[InterviewHistoryEntry.model_validate(e) for e in entries])


@router.delete("/history", status_code=status.HTTP_204_NO_CONTENT)
async def clear_interview_history(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> None:
    """Deletes every interview history row for the current user — irreversible, confirmed client-side."""
    db.query(InterviewHistory).filter(InterviewHistory.user_id == current_user.id).delete()
    db.commit()


@router.get("/history/{history_id}", response_model=InterviewHistoryDetail)
async def get_interview_history(
    history_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> InterviewHistoryDetail:
    """Returns the exact saved Q&A/feedback — never regenerated."""
    entry = _get_owned_interview_history(history_id, current_user, db)
    review_row = (
        db.query(InterviewReviewRow).filter(InterviewReviewRow.interview_history_id == entry.id).first()
    )
    return InterviewHistoryDetail(
        **InterviewHistoryEntry.model_validate(entry).model_dump(),
        duration_seconds=entry.duration_seconds,
        qa=entry.qa_json,
        review=InterviewReview.model_validate(review_row) if review_row else None,
    )


@router.delete("/history/{history_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_interview_history(
    history_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> None:
    entry = _get_owned_interview_history(history_id, current_user, db)
    db.delete(entry)
    db.commit()
