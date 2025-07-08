-- Check if the feature tables exist and create them if they don't
DO $$
BEGIN
    -- Check if plan_features table exists (this should be plan_feature_assignments)
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'plan_feature_assignments') THEN
        CREATE TABLE plan_feature_assignments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
            feature_id UUID NOT NULL REFERENCES plan_features(id) ON DELETE CASCADE,
            is_enabled BOOLEAN DEFAULT true,
            limit_value INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(plan_id, feature_id)
        );
        
        CREATE INDEX idx_plan_feature_assignments_plan_id ON plan_feature_assignments(plan_id);
        CREATE INDEX idx_plan_feature_assignments_feature_id ON plan_feature_assignments(feature_id);
        
        RAISE NOTICE 'Created plan_feature_assignments table';
    ELSE
        RAISE NOTICE 'plan_feature_assignments table already exists';
    END IF;

    -- Check if plan_features table exists and has correct structure
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'plan_features') THEN
        CREATE TABLE plan_features (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            feature_key VARCHAR(100) NOT NULL UNIQUE,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX idx_plan_features_feature_key ON plan_features(feature_key);
        CREATE INDEX idx_plan_features_is_active ON plan_features(is_active);
        
        RAISE NOTICE 'Created plan_features table';
    ELSE
        RAISE NOTICE 'plan_features table already exists';
    END IF;

    -- Insert some default features if the table is empty
    IF NOT EXISTS (SELECT 1 FROM plan_features LIMIT 1) THEN
        INSERT INTO plan_features (name, description, feature_key) VALUES
        ('Real-time Updates', 'Real-time content synchronization across all screens', 'realtime_updates'),
        ('Custom Branding', 'White-label solution with custom branding options', 'custom_branding'),
        ('Advanced Analytics', 'Detailed analytics and reporting dashboard', 'advanced_analytics'),
        ('API Access', 'Full REST API access for integrations', 'api_access'),
        ('Priority Support', '24/7 priority customer support', 'priority_support'),
        ('Team Collaboration', 'Multi-user team collaboration features', 'team_collaboration'),
        ('Custom Templates', 'Access to premium custom templates', 'custom_templates'),
        ('Offline Mode', 'Content playback in offline mode', 'offline_mode'),
        ('Multi-zone Display', 'Multiple content zones on single screen', 'multi_zone_display'),
        ('Scheduled Content', 'Advanced content scheduling features', 'scheduled_content'),
        ('Remote Management', 'Remote device management and monitoring', 'remote_management'),
        ('Content Approval', 'Content approval workflow system', 'content_approval');
        
        RAISE NOTICE 'Inserted default features';
    END IF;

END $$;
