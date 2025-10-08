-- Add missing RLS policies for full functionality

-- Allow users to read messages in their conversations
CREATE POLICY "Read messages in own conversations"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = messages.conversation_id
    AND conversation_participants.user_id = auth.uid()
  )
);

-- Allow users to create conversations
CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (true);

-- Allow users to join conversations (add themselves as participants)
CREATE POLICY "Users can join conversations"
ON public.conversation_participants
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow AI to insert messages (for the edge function)
CREATE POLICY "Service role can insert AI messages"
ON public.messages
FOR INSERT
WITH CHECK (is_ai_mediator = true);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;