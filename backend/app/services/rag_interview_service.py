"""
Dedicated RAG retrieval service for interview question generation.

This is the one place that decides *which* knowledge-base categories to retrieve for an
interview, what query to run, and how to join the results into a single grounding-context
string — reused as-is by `InterviewKitGeneratorAgent` (text interview) today. A future voice or
video interview delivery method should import `retrieve_interview_context` from here rather than
re-implementing retrieval: only the delivery/presentation layer is expected to differ between
text/voice/video, never how grounding context is fetched.

Sits one layer above `vector_store.get_company_retriever` (which stays generic/company-agnostic)
by encoding interview-specific knowledge: the fixed set of categories an interview kit draws on,
including optional style categories (`interview_style`, `system_design`, `leadership_principles`,
`oa_pattern`) that only some companies have markdown files for. A category with no matching file
for a given company simply retrieves nothing and contributes no block to the context — callers
never need per-company conditionals.
"""

import logging

from app.services.vector_store import get_company_retriever

logger = logging.getLogger(__name__)

# Core categories every company knowledge base is expected to have, plus optional style
# categories that only some companies define (e.g. system_design.md only exists for Microsoft
# today) — present or absent, the retrieval loop below treats them identically.
INTERVIEW_RETRIEVAL_CATEGORIES = (
    "company_overview",
    "interview_process",
    "hr_questions",
    "technical_questions",
    "coding_patterns",
    "preparation_tips",
    "resume_based_questions",
    "interview_experiences",
    "interview_style",
    "system_design",
    "leadership_principles",
    "oa_pattern",
)


async def retrieve_interview_context(
    company_slug: str,
    target_role: str,
    categories: tuple[str, ...] = INTERVIEW_RETRIEVAL_CATEGORIES,
    k: int = 5,
) -> str:
    """
    Retrieve grounding context for one company's interview kit, one category at a time.

    Retrieving per-category (rather than one global top-k search) means no single category is
    starved by chunks from a more "popular" category, and a company-specific style category
    (e.g. Amazon's leadership_principles) can't be crowded out by generic company_overview chunks.
    """
    blocks: list[str] = []
    for category in categories:
        retriever = get_company_retriever(company_slug, k=k, category=category)
        docs = await retriever.ainvoke(f"{target_role} interview preparation")
        if docs:
            joined = "\n---\n".join(d.page_content for d in docs)
            blocks.append(f"### {category}\n{joined}")
    return "\n\n".join(blocks)
