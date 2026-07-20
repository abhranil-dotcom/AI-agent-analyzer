from typing import Literal

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Phase 1 — Resume upload & extraction
# ---------------------------------------------------------------------------

class ResumeUploadResponse(BaseModel):
    """Response returned after a resume PDF has been parsed."""

    filename: str = Field(..., description="Original uploaded file name")
    page_count: int = Field(..., description="Number of pages detected in the PDF")
    character_count: int = Field(..., description="Length of the extracted text")
    extracted_text: str = Field(..., description="Raw text extracted from the PDF")


class HealthResponse(BaseModel):
    status: str = "ok"
    app_name: str
    app_env: str


class ErrorResponse(BaseModel):
    detail: str


# ---------------------------------------------------------------------------
# Phase 2 — AI Resume Analysis
# ---------------------------------------------------------------------------

class ResumeAnalysis(BaseModel):
    """Structured output produced by the resume analysis agent."""

    ats_score: int = Field(..., ge=0, le=100, description="ATS compatibility score (0-100)")
    summary: str = Field(..., description="Professional summary of the candidate")
    skills: list[str] = Field(..., description="Key skills detected in the resume")
    strengths: list[str] = Field(..., description="Candidate's notable strengths")
    weaknesses: list[str] = Field(..., description="Areas where the resume or profile is lacking")
    missing_skills: list[str] = Field(..., description="Important skills absent for the apparent target role")
    suggestions: list[str] = Field(..., description="Specific, actionable resume improvement suggestions")


class AnalyzeResumeRequest(BaseModel):
    """Request body for the /analyze endpoint."""

    extracted_text: str = Field(..., min_length=50, description="Plain text extracted from the resume PDF")
    target_role: str = Field(
        ..., min_length=2, max_length=100, description="Role the candidate is applying for"
    )


class AnalyzeResumeResponse(BaseModel):
    """Response returned by the /analyze endpoint."""

    analysis: ResumeAnalysis
    target_role: str


# ---------------------------------------------------------------------------
# Phase 3 — Company Recommendation
# ---------------------------------------------------------------------------

class CompanyRecommendation(BaseModel):
    """A single personalized company match, ranked and reasoned by the recommender agent."""

    slug: str = Field(..., description="Must match one of the supported company slugs")
    display_name: str
    match_percentage: int = Field(..., ge=0, le=100)
    reason: str = Field(..., description="1-3 sentence personalized reason grounded in the resume")


class RecommendCompaniesRequest(BaseModel):
    """Request body for the /api/companies/recommend endpoint."""

    extracted_text: str = Field(..., min_length=50, description="Plain text extracted from the resume PDF")
    target_role: str = Field(..., min_length=2, max_length=100)
    analysis: ResumeAnalysis


class RecommendCompaniesResponse(BaseModel):
    recommendations: list[CompanyRecommendation]
    target_role: str


# ---------------------------------------------------------------------------
# Phase 4 — Company Interview Preparation (RAG) & Mock Interview
# ---------------------------------------------------------------------------

QuestionCategory = Literal["hr", "resume", "technical", "coding"]


class InterviewQuestion(BaseModel):
    id: str = Field(..., description="Stable id, e.g. 'hr-1', 'resume-3', 'technical-2', 'coding-1'")
    category: QuestionCategory
    question: str
    difficulty: Literal["Easy", "Medium", "Hard"] | None = Field(
        None, description="Populated for coding questions; optional elsewhere"
    )


class InterviewKit(BaseModel):
    """Structured output produced by the RAG interview-kit generator agent."""

    company_overview: str
    hiring_process: str
    interview_rounds: list[str]
    preparation_tips: list[str]
    hr_questions: list[InterviewQuestion]
    resume_questions: list[InterviewQuestion]
    technical_questions: list[InterviewQuestion]
    coding_questions: list[InterviewQuestion]


class GenerateInterviewKitRequest(BaseModel):
    """Request body for the /api/interview/kit endpoint."""

    company_slug: str
    target_role: str = Field(..., min_length=2, max_length=100)
    extracted_text: str = Field(..., min_length=50)
    analysis: ResumeAnalysis


class GenerateInterviewKitResponse(BaseModel):
    kit: InterviewKit
    company_slug: str


class EvaluateAnswerRequest(BaseModel):
    """Request body for the /api/interview/evaluate endpoint."""

    question: str
    category: QuestionCategory
    target_role: str
    company_slug: str
    candidate_answer: str = Field(..., min_length=1)


class AnswerEvaluation(BaseModel):
    """Structured output produced by the answer-evaluator agent for a single mock-interview turn."""

    score: int = Field(..., ge=0, le=100, description="Same 0-100 scale as ats_score")
    feedback: str = Field(
        ..., description="Narrative synthesizing technical correctness, completeness, communication, and confidence"
    )
    missing_points: list[str]
    ideal_answer: str
    improvement_suggestions: list[str]


class EvaluateAnswerResponse(BaseModel):
    evaluation: AnswerEvaluation


# ---------------------------------------------------------------------------
# Phase 5 — Career Toolkit (JD Match, Resume Rewrite, Skill Gap, Cover Letter)
# ---------------------------------------------------------------------------

class JDMatchResult(BaseModel):
    """Structured output produced by the JD-matcher agent."""

    jd_match_score: int = Field(
        ...,
        ge=0,
        le=100,
        description=(
            "Match against THIS job description's stated requirements — distinct from and not "
            "comparable to ats_score, which measures general role fit."
        ),
    )
    matching_keywords: list[str] = Field(..., description="Skills/keywords present in both resume and JD")
    missing_keywords: list[str] = Field(..., description="Important JD keywords/requirements absent from the resume")
    tailoring_suggestions: list[str] = Field(..., description="Actionable suggestions for tailoring to this exact JD")


class MatchResumeToJDRequest(BaseModel):
    """Request body for the /api/toolkit/match-jd endpoint."""

    extracted_text: str = Field(..., min_length=50)
    target_role: str = Field(..., min_length=2, max_length=100)
    analysis: ResumeAnalysis
    job_description: str = Field(..., min_length=50, description="Full text of the job posting pasted by the user")


class MatchResumeToJDResponse(BaseModel):
    match: JDMatchResult


class BulletRewrite(BaseModel):
    original: str = Field(..., description="The original bullet/line exactly as it appears in the resume")
    improved: str = Field(..., description="A stronger rewritten version — action-verb led, sharper impact")
    rationale: str = Field(..., description="One sentence explaining what changed and why it's stronger")


class ResumeRewrite(BaseModel):
    """Structured output produced by the resume-rewriter agent."""

    improved_summary: str = Field(..., description="A stronger 2-4 sentence professional summary")
    bullet_rewrites: list[BulletRewrite] = Field(
        ..., description="Original -> improved pairs for the resume's most impactful bullets"
    )
    skills_section_rewrite: list[str] = Field(
        ..., description="Cleaned-up, grouped skills section lines, e.g. 'Languages: Python, JavaScript, SQL'"
    )


class RewriteResumeRequest(BaseModel):
    """Request body for the /api/toolkit/rewrite-resume endpoint."""

    extracted_text: str = Field(..., min_length=50)
    target_role: str = Field(..., min_length=2, max_length=100)
    analysis: ResumeAnalysis


class RewriteResumeResponse(BaseModel):
    rewrite: ResumeRewrite


SkillPriority = Literal["High", "Medium", "Low"]


class SkillGapEntry(BaseModel):
    skill: str
    priority: SkillPriority
    why_it_matters: str = Field(..., description="Why this skill matters specifically for the target role")
    suggested_resources: list[str] = Field(
        ...,
        description=(
            "Named real, well-known, generically-recognizable resources (e.g. 'official FastAPI "
            "documentation', 'freeCodeCamp's React course') — never a fabricated clickable URL"
        ),
    )
    search_terms: list[str] = Field(..., description="Search terms the candidate can use to find current material")


class SkillGapAnalysis(BaseModel):
    """Structured output produced by the skill-gap-analyzer agent."""

    learning_path: list[SkillGapEntry] = Field(..., description="Prioritized, highest-priority gap first")
    overall_notes: str = Field(..., description="1-3 sentence summary of the candidate's overall gap picture")


class AnalyzeSkillGapRequest(BaseModel):
    """Request body for the /api/toolkit/skill-gap endpoint."""

    extracted_text: str = Field(..., min_length=50)
    target_role: str = Field(..., min_length=2, max_length=100)
    analysis: ResumeAnalysis


class AnalyzeSkillGapResponse(BaseModel):
    skill_gap: SkillGapAnalysis


class CoverLetter(BaseModel):
    """Structured output produced by the cover-letter-generator agent."""

    greeting: str = Field(..., description="e.g. 'Dear Hiring Manager,' or company-personalized if given")
    body_paragraphs: list[str] = Field(..., description="Ordered body paragraphs")
    closing: str = Field(..., description="Sign-off line, e.g. 'Sincerely,'")


class GenerateCoverLetterRequest(BaseModel):
    """Request body for the /api/toolkit/cover-letter endpoint."""

    extracted_text: str = Field(..., min_length=50)
    target_role: str = Field(..., min_length=2, max_length=100)
    analysis: ResumeAnalysis
    company_name: str | None = Field(
        None, max_length=150, description="Optional — personalizes the letter if a company was already selected"
    )


class GenerateCoverLetterResponse(BaseModel):
    cover_letter: CoverLetter
    company_name: str | None = Field(None, description="Echoes whether/what personalization was applied")
