import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from app.agent.resume_analyzer import ResumeAnalyzerAgent, get_resume_agent
from app.api.deps import get_current_user
from app.core.config import Settings, get_settings
from app.models.schemas import (
    AnalyzeResumeRequest,
    AnalyzeResumeResponse,
    ResumeUploadResponse,
)
from app.services.pdf_extractor import PDFExtractionError, extract_text_from_pdf

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/resume", tags=["resume"], dependencies=[Depends(get_current_user)])

ALLOWED_CONTENT_TYPES = {"application/pdf"}


@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(
    file: UploadFile,
    settings: Settings = Depends(get_settings),
) -> ResumeUploadResponse:
    """Accept a PDF resume, extract its text, and return the extracted content."""
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only PDF files are supported.",
        )

    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")

    if len(file_bytes) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the {settings.max_upload_size_mb}MB upload limit.",
        )

    try:
        extracted_text, page_count = extract_text_from_pdf(file_bytes)
    except PDFExtractionError as exc:
        logger.info("PDF extraction failed for '%s': %s", file.filename, exc)
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    logger.info("Extracted %d characters from '%s' (%d pages)", len(extracted_text), file.filename, page_count)

    return ResumeUploadResponse(
        filename=file.filename or "resume.pdf",
        page_count=page_count,
        character_count=len(extracted_text),
        extracted_text=extracted_text,
    )


@router.post("/analyze", response_model=AnalyzeResumeResponse)
async def analyze_resume(
    body: AnalyzeResumeRequest,
    agent: ResumeAnalyzerAgent = Depends(get_resume_agent),
) -> AnalyzeResumeResponse:
    """Pass extracted resume text and the target role to the analysis agent and return structured results."""
    try:
        analysis = await agent.analyze(body.extracted_text, body.target_role)
    except Exception as exc:
        logger.exception("Resume analysis failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The analysis service is unavailable. Please try again shortly.",
        ) from exc

    return AnalyzeResumeResponse(analysis=analysis, target_role=body.target_role)
