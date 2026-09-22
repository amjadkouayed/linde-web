-- Linde — core schema, helpers and row level security.
--
-- Table and column names follow the schema Amjad built in the dashboard, so the
-- live database and this file finally agree. What this adds is the part the
-- dashboard cannot express well: policies, the guard trigger, indexes, and the
-- views that keep each screen to one query.
--
-- Read top to bottom before changing a policy. The ordering matters: tables,
-- indexes, the `app` helpers the policies call, the trigger, then the policies.

create schema if not exists app;

-- `app` is deliberately NOT in config.toml's api.schemas, so PostgREST never
-- exposes it. Callers need USAGE to evaluate policies that call into it.
grant usage on schema app to authenticated, anon;


-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- A profile IS an auth user: profiles.id = auth.users.id. That identity is what
-- keeps almost every policy below a direct comparison against auth.uid()
-- instead of a subquery.
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null check (length(btrim(name)) between 1 and 80),
  role        text not null check (role in ('student', 'senior')),
  bio         text check (length(bio) <= 1000),
  interests   text[] not null default '{}' check (coalesce(array_length(interests, 1), 0) <= 20),
  study_field text check (length(study_field) <= 120),
  avatar_path text,
  created_at  timestamptz not null default now()
);

-- "Meine Karte" — the thing a person posts, kept separate from the person.
-- This is Amjad's model and it is the right one: it gives location somewhere
-- natural to live, which a column on profiles would not, and it matches the
-- concept's wording ("postet eigene Verfügbarkeit").
--
-- One card per person, per the concept, hence unique (user_id).
--
-- lat/lng are a PLZ CENTROID, never a street address. A radius filter is
-- trilaterable: probe it from three points and you recover whatever is stored.
-- Storing the centroid means the most anyone can recover is the postal area the
-- user already chose to disclose. Populating these from a PLZ lookup and adding
-- the PostGIS index is the next migration.
create table public.offers (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null unique references public.profiles (id) on delete cascade,
  availability text not null check (length(btrim(availability)) between 1 and 500),
  description  text not null check (length(btrim(description)) between 1 and 1000),
  postal_code  text not null check (postal_code ~ '^[0-9]{5}$'),
  city         text not null check (length(btrim(city)) between 1 and 120),
  lat          double precision,
  lng          double precision,
  is_published boolean not null default false,
  created_at   timestamptz not null default now()
);

create table public.connections (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  status       text not null default 'pending'
                 check (status in ('pending', 'accepted', 'declined')),
  created_at   timestamptz not null default now(),
  check (requester_id <> recipient_id)
);

-- One connection per pair, in either direction.
create unique index connections_pair_uniq
  on public.connections (least(requester_id, recipient_id), greatest(requester_id, recipient_id));

-- read_at per message is Amjad's design and it is fine: marking a thread read is
-- still a single UPDATE (it just touches N rows), and the unread count is a
-- count of NULLs rather than a timestamp comparison.
create table public.messages (
  id            bigint generated always as identity primary key,
  connection_id uuid not null references public.connections (id) on delete cascade,
  sender_id     uuid not null references public.profiles (id) on delete cascade,
  body          text not null check (length(btrim(body)) between 1 and 2000),
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);


-- ---------------------------------------------------------------------------
-- Indexes — every column a policy filters on, plus the sort keys
-- ---------------------------------------------------------------------------

create index profiles_role_idx        on public.profiles (role);
create index profiles_interests_idx   on public.profiles using gin (interests);
create index offers_published_idx     on public.offers (is_published);
create index offers_postal_code_idx   on public.offers (postal_code);
create index connections_requester_idx on public.connections (requester_id);
create index connections_recipient_idx on public.connections (recipient_id);
create index messages_thread_idx      on public.messages (connection_id, created_at desc);
create index messages_sender_idx      on public.messages (sender_id);
-- Drives the unread count.
create index messages_unread_idx      on public.messages (connection_id, sender_id) where read_at is null;


-- ---------------------------------------------------------------------------
-- Helpers
--
-- Only where a policy must read a DIFFERENT table than the one it protects.
-- All SECURITY DEFINER, STABLE, `set search_path = ''` so every reference is
-- fully qualified and cannot be hijacked by a caller's search_path.
--
-- SECURITY DEFINER is load-bearing: without it these become RLS checks nested
-- inside RLS checks. They run as the table owner, which bypasses RLS because
-- the tables use ENABLE (not FORCE) row level security.
--
-- Always call them wrapped — `(select app.foo())` — so Postgres evaluates them
-- once per statement as an initPlan rather than once per row.
-- ---------------------------------------------------------------------------

-- Is this profile on the other end of one of my connections? Keeps a partner's
-- name visible in my connections list even after they unpublish their card.
create function app.is_connected_to(p uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.connections c
    where (c.requester_id = p and c.recipient_id = (select auth.uid()))
       or (c.recipient_id = p and c.requester_id = (select auth.uid()))
  )
$$;

-- Students connect with seniors and vice versa, and only to someone who has
-- actually published a card.
create function app.can_connect(requester uuid, recipient uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles r
    join public.profiles a on a.id = recipient
    join public.offers o on o.user_id = a.id and o.is_published
    where r.id = requester
      and r.role <> a.role
  )
$$;

-- Am I a participant of this connection, and has it been accepted? Gates both
-- reading a thread and posting to it.
create function app.can_use_thread(conn uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.connections c
    where c.id = conn
      and c.status = 'accepted'
      and (select auth.uid()) in (c.requester_id, c.recipient_id)
  )
$$;


-- ---------------------------------------------------------------------------
-- Trigger
--
-- profiles and offers need none: their UPDATE policies pin both USING and WITH
-- CHECK to the owner, so a row can neither be stolen nor handed away.
--
-- connections does, because one policy covers a request being answered, and
-- only the recipient may answer, only once, only from pending.
-- ---------------------------------------------------------------------------

create function app.connections_guard_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
     or new.requester_id is distinct from old.requester_id
     or new.recipient_id is distinct from old.recipient_id
     or new.created_at is distinct from old.created_at then
    raise exception 'connection identity is immutable' using errcode = '42501';
  end if;

  if new.status is distinct from old.status then
    if old.status <> 'pending' then
      raise exception 'only a pending request can be answered' using errcode = '42501';
    end if;
    if new.status not in ('accepted', 'declined') then
      raise exception 'a request may only be accepted or declined' using errcode = '42501';
    end if;
    if old.recipient_id <> (select auth.uid()) then
      raise exception 'only the recipient may answer a request' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

create trigger connections_guard_update
  before update on public.connections
  for each row execute function app.connections_guard_update();


-- ---------------------------------------------------------------------------
-- Row level security
--
-- ENABLE, deliberately not FORCE. FORCE would subject the table owner to RLS
-- too, making the SECURITY DEFINER helpers above recurse into the very policies
-- that call them. The app only ever connects as `authenticated` or `anon`
-- through PostgREST, never as the owner, so FORCE buys nothing here.
--
-- Every policy names its role with TO, so evaluation stops early for anon.
-- ---------------------------------------------------------------------------

alter table public.profiles    enable row level security;
alter table public.offers      enable row level security;
alter table public.connections enable row level security;
alter table public.messages    enable row level security;

grant select, insert, update, delete on public.profiles    to authenticated;
grant select, insert, update, delete on public.offers      to authenticated;
grant select, insert, update, delete on public.connections to authenticated;
grant select, insert, update         on public.messages    to authenticated;


-- profiles ------------------------------------------------------------------

-- Anyone signed in may read a profile whose card is published (that is what
-- discover shows), plus their own, plus anyone they are connected to.
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or (select app.is_connected_to(id))
    or exists (select 1 from public.offers o where o.user_id = profiles.id and o.is_published)
  );

-- Onboarding. The row IS the auth user, so this is the whole check. Note it
-- tests the NEW row's column directly rather than looking the row up — a
-- SECURITY DEFINER helper cannot see the not-yet-visible tuple.
create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy profiles_delete on public.profiles
  for delete to authenticated
  using (id = (select auth.uid()));


-- offers --------------------------------------------------------------------

create policy offers_select on public.offers
  for select to authenticated
  using (
    is_published
    or user_id = (select auth.uid())
    or (select app.is_connected_to(user_id))
  );

create policy offers_insert on public.offers
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy offers_update on public.offers
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy offers_delete on public.offers
  for delete to authenticated
  using (user_id = (select auth.uid()));


-- connections ---------------------------------------------------------------

create policy connections_select on public.connections
  for select to authenticated
  using ((select auth.uid()) in (requester_id, recipient_id));

create policy connections_insert on public.connections
  for insert to authenticated
  with check (
    status = 'pending'
    and requester_id = (select auth.uid())
    and recipient_id <> (select auth.uid())
    and (select app.can_connect(requester_id, recipient_id))
  );

-- Participation is the row-level gate; connections_guard_update decides who may
-- answer and how.
create policy connections_update on public.connections
  for update to authenticated
  using ((select auth.uid()) in (requester_id, recipient_id))
  with check ((select auth.uid()) in (requester_id, recipient_id));

-- Lets a requester withdraw, or retry after a decline. Accepted connections are
-- not deletable — that would silently destroy both sides' chat history.
create policy connections_delete on public.connections
  for delete to authenticated
  using (status <> 'accepted' and requester_id = (select auth.uid()));


-- messages ------------------------------------------------------------------

create policy messages_select on public.messages
  for select to authenticated
  using ((select app.can_use_thread(connection_id)));

-- Both halves in one predicate, so a sender can never be forged onto a thread:
-- the sender must BE the caller, and the thread must be one the caller is in.
create policy messages_insert on public.messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and (select app.can_use_thread(connection_id))
  );

-- The only permitted update is marking someone ELSE's message as read. Your own
-- message's read_at belongs to the recipient, and the body is immutable.
create policy messages_mark_read on public.messages
  for update to authenticated
  using (sender_id <> (select auth.uid()) and (select app.can_use_thread(connection_id)))
  with check (sender_id <> (select auth.uid()) and (select app.can_use_thread(connection_id)));

create function app.messages_guard_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
     or new.connection_id is distinct from old.connection_id
     or new.sender_id is distinct from old.sender_id
     or new.body is distinct from old.body
     or new.created_at is distinct from old.created_at then
    raise exception 'only read_at may change on a message' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger messages_guard_update
  before update on public.messages
  for each row execute function app.messages_guard_update();

-- No DELETE policy: messages cannot be unsent.
