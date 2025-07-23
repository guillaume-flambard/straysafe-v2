-- Add privacy-aware RLS policies

-- Function to check if a user's profile should be visible
CREATE OR REPLACE FUNCTION is_profile_visible(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  privacy_settings RECORD;
BEGIN
  -- Get the target user's privacy settings
  SELECT profile_visibility INTO privacy_settings
  FROM user_privacy_settings
  WHERE user_id = target_user_id;
  
  -- If no privacy settings found, default to visible
  IF NOT FOUND THEN
    RETURN TRUE;
  END IF;
  
  -- Return the profile visibility setting
  RETURN privacy_settings.profile_visibility;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user should appear in search
CREATE OR REPLACE FUNCTION is_search_visible(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  privacy_settings RECORD;
BEGIN
  SELECT search_visibility INTO privacy_settings
  FROM user_privacy_settings
  WHERE user_id = target_user_id;
  
  IF NOT FOUND THEN
    RETURN TRUE;
  END IF;
  
  RETURN privacy_settings.search_visibility;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if location sharing is enabled
CREATE OR REPLACE FUNCTION is_location_sharing_enabled(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  privacy_settings RECORD;
BEGIN
  SELECT location_sharing INTO privacy_settings
  FROM user_privacy_settings
  WHERE user_id = target_user_id;
  
  IF NOT FOUND THEN
    RETURN TRUE;
  END IF;
  
  RETURN privacy_settings.location_sharing;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update profiles table RLS to respect privacy settings
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable based on privacy settings" ON profiles;

CREATE POLICY "Profiles are viewable based on privacy settings" ON profiles
  FOR SELECT USING (
    -- Users can always see their own profile
    auth.uid() = id 
    OR 
    -- Others can see profile only if privacy allows
    is_profile_visible(id)
  );

-- Create policy for profiles search with privacy
DROP POLICY IF EXISTS "Profiles appear in search based on privacy settings" ON profiles;
CREATE POLICY "Profiles appear in search based on privacy settings" ON profiles
  FOR SELECT USING (
    auth.uid() = id 
    OR 
    (is_profile_visible(id) AND is_search_visible(id))
  );

-- Add location privacy to profiles (if location data is stored in profiles)
-- This would apply to any location-based queries

-- Add privacy-aware policy for user presence
DROP POLICY IF EXISTS "Users can view presence of others" ON user_presence;
DROP POLICY IF EXISTS "User presence viewable based on privacy settings" ON user_presence;

CREATE POLICY "User presence viewable based on privacy settings" ON user_presence
  FOR SELECT USING (
    auth.uid() = user_id
    OR
    (
      is_profile_visible(user_id) 
      AND 
      EXISTS (
        SELECT 1 FROM user_privacy_settings 
        WHERE user_id = user_presence.user_id 
        AND activity_status = true
      )
    )
  );

-- Ensure privacy settings trigger creates default settings
CREATE OR REPLACE FUNCTION ensure_privacy_settings_exist()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default privacy settings for new user if they don't exist
  INSERT INTO user_privacy_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS ensure_privacy_settings_trigger ON auth.users;
CREATE TRIGGER ensure_privacy_settings_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION ensure_privacy_settings_exist();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_profile_visible(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_search_visible(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_location_sharing_enabled(UUID) TO authenticated;