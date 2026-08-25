"""
Supabase admin client (uses service_role key — bypasses RLS).
ONLY used server-side in FastAPI.  Never expose this to the browser.
"""
from functools import lru_cache
from supabase import create_client, Client
from app.core.config import settings


@lru_cache(maxsize=1)
def get_supabase_admin() -> Client:
    """Return a cached Supabase admin client."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
