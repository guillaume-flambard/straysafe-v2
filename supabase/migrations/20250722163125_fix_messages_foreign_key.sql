-- Remove sender_id foreign key constraint from messages table for development
-- This allows test users to send messages without being in auth.users

-- Drop the foreign key constraint to auth.users for sender_id
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS fk_messages_sender;

-- Keep the constraint to conversations table (this one is needed)
-- The conversation_id foreign key should remain intact

-- Note: In production, you'd want proper auth.users entries for all message senders