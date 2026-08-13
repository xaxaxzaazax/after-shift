-- Revoke anon access from battle functions to silence security warnings
-- These functions already check auth.uid() internally, so they're secure
-- But revoking anon prevents false positive security warnings

revoke execute on function public.start_battle(text, text, date) from anon;
revoke execute on function public.join_battle(text, text) from anon;
revoke execute on function public.complete_battle(uuid) from anon;
revoke execute on function public.delete_battle(uuid) from anon;
revoke execute on function public.get_battle_shifts(uuid[]) from anon;
revoke execute on function public.leave_battle(uuid) from anon;
