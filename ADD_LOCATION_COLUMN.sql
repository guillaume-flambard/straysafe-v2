-- Run this SQL command in your Supabase database to add the location column:

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;

-- Optional: Create index for better performance on location searches
CREATE INDEX IF NOT EXISTS idx_profiles_location_text ON profiles(location);