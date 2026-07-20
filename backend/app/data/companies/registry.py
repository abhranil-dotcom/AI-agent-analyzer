"""
Auto-discovered roster of companies supported for recommendation and RAG interview prep.

Adding a new company requires zero code changes: create a new folder under this directory with a
`company_overview.md` starting with a `## About <Display Name>` heading (its first paragraph
becomes the recommender's blurb), plus whatever other knowledge-base markdown files you want
retrievable (hr_questions.md, technical_questions.md, coding_patterns.md, etc.) — the next request
that touches the registry will pick it up automatically. Content is deliberately fixed to companies
that actually have a knowledge base here, because the recommender agent is constrained to choose
from this list so every recommendation is guaranteed to have a working "Prepare" flow behind it.
"""

import logging
from functools import lru_cache
from pathlib import Path

from pydantic import BaseModel

logger = logging.getLogger(__name__)

DATA_ROOT = Path(__file__).resolve().parent
_BLURB_MAX_CHARS = 280


class CompanyInfo(BaseModel):
    slug: str
    display_name: str
    blurb: str


def _fallback_name(slug: str) -> str:
    return slug.replace("_", " ").replace("-", " ").title()


def _parse_overview(overview_path: Path, slug: str) -> tuple[str, str]:
    """Extract a display name and short blurb from a company_overview.md file."""
    fallback = _fallback_name(slug)
    if not overview_path.exists():
        logger.warning("No company_overview.md for '%s' — using fallback name/blurb", slug)
        return fallback, f"{fallback} — profile not yet documented."

    lines = overview_path.read_text(encoding="utf-8").splitlines()

    display_name = fallback
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("## About "):
            display_name = stripped.removeprefix("## About ").strip() or fallback
            break
        if stripped.startswith("# "):
            display_name = stripped.removeprefix("# ").strip() or fallback
            break

    blurb_words: list[str] = []
    started = False
    for line in lines:
        stripped = line.strip()
        if not stripped:
            if started:
                break
            continue
        if stripped.startswith("#"):
            continue
        started = True
        blurb_words.append(stripped)
    blurb = " ".join(blurb_words)[:_BLURB_MAX_CHARS].strip()

    return display_name, blurb or f"{display_name} — profile not yet documented."


@lru_cache(maxsize=1)
def get_company_registry() -> list[CompanyInfo]:
    """Scan app/data/companies/*/ once per process and cache the result."""
    companies: list[CompanyInfo] = []
    if not DATA_ROOT.exists():
        return companies

    for company_dir in sorted(DATA_ROOT.iterdir()):
        if not company_dir.is_dir() or company_dir.name.startswith((".", "_")):
            continue
        if not any(company_dir.glob("*.md")):
            continue  # not a knowledge base — e.g. a stray or empty directory
        slug = company_dir.name
        display_name, blurb = _parse_overview(company_dir / "company_overview.md", slug)
        companies.append(CompanyInfo(slug=slug, display_name=display_name, blurb=blurb))

    logger.info("Discovered %d companies: %s", len(companies), [c.slug for c in companies])
    return companies


def get_company(slug: str) -> CompanyInfo | None:
    for company in get_company_registry():
        if company.slug == slug:
            return company
    return None
