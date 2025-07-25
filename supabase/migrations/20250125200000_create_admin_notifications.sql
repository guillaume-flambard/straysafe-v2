-- Create admin notifications system
-- Created: 2025-01-25 20:00:00

-- Admin notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('new_interest', 'interest_update', 'adoption_inquiry')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  interest_id UUID REFERENCES dog_interests(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_dog_id ON admin_notifications(dog_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_user_id ON admin_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);

-- Enable RLS
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies (only admins and volunteers can see admin notifications)
DROP POLICY IF EXISTS "Admins can view admin notifications" ON admin_notifications;
DROP POLICY IF EXISTS "Admins can update admin notifications" ON admin_notifications;

CREATE POLICY "Admins can view admin notifications" ON admin_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'volunteer')
    )
  );

CREATE POLICY "Admins can update admin notifications" ON admin_notifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'volunteer')
    )
  );

-- Function to create admin notifications when new interests are submitted
CREATE OR REPLACE FUNCTION notify_admins_of_interest()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notifications for new interests (not updates)
  IF TG_OP = 'INSERT' THEN
    INSERT INTO admin_notifications (type, title, message, dog_id, user_id, interest_id)
    SELECT 
      'new_interest',
      'New ' || NEW.type || ' interest',
      p.full_name || ' is interested in ' || NEW.type || ' for ' || d.name,
      NEW.dog_id,
      NEW.user_id,
      NEW.id
    FROM profiles p
    JOIN dogs d ON d.id = NEW.dog_id
    WHERE p.id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create admin notifications when interest status changes
CREATE OR REPLACE FUNCTION notify_admins_of_interest_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notifications when status changes
  IF OLD.status != NEW.status THEN
    INSERT INTO admin_notifications (type, title, message, dog_id, user_id, interest_id)
    SELECT 
      'interest_update',
      'Interest status updated',
      p.full_name || '''s ' || NEW.type || ' interest for ' || d.name || ' changed to ' || NEW.status,
      NEW.dog_id,
      NEW.user_id,
      NEW.id
    FROM profiles p
    JOIN dogs d ON d.id = NEW.dog_id
    WHERE p.id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'notify_admins_new_interest') THEN
        CREATE TRIGGER notify_admins_new_interest
          AFTER INSERT ON dog_interests
          FOR EACH ROW EXECUTE FUNCTION notify_admins_of_interest();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'notify_admins_interest_update') THEN
        CREATE TRIGGER notify_admins_interest_update
          AFTER UPDATE ON dog_interests
          FOR EACH ROW EXECUTE FUNCTION notify_admins_of_interest_update();
    END IF;
END $$;

-- Grant permissions
GRANT ALL ON admin_notifications TO authenticated;