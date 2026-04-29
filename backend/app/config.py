"""
app/config.py — Environment-based configuration.

All secrets are loaded from environment variables.
Pydantic Settings validates types and raises clear errors on startup
if required variables are missing — prevents silent misconfiguration.

Usage:
    from app.config import Settings
    settings = Settings()
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings sourced from environment / .env file.

    Security: No default values for secrets — missing vars raise
    a clear ValidationError at startup rather than silently using
    insecure defaults.
    """

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # ---- Anthropic ----
    anthropic_api_key: str  # required — no default

    # ---- Firebase (Google Services) ----
    firebase_credentials_path: str = "firebase-credentials.json"
    firebase_database_url: str = ""

    # ---- Server ----
    allowed_origins: list[str] = ["http://localhost:3000", "https://electguide.web.app"]
    trusted_hosts: list[str]   = ["localhost", "electguide.web.app", "*.run.app"]
    rate_limit_rpm: int = 30

    # ---- App ----
    environment: str = "development"   # "development" | "staging" | "production"
    log_level: str   = "INFO"
