import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from app.core.config import Settings, get_settings
from app.models.schemas import ResumeUploadResponse
from app.services.pdf_extractor import PDFExtractionError, extract_text_from_pdf

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/resume", tags=["resume"])

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
