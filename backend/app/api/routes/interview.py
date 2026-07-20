import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.agent.answer_evaluator import AnswerEvaluatorAgent, get_answer_evaluator_agent
from app.agent.interview_kit_generator import InterviewKitGeneratorAgent, get_interview_kit_agent
from app.models.schemas import (
    EvaluateAnswerRequest,
    EvaluateAnswerResponse,
    GenerateInterviewKitRequest,
    GenerateInterviewKitResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/interview", tags=["interview"])


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
            body.question, body.category, body.target_role, body.company_slug, body.candidate_answer
        )
    except Exception as exc:
        logger.exception("Answer evaluation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The evaluation service is unavailable. Please try again shortly.",
        ) from exc

    return EvaluateAnswerResponse(evaluation=evaluation)
