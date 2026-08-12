-- Fix ambiguous battle_id in join_battle function
create or replace function public.join_battle(p_code text, p_nickname text)
returns table (battle_id uuid, battle_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_battle public.battles%rowtype;
begin
  if auth.uid() is null then raise exception 'You must be signed in'; end if;
  if char_length(btrim(p_nickname)) not between 1 and 30 then raise exception 'Nickname must be 1 to 30 characters'; end if;
  select * into v_battle from public.battles where code = btrim(p_code) for update;
  if not found then raise exception 'Battle code not found'; end if;
  if v_battle.status <> 'waiting' then raise exception 'This battle is no longer accepting players'; end if;
  if v_battle.end_date is not null and v_battle.end_date < current_date then raise exception 'This battle has ended'; end if;
  if exists (select 1 from public.battle_members bm where bm.battle_id = v_battle.id and bm.user_id = auth.uid()) then
    return query select v_battle.id, v_battle.code;
    return;
  end if;
  if (select count(*) from public.battle_members bm where bm.battle_id = v_battle.id) >= 2 then raise exception 'This battle is full'; end if;

  insert into public.battle_members (battle_id, user_id, nickname)
  values (v_battle.id, auth.uid(), btrim(p_nickname));
  update public.battles set status = 'active' where id = v_battle.id;
  return query select v_battle.id, v_battle.code;
exception when unique_violation then
  raise exception 'That nickname is already being used in this battle';
end;
$$;
