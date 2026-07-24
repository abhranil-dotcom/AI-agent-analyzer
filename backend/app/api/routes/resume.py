import logging

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.agent.resume_analyzer import ResumeAnalyzerAgent, get_resume_agent
from app.api.deps import get_current_user
from app.core.config import Settings, get_settings
from app.db.database import get_db
from app.db.models import ResumeHistory, User
from app.models.schemas import (
    AnalyzeResumeRequest,
    AnalyzeResumeResponse,
    ResumeHistoryCompareResponse,
    ResumeHistoryDetail,
    ResumeHistoryEntry,
    ResumeHistoryListResponse,
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
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

    # Persisted automatically so Resume History/Dashboard never have to regenerate this analysis.
    db.add(
        ResumeHistory(
            user_id=current_user.id,
            resume_filename=body.resume_filename or "Resume",
            target_role=body.target_role,
            ats_score=analysis.ats_score,
            analysis_json=analysis.model_dump(),
        )
    )
    db.commit()

    return AnalyzeResumeResponse(analysis=analysis, target_role=body.target_role)


def _get_owned_resume_history(history_id: int, current_user: User, db: Session) -> ResumeHistory:
    entry = (
        db.query(ResumeHistory)
        .filter(ResumeHistory.id == history_id, ResumeHistory.user_id == current_user.id)
        .first()
    )
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume history entry not found.")
    return entry


@router.get("/history", response_model=ResumeHistoryListResponse)
async def list_resume_history(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> ResumeHistoryListResponse:
    entries = (
        db.query(ResumeHistory)
        .filter(ResumeHistory.user_id == current_user.id)
        .order_by(ResumeHistory.uploaded_at.desc())
        .all()
    )
    return ResumeHistoryListResponse(entries=[ResumeHistoryEntry.model_validate(e) for e in entries])


@router.delete("/history", status_code=status.HTTP_204_NO_CONTENT)
async def clear_resume_history(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> None:
    """Deletes every resume history row for the current user — irreversible, confirmed client-side."""
    db.query(ResumeHistory).filter(ResumeHistory.user_id == current_user.id).delete()
    db.commit()


@router.get("/history/compare", response_model=ResumeHistoryCompareResponse)
async def compare_resume_history(
    ids: str = Query(..., description="Two comma-separated resume history ids, e.g. '3,7'"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ResumeHistoryCompareResponse:
    try:
        id_a, id_b = (int(part) for part in ids.split(","))
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="ids must be exactly two comma-separated integers."
        ) from exc

    entry_a = _get_owned_resume_history(id_a, current_user, db)
    entry_b = _get_owned_resume_history(id_b, current_user, db)
    return ResumeHistoryCompareResponse(
        a=ResumeHistoryDetail(**ResumeHistoryEntry.model_validate(entry_a).model_dump(), analysis=entry_a.analysis_json),
        b=ResumeHistoryDetail(**ResumeHistoryEntry.model_validate(entry_b).model_dump(), analysis=entry_b.analysis_json),
    )


@router.get("/history/{history_id}", response_model=ResumeHistoryDetail)
async def get_resume_history(
    history_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> ResumeHistoryDetail:
    """Returns the exact analysis generated at upload time — never recomputed."""
    entry = _get_owned_resume_history(history_id, current_user, db)
    return ResumeHistoryDetail(**ResumeHistoryEntry.model_validate(entry).model_dump(), analysis=entry.analysis_json)


@router.delete("/history/{history_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resume_history(
    history_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> None:
    entry = _get_owned_resume_history(history_id, current_user, db)
    db.delete(entry)
    db.commit()
