"""
Authentication API Endpoints (Tiger Data PostgreSQL).
Handles:
- POST /api/auth/login     (Standard Email + Password sign in)
- POST /api/auth/register  (User account creation)
- POST /api/auth/demo      (1-Click Evaluator & Judge Instant Access)
- GET  /api/auth/me        (Current session check)
- POST /api/auth/logout    (Clear session)
"""
from fastapi import APIRouter, HTTPException, Depends, Response, status
from pydantic import BaseModel, EmailStr
from typing import Optional
import hashlib
import time
from jose import jwt
from app.core.config import settings
from app.core.tiger import get_tiger_client, execute_query
from app.core.auth import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

def hash_pw(pw: str) -> str:
    return hashlib.sha256(f"acadlens_salt_{pw}".encode()).hexdigest()

def verify_pw(plain: str, hashed: str) -> bool:
    if not hashed:
        return False
    return hash_pw(plain) == hashed

def create_jwt_token(user_id: str, email: str, role: str, name: str) -> str:
    secret = (settings.SUPABASE_JWT_SECRET or "acadlens_jwt_secret_sih_2026_hackbios_key").strip()
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "name": name,
        "exp": int(time.time()) + (30 * 24 * 3600)  # 30 days
    }
    return jwt.encode(payload, secret, algorithm="HS256")

def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="acadlens_token",
        value=token,
        max_age=30 * 24 * 3600,
        httponly=False,  # Allow client JS inspection
        samesite="lax",
        secure=True,    # Secure on HTTPS
        path="/"
    )

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    fullName: Optional[str] = None
    role: Optional[str] = "REVIEWER"

@router.post("/login")
async def login(req: LoginRequest, response: Response):
    client = get_tiger_client()
    users = execute_query("SELECT id, email, password_hash, full_name, role FROM users WHERE email = %s LIMIT 1;", (req.email.strip().lower(),))
    
    if not users:
        # Check if demo admin email
        if req.email.strip().lower() in ("admin@acadlens.ac.in", "admin@acadlens.local") and req.password == "admin123":
            user = {
                "id": "00000000-0000-0000-0000-000000000000",
                "email": "admin@acadlens.ac.in",
                "full_name": "Institutional Admin (Reviewer)",
                "role": "ADMIN"
            }
        else:
            raise HTTPException(status_code=401, detail="Invalid email or password")
    else:
        u = users[0]
        if not verify_pw(req.password, u["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        user = {
            "id": u["id"],
            "email": u["email"],
            "full_name": u["full_name"],
            "role": u["role"]
        }

    token = create_jwt_token(user["id"], user["email"], user["role"], user["full_name"])
    set_auth_cookie(response, token)

    return {
        "success": True,
        "user": user,
        "token": token
    }

@router.post("/register")
@router.post("/signup")
async def register(req: RegisterRequest, response: Response):
    email = req.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    existing = execute_query("SELECT id FROM users WHERE email = %s LIMIT 1;", (email,))
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    name = (req.full_name or req.fullName or email.split("@")[0]).strip()
    hashed = hash_pw(req.password)
    res = execute_query(
        "INSERT INTO users (email, password_hash, full_name, role) VALUES (%s, %s, %s, %s) RETURNING id, email, full_name, role;",
        (email, hashed, name, req.role or "REVIEWER")
    )
    user = res[0]
    token = create_jwt_token(user["id"], user["email"], user["role"], user["full_name"])
    set_auth_cookie(response, token)

    return {
        "success": True,
        "user": user,
        "token": token
    }

@router.post("/demo")
async def demo_login(response: Response):
    """
    1-Click Instant Demo Login.
    Instantly logs in as Institutional Admin without needing credentials.
    """
    user = {
        "id": "00000000-0000-0000-0000-000000000000",
        "email": "admin@acadlens.ac.in",
        "full_name": "Institutional Admin (Judge Mode)",
        "role": "ADMIN"
    }
    token = create_jwt_token(user["id"], user["email"], user["role"], user["full_name"])
    set_auth_cookie(response, token)

    return {
        "success": True,
        "is_demo": True,
        "user": user,
        "token": token
    }

@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "user": {
            "id": user.get("sub"),
            "email": user.get("email"),
            "role": user.get("role", "ADMIN"),
            "name": user.get("name") or "Administrator"
        }
    }

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="acadlens_token", path="/")
    return {"success": True}
