-- Two promises the privacy policy makes that nothing in the schema kept.


-- ---------------------------------------------------------------------------
-- "Wenn Sie Ihr Konto löschen, löschen wir die damit verbundenen Daten
-- vollständig." (Art. 17 DSGVO)
-- ---------------------------------------------------------------------------

-- Deleting an auth user normally needs the service-role key, which this app
-- deliberately never holds. A SECURITY DEFINER function that can only ever
-- delete the caller does the same job without it.
--
-- Everything else follows by cascade: auth.users -> profiles -> offers,
-- connections (either side), messages, offer_views. The other person in a
-- conversation loses the thread too — the policy says so, and a half-deleted
-- conversation that keeps one side's messages would be worse.
--
-- Avatar files live in Storage, not in these tables, so the server action
-- removes them before calling this. Deleting storage.objects rows from SQL
-- would leave the actual files behind.
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  delete from auth.users where id = me;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

comment on function public.delete_my_account() is
  'Deletes the calling user and, by cascade, everything they own. Takes no argument on purpose: there is no way to name someone else.';


-- ---------------------------------------------------------------------------
-- "Aufrufe von Angeboten: 90 Tage, danach werden sie gelöscht."
-- ---------------------------------------------------------------------------

-- The UI only ever counts the last seven days, so these rows are useless after
-- that — but "who looked at whose card, and when" is exactly the kind of log
-- nobody should keep by accident. A nightly job enforces what the policy says.
create extension if not exists pg_cron;

select cron.schedule(
  'expire-offer-views',
  '17 3 * * *',
  $$delete from public.offer_views where viewed_on < current_date - 90$$
);
