from fastapi import APIRouter, Depends, HTTPException, status
from app.core.auth import get_current_user
from app.schemas.faculty import SyncScholarRequest
from app.services import faculty_service

router = APIRouter(prefix="/api/faculty", tags=["faculty"])

@router.post("/{faculty_id}/sources/google-scholar/sync")
async def sync_google_scholar(
    faculty_id: str,
    payload: SyncScholarRequest,
    user: dict = Depends(get_current_user)
):
    try:
        result = faculty_service.sync_google_scholar(faculty_id, payload.scholar_url)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error during sync")
