create or replace function public.delete_battle(p_battle_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_count int;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in';
  end if;

  -- Check if the user is a member of this battle
  if not exists (
    select 1 from public.battle_members
    where battle_id = p_battle_id and user_id = auth.uid()
  ) then
    raise exception 'You are not a member of this battle';
  end if;

  -- Count remaining members
  select count(*) into v_member_count
  from public.battle_members
  where battle_id = p_battle_id;

  -- Allow deletion if:
  -- 1. User is the creator, OR
  -- 2. User is the only remaining member (opponent left)
  if exists (
    select 1 from public.battles
    where id = p_battle_id and created_by = auth.uid()
  ) or v_member_count = 1 then
    delete from public.battles where id = p_battle_id;
  else
    raise exception 'Only the battle creator can delete this battle';
  end if;
end;
$$;

revoke all on function public.delete_battle(uuid) from public;
grant execute on function public.delete_battle(uuid) to authenticated;
