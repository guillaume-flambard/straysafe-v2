-- Enable real-time subscriptions for messages table
-- This allows the messaging system to work with live updates

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable realtime for conversations table too
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Enable realtime for conversation_participants table
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;

-- Verify that authenticated users can subscribe to changes
GRANT SELECT ON messages TO authenticated;
GRANT SELECT ON conversations TO authenticated;
GRANT SELECT ON conversation_participants TO authenticated;