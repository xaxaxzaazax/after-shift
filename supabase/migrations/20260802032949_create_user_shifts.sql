create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  shift_date date not null,
  sales numeric(12, 2) not null check (sales >= 0),
  tips numeric(12, 2) not null check (tips >= 0),
  tip_out numeric(12, 2) not null check (tip_out >= 0 and tip_out <= tips),
  created_at timestamptz not null default now()
);

create index shifts_user_id_shift_date_idx
  on public.shifts (user_id, shift_date desc);

alter table public.shifts enable row level security;

create policy "Users can read their own shifts"
  on public.shifts for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own shifts"
  on public.shifts for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own shifts"
  on public.shifts for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own shifts"
  on public.shifts for delete to authenticated
  using ((select auth.uid()) = user_id);
