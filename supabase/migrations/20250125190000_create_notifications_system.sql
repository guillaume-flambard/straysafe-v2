-- Create notifications system for followed dogs
-- Created: 2025-01-25 19:00:00

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('dog_status_change', 'dog_event', 'dog_comment', 'adoption_update')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES dog_comments(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_dog_id ON notifications(dog_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON notifications TO authenticated;

-- Function to create notifications for dog followers when events happen
CREATE OR REPLACE FUNCTION notify_dog_followers()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notifications for public events
  IF NEW.is_private = false THEN
    INSERT INTO notifications (user_id, type, title, message, dog_id, event_id)
    SELECT 
      df.user_id,
      'dog_event',
      'Update for ' || d.name,
      NEW.title || ': ' || NEW.description,
      NEW.dog_id,
      NEW.id
    FROM dog_following df
    JOIN dogs d ON d.id = NEW.dog_id
    WHERE df.dog_id = NEW.dog_id 
      AND df.notifications_enabled = true
      AND df.user_id != NEW.created_by; -- Don't notify the person who created the event
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notifications when dog status changes
CREATE OR REPLACE FUNCTION notify_dog_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if status actually changed
  IF OLD.status != NEW.status THEN
    INSERT INTO notifications (user_id, type, title, message, dog_id)
    SELECT 
      df.user_id,
      'dog_status_change',
      NEW.name || ' status updated',
      'Status changed from ' || OLD.status || ' to ' || NEW.status,
      NEW.id
    FROM dog_following df
    WHERE df.dog_id = NEW.id 
      AND df.notifications_enabled = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notifications when new comments are added
CREATE OR REPLACE FUNCTION notify_dog_new_comment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, dog_id, comment_id)
  SELECT 
    df.user_id,
    'dog_comment',
    'New comment on ' || d.name,
    'Someone commented: ' || LEFT(NEW.content, 100) || CASE WHEN LENGTH(NEW.content) > 100 THEN '...' ELSE '' END,
    NEW.dog_id,
    NEW.id
  FROM dog_following df
  JOIN dogs d ON d.id = NEW.dog_id
  WHERE df.dog_id = NEW.dog_id 
    AND df.notifications_enabled = true
    AND df.user_id != NEW.user_id; -- Don't notify the person who made the comment
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'notify_followers_on_event') THEN
        CREATE TRIGGER notify_followers_on_event
          AFTER INSERT ON events
          FOR EACH ROW EXECUTE FUNCTION notify_dog_followers();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'notify_followers_on_status_change') THEN
        CREATE TRIGGER notify_followers_on_status_change
          AFTER UPDATE ON dogs
          FOR EACH ROW EXECUTE FUNCTION notify_dog_status_change();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'notify_followers_on_new_comment') THEN
        CREATE TRIGGER notify_followers_on_new_comment
          AFTER INSERT ON dog_comments
          FOR EACH ROW EXECUTE FUNCTION notify_dog_new_comment();
    END IF;
END $$;