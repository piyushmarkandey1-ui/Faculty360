-- Link profiles to faculty for the FACULTY role
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS faculty_id UUID REFERENCES faculty(id);

-- ------------------------------------------------------------
-- AUDIT TRAIL
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    result TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- RLS POLICIES
-- ------------------------------------------------------------
-- Enable RLS on core tables
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutional_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 1. Profiles: Users can read their own, Admin can read all
CREATE POLICY "Users can read own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- 2. Faculty: 
-- Admin/Reviewer: read all
-- Faculty: read own
CREATE POLICY "Admin/Reviewer can view all faculty" ON faculty
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('ADMIN', 'REVIEWER')
        )
    );

CREATE POLICY "Faculty can view own faculty record" ON faculty
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'FACULTY'
            AND profiles.faculty_id = faculty.id
        )
    );

-- 3. Assessments:
CREATE POLICY "Admin/Reviewer can view all assessments" ON assessments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('ADMIN', 'REVIEWER')
        )
    );

CREATE POLICY "Faculty can view own assessments" ON assessments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'FACULTY'
            AND profiles.faculty_id = assessments.faculty_id
        )
    );

-- 4. Audit Logs: Admin only
CREATE POLICY "Admin can view all audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'ADMIN'
        )
    );
