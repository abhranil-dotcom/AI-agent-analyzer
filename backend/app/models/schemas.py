from pydantic import BaseModel, Field


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
