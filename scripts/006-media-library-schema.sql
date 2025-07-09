-- Create media folders table
CREATE TABLE IF NOT EXISTS media_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES media_folders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create media assets table
CREATE TABLE IF NOT EXISTS media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    blob_url TEXT NOT NULL,
    thumbnail_url TEXT,
    folder_id UUID REFERENCES media_folders(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_folders_user_id ON media_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_media_folders_parent_id ON media_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_user_id ON media_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_folder_id ON media_assets(folder_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_file_type ON media_assets(file_type);
CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON media_assets(created_at);

-- Add system settings table for configurable file size limits
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default file size limit (3MB)
INSERT INTO system_settings (key, value, description) 
VALUES ('max_file_size_mb', '3', 'Maximum file size in MB for uploads')
ON CONFLICT (key) DO NOTHING;
