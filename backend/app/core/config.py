"""
Application configuration.
All values are loaded from environment variables (or .env file).
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, AliasChoices
from typing import List


class Settings(BaseSettings):
    # Supabase & Tiger Data
    TIGER_DATABASE_URL: str = "postgresql://tsdbadmin:ihfyu8sqtf18k7ds@tt158v5sae.oc4fcokabh.tsdb.cloud.timescale.com:36613/tsdb?sslmode=require"
    DATABASE_URL: str = "postgresql://tsdbadmin:ihfyu8sqtf18k7ds@tt158v5sae.oc4fcokabh.tsdb.cloud.timescale.com:36613/tsdb?sslmode=require"
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = "acadlens_jwt_secret_sih_2026_hackbios_key"
    GEMINI_API_KEY: str = ""

    # Google Scholar APIs
    SERPAPI_API_KEY: str = Field(default="", validation_alias=AliasChoices("SERPAPI_API_KEY", "SERP_API_KEY"))
    APIFY_API_TOKEN: str = Field(default="", validation_alias=AliasChoices("APIFY_API_TOKEN", "APIFY_TOKEN"))
    APIFY_GOOGLE_SCHOLAR_ACTOR_ID: str = "biscience/google-scholar-scraper"


    # CORS — allow Next.js dev server and production domain
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://faculty360.vercel.app",
        "https://*.vercel.app",
        "*"
    ]


    @classmethod
    def sanitize_val(cls, val):
        if isinstance(val, str):
            val = val.strip().strip('"').strip("'").strip()
        return val

    model_config = SettingsConfigDict(
        env_file=[".env", ".env.local", "../.env.local", "../.env"],
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def __init__(self, **values):
        super().__init__(**values)
        for field in ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_JWT_SECRET", "APIFY_API_TOKEN", "GEMINI_API_KEY", "TIGER_DATABASE_URL", "DATABASE_URL"]:
            val = getattr(self, field, "")
            if isinstance(val, str):
                import re
                val = re.sub(r"^[\ufeff\ufffe\s\"']+", "", val)
                val = re.sub(r"[\s\"']+$", "", val)
                setattr(self, field, val.strip())


settings = Settings()
