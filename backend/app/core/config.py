"""
Application configuration.
All values are loaded from environment variables (or .env file).
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_JWT_SECRET: str
    GEMINI_API_KEY: str = ""

    # Apify
    APIFY_API_TOKEN: str
    APIFY_GOOGLE_SCHOLAR_ACTOR_ID: str = "biscience/google-scholar-scraper"

    # CORS — allow Next.js dev server and production domain
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
