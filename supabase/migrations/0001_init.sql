-- Linde — core schema, helpers and row level security.
--
-- Read this file top to bottom before changing any policy. The ordering matters:
-- tables, then indexes, then the `app` helper functions the policies depend on,
-- then the trigger, then the policies themselves.

create schema if not exists app;

-- `app` is deliberately NOT listed in config.toml's api.schemas, so PostgREST
-- never exposes it. Callers need USAGE to evaluate policies that call into it.
grant usage on schema app to authenticated, anon;


-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Everyone owns their own account — students and seniors alike — so a profile
-- is exactly an auth user and profiles.id IS auth.users.id. That identity is
-- what keeps every policy below a direct column comparison against auth.uid()
-- instead of a subquery.
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        text not null check (role in ('student', 'senior')),
  full_name   text not null check (length(btrim(full_name)) between 1 and 80),
  bio         text check (length(bio) <= 1000),
  interests   text[] not null default '{}' check (coalesce(array_length(interests, 1), 0) <= 20),
  study_field text check (length(study_field) <= 120),
  avatar_path text,

  -- "Meine Karte" — one card per person, so these are columns rather than a
  -- cards table. A separate table would buy only a join and an N+1 risk on the
  -- busiest screen. Promote it if multiple/historical cards are ever wanted.
  availability     text check (length(availability) <= 500),
  card_description text check (length(card_description) <= 1000),

  is_published boolean not null default false,
  created_at   timestamptz not null default now()
);

create table public.connections (
  id                     uuid primary key default gen_random_uuid(),
  requester_profile_id   uuid not null references public.profiles (id) on delete cascade,
  addressee_profile_id   uuid not null references public.profiles (id) on delete cascade,
  status                 text not null default 'pending'
                           check (status in ('pending', 'accepted', 'declined')),
  requester_last_read_at timestamptz not null default now(),
  addressee_last_read_at timestamptz not null default now(),
  created_at             timestamptz not null default now(),
  check (requester_profile_id <> addressee_profile_id)
);

-- One connection per pair, in either direction.
create unique index connections_pair_uniq
  on public.connections (
    least(requester_profile_id, addressee_profile_id),
    greatest(requester_profile_id, addressee_profile_id)
  );

-- No last_message_at column: a trigger maintaining it would run as the invoker
-- and be blocked by the connections UPDATE policy. connection_overview derives
-- it with a LATERAL instead (0002_views.sql).
create table public.messages (
  id                uuid primary key default gen_random_uuid(),
  connection_id     uuid not null references public.connections (id) on delete cascade,
  sender_profile_id uuid not null references public.profiles (id) on delete cascade,
  body              text not null check (length(btrim(body)) between 1 and 2000),
  created_at        timestamptz not null default now()
);


-- ---------------------------------------------------------------------------
-- Indexes — every column a policy filters on, plus the sort keys
-- ---------------------------------------------------------------------------

create index profiles_discover_idx     on public.profiles (role, is_published);
create index profiles_interests_idx    on public.profiles using gin (interests);
create index connections_requester_idx on public.connections (requester_profile_id);
create index connections_addressee_idx on public.connections (addressee_profile_id);
create index messages_thread_idx       on public.messages (connection_id, created_at desc);
create index messages_sender_idx       on public.messages (sender_profile_id);


-- ---------------------------------------------------------------------------
-- Helpers
--
-- Only four, and only where a policy must read a DIFFERENT table than the one
-- it protects. Everything else is a direct auth.uid() comparison.
--
-- All SECURITY DEFINER, STABLE, and `set search_path = ''` (so every reference
-- is fully qualified and cannot be hijacked by a caller's search_path).
--
-- SECURITY DEFINER is load-bearing, not decorative: without it these would be
-- RLS checks nested inside RLS checks — slower, and fragile as the policies
-- they depend on evolve. They run as the table owner, which bypasses RLS
-- because the tables use ENABLE (not FORCE) row level security.
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
    where (c.requester_profile_id = p and c.addressee_profile_id = (select auth.uid()))
       or (c.addressee_profile_id = p and c.requester_profile_id = (select auth.uid()))
  )
$$;

-- Students connect with seniors and vice versa, and only to a published card.
create function app.can_connect(requester uuid, addressee uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles r, public.profiles a
    where r.id = requester
      and a.id = addressee
      and a.is_published
      and r.role <> a.role
  )
$$;

-- Messages are readable only once the connection is accepted.
create function app.can_read_messages(conn uuid)
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
      and (select auth.uid()) in (c.requester_profile_id, c.addressee_profile_id)
  )
$$;

-- One predicate, not two: "the connection is mine" and "the sender is me" are
-- bound together so a sender can never be forged onto someone else's thread.
create function app.can_post_message(conn uuid, sender uuid)
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
      and sender = (select auth.uid())
      and sender in (c.requester_profile_id, c.addressee_profile_id)
  )
$$;


-- ---------------------------------------------------------------------------
-- Trigger
--
-- profiles needs none: its UPDATE policy has both USING and WITH CHECK pinned
-- to auth.uid(), so a row can neither be stolen nor handed away.
--
-- connections does, because two quite different updates share one policy: the
-- addressee answering a pending request, and either side marking their own
-- side read. Enforcing that here keeps the policy a single predicate.
-- ---------------------------------------------------------------------------

create function app.connections_guard_update()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if new.id is distinct from old.id
     or new.requester_profile_id is distinct from old.requester_profile_id
     or new.addressee_profile_id is distinct from old.addressee_profile_id
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
    if old.addressee_profile_id <> me then
      raise exception 'only the addressee may answer a request' using errcode = '42501';
    end if;
  end if;

  if new.requester_last_read_at is distinct from old.requester_last_read_at
     and old.requester_profile_id <> me then
    raise exception 'cannot mark another participant''s side read' using errcode = '42501';
  end if;

  if new.addressee_last_read_at is distinct from old.addressee_last_read_at
     and old.addressee_profile_id <> me then
    raise exception 'cannot mark another participant''s side read' using errcode = '42501';
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
-- too, which would make the SECURITY DEFINER helpers above recurse into the
-- very policies that call them. The app only ever connects as `authenticated`
-- or `anon` through PostgREST, never as the owner, so FORCE buys nothing here.
--
-- Every policy names its role with TO, so evaluation stops early for anon.
-- ---------------------------------------------------------------------------

alter table public.profiles    enable row level security;
alter table public.connections enable row level security;
alter table public.messages    enable row level security;

grant select, insert, update, delete on public.profiles    to authenticated;
grant select, insert, update, delete on public.connections to authenticated;
grant select, insert                 on public.messages    to authenticated;


-- profiles ------------------------------------------------------------------

-- Published cards are discoverable; your own profile is always visible; and a
-- connection partner stays visible even if they unpublish.
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    is_published
    or id = (select auth.uid())
    or (select app.is_connected_to(id))
  );

-- Onboarding. The row IS the auth user, so this is the whole check.
create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

-- USING picks which row may be touched; WITH CHECK makes sure the result is
-- still yours, so a profile can be neither stolen nor handed to someone else.
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy profiles_delete on public.profiles
  for delete to authenticated
  using (id = (select auth.uid()));


-- connections ---------------------------------------------------------------

create policy connections_select on public.connections
  for select to authenticated
  using ((select auth.uid()) in (requester_profile_id, addressee_profile_id));

create policy connections_insert on public.connections
  for insert to authenticated
  with check (
    status = 'pending'
    and requester_profile_id = (select auth.uid())
    and addressee_profile_id <> (select auth.uid())
    and (select app.can_connect(requester_profile_id, addressee_profile_id))
  );

-- Participation is the row-level gate; connections_guard_update decides which
-- columns may actually move and who may move them.
create policy connections_update on public.connections
  for update to authenticated
  using ((select auth.uid()) in (requester_profile_id, addressee_profile_id))
  with check ((select auth.uid()) in (requester_profile_id, addressee_profile_id));

-- Lets a requester withdraw, or retry after a decline. Accepted connections are
-- not deletable — that would silently destroy both sides' chat history.
create policy connections_delete on public.connections
  for delete to authenticated
  using (
    status <> 'accepted'
    and requester_profile_id = (select auth.uid())
  );


-- messages ------------------------------------------------------------------

create policy messages_select on public.messages
  for select to authenticated
  using ((select app.can_read_messages(connection_id)));

create policy messages_insert on public.messages
  for insert to authenticated
  with check ((select app.can_post_message(connection_id, sender_profile_id)));

-- No UPDATE or DELETE policy: messages are immutable once sent.
