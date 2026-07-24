import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.agent.company_recommender import CompanyRecommenderAgent, get_company_recommender_agent
from app.api.deps import get_current_user
from app.db.database import get_db
from app.db.models import CompanyRecommendationHistory, User
from app.models.schemas import RecommendCompaniesRequest, RecommendCompaniesResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/companies", tags=["companies"], dependencies=[Depends(get_current_user)])


@router.post("/recommend", response_model=RecommendCompaniesResponse)
async def recommend_companies(
    body: RecommendCompaniesRequest,
    agent: CompanyRecommenderAgent = Depends(get_company_recommender_agent),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RecommendCompaniesResponse:
    """Rank the supported company roster for this resume, role, and prior ATS analysis."""
    try:
        recommendations = await agent.recommend(body.extracted_text, body.target_role, body.analysis)
    except Exception as exc:
        logger.exception("Company recommendation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The recommendation service is unavailable. Please try again shortly.",
        ) from exc

    # Persisted automatically so the Dashboard can show a cached "recommended companies" section
    # without triggering a fresh LLM call on every visit.
    db.add(
        CompanyRecommendationHistory(
            user_id=current_user.id,
            target_role=body.target_role,
            recommendations_json=[r.model_dump() for r in recommendations],
        )
    )
    db.commit()

    return RecommendCompaniesResponse(recommendations=recommendations, target_role=body.target_role)
