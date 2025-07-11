-- Add Google Slides support columns to media table
ALTER TABLE media 
ADD COLUMN IF NOT EXISTS google_slides_url TEXT,
ADD COLUMN IF NOT EXISTS embed_url TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_media_google_slides_url ON media(google_slides_url);
CREATE INDEX IF NOT EXISTS idx_media_embed_url ON media(embed_url);

-- Update existing records to ensure consistency
UPDATE media SET google_slides_url = NULL WHERE google_slides_url = '';
UPDATE media SET embed_url = NULL WHERE embed_url = '';
