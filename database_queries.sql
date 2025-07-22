-- ================================================================
-- HOTEL AUDIT MANAGEMENT SYSTEM - DATABASE QUERIES
-- ================================================================
-- Complete SQL queries for the hotel audit management application
-- Database: PostgreSQL
-- Tables: users, properties, audits, audit_items
-- ================================================================

-- ================================================================
-- 1. DATABASE SCHEMA CREATION
-- ================================================================

-- Create Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'auditor', 'reviewer', 'corporate', 'hotelgm')),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Properties table
CREATE TABLE properties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    region VARCHAR(255) NOT NULL,
    image VARCHAR(500),
    last_audit_score INTEGER,
    next_audit_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'green' CHECK (status IN ('green', 'amber', 'red')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Audits table
CREATE TABLE audits (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    auditor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'submitted', 'reviewed', 'completed')),
    overall_score INTEGER,
    cleanliness_score INTEGER,
    branding_score INTEGER,
    operational_score INTEGER,
    compliance_zone VARCHAR(10) CHECK (compliance_zone IN ('green', 'amber', 'red')),
    findings JSONB,
    action_plan JSONB,
    ai_report JSONB,
    ai_insights JSONB,
    submitted_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Audit Items table
CREATE TABLE audit_items (
    id SERIAL PRIMARY KEY,
    audit_id INTEGER NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    category VARCHAR(255) NOT NULL,
    item VARCHAR(255) NOT NULL,
    score INTEGER,
    comments TEXT,
    photos JSONB,
    ai_analysis JSONB,
    ai_suggested_score INTEGER,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- 2. INDEXES FOR PERFORMANCE
-- ================================================================

-- Users indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- Properties indexes
CREATE INDEX idx_properties_location ON properties(location);
CREATE INDEX idx_properties_region ON properties(region);
CREATE INDEX idx_properties_status ON properties(status);

-- Audits indexes
CREATE INDEX idx_audits_property_id ON audits(property_id);
CREATE INDEX idx_audits_auditor_id ON audits(auditor_id);
CREATE INDEX idx_audits_reviewer_id ON audits(reviewer_id);
CREATE INDEX idx_audits_status ON audits(status);
CREATE INDEX idx_audits_compliance_zone ON audits(compliance_zone);
CREATE INDEX idx_audits_created_at ON audits(created_at);

-- Audit Items indexes
CREATE INDEX idx_audit_items_audit_id ON audit_items(audit_id);
CREATE INDEX idx_audit_items_category ON audit_items(category);
CREATE INDEX idx_audit_items_status ON audit_items(status);

-- ================================================================
-- 3. USER MANAGEMENT QUERIES
-- ================================================================

-- Create a new user
INSERT INTO users (username, password, role, name, email)
VALUES ('john.doe', '$2b$12$hashed_password', 'auditor', 'John Doe', 'john.doe@hotel-audit.com');

-- Get user by username (for authentication)
SELECT id, username, password, role, name, email, created_at
FROM users
WHERE username = 'admin';

-- Get all users with role filtering
SELECT id, username, role, name, email, created_at
FROM users
WHERE role = 'auditor'
ORDER BY name;

-- Get user statistics by role
SELECT 
    role,
    COUNT(*) as user_count,
    COUNT(CASE WHEN created_at > CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_users_last_30_days
FROM users
GROUP BY role
ORDER BY user_count DESC;

-- Update user information
UPDATE users
SET name = 'Updated Name', email = 'updated.email@hotel-audit.com'
WHERE id = 1;

-- Deactivate user (soft delete - add is_active column if needed)
-- ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
-- UPDATE users SET is_active = FALSE WHERE id = 1;

-- ================================================================
-- 4. PROPERTY MANAGEMENT QUERIES
-- ================================================================

-- Create a new property
INSERT INTO properties (name, location, region, image, status)
VALUES ('Grand Hotel Downtown', 'Mumbai', 'West India', 'https://example.com/image.jpg', 'green');

-- Get all properties with latest audit information
SELECT 
    p.*,
    a.overall_score as latest_score,
    a.compliance_zone as latest_compliance,
    a.created_at as last_audit_date,
    u.name as last_auditor_name
FROM properties p
LEFT JOIN audits a ON p.id = a.property_id 
    AND a.id = (SELECT MAX(id) FROM audits WHERE property_id = p.id)
LEFT JOIN users u ON a.auditor_id = u.id
ORDER BY p.name;

-- Get properties by region
SELECT * FROM properties
WHERE region = 'North India'
ORDER BY last_audit_score DESC;

-- Get properties needing audits (next audit date passed or no audit)
SELECT 
    p.*,
    COALESCE(p.next_audit_date < CURRENT_DATE, TRUE) as audit_overdue
FROM properties p
WHERE p.next_audit_date IS NULL 
   OR p.next_audit_date < CURRENT_DATE
ORDER BY p.next_audit_date ASC NULLS FIRST;

-- Update property status based on latest audit
UPDATE properties 
SET 
    status = CASE 
        WHEN last_audit_score >= 80 THEN 'green'
        WHEN last_audit_score >= 60 THEN 'amber'
        ELSE 'red'
    END,
    next_audit_date = CURRENT_DATE + INTERVAL '3 months'
WHERE id = 1;

-- Property performance summary
SELECT 
    region,
    COUNT(*) as total_properties,
    AVG(last_audit_score) as avg_score,
    COUNT(CASE WHEN status = 'green' THEN 1 END) as green_properties,
    COUNT(CASE WHEN status = 'amber' THEN 1 END) as amber_properties,
    COUNT(CASE WHEN status = 'red' THEN 1 END) as red_properties
FROM properties
GROUP BY region
ORDER BY avg_score DESC;

-- ================================================================
-- 5. AUDIT MANAGEMENT QUERIES
-- ================================================================

-- Create a new audit
INSERT INTO audits (property_id, auditor_id, status)
VALUES (1, 2, 'scheduled');

-- Get all audits with full details
SELECT 
    a.*,
    p.name as property_name,
    p.location,
    p.region,
    au.name as auditor_name,
    r.name as reviewer_name
FROM audits a
JOIN properties p ON a.property_id = p.id
LEFT JOIN users au ON a.auditor_id = au.id
LEFT JOIN users r ON a.reviewer_id = r.id
ORDER BY a.created_at DESC;

-- Get audits by status
SELECT 
    a.id,
    a.status,
    p.name as property_name,
    au.name as auditor_name,
    a.created_at
FROM audits a
JOIN properties p ON a.property_id = p.id
LEFT JOIN users au ON a.auditor_id = au.id
WHERE a.status = 'in_progress'
ORDER BY a.created_at;

-- Get audits assigned to specific auditor
SELECT 
    a.*,
    p.name as property_name,
    p.location
FROM audits a
JOIN properties p ON a.property_id = p.id
WHERE a.auditor_id = 2
  AND a.status IN ('scheduled', 'in_progress')
ORDER BY a.created_at;

-- Update audit with scores and completion
UPDATE audits
SET 
    overall_score = 85,
    cleanliness_score = 90,
    branding_score = 82,
    operational_score = 83,
    compliance_zone = 'green',
    status = 'submitted',
    submitted_at = CURRENT_TIMESTAMP,
    findings = '{"issues": ["Minor soap dispenser issue"], "positives": ["Excellent cleanliness", "Good maintenance"]}',
    action_plan = '{"immediate": ["Fix soap dispenser"], "short_term": ["Schedule regular maintenance"]}'
WHERE id = 1;

-- Assign reviewer to audit
UPDATE audits
SET reviewer_id = 3, status = 'reviewed', reviewed_at = CURRENT_TIMESTAMP
WHERE id = 1;

-- Audit completion statistics
SELECT 
    status,
    COUNT(*) as count,
    AVG(overall_score) as avg_score,
    AVG(EXTRACT(days FROM submitted_at - created_at)) as avg_completion_days
FROM audits
WHERE submitted_at IS NOT NULL
GROUP BY status
ORDER BY count DESC;

-- Monthly audit trend
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as total_audits,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_audits,
    AVG(overall_score) as avg_score
FROM audits
WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;

-- ================================================================
-- 6. AUDIT ITEMS QUERIES
-- ================================================================

-- Create audit items for an audit
INSERT INTO audit_items (audit_id, category, item, score, comments, status)
VALUES 
    (1, 'Cleanliness', 'Bathroom Cleanliness', 90, 'Excellent condition, all fixtures working', 'completed'),
    (1, 'Safety', 'Fire Safety Equipment', 85, 'All equipment present and functional', 'completed'),
    (1, 'Branding', 'Logo Display', 95, 'Perfect brand compliance', 'completed');

-- Get all items for specific audit
SELECT 
    ai.*,
    a.property_id,
    p.name as property_name
FROM audit_items ai
JOIN audits a ON ai.audit_id = a.id
JOIN properties p ON a.property_id = p.id
WHERE ai.audit_id = 1
ORDER BY ai.category, ai.item;

-- Get items by category across all audits
SELECT 
    category,
    item,
    AVG(score) as avg_score,
    COUNT(*) as total_assessments,
    COUNT(CASE WHEN score >= 80 THEN 1 END) as high_scores
FROM audit_items
WHERE score IS NOT NULL
GROUP BY category, item
ORDER BY category, avg_score DESC;

-- Update audit item with AI analysis
UPDATE audit_items
SET 
    ai_analysis = '{"compliance_status": "compliant", "confidence": 0.95, "observations": ["Clean", "Well-maintained"]}',
    ai_suggested_score = 88,
    score = 88,
    comments = 'AI analysis confirms excellent condition'
WHERE id = 1;

-- Items needing attention (low scores)
SELECT 
    ai.category,
    ai.item,
    ai.score,
    ai.comments,
    p.name as property_name,
    a.created_at as audit_date
FROM audit_items ai
JOIN audits a ON ai.audit_id = a.id
JOIN properties p ON a.property_id = p.id
WHERE ai.score < 70
ORDER BY ai.score, a.created_at DESC;

-- ================================================================
-- 7. COMPLIANCE AND REPORTING QUERIES
-- ================================================================

-- Overall compliance dashboard
SELECT 
    COUNT(DISTINCT p.id) as total_properties,
    COUNT(DISTINCT a.id) as total_audits,
    AVG(a.overall_score) as avg_overall_score,
    COUNT(CASE WHEN a.compliance_zone = 'green' THEN 1 END) as green_audits,
    COUNT(CASE WHEN a.compliance_zone = 'amber' THEN 1 END) as amber_audits,
    COUNT(CASE WHEN a.compliance_zone = 'red' THEN 1 END) as red_audits
FROM properties p
LEFT JOIN audits a ON p.id = a.property_id
WHERE a.status = 'completed';

-- Property compliance trend
SELECT 
    p.name,
    p.location,
    COUNT(a.id) as total_audits,
    AVG(a.overall_score) as avg_score,
    MAX(a.created_at) as last_audit_date,
    STRING_AGG(DISTINCT a.compliance_zone, ', ') as compliance_zones
FROM properties p
LEFT JOIN audits a ON p.id = a.property_id
GROUP BY p.id, p.name, p.location
ORDER BY avg_score DESC;

-- Auditor performance statistics
SELECT 
    u.name as auditor_name,
    COUNT(a.id) as total_audits,
    AVG(a.overall_score) as avg_score_given,
    AVG(EXTRACT(days FROM a.submitted_at - a.created_at)) as avg_completion_days,
    COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_audits
FROM users u
LEFT JOIN audits a ON u.id = a.auditor_id
WHERE u.role = 'auditor'
GROUP BY u.id, u.name
ORDER BY total_audits DESC;

-- Category-wise performance analysis
SELECT 
    ai.category,
    COUNT(*) as total_items,
    AVG(ai.score) as avg_score,
    MIN(ai.score) as min_score,
    MAX(ai.score) as max_score,
    STDDEV(ai.score) as score_variance
FROM audit_items ai
WHERE ai.score IS NOT NULL
GROUP BY ai.category
ORDER BY avg_score DESC;

-- Properties requiring immediate attention
SELECT 
    p.name,
    p.location,
    p.status,
    a.overall_score,
    a.compliance_zone,
    a.created_at as last_audit_date,
    EXTRACT(days FROM CURRENT_DATE - a.created_at) as days_since_audit
FROM properties p
JOIN audits a ON p.id = a.property_id
WHERE a.id = (SELECT MAX(id) FROM audits WHERE property_id = p.id)
  AND (a.compliance_zone = 'red' OR a.overall_score < 60)
ORDER BY a.overall_score, days_since_audit DESC;

-- ================================================================
-- 8. AI INTEGRATION QUERIES
-- ================================================================

-- Update audit with AI-generated report
UPDATE audits
SET 
    ai_report = '{
        "summary": "Comprehensive analysis completed",
        "key_findings": ["Excellent cleanliness standards", "Minor branding issues"],
        "recommendations": ["Update brand signage", "Maintain current cleaning standards"],
        "compliance_overview": {"overall": "green"},
        "ai_insights": {"confidence": 0.92, "analysis_time": "2.3s"}
    }',
    ai_insights = '{
        "patterns": ["Consistent high performance in cleanliness"],
        "predictions": ["Likely to maintain green status"],
        "suggestions": ["Focus on branding improvements"]
    }'
WHERE id = 1;

-- Get audits with AI analysis
SELECT 
    a.id,
    p.name as property_name,
    a.overall_score,
    a.ai_report->>'summary' as ai_summary,
    a.ai_insights->>'patterns' as ai_patterns
FROM audits a
JOIN properties p ON a.property_id = p.id
WHERE a.ai_report IS NOT NULL
ORDER BY a.created_at DESC;

-- Items with AI-suggested scores vs actual scores
SELECT 
    ai.category,
    ai.item,
    ai.ai_suggested_score,
    ai.score as actual_score,
    ABS(ai.ai_suggested_score - ai.score) as score_difference,
    ai.ai_analysis->>'confidence' as ai_confidence
FROM audit_items ai
WHERE ai.ai_suggested_score IS NOT NULL 
  AND ai.score IS NOT NULL
ORDER BY score_difference DESC;

-- ================================================================
-- 9. ADVANCED ANALYTICS QUERIES
-- ================================================================

-- Seasonal audit performance
SELECT 
    EXTRACT(quarter FROM a.created_at) as quarter,
    EXTRACT(year FROM a.created_at) as year,
    COUNT(*) as total_audits,
    AVG(a.overall_score) as avg_score,
    COUNT(CASE WHEN a.compliance_zone = 'green' THEN 1 END) * 100.0 / COUNT(*) as green_percentage
FROM audits a
WHERE a.created_at >= CURRENT_DATE - INTERVAL '2 years'
GROUP BY EXTRACT(quarter FROM a.created_at), EXTRACT(year FROM a.created_at)
ORDER BY year, quarter;

-- Property improvement tracking
WITH property_scores AS (
    SELECT 
        a.property_id,
        a.overall_score,
        a.created_at,
        ROW_NUMBER() OVER (PARTITION BY a.property_id ORDER BY a.created_at) as audit_sequence,
        LAG(a.overall_score) OVER (PARTITION BY a.property_id ORDER BY a.created_at) as previous_score
    FROM audits a
    WHERE a.overall_score IS NOT NULL
)
SELECT 
    p.name,
    ps.overall_score as current_score,
    ps.previous_score,
    ps.overall_score - ps.previous_score as score_improvement,
    ps.audit_sequence as total_audits
FROM property_scores ps
JOIN properties p ON ps.property_id = p.id
WHERE ps.previous_score IS NOT NULL
ORDER BY score_improvement DESC;

-- Risk assessment query
SELECT 
    p.name,
    p.location,
    a.overall_score,
    a.compliance_zone,
    EXTRACT(days FROM CURRENT_DATE - a.created_at) as days_since_audit,
    CASE 
        WHEN a.compliance_zone = 'red' THEN 'HIGH'
        WHEN a.compliance_zone = 'amber' AND EXTRACT(days FROM CURRENT_DATE - a.created_at) > 90 THEN 'HIGH'
        WHEN a.compliance_zone = 'amber' THEN 'MEDIUM'
        WHEN EXTRACT(days FROM CURRENT_DATE - a.created_at) > 180 THEN 'MEDIUM'
        ELSE 'LOW'
    END as risk_level
FROM properties p
LEFT JOIN audits a ON p.id = a.property_id 
    AND a.id = (SELECT MAX(id) FROM audits WHERE property_id = p.id)
ORDER BY 
    CASE 
        WHEN a.compliance_zone = 'red' THEN 1
        WHEN a.compliance_zone = 'amber' THEN 2
        ELSE 3
    END,
    days_since_audit DESC;

-- ================================================================
-- 10. MAINTENANCE AND CLEANUP QUERIES
-- ================================================================

-- Delete old audit data (older than 3 years)
DELETE FROM audit_items 
WHERE audit_id IN (
    SELECT id FROM audits 
    WHERE created_at < CURRENT_DATE - INTERVAL '3 years'
);

DELETE FROM audits 
WHERE created_at < CURRENT_DATE - INTERVAL '3 years';

-- Archive completed audits to separate table (if needed)
-- CREATE TABLE archived_audits AS SELECT * FROM audits WHERE status = 'completed' AND created_at < CURRENT_DATE - INTERVAL '1 year';

-- Update property next audit dates
UPDATE properties 
SET next_audit_date = CURRENT_DATE + INTERVAL '3 months'
WHERE next_audit_date < CURRENT_DATE;

-- Database maintenance - update statistics
ANALYZE users;
ANALYZE properties;
ANALYZE audits;
ANALYZE audit_items;

-- Find orphaned records
SELECT 'Orphaned audit items' as issue, COUNT(*) as count
FROM audit_items ai
LEFT JOIN audits a ON ai.audit_id = a.id
WHERE a.id IS NULL

UNION ALL

SELECT 'Audits without property' as issue, COUNT(*) as count
FROM audits a
LEFT JOIN properties p ON a.property_id = p.id
WHERE p.id IS NULL;

-- ================================================================
-- 11. VIEWS FOR COMMON QUERIES
-- ================================================================

-- Create view for audit summary
CREATE VIEW audit_summary AS
SELECT 
    a.id,
    a.status,
    a.overall_score,
    a.compliance_zone,
    a.created_at,
    a.submitted_at,
    p.name as property_name,
    p.location,
    p.region,
    au.name as auditor_name,
    r.name as reviewer_name,
    COUNT(ai.id) as total_items,
    AVG(ai.score) as avg_item_score
FROM audits a
JOIN properties p ON a.property_id = p.id
LEFT JOIN users au ON a.auditor_id = au.id
LEFT JOIN users r ON a.reviewer_id = r.id
LEFT JOIN audit_items ai ON a.id = ai.audit_id
GROUP BY a.id, a.status, a.overall_score, a.compliance_zone, a.created_at, 
         a.submitted_at, p.name, p.location, p.region, au.name, r.name;

-- Create view for property dashboard
CREATE VIEW property_dashboard AS
SELECT 
    p.*,
    latest_audit.overall_score as latest_score,
    latest_audit.compliance_zone as latest_compliance,
    latest_audit.created_at as last_audit_date,
    latest_audit.auditor_name,
    CASE 
        WHEN p.next_audit_date < CURRENT_DATE THEN 'OVERDUE'
        WHEN p.next_audit_date < CURRENT_DATE + INTERVAL '30 days' THEN 'DUE_SOON'
        ELSE 'SCHEDULED'
    END as audit_status
FROM properties p
LEFT JOIN (
    SELECT DISTINCT ON (a.property_id)
        a.property_id,
        a.overall_score,
        a.compliance_zone,
        a.created_at,
        u.name as auditor_name
    FROM audits a
    LEFT JOIN users u ON a.auditor_id = u.id
    WHERE a.status = 'completed'
    ORDER BY a.property_id, a.created_at DESC
) latest_audit ON p.id = latest_audit.property_id;

-- ================================================================
-- END OF QUERIES
-- ================================================================
