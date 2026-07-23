import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from app.agent.cover_letter_generator import CoverLetterGeneratorAgent, get_cover_letter_generator_agent
from app.agent.jd_matcher import JDMatcherAgent, get_jd_matcher_agent
from app.agent.learning_resource_recommender import (
    LearningResourceRecommenderAgent,
    get_learning_resource_recommender_agent,
)
from app.agent.resume_rewriter import ResumeRewriterAgent, get_resume_rewriter_agent
from app.agent.skill_gap_analyzer import SkillGapAnalyzerAgent, get_skill_gap_analyzer_agent
from app.api.deps import get_current_user
from app.models.schemas import (
    AnalyzeSkillGapRequest,
    AnalyzeSkillGapResponse,
    DownloadOptimizedResumeRequest,
    GenerateCoverLetterRequest,
    GenerateCoverLetterResponse,
    MatchResumeToJDRequest,
    MatchResumeToJDResponse,
    RecommendLearningResourcesRequest,
    RecommendLearningResourcesResponse,
    RewriteResumeRequest,
    RewriteResumeResponse,
)
from app.services.resume_pdf import render_optimized_resume_pdf

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/toolkit", tags=["toolkit"], dependencies=[Depends(get_current_user)])


@router.post("/match-jd", response_model=MatchResumeToJDResponse)
async def match_resume_to_jd(
    body: MatchResumeToJDRequest,
    agent: JDMatcherAgent = Depends(get_jd_matcher_agent),
) -> MatchResumeToJDResponse:
    """Score the resume against a specific pasted job description."""
    try:
        match = await agent.match(body.extracted_text, body.target_role, body.analysis, body.job_description)
    except Exception as exc:
        logger.exception("JD matching failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The job description matching service is unavailable. Please try again shortly.",
        ) from exc
    return MatchResumeToJDResponse(match=match)


@router.post("/rewrite-resume", response_model=RewriteResumeResponse)
async def rewrite_resume(
    body: RewriteResumeRequest,
    agent: ResumeRewriterAgent = Depends(get_resume_rewriter_agent),
) -> RewriteResumeResponse:
    """Generate a complete, ready-to-use optimized resume grounded in the candidate's actual content."""
    try:
        optimized_resume = await agent.rewrite(body.extracted_text, body.target_role, body.analysis)
    except Exception as exc:
        logger.exception("Resume optimization failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The resume optimization service is unavailable. Please try again shortly.",
        ) from exc
    return RewriteResumeResponse(optimized_resume=optimized_resume)


@router.post("/rewrite-resume/download")
async def download_optimized_resume(body: DownloadOptimizedResumeRequest) -> StreamingResponse:
    """Render an already-generated optimized resume to PDF — no LLM call, just formatting."""
    pdf_bytes = render_optimized_resume_pdf(body.optimized_resume)
    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="optimized_resume.pdf"'},
    )


@router.post("/skill-gap", response_model=AnalyzeSkillGapResponse)
async def analyze_skill_gap(
    body: AnalyzeSkillGapRequest,
    agent: SkillGapAnalyzerAgent = Depends(get_skill_gap_analyzer_agent),
) -> AnalyzeSkillGapResponse:
    """Turn missing skills into a prioritized learning path."""
    try:
        skill_gap = await agent.analyze(body.extracted_text, body.target_role, body.analysis)
    except Exception as exc:
        logger.exception("Skill gap analysis failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The skill gap analysis service is unavailable. Please try again shortly.",
        ) from exc
    return AnalyzeSkillGapResponse(skill_gap=skill_gap)


@router.post("/learning-resources", response_model=RecommendLearningResourcesResponse)
async def recommend_learning_resources(
    body: RecommendLearningResourcesRequest,
    agent: LearningResourceRecommenderAgent = Depends(get_learning_resource_recommender_agent),
) -> RecommendLearningResourcesResponse:
    """Turn missing skills (resume + optional JD gaps) into a personalized, Udemy-search-linked learning path."""
    try:
        resources = await agent.recommend(
            body.extracted_text, body.target_role, body.analysis, body.extra_missing_skills
        )
    except Exception as exc:
        logger.exception("Learning resource recommendation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The learning resources service is unavailable. Please try again shortly.",
        ) from exc
    return RecommendLearningResourcesResponse(resources=resources)


@router.post("/cover-letter", response_model=GenerateCoverLetterResponse)
async def generate_cover_letter(
    body: GenerateCoverLetterRequest,
    agent: CoverLetterGeneratorAgent = Depends(get_cover_letter_generator_agent),
) -> GenerateCoverLetterResponse:
    """Generate a complete, role-targeted (and company-targeted, if given) cover letter."""
    try:
        cover_letter = await agent.generate(body.extracted_text, body.target_role, body.analysis, body.company_name)
    except Exception as exc:
        logger.exception("Cover letter generation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The cover letter service is unavailable. Please try again shortly.",
        ) from exc
    return GenerateCoverLetterResponse(cover_letter=cover_letter, company_name=body.company_name)
