"""
Generic RAG vector-store service backed by FAISS.

Not hardcoded to "company" knowledge bases — `get_knowledge_base_store(namespace, kb_subdir)`
resolves `app/data/{namespace}s/{kb_subdir}/*.md`, so any future knowledge base (e.g. a
"learning_resource" KB for a future skill-gap/learning-recommendations feature) can reuse this
factory unchanged.

Indexes are built in-memory from markdown files checked into the repo and cached for the process
lifetime — nothing is persisted to disk, because the Render deployment has no persistent disk
(the filesystem resets on every deploy/restart).
"""

import logging
from functools import lru_cache
from pathlib import Path

from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from langchain_openai import AzureOpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import Settings, get_settings

logger = logging.getLogger(__name__)

DATA_ROOT = Path(__file__).resolve().parent.parent / "data"

_SPLITTER = RecursiveCharacterTextSplitter(
    chunk_size=800,
    chunk_overlap=120,
    separators=["\n## ", "\n### ", "\n\n", "\n", " ", ""],
)


def _load_markdown_documents(kb_dir: Path, *, extra_metadata: dict) -> list[Document]:
    """Load every .md file in kb_dir, tag each chunk with category + source metadata."""
    documents: list[Document] = []
    for md_path in sorted(kb_dir.glob("*.md")):
        text = md_path.read_text(encoding="utf-8")
        category = md_path.stem  # e.g. "hr_questions"
        for chunk in _SPLITTER.split_text(text):
            documents.append(
                Document(
                    page_content=chunk,
                    metadata={**extra_metadata, "category": category, "source_file": md_path.name},
                )
            )
    return documents


def _build_embeddings(settings: Settings) -> AzureOpenAIEmbeddings:
    return AzureOpenAIEmbeddings(
        azure_endpoint=settings.azure_openai_endpoint,
        api_key=settings.azure_openai_api_key,
        api_version=settings.azure_openai_api_version,
        azure_deployment=settings.azure_openai_embeddings_deployment,
    )


@lru_cache(maxsize=None)
def get_knowledge_base_store(namespace: str, kb_subdir: str) -> FAISS:
    """
    Cached FAISS store factory, keyed on (namespace, kb_subdir).

    Not `maxsize=1` like the singleton agent factories — each (namespace, kb_subdir) pair
    (e.g. each company) needs its own independently cached index.
    """
    settings = get_settings()
    kb_dir = DATA_ROOT / f"{namespace}s" / kb_subdir  # e.g. data/companies/tcs
    documents = _load_markdown_documents(kb_dir, extra_metadata={"namespace": namespace, "kb_subdir": kb_subdir})
    if not documents:
        raise ValueError(f"No markdown documents found for {namespace}/{kb_subdir} at {kb_dir}")

    logger.info("Building FAISS index for %s/%s (%d chunks)", namespace, kb_subdir, len(documents))
    return FAISS.from_documents(documents, _build_embeddings(settings))


def get_company_retriever(slug: str, k: int = 3, category: str | None = None) -> BaseRetriever:
    """Convenience wrapper used by agents: a retriever over one company's knowledge base."""
    store = get_knowledge_base_store("company", slug)
    search_kwargs: dict = {"k": k}
    if category:
        search_kwargs["filter"] = {"category": category}
        search_kwargs["fetch_k"] = 40  # over-fetch before filtering so a small per-category corpus isn't starved
    return store.as_retriever(search_kwargs=search_kwargs)
