-- Remove foreign key constraints from conversation_participants for development testing
-- This allows test users to participate in conversations without being in auth.users

-- Drop the foreign key constraint to auth.users
ALTER TABLE conversation_participants DROP CONSTRAINT IF EXISTS conversation_participants_user_id_fkey;

-- Keep the constraint to conversations table (this one is fine)
-- ALTER TABLE conversation_participants ADD CONSTRAINT conversation_participants_conversation_id_fkey 
--     FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

-- Note: In production, you'd want proper auth.users entries for all participants