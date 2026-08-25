"""
Supabase admin client (uses service_role key — bypasses RLS).
ONLY used server-side in FastAPI.  Never expose this to the browser.
"""
from functools import lru_cache
from typing import Any
from app.core.config import settings

try:
    from supabase import create_client, Client
except ImportError:
    create_client, Client = None, Any


@lru_cache(maxsize=1)
def get_supabase_admin() -> Client:
    """Return a cached Supabase admin client."""
    if create_client is None:
        raise ImportError("supabase package is not installed. Please run 'pip install supabase'.")
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env file.")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

