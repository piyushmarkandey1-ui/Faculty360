"""
Tiger Data / PostgreSQL primary data client.
Maintains backward compatibility with get_supabase_admin() so existing
business logic and service calls route directly through Tiger Data.
"""
from typing import Any
import os
import re
from app.core.config import settings
from app.core.tiger import get_tiger_client, TigerClient

def get_supabase_admin():
    """
    Returns the Tiger Data client.
    Routes all database operations directly to Tiger Cloud PostgreSQL.
    """
    try:
        return get_tiger_client()
    except Exception as e:
        # Fallback to Supabase client if Tiger connection fails
        try:
            from supabase import create_client
            raw_url = settings.SUPABASE_URL or os.environ.get("SUPABASE_URL", "")
            raw_key = settings.SUPABASE_SERVICE_ROLE_KEY or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
            url = re.sub(r'[\r\n\s"\' ]+', '', str(raw_url)).rstrip('/')
            key = re.sub(r'[^a-zA-Z0-9_\-\.\+/=]', '', str(raw_key))
            if url and key:
                return create_client(url, key)
        except Exception:
            pass
        raise e
