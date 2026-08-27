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


import os
import re

@lru_cache(maxsize=1)
def get_supabase_admin() -> Client:
    """Return a cached Supabase admin client with sanitized credentials."""
    if create_client is None:
        raise ImportError("supabase package is not installed. Please run 'pip install supabase'.")
    
    raw_url = settings.SUPABASE_URL or os.environ.get("SUPABASE_URL", "") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
    raw_key = (
        settings.SUPABASE_SERVICE_ROLE_KEY
        or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
        or os.environ.get("SUPABASE_KEY", "")
        or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    )
    
    url = re.sub(r'[\r\n\s"\' ]+', '', str(raw_url)).rstrip('/')
    key = re.sub(r'[^a-zA-Z0-9_\-\.\+/=]', '', str(raw_key))
    
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured in environment.")
    
    return create_client(url, key)

