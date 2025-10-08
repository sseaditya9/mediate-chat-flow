-- Fix RLS policies for conversations table
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;

-- Allow authenticated users to insert conversations
CREATE POLICY "Users can create conversations"
ON conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix conversation_participants policies
DROP POLICY IF EXISTS "Users can join conversations" ON conversation_participants;

CREATE POLICY "Users can join conversations"
ON conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);