import os
import sys
import psycopg2
from psycopg2.extras import Json
import dotenv

dotenv.load_dotenv('.env.local')

# Supabase source
from supabase import create_client
sb_url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', '').strip()
sb_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '').strip()
supabase = create_client(sb_url, sb_key)

# Tiger Data target
TIGER_URL = os.environ.get('TIGER_DATABASE_URL', 'postgresql://tsdbadmin:ihfyu8sqtf18k7ds@tt158v5sae.oc4fcokabh.tsdb.cloud.timescale.com:36613/tsdb?sslmode=require')

print("Connecting to Tiger Data...")
conn = psycopg2.connect(TIGER_URL)
conn.autocommit = True
cur = conn.cursor()

print("Setting up schemas & extensions...")
cur.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
cur.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto";')
cur.execute('CREATE SCHEMA IF NOT EXISTS auth;')

# Create auth.users table for self-contained auth
cur.execute('''
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    encrypted_password TEXT,
    raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'REVIEWER' CHECK (role IN ('ADMIN', 'REVIEWER', 'FACULTY')),
    faculty_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
''')

# Create core tables
cur.execute('''
CREATE TABLE IF NOT EXISTS institutions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  code        TEXT UNIQUE NOT NULL,
  city        TEXT,
  state       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name      TEXT,
  role           TEXT NOT NULL DEFAULT 'REVIEWER' CHECK (role IN ('ADMIN', 'REVIEWER', 'FACULTY')),
  institution_id UUID REFERENCES institutions(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faculty (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id     UUID REFERENCES institutions(id),
  canonical_name     TEXT NOT NULL,
  canonical_email    TEXT,
  department         TEXT NOT NULL,
  designation        TEXT NOT NULL,
  onboarding_status  TEXT NOT NULL DEFAULT 'active' CHECK (onboarding_status IN ('pending', 'active', 'archived')),
  completeness_score NUMERIC(5,2) DEFAULT 0,
  conflict_count     INTEGER DEFAULT 0,
  employee_id        TEXT,
  last_synced_at     TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS academic_identities (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id     UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  source         TEXT NOT NULL,
  external_id    TEXT NOT NULL,
  profile_url    TEXT,
  confidence_score NUMERIC(5,2) DEFAULT 1.0,
  verified       BOOLEAN DEFAULT FALSE,
  raw_payload    JSONB DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (faculty_id, source, external_id)
);

CREATE TABLE IF NOT EXISTS unified_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id        UUID UNIQUE NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  source_coverage   JSONB DEFAULT '{}'::jsonb,
  total_citations   INTEGER DEFAULT 0,
  h_index           INTEGER DEFAULT 0,
  i10_index         INTEGER DEFAULT 0,
  total_publications INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS publications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id     UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  authors        TEXT[] DEFAULT '{}',
  venue          TEXT,
  year           INTEGER,
  doi            TEXT,
  citations      INTEGER DEFAULT 0,
  source_url     TEXT,
  source         TEXT,
  dedup_status   TEXT DEFAULT 'unique',
  raw_payload    JSONB DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assessments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id     UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  total_score    NUMERIC(5,2) DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'draft',
  category_scores JSONB DEFAULT '{}'::jsonb,
  rule_version   TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kpi_scores (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id  UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  kpi_code       TEXT NOT NULL,
  category       TEXT NOT NULL,
  name           TEXT NOT NULL,
  computed_score NUMERIC(5,2) DEFAULT 0,
  max_score      NUMERIC(5,2) DEFAULT 0,
  weight         NUMERIC(5,2) DEFAULT 0,
  status         TEXT DEFAULT 'VALID',
  evidence_data  JSONB DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profile_conflicts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id     UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  field_name     TEXT NOT NULL,
  source_a       TEXT NOT NULL,
  val_a          TEXT NOT NULL,
  source_b       TEXT NOT NULL,
  val_b          TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'OPEN',
  resolved_val   TEXT,
  resolved_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS institutional_records (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id     UUID REFERENCES faculty(id) ON DELETE SET NULL,
  employee_id    TEXT,
  email          TEXT,
  category       TEXT NOT NULL,
  title          TEXT NOT NULL,
  year           INTEGER,
  hours          NUMERIC(6,2),
  feedback_score NUMERIC(3,2),
  details        JSONB DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assessment_frameworks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  version        TEXT NOT NULL,
  is_active      BOOLEAN DEFAULT FALSE,
  rules          JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        TEXT,
  action         TEXT NOT NULL,
  entity_type    TEXT NOT NULL,
  entity_id      TEXT,
  result         TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
''')

# Create Tiger Data Time-Series Hypertable
print("Setting up Tiger Data Time-Series Hypertable...")
cur.execute('''
CREATE TABLE IF NOT EXISTS faculty_annual_metrics (
  faculty_id        UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  recorded_year     INTEGER NOT NULL,
  recorded_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  citations         INTEGER DEFAULT 0,
  publications_count INTEGER DEFAULT 0,
  teaching_hours    NUMERIC(6,2) DEFAULT 0,
  mentoring_count   INTEGER DEFAULT 0,
  overall_score     NUMERIC(5,2) DEFAULT 0,
  PRIMARY KEY (faculty_id, recorded_year, recorded_at)
);
''')

# Convert to hypertable if not already
try:
    cur.execute("SELECT create_hypertable('faculty_annual_metrics', 'recorded_at', if_not_exists => TRUE);")
    print("  Created TimescaleDB hypertable 'faculty_annual_metrics' successfully!")
except Exception as e:
    print("  Hypertable note:", e)

# Pre-seed default Admin and Reviewer accounts for Instant Demo Access
print("Seeding demo users...")
import hashlib

def hash_pw(pw: str) -> str:
    # simple sha256 + salt for portable fast demo
    return hashlib.sha256(f"acadlens_salt_{pw}".encode()).hexdigest()

demo_admin_id = "00000000-0000-0000-0000-000000000000"
cur.execute('''
INSERT INTO users (id, email, password_hash, full_name, role)
VALUES (%s, %s, %s, %s, %s)
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role;
''', (demo_admin_id, 'admin@acadlens.ac.in', hash_pw('admin123'), 'Institution Admin (Reviewer)', 'ADMIN'))

# Add evaluator demo user
cur.execute('''
INSERT INTO users (id, email, password_hash, full_name, role)
VALUES (%s, %s, %s, %s, %s)
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role;
''', ('11111111-1111-1111-1111-111111111111', 'evaluator@hackbios.xyz', hash_pw('hackbios2026'), 'HackBIOS Evaluator', 'ADMIN'))

# Now migrate data from Supabase
print("\nMigrating data from Supabase to Tiger Data...")

def migrate_table(table_name, conflict_col="id"):
    try:
        res = supabase.table(table_name).select("*").limit(1000).execute()
        rows = res.data or []
        if not rows:
            print(f"  {table_name}: 0 rows to migrate")
            return
        
        # Get column names from first row
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
            
        print(f"  [SUCCESS] {table_name}: {count} rows migrated!")
    except Exception as e:
        print(f"  [ERROR] {table_name}: {e}")

# Migrate in dependency order
for tbl in ['institutions', 'faculty', 'academic_identities', 'unified_profiles', 'publications', 'assessments', 'kpi_scores', 'institutional_records', 'assessment_frameworks']:
    migrate_table(tbl)

# Seed time-series historical trajectory data for the 8 faculty
print("\nPopulating Tiger Data time-series annual trajectory for faculty...")
cur.execute("SELECT id, canonical_name FROM faculty;")
faculty_rows = cur.fetchall()

years = [2021, 2022, 2023, 2024, 2025, 2026]
import random
random.seed(42)

for f_id, f_name in faculty_rows:
    base_citations = random.randint(30, 80)
    base_pubs = random.randint(2, 5)
    base_score = random.uniform(68.0, 75.0)
    
    for y in years:
        citations = base_citations + (y - 2021) * random.randint(20, 50)
        pubs = base_pubs + (y - 2021) * random.randint(2, 6)
        score = min(98.5, round(base_score + (y - 2021) * random.uniform(2.5, 4.5), 1))
        teaching = random.randint(36, 48)
        mentoring = random.randint(2, 8)
        
        cur.execute('''
        INSERT INTO faculty_annual_metrics 
        (faculty_id, recorded_year, recorded_at, citations, publications_count, teaching_hours, mentoring_count, overall_score)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (faculty_id, recorded_year, recorded_at) DO NOTHING;
        ''', (f_id, y, f"{y}-09-01 00:00:00+00", citations, pubs, teaching, mentoring, score))

print("  Successfully populated Tiger Data time-series trajectory metrics!")

cur.close()
conn.close()
print("\n=== MIGRATION TO TIGER DATA COMPLETE ===")
