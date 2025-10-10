-- Drop the insecure view
DROP VIEW IF EXISTS public.conversation_participants_view;

-- Create a secure function to get participant info instead
CREATE OR REPLACE FUNCTION public.get_conversation_participants(conversation_uuid uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  avatar_url text,
  email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    cp.user_id,
    p.full_name,
    p.avatar_url,
    au.email
  FROM public.conversation_participants cp
  LEFT JOIN public.profiles p ON p.id = cp.user_id
  LEFT JOIN auth.users au ON au.id = cp.user_id
  WHERE cp.conversation_id = conversation_uuid
  AND EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = conversation_uuid
    AND user_id = auth.uid()
  );
$$;

-- Allow authenticated users to read profiles of conversation participants
CREATE POLICY "Users can view profiles of conversation participants"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp1
    INNER JOIN public.conversation_participants cp2 
      ON cp1.conversation_id = cp2.conversation_id
    WHERE cp1.user_id = profiles.id
    AND cp2.user_id = auth.uid()
  )
);