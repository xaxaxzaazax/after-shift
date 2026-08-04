alter table public.user_profiles
  add column hourly_pay_rate numeric(8, 2),
  add constraint user_profiles_hourly_pay_rate_check check (hourly_pay_rate is null or (hourly_pay_rate >= 0 and hourly_pay_rate <= 10000));

alter table public.shifts
  add column base_hourly_rate numeric(8, 2),
  add constraint shifts_base_hourly_rate_check check (base_hourly_rate is null or (base_hourly_rate >= 0 and base_hourly_rate <= 10000));
