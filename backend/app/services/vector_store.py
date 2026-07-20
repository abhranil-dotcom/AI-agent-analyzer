"""
Generic RAG vector-store service backed by FAISS.

Not hardcoded to "company" knowledge bases — `get_knowledge_base_store(namespace, kb_subdir)`
resolves `app/data/{namespace}/{kb_subdir}/*.md`, so any future knowledge base (e.g. a
"learning_resources" KB for a future skill-gap/learning-recommendations feature) can reuse this
factory unchanged. `namespace` is used verbatim as the directory name under app/data/ — it is NOT
pluralized automatically. (A prior version did `f"{namespace}s"`, which silently produced
"companys" instead of "companies" and made every company's knowledge base unreachable in
production — every request for a company's interview kit failed with "No markdown documents
found," even though the markdown files were correctly committed and deployed the whole time.)

ChromaDB was evaluated as an alternative (see project memory) but segfaults reproducibly on
`collection.add()` in this project's dev environment — a native crash that kills the whole worker
process, not a catchable error — so FAISS remains the vector store.

Indexes are built in-memory from markdown files checked into the repo and cached for the process
lifetime via `@lru_cache` — nothing is persisted to disk, since the Render deployment has no
persistent disk (the filesystem resets on every deploy/restart). `warm_all()` builds every known
company's index eagerly at app startup (see main.py) so the first real user request doesn't pay
the embedding-build cost; `get_knowledge_base_store` itself also works lazily on first call for
any index `warm_all()` didn't cover (e.g. a future non-company namespace).
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


class KnowledgeBaseUnavailableError(Exception):
    """
    Raised when a knowledge base's markdown source directory is missing or empty.

    Deliberately generic (namespace + kb_subdir only, no display name) — this module doesn't know
    "company" semantics. Callers with domain context (e.g. the interview-kit agent, which already
    has the company's display_name from the registry) should catch this and build a friendly,
    display-name-aware message for the API response. The real filesystem path is logged
    server-side where this is raised and never included in the exception's string representation,
    so it can't accidentally leak to a client through a bare str(exc).
    """

    def __init__(self, namespace: str, kb_subdir: str) -> None:
        self.namespace = namespace
        self.kb_subdir = kb_subdir
        super().__init__(f"Knowledge base unavailable: {namespace}/{kb_subdir}")


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
    kb_dir = DATA_ROOT / namespace / kb_subdir  # e.g. data/companies/tcs
    documents = _load_markdown_documents(kb_dir, extra_metadata={"namespace": namespace, "kb_subdir": kb_subdir})
    if not documents:
        logger.error("No markdown documents found for %s/%s at %s", namespace, kb_subdir, kb_dir)
        raise KnowledgeBaseUnavailableError(namespace, kb_subdir)

    logger.info("Building FAISS index for %s/%s (%d chunks)", namespace, kb_subdir, len(documents))
    return FAISS.from_documents(documents, _build_embeddings(settings))


def get_company_retriever(slug: str, k: int = 3, category: str | None = None) -> BaseRetriever:
    """Convenience wrapper used by agents: a retriever over one company's knowledge base."""
    store = get_knowledge_base_store("companies", slug)
    search_kwargs: dict = {"k": k}
    if category:
        search_kwargs["filter"] = {"category": category}
        search_kwargs["fetch_k"] = 40  # over-fetch before filtering so a small per-category corpus isn't starved
    return store.as_retriever(search_kwargs=search_kwargs)


def warm_all(namespace: str, kb_subdirs: list[str]) -> None:
    """
    Eagerly build every listed knowledge base's index (e.g. at app startup), so the first real
    request for any of them doesn't pay the embedding-build cost. Failures are logged and
    skipped per kb_subdir rather than raised, so one broken/missing company doesn't prevent the
    app from starting or block other companies from warming.
    """
    for kb_subdir in kb_subdirs:
        try:
            get_knowledge_base_store(namespace, kb_subdir)
            logger.info("Warmed knowledge base %s/%s", namespace, kb_subdir)
        except KnowledgeBaseUnavailableError:
            logger.warning("Skipped warming %s/%s — knowledge base unavailable", namespace, kb_subdir)
        except Exception:
            logger.exception("Failed to warm knowledge base %s/%s", namespace, kb_subdir)
