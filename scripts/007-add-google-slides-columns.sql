-- Add Google Slides support to media table
ALTER TABLE media 
ADD COLUMN IF NOT EXISTS google_slides_url TEXT,
ADD COLUMN IF NOT EXISTS embed_url TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_media_google_slides_url ON media(google_slides_url);
CREATE INDEX IF NOT EXISTS idx_media_embed_url ON media(embed_url);

-- Update existing Google Slides entries if any
UPDATE media 
SET google_slides_url = blob_url, 
    embed_url = blob_url 
WHERE file_type = 'google-slides' 
  AND google_slides_url IS NULL;
