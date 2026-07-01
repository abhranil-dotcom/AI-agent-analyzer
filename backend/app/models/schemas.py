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


class AnalyzeResumeResponse(BaseModel):
    """Response returned by the /analyze endpoint."""

    analysis: ResumeAnalysis
