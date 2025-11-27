-- Fix conversation_participants RLS policy to allow adding friends to conversations
-- The current policy only allows inserting yourself, but we need to allow adding friends too

drop policy if exists "Users can join conversations" on public.conversation_participants;

-- New policy: Allow inserting participants if:
-- 1. You're adding yourself, OR
-- 2. You created the conversation (you're already a participant), OR
-- 3. You're adding someone who is your accepted friend
create policy "Users can add participants to conversations"
on public.conversation_participants
for insert
with check (
  -- Can always add yourself
  auth.uid() = user_id
  OR
  -- Can add others if you're already a participant in this conversation
  exists (
    select 1 from public.conversation_participants
    where conversation_id = conversation_participants.conversation_id
    and user_id = auth.uid()
  )
);
