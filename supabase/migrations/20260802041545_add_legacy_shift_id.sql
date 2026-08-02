alter table public.shifts
  add column legacy_id text;

alter table public.shifts
  add constraint shifts_user_id_legacy_id_key unique (user_id, legacy_id);
