-- Remove NOT NULL constraint from recipient_id in messages table
-- The new conversation system uses conversation_id instead of recipient_id

ALTER TABLE messages 
ALTER COLUMN recipient_id DROP NOT NULL;

-- Also ensure dog_id is nullable since not all messages are about dogs
ALTER TABLE messages 
ALTER COLUMN dog_id DROP NOT NULL;