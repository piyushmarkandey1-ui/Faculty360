from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.core.auth import get_current_user
from app.services import faculty_service

router = APIRouter(prefix="/api/institutional", tags=["institutional"])

@router.post("/upload")
async def upload_institutional_data(
    file: UploadFile = File(...),
    category: str = Form(None),
    dry_run: bool = Form(False),
    user: dict = Depends(get_current_user)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
        
    try:
        content = await file.read()
        if len(content) > 5 * 1024 * 1024:  # 5MB limit
            raise HTTPException(status_code=413, detail="File too large (max 5MB)")
        csv_string = content.decode("utf-8")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {e}")
        
    try:
        result = faculty_service.process_institutional_batch(csv_string, category_override=category, dry_run=dry_run)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")
