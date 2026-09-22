-- The two list screens, each in exactly one round trip.

-- ---------------------------------------------------------------------------
-- Discover
-- ---------------------------------------------------------------------------

-- Published cards of the opposite role that the caller is not already
-- connected to. Doing the exclusion here rather than in the app keeps discover
-- a single query with no parameters to pass and nothing to filter client-side.
--
-- security_invoker = on so the caller's RLS applies: profiles_select already
-- limits this to published cards, and the connections subquery only sees the
-- caller's own connections.
create view public.discover_feed
with (security_invoker = on, security_barrier = on) as
select
  p.id,
  p.role,
  p.full_name,
  p.bio,
  p.interests,
  p.study_field,
  p.avatar_path,
  p.availability,
  p.card_description,
  p.created_at
from public.profiles p
where p.is_published
  and p.id <> (select auth.uid())
  and p.role <> (select me.role from public.profiles me where me.id = (select auth.uid()))
  and not exists (
    select 1
    from public.connections c
    where (c.requester_profile_id = p.id and c.addressee_profile_id = (select auth.uid()))
       or (c.addressee_profile_id = p.id and c.requester_profile_id = (select auth.uid()))
  );

grant select on public.discover_feed to authenticated;

comment on view public.discover_feed is
  'Published cards of the opposite role that the caller has no connection with yet. Backs the discover screen in a single query.';


-- ---------------------------------------------------------------------------
-- Connections
-- ---------------------------------------------------------------------------

-- The connections screen in exactly one round trip.
--
-- Without this view the screen is a textbook N+1: fetch connections, then per
-- row fetch the other person's profile, their last message, and an unread
-- count. Here it is one query, and the per-connection parts are LATERALs rather
-- than aggregates over a join (which would multiply rows before grouping).

-- security_invoker = on is load-bearing. A Postgres view runs with its OWNER's
-- privileges by default, which would silently bypass RLS on profiles,
-- connections and messages and expose every conversation in the database.
-- security_barrier stops a cheap leaky operator in a caller's WHERE clause from
-- being evaluated before the view's own filtering.
create view public.connection_overview
with (security_invoker = on, security_barrier = on) as
select
  c.id                   as connection_id,
  c.status,
  c.created_at,
  c.requester_profile_id = (select auth.uid()) as i_am_requester,
  o.id                   as other_profile_id,
  o.full_name            as other_full_name,
  o.role                 as other_role,
  o.bio                  as other_bio,
  o.interests            as other_interests,
  o.study_field          as other_study_field,
  o.avatar_path          as other_avatar_path,
  o.availability         as other_availability,
  o.card_description     as other_card_description,
  last_message.body              as last_message_body,
  last_message.created_at        as last_message_at,
  last_message.sender_profile_id as last_message_sender_id,
  unread.count           as unread_count
from public.connections c
-- Which side of this connection is the caller on?
cross join lateral (
  select
    case when c.requester_profile_id = (select auth.uid())
         then c.addressee_profile_id else c.requester_profile_id end as other_profile_id,
    case when c.requester_profile_id = (select auth.uid())
         then c.requester_last_read_at else c.addressee_last_read_at end as my_last_read_at
) s
join public.profiles o on o.id = s.other_profile_id
left join lateral (
  select m.body, m.created_at, m.sender_profile_id
  from public.messages m
  where m.connection_id = c.id
  order by m.created_at desc
  limit 1
) last_message on true
cross join lateral (
  -- Excluding your own messages matters: otherwise sending a message marks your
  -- own conversation unread.
  select count(*)::int as count
  from public.messages m
  where m.connection_id = c.id
    and m.created_at > s.my_last_read_at
    and m.sender_profile_id <> (select auth.uid())
) unread;

grant select on public.connection_overview to authenticated;

comment on view public.connection_overview is
  'One row per connection from the caller''s point of view: the other person''s card, the last message, and an unread count. Backs the connections screen in a single query.';
