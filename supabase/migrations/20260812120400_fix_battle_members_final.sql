-- Drop the still-recursive policy
drop policy if exists "Users can read members of their battles" on public.battle_members;

-- Use a non-recursive approach: allow users to read any battle_members row
-- where either they are that member OR they created the battle
create policy "Users can read battle participants"
  on public.battle_members for select to authenticated
  using (
    user_id = auth.uid()
    or battle_id in (
      select id from public.battles where created_by = auth.uid()
    )
    or exists (
      select 1 from public.battles b
      where b.id = battle_members.battle_id
        and b.created_by = auth.uid()
    )
  );

-- Actually, the simplest fix: just let users see battle_members if they're in that battle
-- by checking the battles table instead
drop policy if exists "Users can read battle participants" on public.battle_members;

create policy "Users can see participants in their battles"
  on public.battle_members for select to authenticated
  using (
    exists (
      select 1 from public.battles b
      join public.battle_members own on own.battle_id = b.id
      where b.id = battle_members.battle_id
        and own.user_id = auth.uid()
    )
  );
