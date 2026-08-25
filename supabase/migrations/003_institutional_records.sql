-- Add employee_id to faculty table
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS employee_id TEXT UNIQUE;

-- Create table for unified institutional records (Teaching, Projects, Awards, etc.)
CREATE TABLE IF NOT EXISTS institutional_records (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id     UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  category       TEXT NOT NULL
                 CHECK (category IN ('Teaching', 'Mentoring', 'Institutional Service', 'Awards', 'Projects', 'Innovation', 'Outreach')),
  title          TEXT NOT NULL,
  description    TEXT,
  year           INTEGER,
  source_type    TEXT NOT NULL DEFAULT 'institutional',
  is_verified    BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create table for unmatched records
CREATE TABLE IF NOT EXISTS unmatched_institutional_records (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id    TEXT,
  email          TEXT,
  category       TEXT NOT NULL,
  title          TEXT NOT NULL,
  description    TEXT,
  year           INTEGER,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
