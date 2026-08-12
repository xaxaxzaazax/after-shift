alter table public.shifts
  add column workplace_name text;

update public.shifts s
set workplace_name = p.workplace_name
from public.user_profiles p
where p.user_id = s.user_id
  and s.workplace_name is null;

create or replace function public.stamp_shift_workplace()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.workplace_name is null or btrim(new.workplace_name) = '' then
    select workplace_name into new.workplace_name
    from public.user_profiles
    where user_id = new.user_id;
  end if;
  return new;
end;
$$;

create trigger shifts_stamp_workplace
before insert on public.shifts
for each row execute function public.stamp_shift_workplace();

alter table public.shifts
  add constraint shifts_workplace_name_length_check
  check (workplace_name is null or char_length(workplace_name) between 1 and 80);

create table public.battles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[0-9]{6}$'),
  workplace_name text not null check (char_length(workplace_name) between 1 and 80),
  status text not null default 'waiting' check (status in ('waiting', 'active', 'completed')),
  end_date date,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.battle_members (
  battle_id uuid not null references public.battles(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 30),
  joined_at timestamptz not null default now(),
  primary key (battle_id, user_id),
  unique (battle_id, nickname)
);

create index battles_created_by_idx on public.battles (created_by, created_at desc);
create index battle_members_user_id_idx on public.battle_members (user_id, joined_at desc);

alter table public.battles enable row level security;
alter table public.battle_members enable row level security;

create policy "Battle members can read their battles"
  on public.battles for select to authenticated
  using (exists (
    select 1 from public.battle_members m
    where m.battle_id = battles.id and m.user_id = (select auth.uid())
  ));

create policy "Battle members can read battle participants"
  on public.battle_members for select to authenticated
  using (exists (
    select 1 from public.battle_members own
    where own.battle_id = battle_members.battle_id and own.user_id = (select auth.uid())
  ));

create policy "Users can read shifts shared in their battles"
  on public.shifts for select to authenticated
  using (exists (
    select 1
    from public.battle_members viewer
    join public.battles b on b.id = viewer.battle_id
    join public.battle_members subject on subject.battle_id = b.id
    where viewer.user_id = (select auth.uid())
      and subject.user_id = shifts.user_id
      and shifts.workplace_name = b.workplace_name
      and shifts.created_at >= subject.joined_at
  ));

create or replace function public.start_battle(
  p_nickname text,
  p_workplace_name text,
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
  if char_length(btrim(p_workplace_name)) not between 1 and 80 then raise exception 'Choose a workplace before starting a battle'; end if;
  if p_end_date is not null and p_end_date < current_date then raise exception 'Battle end date cannot be in the past'; end if;

  loop
    v_code := lpad((floor(random() * 900000) + 100000)::text, 6, '0');
    begin
      insert into public.battles (code, workplace_name, end_date, created_by)
      values (v_code, btrim(p_workplace_name), p_end_date, auth.uid())
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
  if exists (select 1 from public.battle_members where battle_id = v_battle.id and user_id = auth.uid()) then
    return query select v_battle.id, v_battle.code;
    return;
  end if;
  if (select count(*) from public.battle_members where battle_id = v_battle.id) >= 2 then raise exception 'This battle is full'; end if;

  insert into public.battle_members (battle_id, user_id, nickname)
  values (v_battle.id, auth.uid(), btrim(p_nickname));
  update public.battles set status = 'active' where id = v_battle.id;
  return query select v_battle.id, v_battle.code;
exception when unique_violation then
  raise exception 'That nickname is already being used in this battle';
end;
$$;

create or replace function public.complete_battle(p_battle_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.battles
    where id = p_battle_id and created_by = auth.uid()
  ) then raise exception 'Only the battle creator can end this battle'; end if;
  update public.battles
  set status = 'completed', completed_at = now()
  where id = p_battle_id and status <> 'completed';
end;
$$;

revoke all on function public.start_battle(text, text, date) from public;
revoke all on function public.join_battle(text, text) from public;
revoke all on function public.complete_battle(uuid) from public;
grant execute on function public.start_battle(text, text, date) to authenticated;
grant execute on function public.join_battle(text, text) to authenticated;
grant execute on function public.complete_battle(uuid) to authenticated;

alter publication supabase_realtime add table public.battles;
alter publication supabase_realtime add table public.battle_members;
alter publication supabase_realtime add table public.shifts;
