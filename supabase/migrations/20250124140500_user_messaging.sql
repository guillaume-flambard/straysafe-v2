-- User Messaging System
-- Created: 2025-01-24 14:05:00

-- Conversations Table (stores conversation metadata)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participants UUID[] NOT NULL, -- Array of user IDs
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  
  -- Ensure we have at least 2 participants
  CONSTRAINT valid_participants CHECK (array_length(participants, 1) >= 2)
);

-- Messages Table (stores individual messages)
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  type TEXT CHECK (type IN ('text', 'image', 'dog_reference')) DEFAULT 'text',
  dog_id UUID REFERENCES dogs(id) ON DELETE SET NULL, -- For dog reference messages
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Message Read Status Table (tracks which users have read which messages)
CREATE TABLE IF NOT EXISTS message_read_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  
  -- One read status per user per message
  UNIQUE(message_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations USING GIN (participants);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_dog_id ON messages(dog_id) WHERE dog_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_message_read_status_message_id ON message_read_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_status_user_id ON message_read_status(user_id);

-- Updated at triggers (only create if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_conversations_updated_at') THEN
        CREATE TRIGGER update_conversations_updated_at 
          BEFORE UPDATE ON conversations 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_messages_updated_at') THEN
        CREATE TRIGGER update_messages_updated_at 
          BEFORE UPDATE ON messages 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Function to update conversation metadata when a message is added
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET 
    last_message = NEW.content,
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation when message is added (only create if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_conversation_on_message_trigger') THEN
        CREATE TRIGGER update_conversation_on_message_trigger
          AFTER INSERT ON messages
          FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();
    END IF;
END $$;

-- Row Level Security (RLS) Policies

-- Conversations RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;

-- Users can view conversations they participate in
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT USING (auth.uid() = ANY(participants));

-- Users can create conversations they participate in
CREATE POLICY "Users can create conversations they participate in" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = ANY(participants));

-- Users can update conversations they participate in (mainly for metadata)
CREATE POLICY "Users can update their conversations" ON conversations
  FOR UPDATE USING (auth.uid() = ANY(participants));

-- Messages RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

-- Users can view messages from conversations they participate in
CREATE POLICY "Users can view messages from their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND auth.uid() = ANY(conversations.participants)
    )
  );

-- Users can send messages to conversations they participate in
CREATE POLICY "Users can send messages to their conversations" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND auth.uid() = ANY(conversations.participants)
    )
  );

-- Users can update their own messages (for editing)
CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Message Read Status RLS
ALTER TABLE message_read_status ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can view read status from their conversations" ON message_read_status;
DROP POLICY IF EXISTS "Users can mark messages as read" ON message_read_status;

-- Users can view read status for messages in their conversations
CREATE POLICY "Users can view read status from their conversations" ON message_read_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = message_read_status.message_id
      AND auth.uid() = ANY(c.participants)
    )
  );

-- Users can mark messages as read
CREATE POLICY "Users can mark messages as read" ON message_read_status
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = message_read_status.message_id
      AND auth.uid() = ANY(c.participants)
    )
  );

-- Helper functions

-- Function to get or create conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
BEGIN
  -- Try to find existing conversation
  SELECT id INTO conversation_id
  FROM conversations
  WHERE participants @> ARRAY[user1_id, user2_id]
    AND array_length(participants, 1) = 2;
  
  -- If not found, create new conversation
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (participants)
    VALUES (ARRAY[user1_id, user2_id])
    RETURNING id INTO conversation_id;
  END IF;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper views

-- View: Conversations with participant details and unread counts
CREATE OR REPLACE VIEW conversations_with_details AS
SELECT 
  c.*,
  -- For each user, get details of the OTHER participant (assumes 2-person conversations)
  CASE 
    WHEN c.participants[1] = auth.uid() THEN
      jsonb_build_object(
        'id', p2.id,
        'name', p2.full_name,
        'avatar', p2.avatar_url,
        'role', p2.role
      )
    ELSE 
      jsonb_build_object(
        'id', p1.id,
        'name', p1.full_name,
        'avatar', p1.avatar_url,
        'role', p1.role
      )
  END as other_participant,
  -- Count unread messages for current user
  COALESCE(unread.count, 0) as unread_count
FROM conversations c
LEFT JOIN profiles p1 ON p1.id = c.participants[1]
LEFT JOIN profiles p2 ON p2.id = c.participants[2]
LEFT JOIN (
  SELECT 
    m.conversation_id,
    COUNT(*) as count
  FROM messages m
  WHERE m.sender_id != auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM message_read_status mrs 
      WHERE mrs.message_id = m.id 
      AND mrs.user_id = auth.uid()
    )
  GROUP BY m.conversation_id
) unread ON unread.conversation_id = c.id
WHERE auth.uid() = ANY(c.participants);

-- View: Messages with sender details
CREATE OR REPLACE VIEW messages_with_users AS
SELECT 
  m.*,
  jsonb_build_object(
    'id', p.id,
    'name', p.full_name,
    'avatar', p.avatar_url,
    'role', p.role
  ) as sender
FROM messages m
JOIN profiles p ON m.sender_id = p.id;

-- Grant permissions
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON message_read_status TO authenticated;
GRANT SELECT ON conversations_with_details TO authenticated;
GRANT SELECT ON messages_with_users TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_conversation(UUID, UUID) TO authenticated;