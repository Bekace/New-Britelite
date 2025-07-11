-- Add folders table for organizing media files
CREATE TABLE IF NOT EXISTS folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add folder_id column to media table
ALTER TABLE media ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_media_folder_id ON media(folder_id);

-- Insert default "Uncategorized" folder for existing users
INSERT INTO folders (user_id, name, description)
SELECT DISTINCT user_id, 'Uncategorized', 'Default folder for uncategorized files'
FROM media
WHERE NOT EXISTS (
    SELECT 1 FROM folders 
    WHERE folders.user_id = media.user_id 
    AND folders.name = 'Uncategorized'
);
