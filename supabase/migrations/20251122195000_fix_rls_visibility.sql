-- Drop existing restrictive policies if any (or just create a new permissive one)
-- We want: A user can SELECT * from conversation_participants IF they are also a participant in that conversation.

create policy "Participants can view other participants"
  on public.conversation_participants
  for select
  using (
    conversation_id in (
      select conversation_id from public.conversation_participants
      where user_id = auth.uid()
    )
  );

-- Also ensure messages are visible to all participants (likely already done, but good to be safe)
create policy "Participants can view messages"
  on public.messages
  for select
  using (
    conversation_id in (
      select conversation_id from public.conversation_participants
      where user_id = auth.uid()
    )
  );
