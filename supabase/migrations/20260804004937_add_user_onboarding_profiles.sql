create table public.user_profiles (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  workplace_name text check (workplace_name is null or char_length(workplace_name) between 1 and 80),
  role text check (role is null or role in ('server', 'bartender', 'host', 'busser', 'food_runner', 'other')),
  tip_setup text check (tip_setup is null or tip_setup in ('individual', 'tip_out', 'pool', 'varies')),
  onboarding_completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

create policy "Users can read their own profile"
  on public.user_profiles for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own profile"
  on public.user_profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own profile"
  on public.user_profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own profile"
  on public.user_profiles for delete to authenticated
  using ((select auth.uid()) = user_id);
