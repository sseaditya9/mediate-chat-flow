create table if not exists public.friends (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  friend_id uuid not null references auth.users(id),
  created_at timestamptz default now(),
  primary key (id),
  unique (user_id, friend_id)
);

alter table public.friends enable row level security;

create policy "Users can view their own friends"
on public.friends for select
using (auth.uid() = user_id);

create policy "Users can add friends"
on public.friends for insert
with check (auth.uid() = user_id);

create policy "Users can remove friends"
on public.friends for delete
using (auth.uid() = user_id);
