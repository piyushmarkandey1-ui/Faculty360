from fastapi import APIRouter
from app.core.config import settings
import os
import re

router = APIRouter(prefix="/api/health", tags=["health"])

@router.get("")
async def health_check():
    url = (settings.SUPABASE_URL or os.environ.get("SUPABASE_URL", "")).strip()
    key = (settings.SUPABASE_SERVICE_ROLE_KEY or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")).strip()
    clean_key = re.sub(r'[^a-zA-Z0-9_\-\.\+/=]', '', key)
    
    supabase_ok = False
    error_msg = None
    try:
        from app.core.supabase import get_supabase_admin
        client = get_supabase_admin()
        res = client.table("faculty").select("id").limit(1).execute()
        supabase_ok = True
    except Exception as e:
        error_msg = str(e)
        
    return {
        "status": "ok",
        "supabase_connected": supabase_ok,
        "error": error_msg,
        "url_preview": f"{url[:12]}...{url[-6:]}" if url else "EMPTY",
        "key_prefix": clean_key[:10] if clean_key else "EMPTY",
        "key_len": len(clean_key)
    }
