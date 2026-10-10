import csv
import io
import re
from typing import Dict, Any, List, Optional
from app.services.connectors.base import AcademicSourceConnector

CATEGORY_MAP = {
    # Teaching
    "teaching": "teaching",
    "course": "teaching",
    "courses": "teaching",
    "instruction": "teaching",
    # Mentoring
    "mentoring": "mentoring",
    "advising": "mentoring",
    "supervision": "mentoring",
    "scholar": "mentoring",
    "scholars": "mentoring",
    "students": "mentoring",
    # Service
    "service": "service",
    "institutional_service": "service",
    "institutional service": "service",
    "committee": "service",
    "administration": "service",
    # Awards
    "awards": "awards",
    "award": "awards",
    "honors": "awards",
    "honor": "awards",
    "fellowship": "awards",
    # Projects
    "projects": "projects",
    "project": "projects",
    "grants": "projects",
    "grant": "projects",
    "sponsored_research": "projects",
    # Innovation / Patents
    "innovation": "innovation",
    "innovations": "innovation",
    "patents": "innovation",
    "patent": "innovation",
    "ipr": "innovation",
    "tech_transfer": "innovation",
    # Outreach
    "outreach": "outreach",
    "keynote": "outreach",
    "keynotes": "outreach",
    "talk": "outreach",
    "invited_talk": "outreach",
    "workshops": "outreach",
    "workshop": "outreach",
    # Career / Experience
    "career": "career",
    "experience": "career",
    "work_experience": "career",
    "appointment": "career",
    "history": "career",
    # Leadership
    "leadership": "leadership",
    "lead": "leadership",
}

class InstitutionalDataConnector(AcademicSourceConnector):
    @property
    def source_type(self) -> str:
        return "institutional"

    def normalize_category(self, cat: Optional[str]) -> Optional[str]:
        if not cat:
            return None
        cleaned = cat.strip().lower().replace("-", "_").replace(" ", "_")
        return CATEGORY_MAP.get(cleaned, cleaned)

    def validate(self, csv_content: str, category_override: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Validates uploaded CSV content with resilient header normalization.
        Supports both single-category batches and multi-category bulk imports.
        """
        if not csv_content or not csv_content.strip():
            raise ValueError("Uploaded file is empty.")

        f = io.StringIO(csv_content)
        reader = csv.DictReader(f)
        
        if not reader.fieldnames:
            raise ValueError("CSV header row missing or empty.")

        # Header normalization map: lowercased, stripped, underscore-separated
        normalized_headers: Dict[str, str] = {}
        for h in reader.fieldnames:
            if not h:
                continue
            cleaned = re.sub(r'[^a-zA-Z0-9_]', '_', h.strip().lower()).strip('_')
            normalized_headers[h] = cleaned

        # Identify key column candidates
        def find_field(candidates: List[str]) -> Optional[str]:
            for orig, clean in normalized_headers.items():
                if clean in candidates:
                    return orig
            return None

        emp_col = find_field(["employee_id", "emp_id", "empid", "faculty_employee_id", "faculty_id", "id"])
        email_col = find_field(["email", "canonical_email", "mail", "faculty_email", "user_email"])
        cat_col = find_field(["category", "data_category", "type", "record_type", "section"])
        title_col = find_field(["title", "name", "course_name", "course_title", "project_title", "award_name", "activity", "topic", "event", "role"])
        year_col = find_field(["year", "academic_year", "period", "session", "date"])
        desc_col = find_field(["description", "details", "desc", "summary", "organization", "venue", "agency", "funding_agency"])
        hours_col = find_field(["hours", "credits", "credit_hours", "contact_hours"])
        score_col = find_field(["feedback_score", "feedback", "rating", "score", "student_rating"])

        # Verification: We must have at least an identifier (emp_id or email) and a title
        if not emp_col and not email_col:
            raise ValueError("CSV must include an 'employee_id' or 'email' column to match faculty records.")

        if not title_col:
            raise ValueError("CSV must include a 'title' column (e.g., Course Name, Project Title, Award Title).")

        effective_category_override = self.normalize_category(category_override)
        if not cat_col and not effective_category_override:
            raise ValueError("CSV missing 'category' column, and no category was selected in the upload form.")

        valid_rows: List[Dict[str, Any]] = []
        errors: List[str] = []

        for idx, row in enumerate(reader, start=2):
            emp_id = (row.get(emp_col) or "").strip() if emp_col else ""
            email = (row.get(email_col) or "").strip().lower() if email_col else ""
            title = (row.get(title_col) or "").strip() if title_col else ""
            raw_cat = (row.get(cat_col) or "").strip() if cat_col else ""
            cat = self.normalize_category(raw_cat) or effective_category_override

            if not emp_id and not email:
                errors.append(f"Row {idx}: Missing both employee_id and email.")
                continue

            if not title:
                errors.append(f"Row {idx}: Missing title.")
                continue

            if not cat:
                errors.append(f"Row {idx}: Missing or invalid category.")
                continue

            # Year parsing
            raw_year = (row.get(year_col) or "").strip() if year_col else ""
            year: Optional[int] = None
            if raw_year:
                # Extract 4-digit year
                match = re.search(r'\b(19\d\d|20\d\d)\b', raw_year)
                if match:
                    year = int(match.group(1))
                else:
                    try:
                        year = int(raw_year)
                    except ValueError:
                        pass
            if year is None:
                # Default to current year
                year = 2026

            # Optional Hours parsing
            raw_hours = (row.get(hours_col) or "").strip() if hours_col else ""
            hours: Optional[float] = None
            if raw_hours:
                try:
                    hours = float(re.sub(r'[^0-9.]', '', raw_hours))
                except ValueError:
                    pass

            # Optional Feedback Score parsing
            raw_score = (row.get(score_col) or "").strip() if score_col else ""
            score: Optional[float] = None
            if raw_score:
                try:
                    score = float(re.sub(r'[^0-9.]', '', raw_score))
                except ValueError:
                    pass

            desc = (row.get(desc_col) or "").strip() if desc_col else ""

            valid_rows.append({
                "employee_id": emp_id,
                "email": email,
                "category": cat,
                "title": title,
                "description": desc,
                "year": year,
                "hours": hours,
                "feedback_score": score,
                "raw_metadata": {str(k): (v.strip() if isinstance(v, str) else str(v)) for k, v in row.items() if v is not None}
            })

        if not valid_rows and errors:
            raise ValueError(f"No valid rows found in CSV. Errors: {'; '.join(errors[:5])}")

        return valid_rows

    def fetch_and_normalize(self, identity: Any) -> Dict[str, Any]:
        """Maps pre-validated CSV rows to normalized institutional batch format."""
        valid_rows = identity
        return {
            "status": "completed",
            "author": {},
            "publications": [],
            "institutional_records": valid_rows
        }
