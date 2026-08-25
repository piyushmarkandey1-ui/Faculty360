"""
JWT verification for Supabase tokens.
FastAPI routes use `Depends(get_current_user)` to protect endpoints.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from app.core.config import settings
from app.core.supabase import get_supabase_admin

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Validate a Supabase JWT from the Authorization header.
    Returns the decoded JWT payload combined with profile role.
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
            
        # Fetch profile
        supabase = get_supabase_admin()
        res = supabase.table("profiles").select("role, faculty_id").eq("id", user_id).execute()
        if res.data:
            payload["role"] = res.data[0].get("role", "REVIEWER")
            payload["faculty_id"] = res.data[0].get("faculty_id")
        else:
            payload["role"] = "REVIEWER"
            payload["faculty_id"] = None
            
        return payload
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

class RequireRole:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: dict = Depends(get_current_user)):
        if user.get("role") not in self.allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user

def verify_faculty_access(faculty_id: str, user: dict):
    """Ensure user is either ADMIN/REVIEWER, or is the FACULTY themselves."""
    role = user.get("role")
    if role in ["ADMIN", "REVIEWER"]:
        return True
    if role == "FACULTY" and user.get("faculty_id") == faculty_id:
        return True
    raise HTTPException(status_code=403, detail="Not authorized to access this faculty record")

def log_audit(action: str, entity_type: str, entity_id: str, result: str, user_id: str):
    """Log an event to the audit_logs table."""
    try:
        supabase = get_supabase_admin()
        supabase.table("audit_logs").insert({
            "user_id": user_id,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "result": result
        }).execute()
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Audit log failed: {e}")
