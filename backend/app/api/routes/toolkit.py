import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.agent.cover_letter_generator import CoverLetterGeneratorAgent, get_cover_letter_generator_agent
from app.agent.jd_matcher import JDMatcherAgent, get_jd_matcher_agent
from app.agent.resume_rewriter import ResumeRewriterAgent, get_resume_rewriter_agent
from app.agent.skill_gap_analyzer import SkillGapAnalyzerAgent, get_skill_gap_analyzer_agent
from app.models.schemas import (
    AnalyzeSkillGapRequest,
    AnalyzeSkillGapResponse,
    GenerateCoverLetterRequest,
    GenerateCoverLetterResponse,
    MatchResumeToJDRequest,
    MatchResumeToJDResponse,
    RewriteResumeRequest,
    RewriteResumeResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/toolkit", tags=["toolkit"])


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
    """Strengthen the resume's summary, bullets, and skills phrasing."""
    try:
        rewrite = await agent.rewrite(body.extracted_text, body.target_role, body.analysis)
    except Exception as exc:
        logger.exception("Resume rewrite failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The resume rewrite service is unavailable. Please try again shortly.",
        ) from exc
    return RewriteResumeResponse(rewrite=rewrite)


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
