-- Remove NOT NULL constraints from legacy participant columns in conversations table
-- These columns are legacy and not used in the new conversation_participants system

ALTER TABLE conversations 
ALTER COLUMN participant_1_id DROP NOT NULL;

ALTER TABLE conversations 
ALTER COLUMN participant_2_id DROP NOT NULL;

-- Also make last_message_id nullable since it's not always set
ALTER TABLE conversations 
ALTER COLUMN last_message_id DROP NOT NULL;