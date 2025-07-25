-- Create moderation system for comments and content
-- Created: 2025-01-25 22:00:00

-- Moderation actions table
CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  moderator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('approve', 'hide', 'delete', 'flag', 'warn_user')),
  target_type TEXT NOT NULL CHECK (target_type IN ('comment', 'dog', 'user', 'interest')),
  target_id UUID NOT NULL,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Content reports table (for user reports)
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('comment', 'dog', 'user', 'interest')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'fake', 'harassment', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- User warnings/suspensions table
CREATE TABLE IF NOT EXISTS user_moderation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  moderator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('warning', 'temporary_ban', 'permanent_ban')),
  reason TEXT NOT NULL,
  notes TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_moderation_actions_moderator_id ON moderation_actions(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_target ON moderation_actions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_created_at ON moderation_actions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_reports_reporter_id ON content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_target ON content_reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_created_at ON content_reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_moderation_user_id ON user_moderation(user_id);
CREATE INDEX IF NOT EXISTS idx_user_moderation_moderator_id ON user_moderation(moderator_id);
CREATE INDEX IF NOT EXISTS idx_user_moderation_active ON user_moderation(is_active);

-- Enable RLS
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_moderation ENABLE ROW LEVEL SECURITY;

-- RLS policies for moderation_actions (only admins/moderators)
DROP POLICY IF EXISTS "Admins can manage moderation actions" ON moderation_actions;
CREATE POLICY "Admins can manage moderation actions" ON moderation_actions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'volunteer')
    )
  );

-- RLS policies for content_reports
DROP POLICY IF EXISTS "Users can create reports" ON content_reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON content_reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON content_reports;

CREATE POLICY "Users can create reports" ON content_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports" ON content_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'volunteer')
    )
  );

CREATE POLICY "Users can view their own reports" ON content_reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can update reports" ON content_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'volunteer')
    )
  );

-- RLS policies for user_moderation (only admins/moderators)
DROP POLICY IF EXISTS "Admins can manage user moderation" ON user_moderation;
DROP POLICY IF EXISTS "Users can view their own moderation history" ON user_moderation;

CREATE POLICY "Admins can manage user moderation" ON user_moderation
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'volunteer')
    )
  );

CREATE POLICY "Users can view their own moderation history" ON user_moderation
  FOR SELECT USING (auth.uid() = user_id);

-- Function to automatically flag comments for review
CREATE OR REPLACE FUNCTION check_comment_for_moderation()
RETURNS TRIGGER AS $$
DECLARE
  flagged_words TEXT[] := ARRAY['spam', 'fake', 'scam', 'abuse']; -- Add more words as needed
  word TEXT;
BEGIN
  -- Check for flagged words in comment content (case insensitive)
  FOREACH word IN ARRAY flagged_words
  LOOP
    IF LOWER(NEW.content) LIKE '%' || word || '%' THEN
      -- Flag for moderation
      NEW.is_moderated := TRUE;
      
      -- Create a content report automatically
      INSERT INTO content_reports (
        reporter_id, 
        target_type, 
        target_id, 
        reason, 
        description,
        status
      ) VALUES (
        NEW.user_id, -- Self-report by system
        'comment',
        NEW.id,
        'inappropriate',
        'Automatically flagged for containing potentially inappropriate content',
        'pending'
      );
      EXIT; -- Exit loop if any flagged word is found
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update comment moderation status
CREATE OR REPLACE FUNCTION update_comment_moderation_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If moderation action is taken on a comment, update the comment
  IF NEW.target_type = 'comment' THEN
    IF NEW.action_type = 'hide' OR NEW.action_type = 'delete' THEN
      UPDATE dog_comments 
      SET is_moderated = TRUE, is_deleted = (NEW.action_type = 'delete')
      WHERE id = NEW.target_id;
    ELSIF NEW.action_type = 'approve' THEN
      UPDATE dog_comments 
      SET is_moderated = FALSE
      WHERE id = NEW.target_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'check_comment_moderation') THEN
        CREATE TRIGGER check_comment_moderation
          BEFORE INSERT ON dog_comments
          FOR EACH ROW EXECUTE FUNCTION check_comment_for_moderation();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_comment_moderation') THEN
        CREATE TRIGGER update_comment_moderation
          AFTER INSERT ON moderation_actions
          FOR EACH ROW EXECUTE FUNCTION update_comment_moderation_status();
    END IF;
END $$;

-- View: Reports with details
CREATE OR REPLACE VIEW reports_with_details AS
SELECT 
  r.*,
  reporter.full_name as reporter_name,
  reviewer.full_name as reviewer_name,
  CASE 
    WHEN r.target_type = 'comment' THEN (
      SELECT jsonb_build_object(
        'content', c.content,
        'user_name', p.full_name,
        'dog_name', d.name
      )
      FROM dog_comments c
      JOIN profiles p ON c.user_id = p.id
      JOIN dogs d ON c.dog_id = d.id
      WHERE c.id = r.target_id::uuid
    )
    WHEN r.target_type = 'dog' THEN (
      SELECT jsonb_build_object(
        'name', d.name,
        'status', d.status,
        'description', d.description
      )
      FROM dogs d
      WHERE d.id = r.target_id::uuid
    )
    ELSE NULL
  END as target_details
FROM content_reports r
LEFT JOIN profiles reporter ON r.reporter_id = reporter.id
LEFT JOIN profiles reviewer ON r.reviewed_by = reviewer.id
ORDER BY r.created_at DESC;

-- Grant permissions
GRANT ALL ON moderation_actions TO authenticated;
GRANT ALL ON content_reports TO authenticated;
GRANT ALL ON user_moderation TO authenticated;
GRANT SELECT ON reports_with_details TO authenticated;