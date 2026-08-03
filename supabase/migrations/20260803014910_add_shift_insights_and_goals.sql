alter table public.shifts
  add column hours_worked numeric(5, 2),
  add column notes text,
  add constraint shifts_hours_worked_check check (hours_worked is null or (hours_worked > 0 and hours_worked <= 24)),
  add constraint shifts_notes_length_check check (notes is null or char_length(notes) <= 500);

create table public.user_goals (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  weekly_take_home numeric(12, 2) check (weekly_take_home is null or weekly_take_home > 0),
  monthly_take_home numeric(12, 2) check (monthly_take_home is null or monthly_take_home > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_goals enable row level security;

create policy "Users can read their own goals"
  on public.user_goals for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own goals"
  on public.user_goals for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own goals"
  on public.user_goals for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own goals"
  on public.user_goals for delete to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.delete_my_app_data()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.user_goals where user_id = (select auth.uid());
  delete from public.shifts where user_id = (select auth.uid());
end;
$$;

grant execute on function public.delete_my_app_data() to authenticated;
