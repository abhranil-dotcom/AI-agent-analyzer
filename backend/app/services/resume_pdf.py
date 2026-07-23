import io

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

from app.models.schemas import OptimizedResume

_STYLES = getSampleStyleSheet()

_NAME_STYLE = ParagraphStyle(
    "ResumeName", parent=_STYLES["Title"], fontSize=18, leading=22, alignment=1, spaceAfter=4,
)
_HEADING_STYLE = ParagraphStyle(
    "ResumeHeading", parent=_STYLES["Heading2"], fontSize=11, leading=14, spaceBefore=12, spaceAfter=4,
    textColor="#1e3a5f",
)
_BODY_STYLE = ParagraphStyle(
    "ResumeBody", parent=_STYLES["BodyText"], fontSize=10, leading=14, spaceAfter=3,
)


def _escape(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def render_optimized_resume_pdf(optimized: OptimizedResume) -> bytes:
    """Renders an already-generated OptimizedResume to a clean, text-selectable one-column PDF."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=LETTER,
        topMargin=0.6 * inch,
        bottomMargin=0.6 * inch,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        title="Optimized Resume",
    )

    story = [Paragraph(_escape(optimized.contact_header), _NAME_STYLE), Spacer(1, 8)]

    for section in optimized.sections:
        story.append(Paragraph(_escape(section.heading).upper(), _HEADING_STYLE))
        for line in section.content:
            story.append(Paragraph(_escape(line), _BODY_STYLE))

    doc.build(story)
    return buffer.getvalue()
