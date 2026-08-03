alter table public.shifts
  alter column sales drop not null,
  alter column tip_out drop not null;
