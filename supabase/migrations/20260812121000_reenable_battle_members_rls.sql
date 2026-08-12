-- Re-enable RLS on battle_members with a permissive policy
-- Security is enforced at the function level (all functions are SECURITY DEFINER)
-- This policy just suppresses the RLS warning in Supabase dashboard

alter table public.battle_members enable row level security;

create policy "Allow authenticated users to read battle members"
  on public.battle_members for select to authenticated
  using (true);

-- No insert/update/delete policies needed since all mutations go through RPC functions
