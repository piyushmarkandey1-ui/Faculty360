import os
import psycopg2
from psycopg2.extras import execute_batch, Json
import dotenv

dotenv.load_dotenv('.env.local')

from supabase import create_client
sb_url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', '').strip()
sb_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '').strip()
supabase = create_client(sb_url, sb_key)

TIGER_URL = os.environ.get('TIGER_DATABASE_URL', 'postgresql://tsdbadmin:ihfyu8sqtf18k7ds@tt158v5sae.oc4fcokabh.tsdb.cloud.timescale.com:36613/tsdb?sslmode=require')

print("Connecting to Tiger Data...")
conn = psycopg2.connect(TIGER_URL)
cur = conn.cursor()

# Disable triggers for bulk import
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
            print(f"  {table_name}: 0 rows in source")
            continue
        
        cols = list(rows[0].keys())
        col_names = ", ".join(cols)
        placeholders = ", ".join(["%s"] * len(cols))
        
        insert_query = f"INSERT INTO {table_name} ({col_names}) VALUES ({placeholders}) ON CONFLICT DO NOTHING;"
        
        batch_values = []
        for r in rows:
            row_vals = []
            for c in cols:
                val = r[c]
                if isinstance(val, (dict, list)):
                    row_vals.append(Json(val))
                else:
                    row_vals.append(val)
            batch_values.append(tuple(row_vals))
            
        execute_batch(cur, insert_query, batch_values, page_size=200)
        conn.commit()
        print(f"  [SUCCESS] {table_name}: {len(batch_values)} rows synced via execute_batch!")
    except Exception as e:
        conn.rollback()
        print(f"  [ERROR] {table_name}: {e}")

# Re-enable triggers
cur.execute("SET session_replication_role = 'origin';")
conn.commit()

print("\nVerifying final counts in Tiger Data:")
for t in tables_to_sync:
    cur.execute(f"SELECT count(*) FROM {t};")
    cnt = cur.fetchone()[0]
    print(f"  {t}: {cnt} rows")

cur.close()
conn.close()
print("\n=== TIGER DATA FAST BATCH SYNC COMPLETED ===")
