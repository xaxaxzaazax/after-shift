revoke all on function public.claim_tip_report_scan() from public;
revoke all on function public.claim_tip_report_scan() from anon;
grant execute on function public.claim_tip_report_scan() to authenticated;
