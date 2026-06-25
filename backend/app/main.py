import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes.resume import router as resume_router
from app.core.config import get_settings
from app.core.logging_config import configure_logging
from app.models.schemas import HealthResponse

settings = get_settings()
configure_logging(debug=settings.debug)

logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.app_name,
    description="API for AI-powered resume analysis and career guidance.",
    version="0.1.0",
)

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


@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc: Exception):
    logger.exception("Unhandled exception while processing %s %s", request.method, request.url)
    return JSONResponse(status_code=500, content={"detail": "Internal server error."})


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    return HealthResponse(status="ok", app_name=settings.app_name, app_env=settings.app_env)


app.include_router(resume_router)


@app.on_event("startup")
async def on_startup() -> None:
    logger.info("%s started in '%s' mode", settings.app_name, settings.app_env)
    logger.info("CORS_ORIGINS env = %s", settings.cors_origins)
    logger.info("Parsed origins = %s", settings.cors_origin_list)
