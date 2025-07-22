-- Add proper security policies for conversation_participants without recursion
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "conversation_participants_simple_policy" ON conversation_participants;

-- Create secure, non-recursive policies
-- Users can only access their own participation records
CREATE POLICY "Users can manage own participation" ON conversation_participants
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Allow conversation creators to add participants when creating conversations
-- This policy allows INSERT operations for any authenticated user (will be controlled at app level)
CREATE POLICY "Allow conversation creation" ON conversation_participants
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);