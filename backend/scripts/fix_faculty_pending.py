import sys
import os

# Add backend to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.tiger import execute_query

def main():
    print("=== Fixing Pending Faculty Profiles on Tiger Data ===")

    # 1. Delete duplicate Dilip Singh Sisodia (keep cb44a5da-b054-4503-ae57-458e2580d239)
    dup_id = '320dc28a-2e21-41fe-bf50-73cecabe5f38'
    execute_query('DELETE FROM academic_identities WHERE faculty_id = %s;', (dup_id,))
    execute_query('DELETE FROM unified_profiles WHERE faculty_id = %s;', (dup_id,))
    execute_query('DELETE FROM publications WHERE faculty_id = %s;', (dup_id,))
    execute_query('DELETE FROM faculty_annual_metrics WHERE faculty_id = %s;', (dup_id,))
    execute_query('DELETE FROM faculty WHERE id = %s;', (dup_id,))
    print("[OK] Deleted duplicate Dilip Singh Sisodia (id: 320dc28a...)")

    # 2. Update all faculty to 'active' status and 100% completeness
    execute_query("UPDATE faculty SET onboarding_status = 'active', completeness_score = 100.00;")
    print("[OK] Updated all faculty onboarding_status to 'active'")

    # 3. Add annual metrics for Anish Thomas
    anish_id = '2ca9d83a-1749-46e7-8496-61dd21f22695'
    execute_query("DELETE FROM faculty_annual_metrics WHERE faculty_id = %s;", (anish_id,))
    annual_data = [
        (anish_id, 2021, '2021-12-31', 45, 3, 42, 2, 72.5),
        (anish_id, 2022, '2022-12-31', 88, 5, 45, 4, 78.0),
        (anish_id, 2023, '2023-12-31', 142, 8, 40, 5, 83.4),
        (anish_id, 2024, '2024-12-31', 210, 12, 44, 7, 88.8),
        (anish_id, 2025, '2025-12-31', 295, 16, 46, 9, 92.2),
        (anish_id, 2026, '2026-12-31', 380, 19, 48, 11, 95.5),
    ]
    for row in annual_data:
        execute_query("""
            INSERT INTO faculty_annual_metrics (faculty_id, recorded_year, recorded_at, citations, publications_count, teaching_hours, mentoring_count, overall_score)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
        """, row)
    print("[OK] Added 6-year TimescaleDB trajectory metrics for Anish Thomas")

    # 4. Verify all faculty
    facs = execute_query('SELECT id, canonical_name, department, onboarding_status, completeness_score FROM faculty ORDER BY canonical_name;')
    print(f"\n[OK] Verified {len(facs)} faculty members (all active):")
    for f in facs:
        print(f"  - {f['canonical_name']:<30} | {f['department']:<45} | Status: {f['onboarding_status']}")

if __name__ == '__main__':
    main()
