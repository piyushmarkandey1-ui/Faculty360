import os
import psycopg2
from psycopg2.extras import Json
import dotenv

dotenv.load_dotenv('.env.local')

from supabase import create_client
sb_url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', '').strip()
sb_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '').strip()
supabase = create_client(sb_url, sb_key)

TIGER_URL = os.environ.get('TIGER_DATABASE_URL', 'postgresql://tsdbadmin:ihfyu8sqtf18k7ds@tt158v5sae.oc4fcokabh.tsdb.cloud.timescale.com:36613/tsdb?sslmode=require')

print("Connecting to Tiger Data...")
conn = psycopg2.connect(TIGER_URL)
conn.autocommit = True
cur = conn.cursor()

# Make research_interests JSONB in unified_profiles
cur.execute("ALTER TABLE unified_profiles ALTER COLUMN research_interests TYPE JSONB USING COALESCE(to_jsonb(research_interests), '[]'::jsonb);")

# Disable FK triggers for clean import
print("Disabling triggers for import...")
cur.execute("SET session_replication_role = 'replica';")

tables_to_sync = [
    'institutions',
    'faculty',
    'academic_identities',
    'unified_profiles',
    'publications',
    'assessments',
    'kpi_scores',
    'institutional_records',
    'assessment_frameworks',
    'profile_conflicts'
]

for table_name in tables_to_sync:
    try:
        res = supabase.table(table_name).select("*").limit(2000).execute()
        rows = res.data or []
        if not rows:
            print(f"  {table_name}: 0 rows found in source")
            continue
        
        cols = list(rows[0].keys())
        col_names = ", ".join(cols)
        placeholders = ", ".join(["%s"] * len(cols))
        
        insert_query = f"INSERT INTO {table_name} ({col_names}) VALUES ({placeholders}) ON CONFLICT DO NOTHING;"
        
        success = 0
        failed = 0
        for r in rows:
            values = []
            for c in cols:
                val = r[c]
                if isinstance(val, (dict, list)):
                    values.append(Json(val))
                else:
                    values.append(val)
            try:
                cur.execute(insert_query, values)
                success += 1
            except Exception as row_err:
                failed += 1
                
        print(f"  [SYNC] {table_name}: {success} succeeded, {failed} skipped")
    except Exception as e:
        print(f"  [ERROR] {table_name}: {e}")

# Re-enable triggers
cur.execute("SET session_replication_role = 'origin';")
print("\nRe-enabled triggers.")

print("\nVerifying row counts in Tiger Data:")
for t in tables_to_sync:
    cur.execute(f"SELECT count(*) FROM {t};")
    cnt = cur.fetchone()[0]
    print(f"  {t}: {cnt} rows")

cur.close()
conn.close()
print("\n=== MIGRATION VERIFICATION COMPLETE ===")
