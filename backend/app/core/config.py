from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centralized application configuration, loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "AI Resume Analyzer API"
    app_env: str = "development"
    debug: bool = True

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    max_upload_size_mb: int = 10

    # Azure OpenAI — all values must be set in the environment; no secrets as defaults.
    azure_openai_api_key: str = ""
    azure_openai_endpoint: str = ""
    azure_openai_api_version: str = "2024-12-01-preview"
    azure_openai_chat_deployment: str = ""
    azure_openai_embeddings_deployment: str = ""

    # Authentication — DATABASE_URL defaults to a local SQLite file for dev. Render's free tier
    # has no persistent disk, so production MUST set DATABASE_URL to a hosted Postgres instance
    # (e.g. Neon/Supabase/Render Postgres free tier) or every registered user is lost on restart.
    database_url: str = "sqlite:///./resume_analyzer.db"
    # Dev-only fallback so local auth works out of the box — production MUST override this via
    # the JWT_SECRET_KEY env var, otherwise every deploy invalidates all issued tokens and (worse)
    # a known default secret would let anyone forge tokens.
    jwt_secret_key: str = "dev-only-insecure-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
