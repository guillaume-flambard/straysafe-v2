-- Create dog favorites system
-- Created: 2025-01-25 21:00:00

-- Dog favorites table
CREATE TABLE IF NOT EXISTS dog_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Ensure a user can only favorite a dog once
  UNIQUE(user_id, dog_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dog_favorites_user_id ON dog_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_dog_favorites_dog_id ON dog_favorites(dog_id);
CREATE INDEX IF NOT EXISTS idx_dog_favorites_created_at ON dog_favorites(created_at DESC);

-- Enable RLS
ALTER TABLE dog_favorites ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Users can view their own favorites" ON dog_favorites;
DROP POLICY IF EXISTS "Users can manage their own favorites" ON dog_favorites;

CREATE POLICY "Users can view their own favorites" ON dog_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites" ON dog_favorites
  FOR ALL USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON dog_favorites TO authenticated;

-- View: Favorites with dog details
CREATE OR REPLACE VIEW favorites_with_dogs AS
SELECT 
  f.*,
  d.name,
  d.status,
  d.gender,
  d.breed,
  d.age,
  d.description,
  d.main_image,
  d.location_id,
  -- Get interaction stats
  COALESCE(stats.total_interests, 0) as total_interests,
  COALESCE(stats.comment_count, 0) as comment_count,
  COALESCE(stats.following_count, 0) as following_count
FROM dog_favorites f
JOIN dogs d ON f.dog_id = d.id
LEFT JOIN dog_interaction_stats stats ON d.id = stats.dog_id
ORDER BY f.created_at DESC;

-- Grant permissions to the view
GRANT SELECT ON favorites_with_dogs TO authenticated;