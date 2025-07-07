-- Insert default plan features
INSERT INTO plan_features (name, description, feature_key) VALUES
('Screen Management', 'Ability to create and manage screens', 'screen_management'),
('Media Library', 'Upload and manage media files', 'media_library'),
('Playlist Creation', 'Create and manage playlists', 'playlist_creation'),
('Real-time Updates', 'Real-time screen status and updates', 'realtime_updates'),
('Advanced Analytics', 'Detailed analytics and reporting', 'advanced_analytics'),
('Custom Branding', 'Custom branding and white-label options', 'custom_branding'),
('API Access', 'Access to REST API', 'api_access'),
('Priority Support', '24/7 priority customer support', 'priority_support');

-- Insert default subscription plans
INSERT INTO plans (name, description, price, billing_cycle, max_screens, max_storage_gb, max_playlists) VALUES
('Free', 'Perfect for testing and small projects', 0.00, 'monthly', 1, 1, 3),
('Starter', 'Great for small businesses', 29.99, 'monthly', 5, 10, 15),
('Professional', 'Perfect for growing businesses', 79.99, 'monthly', 20, 50, 50),
('Enterprise', 'For large organizations', 199.99, 'monthly', 100, 200, 200);

-- Get plan IDs for feature assignments
DO $$
DECLARE
    free_plan_id UUID;
    starter_plan_id UUID;
    pro_plan_id UUID;
    enterprise_plan_id UUID;
    screen_mgmt_id UUID;
    media_lib_id UUID;
    playlist_id UUID;
    realtime_id UUID;
    analytics_id UUID;
    branding_id UUID;
    api_id UUID;
    support_id UUID;
BEGIN
    -- Get plan IDs
    SELECT id INTO free_plan_id FROM plans WHERE name = 'Free';
    SELECT id INTO starter_plan_id FROM plans WHERE name = 'Starter';
    SELECT id INTO pro_plan_id FROM plans WHERE name = 'Professional';
    SELECT id INTO enterprise_plan_id FROM plans WHERE name = 'Enterprise';
    
    -- Get feature IDs
    SELECT id INTO screen_mgmt_id FROM plan_features WHERE feature_key = 'screen_management';
    SELECT id INTO media_lib_id FROM plan_features WHERE feature_key = 'media_library';
    SELECT id INTO playlist_id FROM plan_features WHERE feature_key = 'playlist_creation';
    SELECT id INTO realtime_id FROM plan_features WHERE feature_key = 'realtime_updates';
    SELECT id INTO analytics_id FROM plan_features WHERE feature_key = 'advanced_analytics';
    SELECT id INTO branding_id FROM plan_features WHERE feature_key = 'custom_branding';
    SELECT id INTO api_id FROM plan_features WHERE feature_key = 'api_access';
    SELECT id INTO support_id FROM plan_features WHERE feature_key = 'priority_support';
    
    -- Free plan features
    INSERT INTO plan_feature_assignments (plan_id, feature_id, is_enabled, limit_value) VALUES
    (free_plan_id, screen_mgmt_id, true, 1),
    (free_plan_id, media_lib_id, true, 10),
    (free_plan_id, playlist_id, true, 3);
    
    -- Starter plan features
    INSERT INTO plan_feature_assignments (plan_id, feature_id, is_enabled, limit_value) VALUES
    (starter_plan_id, screen_mgmt_id, true, 5),
    (starter_plan_id, media_lib_id, true, 100),
    (starter_plan_id, playlist_id, true, 15),
    (starter_plan_id, realtime_id, true, null);
    
    -- Professional plan features
    INSERT INTO plan_feature_assignments (plan_id, feature_id, is_enabled, limit_value) VALUES
    (pro_plan_id, screen_mgmt_id, true, 20),
    (pro_plan_id, media_lib_id, true, 500),
    (pro_plan_id, playlist_id, true, 50),
    (pro_plan_id, realtime_id, true, null),
    (pro_plan_id, analytics_id, true, null),
    (pro_plan_id, api_id, true, null);
    
    -- Enterprise plan features
    INSERT INTO plan_feature_assignments (plan_id, feature_id, is_enabled, limit_value) VALUES
    (enterprise_plan_id, screen_mgmt_id, true, 100),
    (enterprise_plan_id, media_lib_id, true, 2000),
    (enterprise_plan_id, playlist_id, true, 200),
    (enterprise_plan_id, realtime_id, true, null),
    (enterprise_plan_id, analytics_id, true, null),
    (enterprise_plan_id, branding_id, true, null),
    (enterprise_plan_id, api_id, true, null),
    (enterprise_plan_id, support_id, true, null);
END $$;

-- Create default admin user (password: admin123)
DO $$
DECLARE
    free_plan_id UUID;
BEGIN
    SELECT id INTO free_plan_id FROM plans WHERE name = 'Free';
    
    INSERT INTO users (
        email, 
        password_hash, 
        first_name, 
        last_name, 
        role, 
        is_email_verified, 
        plan_id,
        business_name
    ) VALUES (
        'admin@digitalsignage.com',
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PJ/...',
        'Super',
        'Admin',
        'admin',
        true,
        free_plan_id,
        'Digital Signage Platform'
    );
END $$;
