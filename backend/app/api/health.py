from fastapi import APIRouter
from app.core.config import settings
from app.core.tiger import get_tiger_client, execute_query
import os

router = APIRouter(prefix="/api/health", tags=["health"])

@router.get("")
async def health_check():
    tiger_ok = False
    faculty_count = 0
    timescale_version = None
    error_msg = None

    try:
        client = get_tiger_client()
        res = client.table("faculty").select("id", count="exact").execute()
        faculty_count = res.count
        tiger_ok = True

        ts_res = execute_query("SELECT extversion FROM pg_extension WHERE extname = 'timescaledb';")
        if ts_res:
            timescale_version = ts_res[0].get("extversion")
    except Exception as e:
        error_msg = str(e)

    return {
        "status": "ok",
        "database": "Tiger Data (TimescaleDB PostgreSQL)",
        "tiger_connected": tiger_ok,
        "timescale_version": timescale_version,
        "faculty_count": faculty_count,
        "error": error_msg
    }
