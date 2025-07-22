-- Completely remove all RLS policies from conversation_participants to avoid recursion
-- We'll rely on application-level security for development

-- Disable RLS entirely on conversation_participants
ALTER TABLE conversation_participants DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can join conversations" ON conversation_participants; 
DROP POLICY IF EXISTS "Users can update their participation" ON conversation_participants;
DROP POLICY IF EXISTS "Admins can remove participants" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_simple_policy" ON conversation_participants;
DROP POLICY IF EXISTS "Users can manage own participation" ON conversation_participants;
DROP POLICY IF EXISTS "Allow conversation creation" ON conversation_participants;