import io
import logging

from pypdf import PdfReader
from pypdf.errors import PdfReadError

logger = logging.getLogger(__name__)


class PDFExtractionError(Exception):
    """Raised when a PDF cannot be parsed or contains no extractable text."""


def extract_text_from_pdf(file_bytes: bytes) -> tuple[str, int]:
    """Extract plain text from PDF bytes.

    Returns a tuple of (extracted_text, page_count).
    Raises PDFExtractionError on unreadable, encrypted, or empty-text PDFs.
    """
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
    except PdfReadError as exc:
        logger.warning("Failed to parse PDF: %s", exc)
        raise PDFExtractionError("The uploaded file is not a valid PDF.") from exc

    if reader.is_encrypted:
        try:
            reader.decrypt("")
        except Exception as exc:
            logger.warning("Encrypted PDF could not be decrypted: %s", exc)
            raise PDFExtractionError("The uploaded PDF is password protected.") from exc

    page_count = len(reader.pages)
    text_chunks = []
    for page in reader.pages:
        page_text = page.extract_text() or ""
        text_chunks.append(page_text)

    extracted_text = "\n".join(text_chunks).strip()

    if not extracted_text:
        raise PDFExtractionError(
            "No text could be extracted from this PDF. It may be a scanned/image-based resume."
        )

    return extracted_text, page_count
