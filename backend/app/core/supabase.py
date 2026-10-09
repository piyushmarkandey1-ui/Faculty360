"""
Tiger Data primary data client.
Routes all database operations directly to Tiger Cloud PostgreSQL.
"""
from app.core.tiger import get_tiger_client, TigerClient

def get_supabase_admin() -> TigerClient:
    """
    Returns the Tiger Data client.
    Routes all database operations directly to Tiger Cloud PostgreSQL.
    """
    return get_tiger_client()
