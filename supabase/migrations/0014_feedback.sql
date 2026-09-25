-- "Was sagen Sie dazu?" — the feedback form on the landing page.
--
-- The landing page is the one page a signed-out visitor sees, so this is the
-- one table the `anon` role may write to: a deliberate, narrow exception to
-- 0008_revoke_anon, where every other grant was taken away.
--
-- Insert only, and there is no select policy at all — so nobody reads these
-- rows through the Data API: not a signed-out caller, not a signed-in one, not
-- even the person who wrote the entry. They are read in the Supabase dashboard,
-- which uses the service role and bypasses RLS. That keeps a table of
-- e-mail addresses and opinions out of reach of the app itself.

create table public.feedback (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (length(name) between 1 and 120),
  -- Not a real address check — that is the confirmation mail's job, and there
  -- isn't one here. It only rules out the obvious nonsense, so the column is
  -- worth reading.
  email      text not null check (length(email) between 6 and 254 and email like '%_@_%.__%'),
  message    text not null check (length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

grant insert on public.feedback to anon, authenticated;

create policy feedback_insert on public.feedback
  for insert to anon, authenticated
  with check (true);

comment on table public.feedback is
  'Visitor feedback from the landing page. Write-only through the API — read it in the dashboard.';
