-- Check what tables exist for features
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%feature%';

-- Check the structure of existing tables
\d+ plan_feature_assignments;
\d+ features;

-- If the tables don't exist, create them
CREATE TABLE IF NOT EXISTS features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    feature_key VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plan_feature_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(plan_id, feature_id)
);

-- Insert some default features if they don't exist
INSERT INTO features (name, description, feature_key) VALUES
('API Access', 'Access to REST API', 'api_access'),
('Advanced Analytics', 'Detailed analytics and reporting', 'advanced_analytics'),
('Priority Support', '24/7 priority customer support', 'priority_support'),
('Custom Branding', 'White-label and custom branding options', 'custom_branding'),
('Team Collaboration', 'Multi-user team collaboration features', 'team_collaboration'),
('Real-time Updates', 'Real-time content updates', 'realtime_updates'),
('Custom Integrations', 'Third-party integrations and webhooks', 'custom_integrations'),
('Advanced Scheduling', 'Advanced content scheduling features', 'advanced_scheduling'),
('Multi-location Support', 'Manage multiple locations', 'multi_location'),
('Content Templates', 'Pre-built content templates', 'content_templates'),
('Mobile App', 'Mobile application access', 'mobile_app'),
('Backup & Recovery', 'Automated backup and recovery', 'backup_recovery')
ON CONFLICT (feature_key) DO NOTHING;
