from fastapi import APIRouter, Depends, HTTPException, status
from app.core.auth import get_current_user
from app.schemas.faculty import SyncScholarRequest
from app.services import faculty_service

router = APIRouter(prefix="/api/faculty", tags=["faculty"])

# Keeping the old route for compatibility, pointing to generic logic
@router.post("/{faculty_id}/sources/google-scholar/sync")
async def sync_google_scholar(
    faculty_id: str,
    payload: SyncScholarRequest,
    user: dict = Depends(get_current_user)
):
    try:
        result = faculty_service.sync_source(faculty_id, "google_scholar", payload.scholar_url)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error during sync")

@router.post("/{faculty_id}/sources/{source_type}/sync")
async def sync_source(
    faculty_id: str,
    source_type: str,
    payload: dict,
    user: dict = Depends(get_current_user)
):
    url_or_id = payload.get("url")
    if not url_or_id:
        raise HTTPException(status_code=400, detail="Missing url field in payload")
    
    try:
        result = faculty_service.sync_source(faculty_id, source_type, url_or_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error during sync")
