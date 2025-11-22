create table if not exists public.conversation_keys (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  secret_key text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (conversation_id)
);

alter table public.conversation_keys enable row level security;

create policy "Participants can view keys"
  on public.conversation_keys
  for select
  using (
    auth.uid() in (
      select user_id from public.conversation_participants
      where conversation_id = public.conversation_keys.conversation_id
    )
  );

create policy "Participants can insert keys"
  on public.conversation_keys
  for insert
  with check (
    auth.uid() in (
      select user_id from public.conversation_participants
      where conversation_id = public.conversation_keys.conversation_id
    )
  );
