-- Add some default features if they don't exist
INSERT INTO plan_features (name, description, feature_key) 
SELECT * FROM (VALUES 
  ('Screen Management', 'Ability to create and manage screens', 'screen_management'),
  ('Media Library', 'Upload and manage media files', 'media_library'),
  ('Playlist Creation', 'Create and manage playlists', 'playlist_creation'),
  ('Real-time Updates', 'Real-time screen status and updates', 'realtime_updates'),
  ('Advanced Analytics', 'Detailed analytics and reporting', 'advanced_analytics'),
  ('Custom Branding', 'Custom branding and white-label options', 'custom_branding'),
  ('API Access', 'Access to REST API', 'api_access'),
  ('Priority Support', '24/7 priority customer support', 'priority_support'),
  ('Team Collaboration', 'Multi-user team collaboration features', 'team_collaboration'),
  ('Scheduled Content', 'Schedule content for specific times', 'scheduled_content'),
  ('Remote Management', 'Remotely manage and control screens', 'remote_management'),
  ('Content Templates', 'Pre-built content templates', 'content_templates')
) AS new_features(name, description, feature_key)
WHERE NOT EXISTS (
  SELECT 1 FROM plan_features WHERE feature_key = new_features.feature_key
);

-- Verify the features were added
SELECT id, name, feature_key, is_active FROM plan_features ORDER BY name;
