from pydantic import BaseModel
from typing import Optional

class SyncScholarRequest(BaseModel):
    scholar_url: str

class FacultyBase(BaseModel):
    canonical_name: str
    canonical_email: Optional[str] = None
    department: str
    designation: str

class FacultyCreate(FacultyBase):
    institution_id: str

class FacultyUpdate(BaseModel):
    canonical_name: Optional[str] = None
    canonical_email: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
