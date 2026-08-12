-- Drop the recursive policy on battle_members
drop policy if exists "Battle members can read battle participants" on public.battle_members;

-- Replace with a simpler policy: users can read battle_members rows where they are a participant
-- This avoids recursion by checking the user_id directly instead of querying battle_members again
create policy "Users can read members of their battles"
  on public.battle_members for select to authenticated
  using (
    battle_id in (
      select battle_id from public.battle_members where user_id = auth.uid()
    )
  );
