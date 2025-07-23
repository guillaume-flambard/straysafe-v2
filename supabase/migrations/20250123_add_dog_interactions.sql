-- Migration: Add dog interactions (interests and comments)
-- Created: 2025-01-23

-- Dog Interest/Favorites system
CREATE TABLE user_dog_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE,
  interest_type TEXT NOT NULL CHECK (interest_type IN ('adoption', 'foster', 'sponsor', 'favorite')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, dog_id, interest_type)
);

-- Public comments on dog profiles
CREATE TABLE dog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_dog_interests_dog_id ON user_dog_interests(dog_id);
CREATE INDEX idx_user_dog_interests_user_id ON user_dog_interests(user_id);
CREATE INDEX idx_dog_comments_dog_id ON dog_comments(dog_id);
CREATE INDEX idx_dog_comments_created_at ON dog_comments(created_at DESC);

-- RLS policies for user_dog_interests
ALTER TABLE user_dog_interests ENABLE ROW LEVEL SECURITY;

-- Users can view all interests (for showing interest counts)
CREATE POLICY "Anyone can view interests" ON user_dog_interests
  FOR SELECT USING (true);

-- Users can insert their own interests
CREATE POLICY "Users can insert their own interests" ON user_dog_interests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own interests
CREATE POLICY "Users can update their own interests" ON user_dog_interests
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own interests
CREATE POLICY "Users can delete their own interests" ON user_dog_interests
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for dog_comments
ALTER TABLE dog_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view public comments
CREATE POLICY "Anyone can view public comments" ON dog_comments
  FOR SELECT USING (is_public = true);

-- Users can view their own comments (even if private)
CREATE POLICY "Users can view their own comments" ON dog_comments
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert comments
CREATE POLICY "Users can insert comments" ON dog_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments" ON dog_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments" ON dog_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can manage all comments
CREATE POLICY "Admins can manage all comments" ON dog_comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_dog_interests_updated_at 
  BEFORE UPDATE ON user_dog_interests 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dog_comments_updated_at 
  BEFORE UPDATE ON dog_comments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();