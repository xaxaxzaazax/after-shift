-- Remove workplace_name from get_battle_shifts function

drop function if exists public.get_battle_shifts(uuid[]);

create or replace function public.get_battle_shifts(p_battle_ids uuid[])
returns table (
  id uuid,
  user_id uuid,
  shift_date date,
  sales numeric,
  tips numeric,
  tip_out numeric,
  hours_worked numeric,
  base_hourly_rate numeric,
  notes text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Verify the caller is a member of at least one of the requested battles
  if not exists (
    select 1 from public.battle_members bm
    where bm.user_id = auth.uid() and bm.battle_id = any(p_battle_ids)
  ) then
    raise exception 'You are not a member of these battles';
  end if;

  -- Return shifts for all members of the requested battles
  return query
  select
    s.id,
    s.user_id,
    s.shift_date,
    s.sales,
    s.tips,
    s.tip_out,
    s.hours_worked,
    s.base_hourly_rate,
    s.notes,
    s.created_at
  from public.shifts s
  where s.user_id in (
    select m.user_id
    from public.battle_members m
    where m.battle_id = any(p_battle_ids)
  )
  order by s.shift_date desc, s.created_at desc;
end;
$$;

revoke all on function public.get_battle_shifts(uuid[]) from public;
grant execute on function public.get_battle_shifts(uuid[]) to authenticated;
