import logging

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.db.models import CompanyRecommendationHistory, InterviewHistory, JDMatchHistory, ResumeHistory, User
from app.models.schemas import (
    CompanyRecommendation,
    DashboardSummaryResponse,
    InterviewHistoryEntry,
    ProgressPoint,
    ResumeHistoryEntry,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"], dependencies=[Depends(get_current_user)])

_MAX_RECOMMENDED_COMPANIES = 5
_MAX_PROGRESS_POINTS = 10

# Overall Career Score weighting — renormalized over whichever of these are present so a user
# who hasn't run a JD match or interview yet isn't penalized for missing data.
_SCORE_WEIGHTS = {"ats": 0.4, "jd_match": 0.3, "interview": 0.3}


def _weighted_overall_score(ats: int | None, jd_match: int | None, interview: int | None) -> int | None:
    present = {k: v for k, v in {"ats": ats, "jd_match": jd_match, "interview": interview}.items() if v is not None}
    if not present:
        return None
    total_weight = sum(_SCORE_WEIGHTS[k] for k in present)
    weighted_sum = sum(v * _SCORE_WEIGHTS[k] for k, v in present.items())
    return round(weighted_sum / total_weight)


@router.get("/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> DashboardSummaryResponse:
    """Aggregates a user's latest history rows. No AI calls — just a handful of cheap, indexed
    'latest row' lookups against the history tables."""
    latest_resume = (
        db.query(ResumeHistory)
        .filter(ResumeHistory.user_id == current_user.id)
        .order_by(ResumeHistory.uploaded_at.desc())
        .first()
    )
    latest_interview = (
        db.query(InterviewHistory)
        .filter(InterviewHistory.user_id == current_user.id)
        .order_by(InterviewHistory.interview_date.desc())
        .first()
    )
    latest_jd_match = (
        db.query(JDMatchHistory)
        .filter(JDMatchHistory.user_id == current_user.id)
        .order_by(JDMatchHistory.matched_at.desc())
        .first()
    )
    latest_company_rec = (
        db.query(CompanyRecommendationHistory)
        .filter(CompanyRecommendationHistory.user_id == current_user.id)
        .order_by(CompanyRecommendationHistory.recommended_at.desc())
        .first()
    )

    latest_ats_score = latest_resume.ats_score if latest_resume else None
    latest_jd_match_score = latest_jd_match.jd_match_score if latest_jd_match else None
    latest_interview_score = latest_interview.overall_score if latest_interview else None

    overall_career_score = _weighted_overall_score(latest_ats_score, latest_jd_match_score, latest_interview_score)

    total_resumes = db.query(func.count(ResumeHistory.id)).filter(ResumeHistory.user_id == current_user.id).scalar()
    total_interviews = (
        db.query(func.count(InterviewHistory.id)).filter(InterviewHistory.user_id == current_user.id).scalar()
    )
    avg_ats = db.query(func.avg(ResumeHistory.ats_score)).filter(ResumeHistory.user_id == current_user.id).scalar()
    avg_interview = (
        db.query(func.avg(InterviewHistory.overall_score)).filter(InterviewHistory.user_id == current_user.id).scalar()
    )
    average_ats_score = round(avg_ats) if avg_ats is not None else None
    average_interview_score = round(avg_interview) if avg_interview is not None else None

    resume_progress_rows = (
        db.query(ResumeHistory.uploaded_at, ResumeHistory.ats_score)
        .filter(ResumeHistory.user_id == current_user.id)
        .order_by(ResumeHistory.uploaded_at.desc())
        .limit(_MAX_PROGRESS_POINTS)
        .all()
    )
    resume_progress = [ProgressPoint(date=d, score=s) for d, s in reversed(resume_progress_rows)]

    interview_progress_rows = (
        db.query(InterviewHistory.interview_date, InterviewHistory.overall_score)
        .filter(InterviewHistory.user_id == current_user.id)
        .order_by(InterviewHistory.interview_date.desc())
        .limit(_MAX_PROGRESS_POINTS)
        .all()
    )
    interview_progress = [ProgressPoint(date=d, score=s) for d, s in reversed(interview_progress_rows)]

    preferred_role = None
    for source in (latest_resume, latest_interview, latest_jd_match, latest_company_rec):
        if source is not None:
            preferred_role = source.target_role
            break

    recommended_companies: list[CompanyRecommendation] = []
    if latest_company_rec is not None:
        ranked = sorted(
            latest_company_rec.recommendations_json, key=lambda r: r.get("match_percentage", 0), reverse=True
        )
        recommended_companies = [CompanyRecommendation(**r) for r in ranked[:_MAX_RECOMMENDED_COMPANIES]]

    return DashboardSummaryResponse(
        preferred_role=preferred_role,
        latest_ats_score=latest_ats_score,
        latest_jd_match_score=latest_jd_match_score,
        latest_interview_score=latest_interview_score,
        overall_career_score=overall_career_score,
        total_resumes=total_resumes,
        total_interviews=total_interviews,
        average_ats_score=average_ats_score,
        average_interview_score=average_interview_score,
        resume_progress=resume_progress,
        interview_progress=interview_progress,
        recent_resume=ResumeHistoryEntry.model_validate(latest_resume) if latest_resume else None,
        recent_interview=InterviewHistoryEntry.model_validate(latest_interview) if latest_interview else None,
        recommended_companies=recommended_companies,
    )
