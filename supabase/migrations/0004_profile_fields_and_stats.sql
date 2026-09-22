-- Fields the UI needs that the schema did not have.
--
-- Everything here comes from reading the four designed screens: age appears on
-- every card, senior cards carry a status chip, a request shows an intro
-- message before it is accepted, and "Mein Angebot" reports views and open
-- requests.
--
-- 0001-0003 are already deployed, so this is additive rather than a rewrite.


-- ---------------------------------------------------------------------------
-- Age
-- ---------------------------------------------------------------------------

-- Stored as a birth year, not an age: an integer that silently becomes wrong on
-- someone's birthday is worse than no column. The view derives the age.
--
-- The CHECK only enforces sanity — the minimum-age policy lives in the action,
-- because anything involving the current year is not immutable and cannot go in
-- a constraint without going stale.
alter table public.profiles
  add column birth_year int not null check (birth_year >= 1900);


-- ---------------------------------------------------------------------------
-- Senior status
-- ---------------------------------------------------------------------------

-- The design shows "Rentner", "Rentnerin" and "Noch berufstätig". Storing the
-- gendered variant as the person's own choice means we never have to store a
-- gender to render it correctly.
alter table public.profiles
  add column status text check (status in ('rentner', 'rentnerin', 'berufstaetig'));

-- Only seniors carry one.
alter table public.profiles
  add constraint profiles_status_only_seniors
    check (role = 'senior' or status is null);


-- ---------------------------------------------------------------------------
-- Intro message on a request
-- ---------------------------------------------------------------------------

-- The requests list shows text before the request is answered. Rather than
-- relaxing the rule that messages require an accepted connection, the greeting
-- lives on the request itself — so real chat still needs mutual consent.
alter table public.connections
  add column intro_message text
    check (intro_message is null or length(btrim(intro_message)) between 1 and 500);

-- Fold intro_message into the immutable set: a greeting cannot be rewritten
-- after the fact, the same way a sent message cannot.
create or replace function app.connections_guard_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
     or new.requester_id is distinct from old.requester_id
     or new.recipient_id is distinct from old.recipient_id
     or new.intro_message is distinct from old.intro_message
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


-- ---------------------------------------------------------------------------
-- Offer views
-- ---------------------------------------------------------------------------

-- "34 Aufrufe diese Woche" needs dated rows, not a counter — a counter cannot
-- answer "this week". The primary key doubles as the dedupe rule: one view per
-- person per offer per day, so refreshing a page does not inflate the number.
create table public.offer_views (
  offer_id  uuid not null references public.offers (id) on delete cascade,
  viewer_id uuid not null references public.profiles (id) on delete cascade,
  viewed_on date not null default current_date,
  primary key (offer_id, viewer_id, viewed_on)
);

create index offer_views_recent_idx on public.offer_views (offer_id, viewed_on desc);

create function app.owns_offer(o uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.offers x
    where x.id = o and x.user_id = (select auth.uid())
  )
$$;

alter table public.offer_views enable row level security;

grant select, insert on public.offer_views to authenticated;

-- Only the owner may read their own view log, and nobody can inflate their own
-- numbers by looking at their own card.
create policy offer_views_select on public.offer_views
  for select to authenticated
  using ((select app.owns_offer(offer_id)));

create policy offer_views_insert on public.offer_views
  for insert to authenticated
  with check (
    viewer_id = (select auth.uid())
    and not (select app.owns_offer(offer_id))
  );

-- No UPDATE or DELETE policy: the log is append-only.


-- ---------------------------------------------------------------------------
-- Views
-- ---------------------------------------------------------------------------

-- Both existing views gain the new columns. Dropped and recreated rather than
-- CREATE OR REPLACE, which cannot reorder or remove columns and quietly fails
-- in confusing ways when you try.

drop view if exists public.discover_feed;

create view public.discover_feed
with (security_invoker = on, security_barrier = on) as
select
  p.id           as profile_id,
  p.name,
  p.role,
  p.bio,
  p.interests,
  p.study_field,
  p.avatar_path,
  p.status,
  extract(year from now())::int - p.birth_year as age,
  o.id           as offer_id,
  o.availability,
  o.description,
  o.city,
  o.postal_code,
  o.created_at
from public.offers o
join public.profiles p on p.id = o.user_id
where o.is_published
  and p.id <> (select auth.uid())
  and p.role <> (select me.role from public.profiles me where me.id = (select auth.uid()))
  and not exists (
    select 1
    from public.connections c
    where (c.requester_id = p.id and c.recipient_id = (select auth.uid()))
       or (c.recipient_id = p.id and c.requester_id = (select auth.uid()))
  );

grant select on public.discover_feed to authenticated;

comment on view public.discover_feed is
  'Published cards of the opposite role the caller has no connection with yet. Backs the discover screen in a single query. Coordinates are deliberately not exposed.';


drop view if exists public.connection_overview;

create view public.connection_overview
with (security_invoker = on, security_barrier = on) as
select
  c.id           as connection_id,
  c.status,
  c.created_at,
  c.intro_message,
  c.requester_id = (select auth.uid()) as i_am_requester,
  other.id       as other_profile_id,
  other.name     as other_name,
  other.role     as other_role,
  other.avatar_path as other_avatar_path,
  other.status   as other_status,
  extract(year from now())::int - other.birth_year as other_age,
  last_message.body       as last_message_body,
  last_message.created_at as last_message_at,
  last_message.sender_id  as last_message_sender_id,
  unread.count   as unread_count
from public.connections c
cross join lateral (
  select case when c.requester_id = (select auth.uid())
              then c.recipient_id else c.requester_id end as other_id
) s
join public.profiles other on other.id = s.other_id
left join lateral (
  select m.body, m.created_at, m.sender_id
  from public.messages m
  where m.connection_id = c.id
  order by m.created_at desc
  limit 1
) last_message on true
cross join lateral (
  select count(*)::int as count
  from public.messages m
  where m.connection_id = c.id
    and m.read_at is null
    and m.sender_id <> (select auth.uid())
) unread;

grant select on public.connection_overview to authenticated;

comment on view public.connection_overview is
  'One row per connection from the caller''s point of view: the other person, their greeting, the last message, and an unread count. Backs the connections screen in a single query.';


-- The two numbers on "Mein Angebot". security_invoker means offer_views' own
-- policy (owner only) and connections' policy do the filtering, so this cannot
-- report anyone else's figures even though it selects from shared tables.
create view public.my_offer_stats
with (security_invoker = on, security_barrier = on) as
select
  o.id as offer_id,
  (select count(*)::int
     from public.offer_views v
    where v.offer_id = o.id
      and v.viewed_on > current_date - 7) as views_this_week,
  (select count(*)::int
     from public.connections c
    where c.recipient_id = o.user_id
      and c.status = 'pending') as open_requests
from public.offers o
where o.user_id = (select auth.uid());

grant select on public.my_offer_stats to authenticated;

comment on view public.my_offer_stats is
  'Views this week and open requests for the caller''s own offer.';
