-- Add title column to conversations
ALTER TABLE public.conversations 
ADD COLUMN title TEXT DEFAULT 'Untitled Conversation';

-- Allow users to update conversation titles
CREATE POLICY "Users can update their own conversations"
ON public.conversations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_participants.conversation_id = conversations.id
    AND conversation_participants.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_participants.conversation_id = conversations.id
    AND conversation_participants.user_id = auth.uid()
  )
);

-- Allow users to delete conversations they're part of
CREATE POLICY "Users can delete their own conversations"
ON public.conversations
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_participants.conversation_id = conversations.id
    AND conversation_participants.user_id = auth.uid()
  )
);

-- Allow users to delete their participation
CREATE POLICY "Users can leave conversations"
ON public.conversation_participants
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create a view to get conversation participants with profile info
CREATE OR REPLACE VIEW public.conversation_participants_view AS
SELECT 
  cp.conversation_id,
  cp.user_id,
  p.full_name,
  p.avatar_url,
  au.email
FROM public.conversation_participants cp
LEFT JOIN public.profiles p ON p.id = cp.user_id
LEFT JOIN auth.users au ON au.id = cp.user_id;

-- Grant access to the view
GRANT SELECT ON public.conversation_participants_view TO authenticated;