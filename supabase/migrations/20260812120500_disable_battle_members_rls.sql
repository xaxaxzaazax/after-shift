-- Drop all policies on battle_members
drop policy if exists "Users can see participants in their battles" on public.battle_members;
drop policy if exists "Users can read members of their battles" on public.battle_members;
drop policy if exists "Battle members can read battle participants" on public.battle_members;

-- Disable RLS on battle_members since we'll control access via the RPC functions
alter table public.battle_members disable row level security;

-- The security definer functions already validate battle membership,
-- so direct table access is not needed by the client
