"""
Authentication API Endpoints (Tiger Data PostgreSQL).
Handles:
- POST /api/auth/login     (Standard Email + Password sign in)
- POST /api/auth/register  (User account creation)
- POST /api/auth/demo      (1-Click Demo Instant Access)
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
    secret = (getattr(settings, "TIGER_JWT_SECRET", None) or getattr(settings, "SUPABASE_JWT_SECRET", None) or "acadlens_tiger_jwt_secret_primary_key").strip()
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

    try:
        execute_query(
            "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, result) VALUES (%s, %s, %s, %s, %s);",
            (user["id"], "USER_LOGIN", "users", user["id"], "SUCCESS")
        )
    except Exception as e:
        logger.warning(f"Audit log warning: {e}")

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

    try:
        execute_query(
            "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, result) VALUES (%s, %s, %s, %s, %s);",
            (user["id"], "USER_REGISTER", "users", user["id"], "SUCCESS")
        )
    except Exception as e:
        logger.warning(f"Audit log warning: {e}")

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
    Ensures demo admin is registered in Tiger Data.
    """
    demo_id = "00000000-0000-0000-0000-000000000000"
    demo_email = "admin@acadlens.ac.in"
    demo_name = "Institutional Admin (Demo)"
    demo_role = "ADMIN"

    # Upsert demo admin in Tiger Data users table
    try:
        execute_query(
            """
            INSERT INTO users (id, email, password_hash, full_name, role)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;
            """,
            (demo_id, demo_email, hash_pw("admin123"), demo_name, demo_role)
        )
    except Exception as e:
        logger.warning(f"Demo user upsert note: {e}")

    user = {
        "id": demo_id,
        "email": demo_email,
        "full_name": demo_name,
        "role": demo_role
    }
    token = create_jwt_token(user["id"], user["email"], user["role"], user["full_name"])
    set_auth_cookie(response, token)

    try:
        execute_query(
            "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, result) VALUES (%s, %s, %s, %s, %s);",
            (demo_id, "USER_DEMO_LOGIN", "users", demo_id, "SUCCESS")
        )
    except Exception as e:
        logger.warning(f"Audit log warning: {e}")

    return {
        "success": True,
        "is_demo": True,
        "user": user,
        "token": token
    }

@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    user_id = user.get("sub")
    # Verify user exists in Tiger Data users table
    db_user = None
    if user_id:
        rows = execute_query("SELECT id, email, full_name, role FROM users WHERE id = %s LIMIT 1;", (user_id,))
        if rows:
            db_user = rows[0]

    return {
        "user": {
            "id": db_user["id"] if db_user else user.get("sub"),
            "email": db_user["email"] if db_user else user.get("email"),
            "role": db_user["role"] if db_user else user.get("role", "ADMIN"),
            "name": db_user["full_name"] if db_user else (user.get("name") or "Administrator")
        }
    }

@router.post("/logout")
async def logout(response: Response, user: dict = Depends(get_current_user)):
    user_id = user.get("sub")
    if user_id:
        try:
            execute_query(
                "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, result) VALUES (%s, %s, %s, %s, %s);",
                (user_id, "USER_LOGOUT", "users", user_id, "SUCCESS")
            )
        except Exception as e:
            logger.warning(f"Logout audit log warning: {e}")

    response.delete_cookie(key="acadlens_token", path="/")
    return {"success": True}

