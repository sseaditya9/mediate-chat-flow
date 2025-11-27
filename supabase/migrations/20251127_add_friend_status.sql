-- Add status column to friends table
alter table public.friends 
add column if not exists status text not null default 'pending' 
check (status in ('pending', 'accepted', 'rejected'));

-- Update any existing rows to be accepted (backwards compatibility)
update public.friends set status = 'accepted' where status = 'pending';

-- Drop existing RLS policies
drop policy if exists "Users can view their own friends" on public.friends;
drop policy if exists "Users can add friends" on public.friends;
drop policy if exists "Users can remove friends" on public.friends;

-- Create new RLS policies that account for both sent and received requests
create policy "Users can view friends they sent or received"
on public.friends for select
using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Users can send friend requests"
on public.friends for insert
with check (auth.uid() = user_id);

create policy "Users can update friend requests they received"
on public.friends for update
using (auth.uid() = friend_id);

create policy "Users can delete their own friend requests or friendships"
on public.friends for delete
using (auth.uid() = user_id or auth.uid() = friend_id);
