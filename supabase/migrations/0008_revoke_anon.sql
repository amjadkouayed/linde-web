-- Make the signed-out role's privileges match what the local database enforces.
--
-- Supabase projects auto-grant the Data API roles on new tables in `public`.
-- Locally that setting behaves differently, so `anon` was refused outright on
-- the local database and merely filtered by RLS on the cloud one.
--
-- Nothing was exposed: every table has RLS on and every policy names
-- `to authenticated`, so a signed-out caller got an empty result either way.
-- The problem is subtler than a leak — it means the RLS tests ran against
-- stricter grants than production had, so a table that someday ships without a
-- policy would fail locally and quietly succeed in the cloud.
--
-- Revoking explicitly removes the difference. Grants are stated in the
-- migration that creates each table; nothing here depends on a default.

revoke all on public.profiles      from anon;
revoke all on public.offers        from anon;
revoke all on public.connections   from anon;
revoke all on public.messages      from anon;
revoke all on public.offer_views   from anon;
revoke all on public.postal_codes  from anon;

revoke all on public.discover_feed       from anon;
revoke all on public.connection_overview from anon;
revoke all on public.my_offer_stats      from anon;

-- Storage is untouched on purpose: the avatars bucket is public by design, and
-- its policy names `anon` deliberately so a profile photo renders before the
-- reader has signed in.
