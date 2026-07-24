import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.db.models import CompanyRecommendationHistory, InterviewHistory, JDMatchHistory, ResumeHistory, User
from app.models.schemas import CompanyRecommendation, DashboardSummaryResponse, InterviewHistoryEntry, ResumeHistoryEntry

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"], dependencies=[Depends(get_current_user)])

_MAX_RECOMMENDED_COMPANIES = 5
_MAX_AI_SUGGESTIONS = 5


def _build_ai_suggestions(
    latest_resume: ResumeHistory | None,
    latest_interview: InterviewHistory | None,
    latest_jd_match: JDMatchHistory | None,
) -> list[str]:
    """Purely templated from already-stored data — no LLM call, so this costs nothing extra
    on every dashboard load."""
    suggestions: list[str] = []

    if latest_resume is not None:
        analysis = latest_resume.analysis_json
        for skill in analysis.get("missing_skills", [])[:2]:
            suggestions.append(f"Improve {skill} before applying to {latest_resume.target_role} roles.")
        if latest_resume.ats_score < 70:
            suggestions.append("Your resume's ATS score is below 70 — try the Resume Rewrite tool to strengthen it.")

    if latest_interview is not None:
        dimensions = {
            "communication": latest_interview.communication_score,
            "technical depth": latest_interview.technical_score,
            "confidence": latest_interview.confidence_score,
        }
        weakest_label, weakest_score = min(dimensions.items(), key=lambda item: item[1])
        suggestions.append(
            f"Your {weakest_label} scored lowest ({weakest_score}/100) in your last mock interview — "
            "practice more questions focused on that."
        )

    if latest_jd_match is not None:
        missing_keywords = latest_jd_match.match_json.get("missing_keywords", [])[:3]
        if missing_keywords:
            suggestions.append(
                f"Add these keywords to better match job descriptions: {', '.join(missing_keywords)}."
            )

    if not suggestions:
        suggestions.append("Upload your resume to get personalized, data-driven suggestions here.")

    return suggestions[:_MAX_AI_SUGGESTIONS]


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

    present_scores = [s for s in (latest_ats_score, latest_jd_match_score, latest_interview_score) if s is not None]
    overall_career_score = round(sum(present_scores) / len(present_scores)) if present_scores else None

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
        recent_resume=ResumeHistoryEntry.model_validate(latest_resume) if latest_resume else None,
        recent_interview=InterviewHistoryEntry.model_validate(latest_interview) if latest_interview else None,
        recommended_companies=recommended_companies,
        ai_suggestions=_build_ai_suggestions(latest_resume, latest_interview, latest_jd_match),
    )
