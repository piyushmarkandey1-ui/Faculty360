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

print("Altering tables to match exact schema...")
alter_queries = [
    # academic_identities
    "ALTER TABLE academic_identities ADD COLUMN IF NOT EXISTS source_type TEXT;",
    "ALTER TABLE academic_identities ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;",
    "ALTER TABLE academic_identities ALTER COLUMN source DROP NOT NULL;",
    
    # unified_profiles
    "ALTER TABLE unified_profiles ADD COLUMN IF NOT EXISTS display_name TEXT;",
    "ALTER TABLE unified_profiles ADD COLUMN IF NOT EXISTS bio TEXT;",
    "ALTER TABLE unified_profiles ADD COLUMN IF NOT EXISTS research_interests TEXT[];",
    
    # publications
    "ALTER TABLE publications ADD COLUMN IF NOT EXISTS normalized_title TEXT;",
    "ALTER TABLE publications ADD COLUMN IF NOT EXISTS citation_count INTEGER DEFAULT 0;",
    "ALTER TABLE publications ADD COLUMN IF NOT EXISTS source_type TEXT;",
    "ALTER TABLE publications ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT TRUE;",
    "ALTER TABLE publications ADD COLUMN IF NOT EXISTS confidence NUMERIC(5,2) DEFAULT 100.0;",
    
    # assessments
    "ALTER TABLE assessments ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(5,2) DEFAULT 90.0;",
    "ALTER TABLE assessments ADD COLUMN IF NOT EXISTS analytics JSONB DEFAULT '{}'::jsonb;",
    "ALTER TABLE assessments ADD COLUMN IF NOT EXISTS ai_insights JSONB DEFAULT '{}'::jsonb;",
    "ALTER TABLE assessments ADD COLUMN IF NOT EXISTS framework_id UUID;",
    "ALTER TABLE assessments ADD COLUMN IF NOT EXISTS evidence_count INTEGER DEFAULT 0;",
    "ALTER TABLE assessments ADD COLUMN IF NOT EXISTS missing_evidence_count INTEGER DEFAULT 0;",
    
    # kpi_scores
    "ALTER TABLE kpi_scores ADD COLUMN IF NOT EXISTS rule_id TEXT;",
    "ALTER TABLE kpi_scores ADD COLUMN IF NOT EXISTS evidence JSONB DEFAULT '{}'::jsonb;",
    "ALTER TABLE kpi_scores ALTER COLUMN kpi_code DROP NOT NULL;",
    "ALTER TABLE kpi_scores ALTER COLUMN name DROP NOT NULL;",
    
    # institutional_records
    "ALTER TABLE institutional_records ADD COLUMN IF NOT EXISTS description TEXT;",
    "ALTER TABLE institutional_records ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'institutional';",
    "ALTER TABLE institutional_records ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT TRUE;",
    
    # assessment_frameworks
    "ALTER TABLE assessment_frameworks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';",
    "ALTER TABLE assessment_frameworks ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;",
    "ALTER TABLE assessment_frameworks ALTER COLUMN rules DROP NOT NULL;"
]

for q in alter_queries:
    try:
        cur.execute(q)
    except Exception as e:
        print(f"Alter note: {e}")

print("Syncing tables from Supabase into Tiger Data...")

def migrate_table(table_name, conflict_col="id"):
    try:
        res = supabase.table(table_name).select("*").limit(2000).execute()
        rows = res.data or []
        if not rows:
            print(f"  {table_name}: 0 rows to migrate")
            return
        
        cols = list(rows[0].keys())
        col_names = ", ".join(cols)
        placeholders = ", ".join(["%s"] * len(cols))
        
        insert_query = f"INSERT INTO {table_name} ({col_names}) VALUES ({placeholders}) ON CONFLICT ({conflict_col}) DO NOTHING;"
        
        count = 0
        for r in rows:
            values = []
            for c in cols:
                val = r[c]
                if isinstance(val, (dict, list)):
                    values.append(Json(val))
                else:
                    values.append(val)
            cur.execute(insert_query, values)
            count += 1
            
        print(f"  [SUCCESS] {table_name}: {count} rows migrated successfully!")
    except Exception as e:
        print(f"  [ERROR] {table_name}: {e}")

tables_to_sync = [
    'academic_identities',
    'unified_profiles',
    'publications',
    'assessments',
    'kpi_scores',
    'institutional_records',
    'assessment_frameworks'
]

for tbl in tables_to_sync:
    migrate_table(tbl)

print("\nVerifying row counts in Tiger Data...")
cur.execute("""
SELECT table_name, 
       (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_count
FROM (
  SELECT table_name, 
         query_to_xml(format('select count(*) as cnt from %I', table_name), false, true, '') as xml_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
) t
ORDER BY table_name;
""")
for row in cur.fetchall():
    print(f"  {row[0]}: {row[1]} rows")

cur.close()
conn.close()
print("\n=== TIGER DATA ALL TABLES SYNC COMPLETE ===")
