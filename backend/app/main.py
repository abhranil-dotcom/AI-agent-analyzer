import asyncio
import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes.auth import router as auth_router
from app.api.routes.companies import router as companies_router
from app.api.routes.interview import router as interview_router
from app.api.routes.resume import router as resume_router
from app.api.routes.toolkit import router as toolkit_router
from app.core.config import get_settings
from app.core.logging_config import configure_logging
from app.data.companies.registry import get_company_registry
from app.db.database import Base, engine
from app.db import models as _db_models  # noqa: F401 — import registers User with Base's metadata
from app.models.schemas import HealthResponse
from app.services.vector_store import warm_all

settings = get_settings()
configure_logging(debug=settings.debug)

logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.app_name,
    description="API for AI-powered resume analysis and career guidance.",
    version="0.1.0",
)

# Must be defined before add_middleware(CORSMiddleware) so that Starlette inserts
# this middleware inside CORS (not outside it). The build order is:
#   ServerErrorMiddleware → CORSMiddleware → this middleware → ExceptionMiddleware → Router
# Exceptions caught here return a response that still flows through CORSMiddleware.
@app.middleware("http")
async def catch_unhandled_exceptions(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as exc:
        logger.exception("Unhandled exception while processing %s %s", request.method, request.url)
        return JSONResponse(status_code=500, content={"detail": "Internal server error."})


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    return HealthResponse(status="ok", app_name=settings.app_name, app_env=settings.app_env)


app.include_router(auth_router)
app.include_router(resume_router)
app.include_router(companies_router)
app.include_router(interview_router)
app.include_router(toolkit_router)


@app.on_event("startup")
async def on_startup() -> None:
    logger.info("%s started in '%s' mode", settings.app_name, settings.app_env)
    logger.info("CORS_ORIGINS env = %s", settings.cors_origins)
    logger.info("Parsed origins = %s", settings.cors_origin_list)

    # No Alembic at this scale — create the users table if it doesn't exist yet. Safe to call
    # on every startup since create_all() is a no-op for tables that already exist.
    Base.metadata.create_all(bind=engine)

    # Build every company's RAG index up front so the first real "Prepare for X" request
    # doesn't pay the embedding-build cost — and so a missing/broken knowledge base is caught
    # in the startup log instead of surfacing as a user-facing error later. Runs in a worker
    # thread so it doesn't block the event loop; per-company failures are logged and skipped by
    # warm_all() itself, so one bad company can't prevent the app from starting or block others.
    try:
        slugs = [c.slug for c in get_company_registry()]
        await asyncio.to_thread(warm_all, "companies", slugs)
    except Exception:
        logger.exception("Company knowledge base warm-up failed unexpectedly — continuing startup anyway")
