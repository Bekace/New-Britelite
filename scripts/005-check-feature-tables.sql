-- Check if plan_features table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'plan_features') THEN
        CREATE TABLE plan_features (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            feature_key VARCHAR(100) UNIQUE NOT NULL,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Insert default features
        INSERT INTO plan_features (name, description, feature_key) VALUES
        ('Real-time Updates', 'Push content updates instantly to all displays', 'realtime_updates'),
        ('Custom Branding', 'White-label and custom branding options', 'custom_branding'),
        ('Advanced Analytics', 'Detailed analytics and reporting', 'advanced_analytics'),
        ('API Access', 'Access to REST API for integrations', 'api_access'),
        ('Priority Support', '24/7 priority customer support', 'priority_support'),
        ('Team Collaboration', 'Multi-user team collaboration features', 'team_collaboration'),
        ('Scheduled Content', 'Schedule content to display at specific times', 'scheduled_content'),
        ('Multi-location Support', 'Manage screens across multiple locations', 'multi_location'),
        ('Content Templates', 'Pre-built content templates', 'content_templates'),
        ('Video Support', 'Full video content support', 'video_support'),
        ('Interactive Content', 'Touch screen and interactive content support', 'interactive_content'),
        ('Cloud Storage', 'Enhanced cloud storage capabilities', 'cloud_storage');
    END IF;
END
$$;

-- Check if plan_feature_assignments table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'plan_feature_assignments') THEN
        CREATE TABLE plan_feature_assignments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
            feature_id UUID NOT NULL REFERENCES plan_features(id) ON DELETE CASCADE,
            is_enabled BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(plan_id, feature_id)
        );
    END IF;
END
$$;
