-- The two list screens, each in exactly one round trip.
--
-- security_invoker = on is load-bearing on both. A Postgres view runs with its
-- OWNER's privileges by default, which would silently bypass RLS on everything
-- underneath and expose every card and conversation in the database.
-- security_barrier stops a cheap leaky operator in a caller's WHERE clause from
-- being evaluated before the view's own filtering.

-- ---------------------------------------------------------------------------
-- Discover
-- ---------------------------------------------------------------------------

-- Published cards of the opposite role that the caller is not already connected
-- to. Doing the exclusion here rather than in the app keeps discover a single
-- query with nothing to filter client-side.
--
-- lat/lng are deliberately NOT selected. Coordinates never leave the server;
-- when the radius filter lands it returns a distance, not a position.
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


-- ---------------------------------------------------------------------------
-- Connections
-- ---------------------------------------------------------------------------

-- Per connection: the other person, the last message, and an unread count.
-- Without this the screen is a textbook N+1 — fetch connections, then loop for
-- profiles, last messages and counts. The per-connection parts are LATERALs
-- rather than aggregates over a join, which would multiply rows before grouping.
create view public.connection_overview
with (security_invoker = on, security_barrier = on) as
select
  c.id           as connection_id,
  c.status,
  c.created_at,
  c.requester_id = (select auth.uid()) as i_am_requester,
  other.id       as other_profile_id,
  other.name     as other_name,
  other.role     as other_role,
  other.avatar_path as other_avatar_path,
  last_message.body      as last_message_body,
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
  -- Only messages from the other person count as unread, so sending a message
  -- never marks your own conversation unread.
  select count(*)::int as count
  from public.messages m
  where m.connection_id = c.id
    and m.read_at is null
    and m.sender_id <> (select auth.uid())
) unread;

grant select on public.connection_overview to authenticated;

comment on view public.connection_overview is
  'One row per connection from the caller''s point of view: the other person, the last message, and an unread count. Backs the connections screen in a single query.';
