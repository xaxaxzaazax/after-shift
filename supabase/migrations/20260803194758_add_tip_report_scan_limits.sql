create table public.tip_report_scan_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  scan_date date not null default current_date,
  scan_count integer not null default 1 check (scan_count > 0),
  primary key (user_id, scan_date)
);

alter table public.tip_report_scan_usage enable row level security;

create or replace function public.claim_tip_report_scan()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed boolean;
begin
  if (select auth.uid()) is null then
    return false;
  end if;

  insert into public.tip_report_scan_usage (user_id, scan_date, scan_count)
  values ((select auth.uid()), current_date, 1)
  on conflict (user_id, scan_date) do update
    set scan_count = public.tip_report_scan_usage.scan_count + 1
    where public.tip_report_scan_usage.scan_count < 20
  returning true into claimed;

  return coalesce(claimed, false);
end;
$$;

revoke all on function public.claim_tip_report_scan() from public;
grant execute on function public.claim_tip_report_scan() to authenticated;
