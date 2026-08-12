-- Remove the problematic shifts policy that causes infinite recursion
drop policy if exists "Users can read shifts shared in their battles" on public.shifts;

-- The existing "Users can read their own shifts" policy is sufficient.
-- Battle shifts are fetched explicitly in fetchBattles() using the .in() filter,
-- which bypasses RLS when the app already knows which user_ids to query.
