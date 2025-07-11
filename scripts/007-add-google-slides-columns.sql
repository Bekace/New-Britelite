-- Add columns for Google Slides support
ALTER TABLE media 
ADD COLUMN IF NOT EXISTS google_slides_url TEXT,
ADD COLUMN IF NOT EXISTS embed_url TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_media_file_type ON media(file_type);
CREATE INDEX IF NOT EXISTS idx_media_user_file_type ON media(user_id, file_type);
