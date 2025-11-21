-- Update get_conversation_participants function to include display_name
CREATE OR REPLACE FUNCTION public.get_conversation_participants(conversation_uuid uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  display_name text,
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
    p.display_name,
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
