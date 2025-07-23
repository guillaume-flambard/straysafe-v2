-- Add location column to profiles table for user addresses
ALTER TABLE profiles ADD COLUMN location TEXT;

-- Create index for location searches
CREATE INDEX idx_profiles_location_text ON profiles(location);

-- Update existing profiles to have null location (optional)
-- Users can fill this in via the settings screen