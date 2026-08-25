import csv
import io
from typing import Dict, Any, List
from app.services.connectors.base import AcademicSourceConnector

class InstitutionalDataConnector(AcademicSourceConnector):
    @property
    def source_type(self) -> str:
        return "institutional"

    def validate(self, csv_content: str) -> List[Dict[str, Any]]:
        """
        Validates the uploaded CSV content.
        Required columns: employee_id, email, category, title, year
        """
        required_cols = {"employee_id", "email", "category", "title", "year"}
        allowed_categories = {"Teaching", "Mentoring", "Institutional Service", "Awards", "Projects", "Innovation", "Outreach"}
        
        f = io.StringIO(csv_content)
        reader = csv.DictReader(f)
        
        if not reader.fieldnames or not required_cols.issubset(set(reader.fieldnames)):
            missing = required_cols - set(reader.fieldnames or [])
            raise ValueError(f"Missing required columns: {missing}")

        valid_rows = []
        errors = []
        
        for idx, row in enumerate(reader, start=2):
            # Basic validation
            emp_id = row.get("employee_id", "").strip()
            email = row.get("email", "").strip()
            cat = row.get("category", "").strip()
            title = row.get("title", "").strip()
            year_str = row.get("year", "").strip()
            
            if not emp_id and not email:
                errors.append(f"Row {idx}: Must provide employee_id or email.")
                continue
            if not cat or cat not in allowed_categories:
                errors.append(f"Row {idx}: Invalid or missing category '{cat}'.")
                continue
            if not title:
                errors.append(f"Row {idx}: Missing title.")
                continue
                
            year = None
            if year_str:
                try:
                    year = int(year_str)
                except:
                    errors.append(f"Row {idx}: Invalid year format '{year_str}'.")
                    continue
            
            valid_rows.append({
                "employee_id": emp_id,
                "email": email,
                "category": cat,
                "title": title,
                "description": row.get("description", "").strip(),
                "year": year
            })
            
        if not valid_rows and errors:
            raise ValueError(f"No valid rows found. Errors: {errors[:5]}")
            
        # Return valid rows, we attach errors as metadata if we wanted, but for now we just return valid
        return valid_rows

    def fetch_and_normalize(self, identity: Any) -> Dict[str, Any]:
        """
        For CSV upload, identity is the pre-validated list of dicts.
        We return it mapped to our normalized format.
        """
        valid_rows = identity  # passed from validate()
        
        return {
            "status": "completed",
            "author": {}, # N/A for batch upload
            "publications": [], # We will process these as institutional records
            "institutional_records": valid_rows
        }
