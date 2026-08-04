alter table public.user_profiles
  add column onboarding_version integer not null default 1,
  add constraint user_profiles_onboarding_version_check check (onboarding_version between 1 and 100);
