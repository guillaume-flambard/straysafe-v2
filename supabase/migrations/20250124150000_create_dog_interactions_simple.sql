-- Simple Dog Interactions System
-- Created: 2025-01-24 15:00:00

-- Drop existing tables if they exist (start fresh)
DROP TABLE IF EXISTS dog_interests CASCADE;
DROP TABLE IF EXISTS dog_comments CASCADE; 
DROP TABLE IF EXISTS dog_following CASCADE;

-- Dog Interests Table
CREATE TABLE dog_interests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dog_id UUID NOT NULL,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('adoption', 'fostering', 'sponsoring', 'volunteering')),
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(dog_id, user_id, type)
);

-- Dog Comments Table
CREATE TABLE dog_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dog_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES dog_comments(id) ON DELETE CASCADE,
  is_moderated BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Dog Following Table
CREATE TABLE dog_following (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dog_id UUID NOT NULL,
  user_id UUID NOT NULL,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(dog_id, user_id)
);

-- Basic indexes
CREATE INDEX idx_dog_interests_dog_id ON dog_interests(dog_id);
CREATE INDEX idx_dog_interests_user_id ON dog_interests(user_id);
CREATE INDEX idx_dog_comments_dog_id ON dog_comments(dog_id);
CREATE INDEX idx_dog_comments_user_id ON dog_comments(user_id);
CREATE INDEX idx_dog_following_dog_id ON dog_following(dog_id);
CREATE INDEX idx_dog_following_user_id ON dog_following(user_id);

-- Enable RLS
ALTER TABLE dog_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE dog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dog_following ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies
CREATE POLICY "Anyone can view dog interests" ON dog_interests FOR SELECT USING (true);
CREATE POLICY "Users can manage their own interests" ON dog_interests FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view dog comments" ON dog_comments FOR SELECT USING (is_deleted = false);
CREATE POLICY "Users can manage their own comments" ON dog_comments FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own following" ON dog_following FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own following" ON dog_following FOR ALL USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON dog_interests TO authenticated;
GRANT ALL ON dog_comments TO authenticated;
GRANT ALL ON dog_following TO authenticated;