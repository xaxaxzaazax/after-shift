-- Remove workplace filtering from battles
-- Any shift added while in a battle should count, regardless of workplace

-- Update battles table to remove workplace_name requirement
alter table public.battles drop column if exists workplace_name;

-- Drop the workplace stamp trigger and function since we don't need it
drop trigger if exists shifts_stamp_workplace on public.shifts;
drop function if exists public.stamp_shift_workplace();

-- Drop workplace constraint on shifts
alter table public.shifts drop constraint if exists shifts_workplace_name_length_check;

-- Update start_battle function to not require workplace
create or replace function public.start_battle(
  p_nickname text,
  p_end_date date default null
)
returns table (battle_id uuid, battle_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_battle_id uuid;
  v_code text;
begin
  if auth.uid() is null then raise exception 'You must be signed in'; end if;
  if char_length(btrim(p_nickname)) not between 1 and 30 then raise exception 'Nickname must be 1 to 30 characters'; end if;
  if p_end_date is not null and p_end_date < current_date then raise exception 'Battle end date cannot be in the past'; end if;

  loop
    v_code := lpad((floor(random() * 900000) + 100000)::text, 6, '0');
    begin
      insert into public.battles (code, end_date, created_by)
      values (v_code, p_end_date, auth.uid())
      returning id into v_battle_id;
      exit;
    exception when unique_violation then
    end;
  end loop;

  insert into public.battle_members (battle_id, user_id, nickname)
  values (v_battle_id, auth.uid(), btrim(p_nickname));
  return query select v_battle_id, v_code;
end;
$$;

revoke all on function public.start_battle(text, date) from public;
grant execute on function public.start_battle(text, date) to authenticated;
