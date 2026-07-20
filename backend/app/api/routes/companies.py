import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.agent.company_recommender import CompanyRecommenderAgent, get_company_recommender_agent
from app.models.schemas import RecommendCompaniesRequest, RecommendCompaniesResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/companies", tags=["companies"])


@router.post("/recommend", response_model=RecommendCompaniesResponse)
async def recommend_companies(
    body: RecommendCompaniesRequest,
    agent: CompanyRecommenderAgent = Depends(get_company_recommender_agent),
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

    return RecommendCompaniesResponse(recommendations=recommendations, target_role=body.target_role)
